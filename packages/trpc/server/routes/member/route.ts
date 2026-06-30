import { router, orgMemberProcedure, protectedProcedure } from "../../trpc";
import { z } from "zod";
import { db } from "@shipflow/db";
import { members, users, organizations, orgInvitations } from "@shipflow/db/schema";
import { eq, and, gt } from "drizzle-orm";
import jwt from "jsonwebtoken";
import { sendInvitationEmail } from "@shipflow/email";
import { createAuditLog, AuditAction } from "@shipflow/services/audit";
import { createNotification } from "@shipflow/services/notification";
import { generatePath } from "../../utils/path-generator";
import {
  getMemberMeOutputSchema,
  getMemberListOutputSchema,
  getMemberInvitationsOutputSchema,
  inviteMemberOutputSchema,
  acceptInvitationOutputSchema,
  revokeInvitationOutputSchema
} from "@shipflow/services/member/model";

const TAGS = ["Member"];
const getPath = generatePath("/members");

export const memberRouter = router({
  me: orgMemberProcedure
    .meta({ openapi: { method: "GET", path: getPath("/{orgId}/me"), tags: TAGS } })
    .input(z.object({ orgId: z.string() }))
    .output(getMemberMeOutputSchema)
    .query(async ({ ctx }) => {
      return ctx.member;
    }),
    
  list: orgMemberProcedure
    .meta({ openapi: { method: "GET", path: getPath("/{orgId}"), tags: TAGS } })
    .input(z.object({ orgId: z.string() }))
    .output(getMemberListOutputSchema)
    .query(async ({ input }) => {
      const results = await db
        .select({
          id: members.id,
          role: members.role,
          user: {
            id: users.id,
            name: users.name,
            email: users.email,
            image: users.image,
          }
        })
        .from(members)
        .innerJoin(users, eq(members.userId, users.id))
        .where(eq(members.orgId, input.orgId));
      return results;
    }),
    
  listInvitations: orgMemberProcedure
    .meta({ openapi: { method: "GET", path: getPath("/{orgId}/invitations"), tags: TAGS } })
    .input(z.object({ orgId: z.string() }))
    .output(getMemberInvitationsOutputSchema)
    .query(async ({ input }) => {
      const results = await db
        .select()
        .from(orgInvitations)
        .where(
          and(
            eq(orgInvitations.orgId, input.orgId),
            eq(orgInvitations.status, "PENDING")
          )
        );
      return results;
    }),

  invite: orgMemberProcedure
    .meta({ openapi: { method: "POST", path: getPath("/{orgId}/invitations"), tags: TAGS } })
    .input(z.object({ orgId: z.string(), email: z.string().email(), role: z.enum(["OWNER", "ADMIN", "PM", "DEVELOPER", "REVIEWER"]) }))
    .output(inviteMemberOutputSchema)
    .mutation(async ({ input, ctx }) => {
      const secret = process.env.INVITATION_SECRET;
      if (!secret) {
        throw new Error("INVITATION_SECRET is missing");
      }

      // Check if user is already a member
      const existingUser = await db.query.users.findFirst({ where: eq(users.email, input.email) });
      if (existingUser) {
        const existingMember = await db.query.members.findFirst({
          where: and(eq(members.orgId, input.orgId), eq(members.userId, existingUser.id))
        });
        if (existingMember) {
          throw new Error("User is already a member of this organization");
        }
      }

      const org = await db.query.organizations.findFirst({ where: eq(organizations.id, input.orgId) });
      if (!org) throw new Error("Organization not found");

      const inviter = await db.query.users.findFirst({ where: eq(users.id, ctx.session.user.id) });
      if (!inviter) throw new Error("Inviter not found");

      const token = jwt.sign({ orgId: input.orgId, email: input.email, role: input.role }, secret, { expiresIn: '72h' });

      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 72);

      await db.insert(orgInvitations).values({
        id: crypto.randomUUID(),
        orgId: input.orgId,
        email: input.email,
        role: input.role,
        token: token,
        status: "PENDING",
        invitedByUserId: ctx.session.user.id,
        expiresAt: expiresAt
      }).returning({ id: orgInvitations.id });

      await createAuditLog({
        orgId: input.orgId,
        actorId: ctx.session.user.id,
        action: AuditAction.ORG_MEMBER_INVITED,
        resourceType: 'MEMBER',
        resourceId: input.email
      });

      const acceptUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/invitations/accept?token=${token}`;

      await sendInvitationEmail({
        to: input.email,
        orgName: org.name,
        inviterName: inviter.name || inviter.email,
        role: input.role,
        acceptUrl,
      });

      if (existingUser) {
        await createNotification({
          userId: existingUser.id,
          orgId: input.orgId,
          type: "MEMBER_INVITED",
          title: "Organization Invitation",
          message: `${inviter.name || inviter.email} invited you to join ${org.name}.`,
          resourceType: "MEMBER",
          resourceId: orgInvitations.id.toString(), // Actually it's just the random uuid
          actionUrl: acceptUrl,
        });
      }

      return { status: "SENT" };
    }),

  acceptInvitation: protectedProcedure
    .meta({ openapi: { method: "POST", path: getPath("/invitations/accept"), tags: TAGS } })
    .input(z.object({ token: z.string() }))
    .output(acceptInvitationOutputSchema)
    .mutation(async ({ input, ctx }) => {
      const secret = process.env.INVITATION_SECRET;
      if (!secret) {
        throw new Error("INVITATION_SECRET is missing");
      }

      let payload;
      try {
        payload = jwt.verify(input.token, secret) as { orgId: string, email: string, role: string };
      } catch (err) {
        throw new Error("Invalid or expired invitation token");
      }

      const invite = await db.query.orgInvitations.findFirst({
        where: and(
          eq(orgInvitations.token, input.token),
          eq(orgInvitations.status, "PENDING")
        )
      });

      if (!invite) {
        throw new Error("Invitation not found or already processed");
      }

      if (new Date() > new Date(invite.expiresAt)) {
        await db.update(orgInvitations).set({ status: "EXPIRED" }).where(eq(orgInvitations.id, invite.id));
        throw new Error("Invitation has expired");
      }

      const existingMember = await db.query.members.findFirst({
        where: and(eq(members.orgId, invite.orgId), eq(members.userId, ctx.session.user.id))
      });

      if (existingMember) {
        // Already a member, just mark as accepted
        await db.update(orgInvitations).set({ status: "ACCEPTED", acceptedAt: new Date() }).where(eq(orgInvitations.id, invite.id));
        return { success: true, orgId: invite.orgId };
      }

      await db.transaction(async (tx) => {
        await tx.insert(members).values({
          id: crypto.randomUUID(),
          orgId: invite.orgId,
          userId: ctx.session.user.id,
          role: invite.role as any,
        });

        await tx.update(orgInvitations)
          .set({ status: "ACCEPTED", acceptedAt: new Date() })
          .where(eq(orgInvitations.id, invite.id));
      });

      return { success: true, orgId: invite.orgId };
    }),

  revokeInvitation: orgMemberProcedure
    .meta({ openapi: { method: "DELETE", path: getPath("/{orgId}/invitations/{id}"), tags: TAGS } })
    .input(z.object({ id: z.string(), orgId: z.string() }))
    .output(revokeInvitationOutputSchema)
    .mutation(async ({ input, ctx }) => {
      await db.update(orgInvitations)
        .set({ status: "REVOKED" })
        .where(
          and(
            eq(orgInvitations.id, input.id),
            eq(orgInvitations.orgId, input.orgId)
          )
        );
        
      await createAuditLog({
        orgId: input.orgId,
        actorId: ctx.session.user.id,
        action: AuditAction.ORG_MEMBER_REMOVED,
        resourceType: 'MEMBER',
        resourceId: input.id
      });
      return { success: true };
    })
});
