import { createTRPCReact } from "@trpc/react-query";
import { ServerRouter } from "@shipflow/trpc/client";

export const trpc = createTRPCReact<ServerRouter>();
