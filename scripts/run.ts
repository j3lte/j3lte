import { exists } from "@std/fs";
import { resolve } from "@std/path";

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

const dataPath = resolve(
  import.meta.dirname || "",
  "../awesome-raycast/data/data.json",
);
const readMePath = resolve(
  import.meta.dirname || "",
  "../README.md",
);

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

const maxRow = Math.max(
  allAuthoredPackages.length,
  allContributedPackages.length,
);

// Generate markdown table, with on the left the packages I authored, and on the right the packages I contributed to
let table = "\n| Authored | Contributed |\n| --- | --- |";
for (let i = 0; i < maxRow; i++) {
  const authored = allAuthoredPackages[i];
  const contributed = allContributedPackages[i];

  const authoredEntry = authored && authored.length === 2
    ? `[${authored[1].title} \`${authored[1].api}\`](https://raycast.com/${
      authored[1].author
    }/${authored[0]})`
    : " ";
  const contributedEntry = contributed && contributed.length === 2
    ? `[${contributed[1].title} \`${
      contributed[1].api
    }\`](https://raycast.com/${contributed[1].author}/${contributed[0]})`
    : " ";

  table += `\n| ${authoredEntry} | ${contributedEntry} |`;
}
table += "\n";

const README = await Deno.readTextFile(readMePath);

const { updatedText } = updateText("RAYCAST", README, table);

await Deno.writeTextFile(readMePath, updatedText);
