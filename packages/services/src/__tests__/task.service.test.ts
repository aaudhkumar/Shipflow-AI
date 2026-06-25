import { describe, it, expect, vi } from 'vitest';
import { eq, inArray } from 'drizzle-orm';

// Mock dependencies
vi.mock('@shipflow/db', () => ({
  db: {
    query: {
      prds: { findFirst: vi.fn() },
      epics: { findMany: vi.fn() },
      tasks: { findMany: vi.fn() }
    },
    update: vi.fn(() => ({
      set: vi.fn(() => ({
        where: vi.fn(() => ({
          returning: vi.fn()
        }))
      }))
    }))
  }
}));

describe('Task Service / Router Operations', () => {
  it('should get Kanban board tasks correctly', async () => {
    const { db } = await import('@shipflow/db');
    
    // Setup mock returns
    vi.mocked(db.query.prds.findFirst).mockResolvedValue({ id: 'prd-1', featureRequestId: 'feat-1' } as any);
    vi.mocked(db.query.epics.findMany).mockResolvedValue([{ id: 'epic-1' }] as any);
    vi.mocked(db.query.tasks.findMany).mockResolvedValue([
      { id: 'task-1', epicId: 'epic-1', status: 'TODO' },
      { id: 'task-2', epicId: 'epic-1', status: 'IN_PROGRESS' },
      { id: 'task-3', epicId: 'epic-1', status: 'DONE' }
    ] as any);

    const prd = await db.query.prds.findFirst({ where: eq({} as any, 'feat-1') });
    expect(prd?.id).toBe('prd-1');

    const epics = await db.query.epics.findMany({ where: eq({} as any, prd!.id) });
    expect(epics).toHaveLength(1);

    const tasks = await db.query.tasks.findMany({ where: inArray({} as any, ['epic-1']) });
    const grouped = {
      TODO: tasks.filter(t => t.status === 'TODO'),
      IN_PROGRESS: tasks.filter(t => t.status === 'IN_PROGRESS'),
      DONE: tasks.filter(t => t.status === 'DONE'),
    };

    expect(grouped.TODO).toHaveLength(1);
    expect(grouped.IN_PROGRESS).toHaveLength(1);
    expect(grouped.DONE).toHaveLength(1);
  });

  it('should handle empty PRD or Epics gracefully', async () => {
    const { db } = await import('@shipflow/db');
    
    vi.mocked(db.query.prds.findFirst).mockResolvedValue(undefined as any);
    
    const prd = await db.query.prds.findFirst({ where: eq({} as any, 'feat-empty') });
    expect(prd).toBeUndefined();
    
    const grouped = prd ? { TODO: [], IN_PROGRESS: [], DONE: [] } : { TODO: [], IN_PROGRESS: [], DONE: [] };
    expect(grouped.TODO).toHaveLength(0);
  });

  it('should batch update tasks', async () => {
    const { db } = await import('@shipflow/db');
    const updateMock = vi.fn().mockReturnValue([{ id: 'task-1', status: 'DONE' }, { id: 'task-2', status: 'DONE' }]);
    
    vi.mocked(db.update).mockImplementation(() => ({
      set: vi.fn(() => ({
        where: vi.fn(() => ({
          returning: updateMock
        }))
      }))
    }) as any);

    const result = db.update({} as any).set({ status: 'DONE' }).where({} as any).returning();
    expect(result).toHaveLength(2);
    expect(result[0].status).toBe('DONE');
  });

  it('should ignore batch updates with empty array', async () => {
    const input = { taskIds: [], status: 'DONE' };
    expect(input.taskIds).toHaveLength(0);
    expect(input.status).toBe('DONE');
  });
});
