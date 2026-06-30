# Chaicode Hackathon: Evaluator Walkthrough (DEMO)

Welcome Judges! This guide is specifically designed to help you quickly evaluate the core technical achievements of **Shipflow AI**. In just 5 minutes, you will see a task go from an idea to a fully autonomously generated Pull Request on GitHub.

## 🔗 Live Application Links
- **Web App:** [https://shipflow-ai-web-eight.vercel.app](https://shipflow-ai-web-eight.vercel.app)
- **API Server:** [https://shipflow-ai-1.onrender.com](https://shipflow-ai-1.onrender.com)
- **Code Worker (AI Sandbox):** [https://shipflow-ai.onrender.com](https://shipflow-ai.onrender.com)

---

## ⏱️ The 5-Minute "Wow Factor" Walkthrough

Please follow these exact steps to test the end-to-end capabilities.

### Step 1: Onboarding & Auth
1. Go to [https://shipflow-ai-web-eight.vercel.app](https://shipflow-ai-web-eight.vercel.app).
2. Sign in using **Google or GitHub OAuth** (no pre-seeded accounts are required).
3. Create a new Organization and a Project. 
   - *Technical Note:* This tests the `better-auth` integration and multi-tenant DB isolation via Drizzle ORM.

### Step 2: Connect GitHub
1. Navigate to the Repositories section.
2. Click to connect your GitHub account via the Shipflow GitHub App. Give it access to a simple test repository (e.g., a basic Vite or Node app).
   - *Technical Note:* This tests the asynchronous GitHub App installation flow and the Inngest background sync job (`repo.sync.requested`).

### Step 3: AI-Assisted Planning
1. Go to your Project and create a new **Feature** (e.g., "Add a health check endpoint").
2. Click **Generate PRD (AI)**. Shipflow will use OpenAI to draft a complete Product Requirements Document.
3. Once the PRD is generated, click **Generate Tasks**. The AI will break the PRD down into granular engineering tasks (e.g., "Create `/health` route in Express").
   - *Technical Note:* This tests the AI integration in the main Express backend. It also tests the **Billing Guard** middleware (`enforceBillingLimit`), which tracks AI usage against your Organization's plan.

### Step 4: Autonomous Code Execution (The Main Event)
1. Navigate to the Kanban board and select a Task.
2. Ensure it is linked to your GitHub repository.
3. Click **Execute with AI Worker**.
4. **Watch the magic:** The task state will change to Running. Behind the scenes, the Express API pings the completely isolated **Code-Worker service** running at `https://shipflow-ai.onrender.com`.

**What is happening inside the Code-Worker?**
- It spins up an isolated sandbox.
- It securely clones your GitHub repository using short-lived installation tokens.
- It initiates an agentic loop (up to 12 iterations) using OpenAI.
- The AI uses tools to `read_file`, `write_file`, and optionally run `lint`/`build`.
- *Security Flex:* Every file the AI writes is passed through an entropy-based Secret Scanner to ensure no API keys are leaked into your codebase!
- Once finished, the worker commits the changes, pushes to a new branch, and uses the GitHub API to open a Pull Request.

### Step 5: Verify the Result
1. Go to your connected GitHub repository.
2. You will see a brand new Pull Request titled `[Shipflow] Implement: <Task Name>`.
3. Review the code the AI wrote for you autonomously.

---

## 💰 Bonus Points: Test the Billing Integration
If you have time, you can trigger the Razorpay billing flow:
1. Attempt to generate too many PRDs/Tasks until you hit the free tier usage limit.
2. You will be prompted to upgrade.
3. Click Upgrade to trigger the Razorpay checkout session (in test mode).
4. Once completed, a secure Razorpay webhook hits the Express server, validates the HMAC signature, and instantly unlocks unlimited AI executions for your organization.
