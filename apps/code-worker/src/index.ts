import { app } from "./server";

const PORT = process.env.WORKER_PORT || process.env.PORT || 3004;

app.listen(PORT, () => {
  console.log(`Code worker running on port ${PORT}`);
});
