import { z, zodUndefinedModel } from "../../schema";
import { publicProcedure, router } from "../../trpc";
import { generatePath } from "../../utils/path-generator";

const TAGS = ["Health"];
const getPath = generatePath("/health");

export const healthRouter = router({
  getHealth: publicProcedure
    .meta({ openapi: { method: "GET", path: getPath(""), tags: TAGS } })
    .input(zodUndefinedModel)
    .output(
      z.object({
        status: z.literal("healthy").describe("status of the server"),
      }),
    )
    .query(async () => {
      return {
        status: "healthy",
      };
    }),
});
