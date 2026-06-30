import express, { type Express } from "express";
import { handleImplement } from "./implement";

export const app: Express = express();
app.use(express.json());

app.post("/implement", async (req, res) => {
  const result = await handleImplement(req.body); // { taskId }
  res.json(result);
});
