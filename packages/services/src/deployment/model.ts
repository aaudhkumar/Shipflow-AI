import { z } from "zod";

type DeploymentOutput = {
  id: string;
  environment: string;
  commitSha: string | null;
  status: string;
  url: string | null;
  deployedAt: string;
  repositoryName: string | null;
};

export const getDeploymentListOutputSchema = z.any() as z.ZodType<DeploymentOutput[]>;
