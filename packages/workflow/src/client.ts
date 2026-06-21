import { Inngest, EventSchemas } from "inngest";
import { z } from "zod";
import { GithubPrOpenedEventSchema } from "./events";

type Events = {
  "github.pr.opened": {
    data: z.infer<typeof GithubPrOpenedEventSchema>;
  };
};

export const inngest = new Inngest({
  id: "shipflow-ai",
  schemas: new EventSchemas().fromRecord<Events>(),
});
