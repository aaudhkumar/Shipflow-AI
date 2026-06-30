import { initTRPC, TRPCError } from "@trpc/server";
import { OpenApiMeta } from "trpc-to-openapi";

import { Context, createContext } from "./context";

export const tRPCContext = initTRPC.meta<OpenApiMeta>().context<Context>().create({});

export const router = tRPCContext.router;

export const publicProcedure = tRPCContext.procedure;

export const protectedProcedure = tRPCContext.procedure.use(({ ctx, next }) => {
  if (!ctx.session || !ctx.session.user) {
    throw new TRPCError({ code: "UNAUTHORIZED" });
  }
  return next({
    ctx: {
      ...ctx,
      session: ctx.session,
    },
  });
});

import { z } from "zod";
import { db } from "@shipflow/db";
import { members } from "@shipflow/db/schema";
import { and, eq } from "drizzle-orm";

export const orgMemberProcedure = protectedProcedure
  .input(z.object({ orgId: z.string() }).passthrough())
  .use(async ({ ctx, next, input }) => {
    const member = await db.query.members.findFirst({
      where: and(
        eq(members.userId, ctx.session.user.id),
        eq(members.orgId, (input as any).orgId)
      ),
    });
    if (!member) throw new TRPCError({ code: "FORBIDDEN", message: "Not a member of this org" });
    return next({ ctx: { ...ctx, member, orgId: (input as any).orgId } });
  });

