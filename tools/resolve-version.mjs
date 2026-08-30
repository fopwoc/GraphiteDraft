import { execFileSync } from "node:child_process";
import { appendFile, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repositoryRoot = fileURLToPath(new URL("../", import.meta.url));
const packageFile = path.join(repositoryRoot, "packages/graphite-draft/package.json");
const semanticVersion = /^\d+\.\d+\.\d+$/;

const tags = git("tag", "--points-at", "HEAD")
  .split("\n")
  .filter((tag) => semanticVersion.test(tag));
const requestedRelease = process.env.RELEASE_VERSION;

if (requestedRelease && !semanticVersion.test(requestedRelease)) {
  throw new Error(`Release version must be MAJOR.MINOR.PATCH: ${requestedRelease}`);
}
if (requestedRelease && !tags.includes(requestedRelease)) {
  throw new Error(`HEAD is not tagged as ${requestedRelease}`);
}

const releaseVersion = requestedRelease || tags[0];
const commitDate = git("show", "-s", "--format=%cs", "HEAD").replaceAll("-", "");
const shortCommit = git("rev-parse", "--short=8", "HEAD");
const version = releaseVersion || `${commitDate}-${shortCommit}`;
const npmVersion = releaseVersion || `0.0.0-dev.${commitDate}.${shortCommit}`;
const buildNumber = git("rev-list", "--count", "HEAD");

if (process.argv.includes("--write-package")) {
  const packageJson = JSON.parse(await readFile(packageFile, "utf8"));
  packageJson.version = npmVersion;
  packageJson.buildIdentity = version;
  await writeFile(packageFile, `${JSON.stringify(packageJson, null, 2)}\n`);
}

const githubOutput = process.env.GITHUB_OUTPUT;
if (githubOutput) {
  await appendFile(
    githubOutput,
    `version=${version}\nnpm_version=${npmVersion}\nbuild_number=${buildNumber}\n`
  );
}

console.log(JSON.stringify({ version, npmVersion, buildNumber, release: Boolean(releaseVersion) }));

function git(...arguments_) {
  return execFileSync("git", arguments_, {
    cwd: repositoryRoot,
    encoding: "utf8"
  }).trim();
}
