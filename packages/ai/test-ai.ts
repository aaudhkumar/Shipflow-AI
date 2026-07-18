import { runClarifierAgent } from "./src/agents/clarifier/index";
import { config } from "dotenv";
config();
runClarifierAgent("test", "test description").then(console.log).catch(console.error);
