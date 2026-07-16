import { z } from "zod";
import { generateOpenApiDocument } from "trpc-to-openapi";
import { router, publicProcedure } from "@shipflow/trpc/server/trpc";

const testSchema = z.custom<any>().openapi({ type: 'object' });

const appRouter = router({
  test: publicProcedure
    .meta({ openapi: { method: 'GET', path: '/test', tags: ['Test'] } })
    .input(z.void())
    .output(testSchema)
    .query(() => { return { hello: "world" }; })
});

try {
  const doc = generateOpenApiDocument(appRouter, { title: "Test", version: "1", baseUrl: "http://localhost" });
  console.log("SUCCESS");
  console.log(JSON.stringify(doc, null, 2));
} catch (e) {
  console.error("FAILED", e);
}
