import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateObject } from 'ai';
import { runClarifierAgent } from '../agents/clarifier';

vi.mock('ai', () => ({
  generateObject: vi.fn(),
}));
vi.mock('../client', () => ({
  getDefaultModel: vi.fn(() => ({})),
}));

const mockGenerateObject = vi.mocked(generateObject);

const validClarification = {
  analysis: 'The request is clear but lacks some specific details.',
  questions: ['What is the expected timeline?', 'Any specific UI framework?']
};

describe('Clarifier Agent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('returns valid analysis and questions', async () => {
    mockGenerateObject.mockResolvedValue({
      object: validClarification
    } as any);

    const result = await runClarifierAgent(
      'Dashboard Feature',
      'Add a dashboard'
    );

    const res = result.result as any;
    expect(res.analysis).toBe(validClarification.analysis);
    expect(res.questions).toEqual(validClarification.questions);
  });

  it('handles edge case of vague input gracefully', async () => {
    mockGenerateObject.mockResolvedValue({
      object: validClarification
    } as any);

    const result = await runClarifierAgent(
      'Button Feature',
      'button'
    );

    expect(mockGenerateObject).toHaveBeenCalledTimes(1);
    expect(result).toBeDefined();
    const callArgs = mockGenerateObject.mock.calls[0]?.[0];
    expect(callArgs!.prompt).toContain('button');
  });

  it('throws on Zod validation failure', async () => {
    mockGenerateObject.mockRejectedValue(new Error("Zod validation failed"));

    await expect(runClarifierAgent(
      'Dashboard Feature',
      'Add dashboard'
    )).rejects.toThrow();
  });
});
