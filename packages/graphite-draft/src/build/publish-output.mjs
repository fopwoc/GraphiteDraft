import { cp, rm } from "node:fs/promises";
import path from "node:path";
import { isEmptyDirectory, isSameOrChild, pathExists } from "../utils/filesystem.mjs";

export async function publishOutput({ source, buildOutput, requestedOutput, force }) {
  if (requestedOutput === buildOutput) return;
  assertSafeOutput(source, requestedOutput);

  if (await pathExists(requestedOutput)) {
    if (!force && !(await isEmptyDirectory(requestedOutput))) {
      throw new Error(
        `Output directory is not empty: ${requestedOutput}. Use --force to replace it.`
      );
    }
    await rm(requestedOutput, { recursive: true, force: true });
  }

  await cp(buildOutput, requestedOutput, { recursive: true, force: true });
}

function assertSafeOutput(source, output) {
  if (output === path.parse(output).root) {
    throw new Error(`Refusing to replace filesystem root: ${output}`);
  }
  if (isSameOrChild(source, output)) {
    throw new Error(`Output directory must not contain the Markdown source directory: ${output}`);
  }
}
