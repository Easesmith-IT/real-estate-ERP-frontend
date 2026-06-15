import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

const candidates = [
  join(process.cwd(), ".next", "types"),
  join(process.cwd(), ".next", "dev", "types"),
];

for (const directory of candidates) {
  const dtsPath = join(directory, "routes.d.ts");
  const jsPath = join(directory, "routes.js");

  if (!existsSync(dtsPath) || existsSync(jsPath)) {
    continue;
  }

  mkdirSync(dirname(jsPath), { recursive: true });
  writeFileSync(jsPath, "export {};\n", "utf8");
}
