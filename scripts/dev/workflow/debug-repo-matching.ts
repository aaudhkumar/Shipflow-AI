import { db } from "@shipflow/db";
import { repositories, projectRepositories, featureRequests } from "@shipflow/db/schema";
import { eq, and, sql, notInArray, inArray } from "drizzle-orm";

async function run() {
  console.log("Starting debug script...");
  
  // 1. Let's find all repos
  const repos = await db.query.repositories.findMany();
  console.log("REPOS:", repos.map(r => ({ id: r.id, fullName: r.fullName })));
  
  // 2. Find all feature requests
  const features = await db.query.featureRequests.findMany();
  console.log("FEATURES:", features.map(f => ({ id: f.id, title: f.title, status: f.status, projectId: f.projectId, orgId: f.orgId })));

  // 3. Find all project repositories
  const projRepos = await db.query.projectRepositories.findMany();
  console.log("PROJ_REPOS:", projRepos);

  // 4. Test the TRGM query
  const title = "dark mode button not working";
  const orgId = features[0]?.orgId; // Assuming there's at least one feature
  const repositoryId = repos[0]?.id; // Assuming we use the first repo for testing
  
  if (!orgId || !repositoryId) {
    console.log("Missing orgId or repositoryId, exiting.");
    process.exit(0);
  }
  
  console.log(`\nTesting TRGM for orgId: ${orgId}, repositoryId: ${repositoryId}, title: "${title}"`);
  
  try {
    const res = await db.execute(sql`
      SELECT id, title, similarity(title, ${title}) AS sim
      FROM feature_requests
      WHERE org_id = ${orgId}
        AND status NOT IN ('SHIPPED', 'REJECTED')
        AND similarity(title, ${title}) > 0.35
        AND project_id IN (
          SELECT project_id FROM project_repositories
          WHERE repository_id = ${repositoryId}
        )
      ORDER BY sim DESC
      LIMIT 1;
    `);
    console.log("TRGM RESULT:", res.rows);
  } catch (err) {
    console.error("TRGM QUERY FAILED:", err);
  }

  process.exit(0);
}

run().catch(console.error);
