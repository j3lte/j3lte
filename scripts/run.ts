import { exists } from "@std/fs";
import { resolve } from "@std/path";
import { updateText } from "./utils/index.ts";

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
    ? `[${authored[1].title} \`${authored[1].api}\`](https://raycast/${
      authored[1].author
    }/${authored[0]})`
    : " ";
  const contributedEntry = contributed && contributed.length === 2
    ? `[${contributed[1].title} \`${contributed[1].api}\`](https://raycast/${
      contributed[1].author
    })/${contributed[0]})`
    : " ";

  table += `\n| ${authoredEntry} | ${contributedEntry} |`;
}
table += "\n";

const README = await Deno.readTextFile(readMePath);

const { updatedText } = updateText("RAYCAST", README, table);

console.log(updatedText);
