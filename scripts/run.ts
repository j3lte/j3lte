import { exists } from "@std/fs";

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
  /** Name of the extension, corresponds with the path `extensions/<name>/package.json` */
  name: string;
  /** Title of the extension */
  title: string;
  /** Description of the extension */
  description: string;
  /** Author of the extension */
  author: string;
  /** Owner of the extension */
  owner?: string;
  /** Contributors of the extension */
  contributors: string[];
  /** API version of the extension */
  api: string | null;
  /** Utils version of the extension */
  utils: string | null;
  /** Whether the extension uses Swift (Mac) */
  swift?: boolean;
  /** Whether the extension has AI features */
  hasAi: boolean;
  /** Whether the extension has AI tools */
  hasTools: boolean;
  /** Whether the extension has Windows support */
  win?: boolean;
  /** Whether the extension has macOS support */
  mac?: boolean;
  /** Dependencies of the extension. This excludes `@raycast/api` and `@raycast/utils`, as they are tracked in `api` and `utils` respectively. */
  deps: Record<string, string>;
  /** Development dependencies of the extension */
  dev_deps: Record<string, string>;
  /** Latest update date from CHANGELOG.md */
  latestUpdate: {
    /** Date string in yyyy-mm-dd format */
    value: string;
    /** Unix timestamp of the date */
    timestamp: number;
  } | null;
  /** Number of issues for the extension */
  issues?: number;
};

const DATA_URL = "https://j3lte.github.io/awesome-raycast/data/data.json";
const readMePath = import.meta.resolve("../README.md").replace("file://", "");

const readMeFile = await exists(readMePath);

if (!readMeFile) {
  console.error("README file not found");
  Deno.exit(1);
}

const response = await fetch(DATA_URL);
if (!response.ok) {
  console.error(`Failed to fetch data: ${response.statusText}`);
  Deno.exit(1);
}
const data = await response.json() as DataObject[];

const allAuthoredPackages = data.filter((p) => p.author === "j3lte").sort((
  a,
  b,
) => a.title.localeCompare(b.title));

const allContributedPackages = data.filter((p) =>
  p.contributors.includes("j3lte")
).sort((a, b) => a.title.localeCompare(b.title));

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

  const authoredEntry = authored
    ? `[${authored.title} \`${authored.api}\`](https://raycast.com/${
      authored.owner ?? authored.author
    }/${authored.name})${
      authored.issues
        ? ` [(⚠️${
          authored.issues
        })](https://github.com/raycast/extensions/issues?q=is%3Aissue%20label%3A%22extension%3A%20${authored.name}%22%20state%3Aopen)`
        : ""
    }`
    : " ";
  const contributedEntry = contributed
    ? `[${contributed.title} \`${contributed.api}\`](https://raycast.com/${
      contributed.owner ?? contributed.author
    }/${contributed.name})${
      contributed.issues
        ? ` [(⚠️${
          contributed.issues
        })](https://github.com/raycast/extensions/issues?q=is%3Aissue%20label%3A%22extension%3A%20${contributed.name}%22%20state%3Aopen)`
        : ""
    }`
    : " ";

  table += `\n| ${authoredEntry} | ${contributedEntry} |`;
}
table += "\n";

const README = await Deno.readTextFile(readMePath);

const { updatedText } = updateText("RAYCAST", README, table);

await Deno.writeTextFile(readMePath, updatedText);
