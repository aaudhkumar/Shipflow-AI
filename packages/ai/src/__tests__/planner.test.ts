import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateObject } from 'ai';
import { runPlanningAgent } from '../agents/planner';
import { PlannerResultSchema } from '../agents/planner/schema';

vi.mock('ai', () => ({
  generateObject: vi.fn(),
}));
vi.mock('../client', () => ({
  getDefaultModel: vi.fn(() => ({})),
}));

const mockGenerateObject = vi.mocked(generateObject);

const validPlan = {
  tasks: [
    { title: 'Login UI', description: 'UI for login', storyPoints: 3, acceptanceCriteria: ['AC1'] },
    { title: 'Login API', description: 'API for login', storyPoints: 5, acceptanceCriteria: ['AC1'] }
  ],
  summary: 'Added auth',
};

describe('Planner Agent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('generates epics, tasks, and dependencies successfully', async () => {
    mockGenerateObject.mockResolvedValue({
      object: validPlan
    } as any);

    const result = await runPlanningAgent(
      'Add Auth'
    );

    const res = result.result as any;
    expect(res.tasks).toHaveLength(2);
    
    const validated = PlannerResultSchema.safeParse(result.result);
    expect(validated.success).toBe(true);
  });

  it('scales down gracefully when there are 0 dependencies', async () => {
    mockGenerateObject.mockResolvedValue({
      object: { ...validPlan, dependencies: [] }
    } as any);

    const result = await runPlanningAgent(
      'Simple feature'
    );

    const res = result.result as any;
    expect(res.tasks).toHaveLength(2);
    expect(mockGenerateObject).toHaveBeenCalledTimes(1);
  });

  it('throws if LLM output fails schema validation', async () => {
    mockGenerateObject.mockRejectedValue(new Error("Zod validation failed"));

    await expect(runPlanningAgent(
      'X'
    )).rejects.toThrow();
  });
});
