import { execFileSync } from "node:child_process";
import { expect, it } from "vitest";

it("netlify/database/migrations mirrors every migration in ./drizzle", () => {
  let output = "";
  try {
    execFileSync(process.execPath, ["scripts/sync-netlify-migrations.mjs", "--check"], { stdio: "pipe", encoding: "utf8" });
  } catch (err) {
    output = String((err as { stderr?: string }).stderr ?? err);
  }
  expect(output).toBe("");
});
