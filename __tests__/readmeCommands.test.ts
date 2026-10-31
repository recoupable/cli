import { execFileSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { expect, it } from "vitest";

it("documents every command group advertised by the built CLI", () => {
  const help = execFileSync(process.execPath, [join(__dirname, "..", "dist", "bin.cjs"), "--help"], {
    encoding: "utf8",
    env: {},
  });
  const commands = help.split("Commands:\n")[1];
  expect(commands).toBeDefined();
  const names = [...commands.matchAll(/^  ([a-z][a-z-]*)\b/gm)]
    .map(match => match[1])
    .filter(name => name !== "help");
  expect(names.length).toBeGreaterThan(0);
  const readme = readFileSync(join(__dirname, "..", "README.md"), "utf8");
  const examples = [...readme.matchAll(/```bash\n([\s\S]*?)```/g)]
    .flatMap(match => [...match[1].matchAll(/^recoup ([a-z][a-z-]*)\b/gm)])
    .map(match => match[1]);
  expect(names.filter(name => !examples.includes(name))).toEqual([]);
});
