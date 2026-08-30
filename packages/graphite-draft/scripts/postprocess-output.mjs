import path from "node:path";
import { copyContentAssets } from "../src/build/copy-content-assets.mjs";
import { processHtmlOutput } from "../src/build/process-html-output.mjs";
import { publishOutput } from "../src/build/publish-output.mjs";
import { readBooleanEnvironment } from "../src/utils/environment.mjs";

const source = path.resolve(process.env.GRAPHITE_CONTENT_DIR || "../../examples/content");
const buildOutput = path.resolve(process.env.GRAPHITE_BUILD_DIR || "./dist");
const requestedOutput = process.env.GRAPHITE_OUTPUT_DIR
  ? path.resolve(process.env.GRAPHITE_OUTPUT_DIR)
  : buildOutput;

await processHtmlOutput(buildOutput);
await copyContentAssets(source, buildOutput, requestedOutput);
await publishOutput({
  source,
  buildOutput,
  requestedOutput,
  force: readBooleanEnvironment("GRAPHITE_FORCE_OUTPUT", false)
});
