import { db } from "@shipflow/db";
import { organizations, members } from "@shipflow/db/schema";
import { eq } from "@shipflow/db";

export class OrganizationRepository {
  async createOrganization(data: typeof organizations.$inferInsert, userId: string) {
    return await db.transaction(async (tx) => {
      const [organization] = await tx.insert(organizations).values(data).returning();
      if (!organization) throw new Error("Failed to create organization");
      
      await tx.insert(members).values({
        id: crypto.randomUUID(),
        orgId: organization.id,
        userId: userId,
        role: "OWNER"
      });
      return organization;
    });
  }

  async listOrganizationsForUser(userId: string) {
    const userMemberships = await db.select({
      organization: organizations
    })
    .from(members)
    .innerJoin(organizations, eq(members.orgId, organizations.id))
    .where(eq(members.userId, userId));

    return userMemberships.map(m => m.organization);
  }

  async getBySlug(slug: string) {
    const org = await db.query.organizations.findFirst({
      where: eq(organizations.slug, slug),
    });
    return org;
  }

  async getStats(orgId: string) {
    const { pullRequests, reviewFindings, pullRequestReviews, featureRequests } = await import("@shipflow/db/schema");
    const { sql, eq, and, not } = await import("@shipflow/db");

    const [totalPRs] = await db
      .select({ count: sql<number>`count(*)` })
      .from(pullRequests)
      .where(eq(pullRequests.orgId, orgId));

    const [criticalBugs] = await db
      .select({ count: sql<number>`count(*)` })
      .from(reviewFindings)
      .innerJoin(pullRequestReviews, eq(reviewFindings.reviewId, pullRequestReviews.id))
      .innerJoin(pullRequests, eq(pullRequestReviews.pullRequestId, pullRequests.id))
      .where(and(eq(pullRequests.orgId, orgId), eq(reviewFindings.isBlocking, true)));

    const activeFeaturesQuery = await db
      .select({ count: sql<number>`count(*)` })
      .from(featureRequests)
      .where(and(eq(featureRequests.orgId, orgId), not(eq(featureRequests.status, "SHIPPED"))));
    const [activeFeatures] = activeFeaturesQuery;

    const prReviews = await db
      .select({ reviewMeta: pullRequestReviews.reviewMeta })
      .from(pullRequestReviews)
      .innerJoin(pullRequests, eq(pullRequestReviews.pullRequestId, pullRequests.id))
      .where(and(eq(pullRequests.orgId, orgId), eq(pullRequestReviews.isAiReview, true)));

    let approved = 0;
    let totalAssessed = 0;
    prReviews.forEach(r => {
      const meta = r.reviewMeta as any;
      if (meta && typeof meta === 'object' && meta.shouldMerge !== undefined) {
        totalAssessed++;
        if (meta.shouldMerge === true) {
          approved++;
        }
      }
    });
    
    // Default to 100% if no PRs have been assessed yet
    const approvalRate = totalAssessed > 0 ? Math.round((approved / totalAssessed) * 100) : 0 ;

    return {
      totalPRsAnalyzed: Number(totalPRs?.count || 0),
      criticalBugsCaught: Number(criticalBugs?.count || 0),
      approvalRate,
      activeFeatures: Number(activeFeatures?.count || 0),
    };
  }

  async getRecentActivity(orgId: string) {
    const { pullRequests, pullRequestReviews, repositories, githubInstallations } = await import("@shipflow/db/schema");
    const { eq, desc } = await import("@shipflow/db");

    const activityQuery = await db
      .select({
        reviewId: pullRequestReviews.id,
        pullRequestId: pullRequests.id,
        prTitle: pullRequests.title,
        githubPrNumber: pullRequests.githubPrNumber,
        repoName: repositories.fullName,
        installationId: githubInstallations.installationId,
        state: pullRequestReviews.state,
        createdAt: pullRequestReviews.createdAt,
        isAiReview: pullRequestReviews.isAiReview,
        reviewMeta: pullRequestReviews.reviewMeta,
      })
      .from(pullRequestReviews)
      .innerJoin(pullRequests, eq(pullRequestReviews.pullRequestId, pullRequests.id))
      .innerJoin(repositories, eq(pullRequests.repositoryId, repositories.id))
      .leftJoin(githubInstallations, eq(pullRequests.orgId, githubInstallations.orgId))
      .where(eq(pullRequests.orgId, orgId))
      .orderBy(desc(pullRequestReviews.createdAt))
      .limit(10);
      
    const activity = activityQuery.map(a => {
      const parts = a.repoName.split('/');
      const repoOwner = parts[0] || '';
      const repoName = parts[1] || a.repoName;
      return {
        ...a,
        repoOwner,
        repoName,
      };
    });

    return activity;
  }

