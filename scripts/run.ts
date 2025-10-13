import { exists } from "@std/fs";
import { createOctoKit } from "./utils.ts";

/**
 * @param blockID {string} block to update (e.g. `<!-- START blockID -->`)
 * @param text {string} text to update
 * @param update {string} text to insert between blockID
 * @returns
 */
const updateText = (
  blockID: string,
  text: string,
  update: string,
): {
  updatedText: string;
  hasChanges: boolean;
} => {
  const snippetIdentifier = `<!-- START ${blockID} -->`;
  const startSnippetPos = text.indexOf(snippetIdentifier);
  const endSnippetPos = text.indexOf(`<!-- END ${blockID} -->`);

  const startSnippet = text.slice(
    0,
    startSnippetPos + snippetIdentifier.length,
  );
  const endSnippet = text.slice(endSnippetPos);

  const currentText = text.slice(
    startSnippetPos + snippetIdentifier.length,
    endSnippetPos,
  );
  // console.log(currentText);
  const updatedText = `${startSnippet}\n${update}\n${endSnippet}`;
  const compared = currentText.trim().localeCompare(update.trim());

  if (compared === 0) {
    console.log(`No changes detected for ${blockID}`);
  } else {
    console.log(`Changes detected for ${blockID}`);
  }

  return {
    updatedText,
    hasChanges: compared !== 0,
  };
};

type DataObject = {
  title: string;
  description: string;
  author: string;
  contributors: string[];
  api: string | null;
  utils: string | null;
  swift?: boolean;
};

const dataPath = import.meta.resolve(
  "../repo/data/data.json",
).replace("file://", "");
const readMePath = import.meta.resolve(
  "../README.md",
).replace("file://", "");

const dataFile = await exists(dataPath);
const readMeFile = await exists(readMePath);

if (!dataFile || !readMeFile) {
  console.error("Data file or README file not found");
  Deno.exit(1);
}

const dataString = await Deno.readTextFile(dataPath);
const data = JSON.parse(dataString) as Record<string, DataObject>;

const allAuthoredPackages = Object.entries(data).filter((p) =>
  p[1].author === "j3lte"
).sort((a, b) => a[1].title.localeCompare(b[1].title));

const allContributedPackages = Object.entries(data).filter((p) =>
  p[1].contributors.includes("j3lte")
).sort((a, b) => a[1].title.localeCompare(b[1].title));

const octokit = createOctoKit();

const issues = await octokit.rest.issues.listForRepo({
  owner: "raycast",
  repo: "extensions",
  state: "open",
  mentioned: "j3lte",
  per_page: 100, // Adjust as needed, max is 100 per page
});

const issueMapping = issues.data.filter((issue) =>
  issue.url.includes("/issues/")
)
  .map((issue) =>
    issue.labels.find((label) =>
      typeof label === "string"
        ? label.includes("extension:")
        : label?.name?.includes("extension:") ?? null
    )
  ).map((label) => typeof label === "string" ? label : label?.name ?? null)
  .filter((label) => label !== null)
  .reduce((acc, label) => {
    const name = label.split(":")[1].trim();
    if (!name) {
      return acc;
    }
    if (!acc.has(name)) {
      acc.set(name, 1);
    } else {
      acc.set(name, acc.get(name)! + 1);
    }
    return acc;
  }, new Map<string, number>());

const maxRow = Math.max(
  allAuthoredPackages.length,
  allContributedPackages.length,
);

// https://github.com/raycast/extensions/issues?q=is%3Aissue%20label%3A%22extension%3A%20anna-s-archive%22%20state%3Aopen

// Generate markdown table, with on the left the packages I authored, and on the right the packages I contributed to
let table = "\n| Authored | Contributed |\n| --- | --- |";
for (let i = 0; i < maxRow; i++) {
  const authored = allAuthoredPackages[i];
  const contributed = allContributedPackages[i];

  const authoredEntry = authored && authored.length === 2
    ? `[${authored[1].title} \`${authored[1].api}\`](https://raycast.com/${
      authored[1].author
    }/${authored[0]})${
      issueMapping.get(authored[0])
        ? ` [(⚠️${
          issueMapping.get(authored[0])
        })](https://github.com/raycast/extensions/issues?q=is%3Aissue%20label%3A%22extension%3A%20${
          authored[0]
        }%22%20state%3Aopen)`
        : ""
    }`
    : " ";
  const contributedEntry = contributed && contributed.length === 2
    ? `[${contributed[1].title} \`${
      contributed[1].api
    }\`](https://raycast.com/${contributed[1].author}/${contributed[0]})${
      issueMapping.get(contributed[0])
        ? ` [(⚠️${
          issueMapping.get(contributed[0])
        })](https://github.com/raycast/extensions/issues?q=is%3Aissue%20label%3A%22extension%3A%20${
          contributed[0]
        }%22%20state%3Aopen)`
        : ""
    }`
    : " ";

  table += `\n| ${authoredEntry} | ${contributedEntry} |`;
}
table += "\n";

const README = await Deno.readTextFile(readMePath);

const { updatedText } = updateText("RAYCAST", README, table);

await Deno.writeTextFile(readMePath, updatedText);
