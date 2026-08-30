export function readBooleanEnvironment(name, fallback) {
  const value = process.env[name];
  if (value === undefined || value === "") return fallback;
  if (value === "true") return true;
  if (value === "false") return false;
  throw new Error(`${name} must be true or false`);
}