  async getChartData(orgId: string) {
    const { pullRequestReviews, pullRequests } = await import("@shipflow/db/schema");
    const { eq, and, gte } = await import("@shipflow/db");

    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const reviews = await db
      .select({ createdAt: pullRequestReviews.createdAt })
      .from(pullRequestReviews)
      .innerJoin(pullRequests, eq(pullRequestReviews.pullRequestId, pullRequests.id))
      .where(and(eq(pullRequests.orgId, orgId), gte(pullRequestReviews.createdAt, sevenDaysAgo)));

    const countsByDay: Record<string, number> = {};
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      countsByDay[dateStr] = 0;
    }

    reviews.forEach(r => {
      const dateStr = new Date(r.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" });
      if (countsByDay[dateStr] !== undefined) {
        countsByDay[dateStr]++;
      }
    });

    return Object.entries(countsByDay).map(([date, count]) => ({ date, count }));
  }

  async getAnalytics(orgId: string, days: number = 7) {
    const { pullRequestReviews, pullRequests, reviewFindings, featureRequests, tasks } = await import("@shipflow/db/schema");
    const { eq, and, gte, inArray, isNotNull, desc } = await import("@shipflow/db");

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // 1. PR Analysis Volume Trend
    const reviews = await db
      .select({ createdAt: pullRequestReviews.createdAt, state: pullRequestReviews.state })
      .from(pullRequestReviews)
      .innerJoin(pullRequests, eq(pullRequestReviews.pullRequestId, pullRequests.id))
      .where(and(eq(pullRequests.orgId, orgId), gte(pullRequestReviews.createdAt, startDate)));

    const countsByDay: Record<string, { date: string; analyses: number }> = {};
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      countsByDay[dateStr] = { date: dateStr, analyses: 0 };
    }

    reviews.forEach(r => {
      const dateStr = new Date(r.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" });
      if (countsByDay[dateStr]) {
        countsByDay[dateStr].analyses++;
      }
    });
    const volumeTrend = Object.values(countsByDay);

    // 2. Average Review Time by Severity (Real data)
    // Calculating based on the time difference between review creation and PR merge
    const reviewTimeFindingsQuery = await db
      .select({
        severity: reviewFindings.severity,
        reviewCreatedAt: pullRequestReviews.createdAt,
        prMergedAt: pullRequests.mergedAt
      })
      .from(reviewFindings)
      .innerJoin(pullRequestReviews, eq(reviewFindings.reviewId, pullRequestReviews.id))
      .innerJoin(pullRequests, eq(pullRequestReviews.pullRequestId, pullRequests.id))
      .where(and(
        eq(pullRequests.orgId, orgId),
        isNotNull(pullRequests.mergedAt)
      ));

    const severityStats = {
      "BLOCKER": { totalHours: 0, count: 0 },
      "MAJOR": { totalHours: 0, count: 0 },
      "MINOR": { totalHours: 0, count: 0 },
      "SUGGESTION": { totalHours: 0, count: 0 },
    };

    reviewTimeFindingsQuery.forEach(f => {
      if (f.prMergedAt && f.reviewCreatedAt) {
        const stats = f.severity ? severityStats[f.severity as keyof typeof severityStats] : undefined;
        if (stats) {
          const diffMs = Math.max(0, f.prMergedAt.getTime() - f.reviewCreatedAt.getTime());
          stats.totalHours += diffMs / (1000 * 60 * 60);
          stats.count++;
        }
      }
    });

    const reviewTimeBySeverity = [
      { severity: "BLOCKER", avgHours: severityStats["BLOCKER"].count > 0 ? Number((severityStats["BLOCKER"].totalHours / severityStats["BLOCKER"].count).toFixed(1)) : 0 },
      { severity: "MAJOR", avgHours: severityStats["MAJOR"].count > 0 ? Number((severityStats["MAJOR"].totalHours / severityStats["MAJOR"].count).toFixed(1)) : 0 },
      { severity: "MINOR", avgHours: severityStats["MINOR"].count > 0 ? Number((severityStats["MINOR"].totalHours / severityStats["MINOR"].count).toFixed(1)) : 0 },
      { severity: "SUGGESTION", avgHours: severityStats["SUGGESTION"].count > 0 ? Number((severityStats["SUGGESTION"].totalHours / severityStats["SUGGESTION"].count).toFixed(1)) : 0 },
    ];

    // 3. Feature-to-Ship Timeline
    const features = await db
      .select({ id: featureRequests.id, title: featureRequests.title, createdAt: featureRequests.createdAt, updatedAt: featureRequests.updatedAt, status: featureRequests.status })
      .from(featureRequests)
      .where(and(eq(featureRequests.orgId, orgId), eq(featureRequests.status, "SHIPPED")))
      .orderBy(desc(featureRequests.updatedAt))
      .limit(10);
    
    const featureTimeline = features.map(f => {
      const durationMs = f.updatedAt.getTime() - f.createdAt.getTime();
      const durationDays = Math.max(1, Math.round(durationMs / (1000 * 60 * 60 * 24)));
      return { id: f.id, title: f.title, durationDays, shippedAt: f.updatedAt };
    });

    // 4. Team Productivity Heatmap (Using PRs + Tasks)
    const orgPrs = await db.select({ createdAt: pullRequests.createdAt }).from(pullRequests).where(and(eq(pullRequests.orgId, orgId), gte(pullRequests.createdAt, startDate)));
    // (Tasks don't natively have orgId but we can skip if complex, just use PRs and Reviews for now)
    const heatmapCounts: Record<string, number> = {};
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split("T")[0]!; // YYYY-MM-DD
      heatmapCounts[dateStr] = 0;
    }
    orgPrs.forEach(pr => {
      const dateStr = new Date(pr.createdAt).toISOString().split("T")[0]!;
      if (heatmapCounts[dateStr] !== undefined) heatmapCounts[dateStr]++;
    });
    reviews.forEach(r => {
      const dateStr = new Date(r.createdAt).toISOString().split("T")[0]!;
      if (heatmapCounts[dateStr] !== undefined) heatmapCounts[dateStr]++;
    });
    const productivityHeatmap = Object.entries(heatmapCounts).map(([date, count]) => ({ date, count }));

