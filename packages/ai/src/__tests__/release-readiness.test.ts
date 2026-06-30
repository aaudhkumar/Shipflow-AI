import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateObject } from 'ai';
import { runReleaseReadinessAgent } from '../agents/release-readiness';
import { releaseReadinessSchema } from '../agents/release-readiness/schema';

vi.mock('ai', () => ({
  generateObject: vi.fn(),
}));
vi.mock('../client', () => ({
  getDefaultModel: vi.fn(() => ({})),
}));

const mockGenerateObject = vi.mocked(generateObject);

const validReadiness = {
  isReady: true,
  overallScore: 95,
  blockers: [],
  warnings: ['Some minor UX issues'],
  recommendation: 'Good to go!',
  releaseNotesDraft: 'Released auth'
};

describe('Release Readiness Agent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('assesses feature readiness successfully', async () => {
    mockGenerateObject.mockResolvedValue({
      object: validReadiness
    } as any);

    const result = await runReleaseReadinessAgent({
      prdContext: 'Empty',
      tasksContext: 'Empty',
      reviewContext: 'Empty',
      pullRequestState: 'Empty'
    });

    expect(result.isReady).toBe(true);
    expect(result.blockers).toHaveLength(0);
    const validated = releaseReadinessSchema.safeParse(result);
    expect(validated.success).toBe(true);
  });

  it('handles assessment with zero blocking issues', async () => {
    mockGenerateObject.mockResolvedValue({
      object: validReadiness
    } as any);

    const result = await runReleaseReadinessAgent({
      prdContext: 'mockPRD',
      tasksContext: 'mockTasks',
      reviewContext: 'mockReviews',
      pullRequestState: 'mockPRState'
    });

    expect(result.isReady).toBe(true);
    expect(mockGenerateObject).toHaveBeenCalledTimes(1);
  });

  it('throws on Zod validation failure', async () => {
    mockGenerateObject.mockRejectedValue(new Error("Zod validation failed"));

    await expect(runReleaseReadinessAgent({
      prdContext: 'mockPRD',
      tasksContext: 'mockTasks',
      reviewContext: 'mockReviews',
      pullRequestState: 'mockPRState'
    })).rejects.toThrow("Zod validation failed");
  });
});
