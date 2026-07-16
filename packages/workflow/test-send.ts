import { Inngest } from "inngest";
const inngest = new Inngest({ id: "shipflow-ai", baseUrl: "http://127.0.0.1:8288/", eventKey: "local" });
async function run() {
  try {
    const result = await inngest.send({
      name: "test.event",
      data: {}
    });
    console.log("Success:", result);
  } catch (err) {
    console.error("Error:", err);
  }
}
run();