    // 5. Security Finding Trends
    // Filter reviewFindings by findingType = 'SECURITY' (assuming we have finding types)
    // For now we map all findings and group by date + isBlocking
    const findingsQuery = await db
      .select({ id: reviewFindings.id, isBlocking: reviewFindings.isBlocking, createdAt: pullRequestReviews.createdAt, severity: reviewFindings.severity })
      .from(reviewFindings)
      .innerJoin(pullRequestReviews, eq(reviewFindings.reviewId, pullRequestReviews.id))
      .innerJoin(pullRequests, eq(pullRequestReviews.pullRequestId, pullRequests.id))
      .where(and(eq(pullRequests.orgId, orgId), gte(pullRequestReviews.createdAt, startDate)));

    const securityTrendsCounts: Record<string, { date: string, blocking: number, nonBlocking: number }> = {};
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const dateStr = d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
      securityTrendsCounts[dateStr] = { date: dateStr, blocking: 0, nonBlocking: 0 };
    }
    findingsQuery.forEach(f => {
      const dateStr = new Date(f.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" });
      if (securityTrendsCounts[dateStr]) {
        if (f.isBlocking || f.severity === 'BLOCKER') securityTrendsCounts[dateStr].blocking++;
        else securityTrendsCounts[dateStr].nonBlocking++;
      }
    });
    const securityTrends = Object.values(securityTrendsCounts);

    // 6. AI Accuracy Metrics
    // We proxy "accuracy" by checking if findings are ADDRESSED (true positive) vs IGNORED (false positive).
    const findingStatsQuery = await db
      .select({ status: reviewFindings.status })
      .from(reviewFindings)
      .innerJoin(pullRequestReviews, eq(reviewFindings.reviewId, pullRequestReviews.id))
      .innerJoin(pullRequests, eq(pullRequestReviews.pullRequestId, pullRequests.id))
      .where(and(eq(pullRequests.orgId, orgId), eq(pullRequestReviews.isAiReview, true)));

    let addressed = 0;
    let ignored = 0;
    let open = 0;

    findingStatsQuery.forEach(f => {
      if (f.status === "ADDRESSED") addressed++;
      else if (f.status === "IGNORED") ignored++;
      else open++;
    });

    const aiAccuracy = {
      truePositives: addressed,
      falsePositives: ignored,
      open: open,
      total: addressed + ignored + open,
      accuracyRate: (addressed + ignored) > 0 ? (addressed / (addressed + ignored)) * 100 : 0
    };

    // 7. Quality of PR Generated
    // Track how many PRs the AI recommended to merge vs not.
    const reviewsQuery = await db
      .select({ reviewMeta: pullRequestReviews.reviewMeta })
      .from(pullRequestReviews)
      .innerJoin(pullRequests, eq(pullRequestReviews.pullRequestId, pullRequests.id))
      .where(and(eq(pullRequests.orgId, orgId), eq(pullRequestReviews.isAiReview, true)));

    let recommended = 0;
    let notRecommended = 0;

    reviewsQuery.forEach(r => {
      const meta = (r.reviewMeta as any) || {};
      if (meta.shouldMerge === true) recommended++;
      else if (meta.shouldMerge === false) notRecommended++;
    });

    const prQualityMetrics = {
      correct: recommended,      // Reusing 'correct' key to avoid changing UI component props
      incorrect: notRecommended, // Reusing 'incorrect' key
      unmarked: 0,
      total: recommended + notRecommended,
      approvalRate: (recommended + notRecommended) > 0 ? (recommended / (recommended + notRecommended)) * 100 : 0
    };

    // 8. Source Channel Breakdown (Real data)
    // Using "gem" colors: Ruby (#e11d48), Sapphire (#2563eb), Emerald (#059669), Amethyst (#9333ea), Topaz (#f59e0b)
    const channelCounts = await db
      .select({ channel: featureRequests.sourceChannel })
      .from(featureRequests)
      .where(eq(featureRequests.orgId, orgId));

    let inApp = 0, emailCount = 0, ticket = 0, call = 0;
    channelCounts.forEach(f => {
      if (f.channel === "IN_APP") inApp++;
      else if (f.channel === "EMAIL") emailCount++;
      else if (f.channel === "TICKET") ticket++;
      else if (f.channel === "CALL") call++;
    });

    const sourceChannelBreakdown = [
      { name: "In-App", value: inApp, fill: "#2563eb" }, // Sapphire Blue
      { name: "Email", value: emailCount, fill: "#f59e0b" }, // Topaz Yellow
      { name: "Ticket", value: ticket, fill: "#059669" }, // Emerald Green
      { name: "Call", value: call, fill: "#9333ea" }, // Amethyst Purple
    ].filter(d => d.value > 0);

    return {
      volumeTrend,
      reviewTimeBySeverity,
      featureTimeline,
      productivityHeatmap,
      securityTrends,
      aiAccuracy,
      userReviewFeedback: prQualityMetrics, // Exporting as userReviewFeedback to avoid breaking page.tsx
      sourceChannelBreakdown
    };
  }

  async updateSettings(orgId: string, data: { name?: string; retentionDays?: number }) {
    const { organizations } = await import("@shipflow/db/schema");
    const { eq } = await import("@shipflow/db");
    const [updated] = await db.update(organizations).set({ ...data, updatedAt: new Date() }).where(eq(organizations.id, orgId)).returning();
    return updated;
  }

  async inviteMember(orgId: string, email: string, role: string) {
    const { users, members } = await import("@shipflow/db/schema");
    const { eq } = await import("@shipflow/db");
    
    // Simplified logic: If user exists, add them directly
    const user = await db.query.users.findFirst({ where: eq(users.email, email) });
    if (!user) {
      throw new Error("User with this email not found. They must sign up first.");
    }
    
    // Check if already member
    const existing = await db.query.members.findFirst({
      where: (members, { and, eq }) => and(eq(members.orgId, orgId), eq(members.userId, user.id))
    });
    
    if (existing) {
      throw new Error("User is already a member");
    }

    const [member] = await db.insert(members).values({
      id: crypto.randomUUID(),
      orgId,
      userId: user.id,
      role: role as any,
    }).returning();
    
    return member;
  }

  async updateMemberRole(orgId: string, memberId: string, newRole: string) {
    const { members } = await import("@shipflow/db/schema");
    const { eq, and } = await import("@shipflow/db");
    
    const [updated] = await db.update(members)
      .set({ role: newRole as any })
      .where(and(eq(members.orgId, orgId), eq(members.id, memberId)))
      .returning();
      
    return updated;
  }

  async removeMember(orgId: string, memberId: string) {
    const { members } = await import("@shipflow/db/schema");
    const { eq, and } = await import("@shipflow/db");
    
    await db.delete(members).where(and(eq(members.orgId, orgId), eq(members.id, memberId)));
    return { success: true };
  }

  async getMembers(orgId: string) {
    const { members, users } = await import("@shipflow/db/schema");
    const { eq, and, ne } = await import("@shipflow/db");
    
    const orgMembers = await db.select({
      id: members.id,
      role: members.role,
      joinedAt: members.joinedAt,
      user: {
        id: users.id,
        name: users.name,
        email: users.email,
        image: users.image,
      }
    }).from(members).innerJoin(users, eq(members.userId, users.id))
      .where(
        and(
          eq(members.orgId, orgId),
          ne(members.userId, "shipflow-ai-agent-user")
        )
      );
    
    return orgMembers;
  }
}
