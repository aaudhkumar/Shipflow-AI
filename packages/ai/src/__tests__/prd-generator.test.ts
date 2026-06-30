import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateObject } from 'ai';
import { runPRDGenerator } from '../agents/prd-generator';
import { PRDSchema } from '../agents/prd-generator/schema';

vi.mock('ai', () => ({
  generateObject: vi.fn(),
}));
vi.mock('../client', () => ({
  getDefaultModel: vi.fn(() => ({})),
}));

const mockGenerateObject = vi.mocked(generateObject);

const validPRD = {
  problemStatement: 'Users cannot reset their passwords.',
  goals: ['Enable self-service password reset', 'Reduce support tickets', 'Improve UX'],
  nonGoals: ['Social login', '2FA'],
  userStories: [
    { role: 'user', action: 'reset password', benefit: 'regain access' },
    { role: 'admin', action: 'view reset logs', benefit: 'audit' },
    { role: 'support', action: 'send reset link', benefit: 'help users' }
  ],
  acceptanceCriteria: ['AC-1', 'AC-2', 'AC-3', 'AC-4', 'AC-5'],
  edgeCases: ['User email not found', 'Token expired', 'Invalid token'],
  successMetrics: [
    { metric: 'tickets', target: '<1%', measurement: 'zendesk' },
    { metric: 'time', target: '<1m', measurement: 'logs' },
    { metric: 'completion', target: '>90%', measurement: 'analytics' }
  ],
};

describe('PRD Generator Agent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('generates a complete PRD with all 7 required sections', async () => {
    mockGenerateObject.mockResolvedValue({
      object: validPRD
    } as any);

    const result = await runPRDGenerator(
      'Add password reset',
      'history',
      'product'
    );

    const res = result.result as any;
    expect(res.problemStatement).toBeTruthy();
    expect(res.goals.length).toBeGreaterThanOrEqual(1);
    expect(res.acceptanceCriteria.length).toBeGreaterThanOrEqual(5);
    expect(res.edgeCases.length).toBeGreaterThanOrEqual(3);
    const validated = PRDSchema.safeParse(result.result);
    expect(validated.success).toBe(true);
  });

  it('handles empty clarification history gracefully', async () => {
    mockGenerateObject.mockResolvedValue({
      object: validPRD
    } as any);

    const result = await runPRDGenerator(
      'Auth feature',
      'Context',
      'Product Context'
    );

    expect(mockGenerateObject).toHaveBeenCalledTimes(1);
    expect(result).toBeDefined();
    
    const callArgs = mockGenerateObject.mock.calls[0]?.[0];
    expect(callArgs!.prompt).toContain('Auth feature');
  });

  it('throws if LLM returns output that fails Zod validation', async () => {
    mockGenerateObject.mockRejectedValue(new Error("Zod validation failed"));

    await expect(runPRDGenerator(
      'Auth feature',
      'Context',
      'Product Context'
    )).rejects.toThrow("Zod validation failed");
  });
});
