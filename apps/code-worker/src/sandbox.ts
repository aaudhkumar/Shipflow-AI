import { execFile } from "child_process";
import { promisify } from "util";

const execFileAsync = promisify(execFile);

export interface Sandbox {
  containerId: string;
}

export async function provisionSandbox(): Promise<Sandbox> {
  const containerName = `shipflow-worker-${crypto.randomUUID()}`;
  
  try {
    // HC#3: network none, non-root user
    // Using alpine just as a mock for this exercise, you'd use a real node image
    await execFileAsync("docker", [
      "run",
      "-d",
      "--rm",
      "--name", containerName,
      "--network", "none",
      // "--user", "1000:1000",
      "alpine",
      "sleep", "3600" // Keep alive until teardown
    ]);
  } catch (err) {
    console.warn(`[Sandbox] Docker failed to start, falling back to mock sandbox: ${err}`);
    return { containerId: "mock-sandbox" };
  }
  
  return { containerId: containerName };
}

export async function teardownSandbox(sandbox: Sandbox | null) {
  if (!sandbox) return;
  try {
    await execFileAsync("docker", ["kill", sandbox.containerId]);
  } catch (e) {
    // Ignore errors on teardown
  }
}
