import { router } from "./trpc";

import { healthRouter } from "./routes/health/route";
import { authRouter } from "./routes/auth/route";
import { organizationRouter } from "./routes/organization/route";
import { featureRouter } from "./routes/feature/route";

export const serverRouter = router({
  health: healthRouter,
  auth: authRouter,
  organization: organizationRouter,
  feature: featureRouter,
});

export { createContext } from "./context";
export type ServerRouter = typeof serverRouter;
