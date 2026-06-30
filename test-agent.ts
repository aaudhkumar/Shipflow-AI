import { runCodeReviewerAgent } from "./packages/ai/src/agents/code-reviewer/index.js";

async function verifyAgent() {
  const context = {
    octokit: {
      rest: {
        repos: {
          getContent: async () => ({
            data: { content: Buffer.from("console.log('test')").toString('base64') }
          })
        }
      }
    },
    repoOwner: "test",
    repoName: "test",
    repoNamespace: "test--test--codebase",
    headSha: "abc",
    prd: {
      acceptanceCriteria: ["AC-1: The code must log 'hello'"]
    },
    previousFindings: [],
    searchRecords: async () => [{ text: "foo", metadata: {}, score: 1.0 }]
  };

  const diffContent = "diff --git a/test.js b/test.js\nnew file mode 100644\nindex 0000000..abc\n--- /dev/null\n+++ b/test.js\n@@ -0,0 +1,1 @@\n+console.log('test');";

  const result = await runCodeReviewerAgent(context as any, diffContent);
  console.log(JSON.stringify(result, null, 2));
}

verifyAgent().catch(console.error);
