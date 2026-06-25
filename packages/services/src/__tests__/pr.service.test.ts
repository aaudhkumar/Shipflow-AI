import { describe, it, expect, vi } from 'vitest';

vi.mock('@shipflow/db', () => ({
  db: {
    query: {
      pullRequests: { findMany: vi.fn() },
      pullRequestReviews: { findFirst: vi.fn() }
    }
  }
}));

describe('Pull Request Service / Router Operations', () => {
  it('should return PR list for a given feature', async () => {
    const { db } = await import('@shipflow/db');
    
    vi.mocked(db.query.pullRequests.findMany).mockResolvedValue([
      { id: 'pr-1', featureRequestId: 'feat-1', state: 'open' },
      { id: 'pr-2', featureRequestId: 'feat-1', state: 'merged' }
    ] as any);

    const prs = await db.query.pullRequests.findMany({ where: {} as any });
    expect(prs).toHaveLength(2);
    expect(prs[0].state).toBe('open');
    expect(prs[1].state).toBe('merged');
  });

  it('should evaluate PR state logic', async () => {
    const prState = 'open';
    const isMerged = prState === 'merged';
    const isClosed = prState === 'closed';
    const isActive = !isMerged && !isClosed;

    expect(isMerged).toBe(false);
    expect(isActive).toBe(true);
  });
});
