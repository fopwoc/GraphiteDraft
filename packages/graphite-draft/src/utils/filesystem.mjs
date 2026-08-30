import { access, readdir } from "node:fs/promises";
import path from "node:path";

export async function pathExists(file) {
  try {
    await access(file);
    return true;
  } catch {
    return false;
  }
}

export async function isEmptyDirectory(directory) {
  try {
    return (await readdir(directory)).length === 0;
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "ENOTDIR") {
      return false;
    }
    throw error;
  }
}

export function isSameOrChild(candidate, parent) {
  const relative = path.relative(parent, candidate);
  return relative === "" || (!relative.startsWith("..") && !path.isAbsolute(relative));
}
