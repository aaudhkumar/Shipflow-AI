import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateObject, generateText } from 'ai';
import { runCodeReviewerAgent } from '../agents/code-reviewer';
import { CodeReviewResultSchema } from '../agents/code-reviewer/schema';

vi.mock('ai', () => ({
  generateObject: vi.fn(),
  generateText: vi.fn(),
  tool: vi.fn(),
}));
vi.mock('../client', () => ({
  getDefaultModel: vi.fn(() => ({})),
}));

const mockGenerateObject = vi.mocked(generateObject);
const mockGenerateText = vi.mocked(generateText);

const validFindings = {
  comments: [
    {
      filePath: 'src/index.ts',
      lineNumber: 10,
      findingType: 'SECURITY',
      isBlocking: true,
      severity: 'BLOCKER',
      comment: 'Do not log credentials',
    }
  ],
  summary: 'Overall good, one security issue.'
};

const mockContext: any = {
  model: {},
  prd: { acceptanceCriteria: ['AC1'] },
  octokit: {},
  repoNamespace: 'test',
  repoOwner: 'test',
  repoName: 'test',
  headSha: 'abc',
  previousFindings: [],
  searchRecords: vi.fn(),
};

describe('Code Reviewer Agent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('completes code review without triggering reflection addition', async () => {
    // 1. Mock Context Gathering (generateText)
    mockGenerateText.mockResolvedValue({
      text: "done",
      response: { messages: [] },
      usage: {}
    } as any);

    // Call the onStepFinish callback to simulate tool tracking if we wanted, 
    // but the callback is passed by the agent. We can simulate it by extracting the callback.
    mockGenerateText.mockImplementation(async (options: any) => {
      if (options.onStepFinish) {
        options.onStepFinish({ toolCalls: [{ toolName: 'searchCodebase' }, { toolName: 'getFileContent' }] });
      }
      return {
        text: "done",
        response: { messages: [] },
        usage: {}
      } as any;
    });

    // 2. Mock Step 2 Generate Object (Findings)
    mockGenerateObject.mockResolvedValueOnce({
      object: validFindings
    } as any);

    // 3. Mock Step 3 Generate Object (Reflection)
    mockGenerateObject.mockResolvedValueOnce({
      object: {
        missedCriteria: [],
        additionalFindings: []
      }
    } as any);

    const result = await runCodeReviewerAgent(mockContext, 'diff code');

    expect(result.result.comments).toHaveLength(1);
    expect(result.result.reviewMeta.toolCallCount).toBe(2);
    expect(result.result.reviewMeta.reflectionApplied).toBe(false);
  });

  it('applies reflection step and merges additional findings', async () => {
    mockGenerateText.mockImplementation(async (options: any) => {
      return {
        text: "done",
        response: { messages: [] },
        usage: {}
      } as any;
    });

    mockGenerateObject.mockResolvedValueOnce({
      object: validFindings
    } as any);

    mockGenerateObject.mockResolvedValueOnce({
      object: {
        missedCriteria: ['AC1'],
        additionalFindings: [
          {
            filePath: 'src/index.ts',
            lineNumber: null,
            findingType: 'PRD_DEVIATION',
            isBlocking: true,
            severity: 'MAJOR',
            comment: 'Missed AC1',
          }
        ]
      }
    } as any);

    const result = await runCodeReviewerAgent(mockContext, 'diff code');

    expect(result.result.comments).toHaveLength(2);
    expect(result.result.reviewMeta.reflectionApplied).toBe(true);
  });

  it('throws on invalid findings payload', async () => {
    mockGenerateText.mockResolvedValue({
      text: "done",
      response: { messages: [] },
      usage: {}
    } as any);

    mockGenerateObject.mockRejectedValueOnce(new Error("Zod validation failed"));

    await expect(runCodeReviewerAgent(mockContext, 'diff code')).rejects.toThrow();
  });
});
