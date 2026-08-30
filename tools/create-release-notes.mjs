import { execFileSync } from "node:child_process";
import { writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";

const repositoryRoot = fileURLToPath(new URL("../", import.meta.url));
const output = process.argv[2];
if (!output) throw new Error("Usage: create-release-notes.mjs OUTPUT");

const currentVersion = process.env.RELEASE_VERSION;
const semanticVersion = /^v?\d+\.\d+\.\d+$/;
const previousVersion = git(
  "tag",
  "--merged",
  "HEAD^",
  "--sort=-version:refname"
)
  .split("\n")
  .find((tag) => semanticVersion.test(tag) && tag !== currentVersion);
const range = previousVersion ? `${previousVersion}..HEAD` : "HEAD";
const commits = git("log", "--format=- %s (%h)", range);

await writeFile(output, `Changes since ${previousVersion || "the first release"}:\n\n${commits}\n`);

function git(...arguments_) {
  return execFileSync("git", arguments_, {
    cwd: repositoryRoot,
    encoding: "utf8"
  }).trim();
}
