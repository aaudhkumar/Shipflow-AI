import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateText } from 'ai';
import { runSummarizerAgent } from '../agents/summarizer';

vi.mock('ai', () => ({
  generateText: vi.fn(),
}));
vi.mock('../client', () => ({
  getDefaultModel: vi.fn(() => ({})),
}));

const mockGenerateText = vi.mocked(generateText);

const validNotes = '# Release Notes\n\n- Added auth';

describe('Summarizer Agent', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('synthesizes release notes properly', async () => {
    mockGenerateText.mockResolvedValue({
      text: validNotes
    } as any);

    const result = await runSummarizerAgent(
      [{ title: 'Auth', body: 'Added auth', commits: ['abc'] }]
    );

    expect(result.result).toContain('Release Notes');
  });

  it('generates fallback text for empty PR arrays', async () => {
    mockGenerateText.mockResolvedValue({
      text: validNotes
    } as any);

    const result = await runSummarizerAgent(
      []
    );

    expect(mockGenerateText).toHaveBeenCalledTimes(1);
    expect(result).toBeDefined();
    
    const callArgs = mockGenerateText.mock.calls[0]?.[0];
    expect(callArgs!.prompt).toContain('Please summarize');
  });

  it('throws on Zod validation failure', async () => {
    mockGenerateText.mockRejectedValue(new Error("Zod validation failed"));

    await expect(runSummarizerAgent(
      []
    )).rejects.toThrow();
  });
});
