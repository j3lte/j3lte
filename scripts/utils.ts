import { Octokit } from "octokit";

export function createOctoKit(): Octokit {
  return new Octokit({
    auth: getGitHubToken(),
  });
}

export function getGitHubToken(): string {
  return getEnvVarOrThrow("GITHUB_TOKEN");
}

function getEnvVarOrThrow(name: string) {
  const value = Deno.env.get(name);
  if (value == null) {
    throw new Error(
      `Could not find environment variable ${name}. ` +
        `Ensure you are running in a GitHub action.`,
    );
  }
  return value;
}
