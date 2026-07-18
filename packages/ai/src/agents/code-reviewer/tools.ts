import { tool } from 'ai';
import { z } from 'zod';
export interface ReviewerContext {
  octokit: any;
  repoOwner: string;
  repoName: string;
  repoNamespace: string;
  headSha: string;
  prd: Record<string, any>;
  task?: any;
  subtasks?: { id: string; description: string }[];
  previousFindings: any[];
  searchRecords: (query: string, topK: number, filter?: any) => Promise<{ text: string, metadata: any, score: number }[]>;
}

export function createReviewerTools(context: ReviewerContext) {
  return {
    searchCodebase: tool({
      description: 'Search the repository codebase for relevant code patterns, architecture decisions, or similar implementations',
      parameters: z.object({ query: z.string() }),
      execute: async ({ query }) => {
        const results = await context.searchRecords(query, 5);
        return { results: results.map((m: any) => ({ content: m.text, metadata: m.metadata, score: m.score })) };
      },
    }),
    getFileContent: tool({
      description: 'Fetch the full content of a specific file from the PR head commit',
      parameters: z.object({ path: z.string() }),
      execute: async ({ path }) => {
        try {
          const content = await context.octokit.rest.repos.getContent({
            owner: context.repoOwner,
            repo: context.repoName,
            path,
            ref: context.headSha,
          });
          return { 
            path, 
            content: Buffer.from((content.data as any).content, 'base64').toString() 
          };
        } catch (e) {
          return { error: `Failed to fetch file content: ${e}` };
        }
      },
    }),
    getPRDSection: tool({
      description: 'Retrieve a specific section of the Product Requirements Document',
      parameters: z.object({ section: z.enum(['problemStatement', 'goals', 'acceptanceCriteria', 'edgeCases', 'successMetrics', 'userStories']) }),
      execute: async ({ section }) => {
        return { section, content: context.prd?.[section] || "No such section found in PRD" };
      },
    }),
    getPreviousFindings: tool({
      description: 'Retrieve findings from the previous review cycle to track resolution status',
      parameters: z.object({}),
      execute: async () => {
        return { findings: context.previousFindings ?? [] };
      },
    }),
    searchSimilarIssues: tool({
      description: 'Search for similar past code issues to check for recurring patterns',
      parameters: z.object({ pattern: z.string() }),
      execute: async ({ pattern }) => {
        const results = await context.searchRecords(pattern, 3, { type: 'finding' });
        return { issues: results.map((m: any) => m.metadata) };
      },
    }),
    analyzeDependencyImpact: tool({
      description: 'Analyze impacts of package updates by fetching package.json from the repository',
      parameters: z.object({ packageName: z.string() }),
      execute: async ({ packageName }) => {
        try {
          const content = await context.octokit.rest.repos.getContent({
            owner: context.repoOwner,
            repo: context.repoName,
            path: 'package.json',
            ref: context.headSha,
          });
          const pkg = JSON.parse(Buffer.from((content.data as any).content, 'base64').toString());
          const version = pkg.dependencies?.[packageName] || pkg.devDependencies?.[packageName];
          if (!version) return { error: `Package ${packageName} not found in package.json` };
          return { packageName, versionFound: version };
        } catch (e) {
          return { error: `Failed to fetch package.json: ${e}` };
        }
      },
    }),
  };
}
