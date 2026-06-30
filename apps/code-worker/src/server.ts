import express from "express";
import { handleImplement } from "./implement";

export const app = express();
app.use(express.json());

app.post("/implement", async (req, res) => {
  const result = await handleImplement(req.body); // { taskId }
  res.json(result);
});
