import express from "express";
import { logger } from "@shipflow/logger";
import cors from "cors";

import * as trpcExpress from "@trpc/server/adapters/express";
import { generateOpenApiDocument, createOpenApiExpressMiddleware } from "trpc-to-openapi";
import { apiReference } from "@scalar/express-api-reference";

import { serverRouter, createContext } from "@shipflow/trpc/server";

import { env } from "./env";

export const app = express();
const openApiDocument = generateOpenApiDocument(serverRouter, {
  title: "ShipFlow OpenAPI",
  version: "1.0.0",
  baseUrl: env.BASE_URL.concat("/api"),
});

const allowedOrigins = (process.env.CORS_ALLOWED_ORIGINS ?? 'http://localhost:3000').split(',').map(s => s.trim());

app.use(
  cors({
    origin: function (origin, callback) {
      // Wildcard origin with credentials is a security vulnerability — see SEC-02 in roadmap
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, origin);
      } else {
        callback(new Error(`Origin ${origin} not allowed by CORS`));
      }
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

app.use(express.json());

app.get("/", (req, res) => {
  return res.json({ message: "ShipFlow is up and running..." });
});

app.get("/health", (req, res) => {
  return res.json({ message: "ShipFlow server is healthy", healthy: true });
});

logger.debug(`openapi.json: ${env.BASE_URL}/openapi.json`);
app.get("/openapi.json", (req, res) => {
  return res.json(openApiDocument);
});

logger.debug(`docs: ${env.BASE_URL}/docs`);
app.use("/docs", apiReference({ url: "/openapi.json" }));

app.use(
  "/trpc",
  trpcExpress.createExpressMiddleware({
    router: serverRouter,
    createContext: ({ req }) =>
      createContext({
        headers: new Headers(req.headers as Record<string, string>),
      }),
  }),
);

app.use(
  "/api",
  createOpenApiExpressMiddleware({
    router: serverRouter,
    createContext: ({ req }) =>
      createContext({
        headers: new Headers(req.headers as Record<string, string>),
      }),
  }),
);

export default app;
