import { router } from "./trpc";

import { healthRouter } from "./routes/health/route";
import { authRouter } from "./routes/auth/route";
import { organizationRouter } from "./routes/organization/route";
import { featureRouter } from "./routes/feature/route";
import { projectRouter } from "./routes/project/route";
import { pullRequestRouter } from "./routes/pullRequest/route";
import { billingRouter } from "./routes/billing/route";
import { repositoryRouter } from "./routes/repository/route";
import { memberRouter } from "./routes/member/route";
import { prdRouter } from "./routes/prd/route";
import { taskRouter } from "./routes/task/route";

import { auditRouter } from "./routes/audit/route";
import { notificationRouter } from "./routes/notification/route";
import { deploymentRouter } from "./routes/deployment/route";
import { taskExecutionRouter } from "./routes/task-execution/route";

export const serverRouter = router({
  health: healthRouter,
  auth: authRouter,
  organization: organizationRouter,
  feature: featureRouter,
  project: projectRouter,
  pullRequest: pullRequestRouter,
  billing: billingRouter,
  repository: repositoryRouter,
  member: memberRouter,
  prd: prdRouter,
  task: taskRouter,
  audit: auditRouter,
  notification: notificationRouter,
  deployment: deploymentRouter,
  taskExecution: taskExecutionRouter,
});

export { createContext } from "./context";
export type ServerRouter = typeof serverRouter;

