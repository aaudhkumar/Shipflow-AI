import { router } from "./trpc";

import { healthRouter } from "./routes/health/route";
import { authRouter } from "./routes/auth/route";
import { workspaceRouter } from "./routes/workspace/route";

export const serverRouter = router({
  health: healthRouter,
  auth: authRouter,
  workspace: workspaceRouter,
});

export { createContext } from "./context";
export type ServerRouter = typeof serverRouter;
