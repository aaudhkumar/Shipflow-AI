import { generateObject, generateText } from "ai";
import { getDefaultModel } from "../../client";
import { CodeReviewResult, CodeReviewResultSchema } from "./schema";
import { ReflectionResult, ReflectionSchema } from "./reflection-schema";
import { codeReviewerSystemPrompt } from "./prompt";
import { GATHERING_SYSTEM_PROMPT } from "./gathering-prompt";
import { createReviewerTools, ReviewerContext } from "./tools";

export async function runCodeReviewerAgent(context: ReviewerContext, diffContent: string) {
  const model = getDefaultModel();
  const tools = createReviewerTools(context);

  let toolCallCount = 0;
  const toolsUsed: string[] = [];

  // Step 1: Context gathering with autonomous tool use
  const gatheringResult = await generateText({
    model,
    system: GATHERING_SYSTEM_PROMPT,
    messages: [
      { role: 'user', content: `Please review this PR diff and gather any necessary context using tools.\n\nDiff:\n${diffContent}` }
    ],
    tools,
    maxSteps: 8,
    onStepFinish: (step) => {
      if (step.toolCalls?.length) {
        toolCallCount += step.toolCalls.length;
        toolsUsed.push(...step.toolCalls.map(t => t.toolName));
      }
    },
  });

  // Extract tool usage from steps - handled by onStepFinish now

  // Step 2: Generate structured findings from gathered context
  const { object: findingsResult } = await generateObject<CodeReviewResult>({
    model,
    system: codeReviewerSystemPrompt,
    schema: CodeReviewResultSchema,
    messages: [
      { 
        role: 'user', 
        content: `Based on your gathered context and the initial diff, generate a structured code review findings report.

Task Context (Acceptance Criteria):
Title: ${context.task?.title || 'Unknown'}
Details: ${context.task?.technicalImplementationDetails || 'Unknown'}

Subtasks (Acceptance Criteria):
${JSON.stringify(context.subtasks || [], null, 2)}

CRITICAL INSTRUCTION: You MUST output a valid JSON object exactly matching the requested schema. Do not return an empty object. If there are no findings, return an empty array [] for "comments" and a brief text for "summary". Evaluate which of the following subtasks were fully completed in this PR and include their IDs in "completedSubtaskIds".

Diff:
${diffContent}

Gathered Context:
${gatheringResult.text}` 
      }
    ],
  });

  // Step 3: Reflection — check all acceptance criteria are addressed
  let reflectionApplied = false;
  let finalFindings = findingsResult.comments;

  if (context.task) {
    const taskCriteria = {
      taskTitle: context.task.title,
      details: context.task.technicalImplementationDetails,
      subtasks: context.subtasks?.map((st: any) => st.title) || [],
    };

    const { object: reflectionResult } = await generateObject<ReflectionResult>({
      model,
      system: `You are a strict QA auditor. Compare the Task's specific implementation details and subtasks to the code review findings. Identify if any criteria specific to this Task are missed and require new findings. Do NOT complain about missing requirements that are outside the scope of this specific Task.`,
      schema: ReflectionSchema,
      prompt: `
        Task Acceptance Criteria:
        ${JSON.stringify(taskCriteria, null, 2)}
        
        Current Findings:
        ${JSON.stringify(findingsResult.comments, null, 2)}
      `,
    });

    if (reflectionResult.missedCriteria.length > 0) {
      reflectionApplied = true;
      finalFindings = [...findingsResult.comments, ...reflectionResult.additionalFindings];
    }
  }

  return {
    result: {
      comments: finalFindings,
      summary: findingsResult.summary,
      completedSubtaskIds: findingsResult.completedSubtaskIds,
      reviewMeta: {
        toolCallCount,
        toolsUsed: [...new Set(toolsUsed)],
        reflectionApplied,
        modelUsed: model.modelId,
        shouldMerge: findingsResult.shouldMerge,
      }
    },
    usage: gatheringResult.usage,
  };
}
