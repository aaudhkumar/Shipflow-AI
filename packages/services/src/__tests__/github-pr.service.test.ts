import { describe, it, expect, vi } from "vitest";
import GithubPrService from "../github/github-pr.service";
import * as github from "@shipflow/github";

vi.mock("@shipflow/github", () => ({
  getInstallationOctokit: vi.fn(),
}));

describe("GithubPrService", () => {
  it("ensureBranch should be idempotent", async () => {
    const service = new GithubPrService();
    
    const getBranchMock = vi.fn().mockResolvedValue({ data: {} });
    const getRefMock = vi.fn();
    const createRefMock = vi.fn();
    
    (github.getInstallationOctokit as any).mockResolvedValue({
      rest: {
        repos: {
          getBranch: getBranchMock,
        },
        git: {
          getRef: getRefMock,
          createRef: createRefMock,
        }
      }
    });

    // Call it first time - branch exists
    await service.ensureBranch({
      installationId: 1,
      owner: "acme",
      repo: "frontend",
      branch: "feat-1",
      defaultBranch: "main"
    });

    expect(getBranchMock).toHaveBeenCalledTimes(1);
    expect(getRefMock).not.toHaveBeenCalled();
    expect(createRefMock).not.toHaveBeenCalled();

    // Call it second time - branch does not exist
    getBranchMock.mockRejectedValueOnce(new Error("Not found"));
    getRefMock.mockResolvedValue({ data: { object: { sha: "abc" } } });
    
    await service.ensureBranch({
      installationId: 1,
      owner: "acme",
      repo: "frontend",
      branch: "feat-1",
      defaultBranch: "main"
    });

    expect(getBranchMock).toHaveBeenCalledTimes(2);
    expect(getRefMock).toHaveBeenCalledTimes(1);
    expect(createRefMock).toHaveBeenCalledTimes(1);
    expect(createRefMock).toHaveBeenCalledWith({
      owner: "acme",
      repo: "frontend",
      ref: "refs/heads/feat-1",
      sha: "abc"
    });
  });
});
