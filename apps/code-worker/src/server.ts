import express, { type Express } from "express";
import { handleImplement } from "./implement";

export const app: Express = express();
app.use(express.json());

app.get("/", (req, res) => {
  res.status(200).send("OK");
});

app.post("/implement", (req, res) => {
  const { taskId } = req.body;
  // Trigger asynchronously and immediately return
  handleImplement(req.body).catch(console.error);
  res.status(202).json({ message: "Accepted", taskId });
});
