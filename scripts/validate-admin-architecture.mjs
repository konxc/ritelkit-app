import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve("src/components/admin/pages");
const files = [];

function walk(dir) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) walk(full);
    if (entry.isFile() && full.endsWith(".svelte")) files.push(full);
  }
}

walk(ROOT);

const violations = [];

const checks = [
  { pattern: /location\.reload\(/, message: "avoid location.reload" },
  { pattern: /\balert\(/, message: "avoid alert()" },
  {
    pattern: /fetch\((["'`])\/api\/admin\//,
    message: "avoid direct /api/admin fetch in admin pages",
  },
  { pattern: /bindJsonForm\(/, message: "avoid bindJsonForm legacy helper" },
];

for (const file of files) {
  const rel = path.relative(process.cwd(), file);
  const content = fs.readFileSync(file, "utf8");
  const lines = content.split("\n");
  for (let i = 0; i < lines.length; i += 1) {
    const line = lines[i];
    for (const check of checks) {
      if (!check.pattern.test(line)) continue;
      if (
        check.message.includes("direct /api/admin fetch") &&
        line.includes("/api/admin/shipping-simulate")
      ) {
        continue;
      }
      violations.push({
        file: rel,
        line: i + 1,
        message: check.message,
      });
    }
  }
}

if (violations.length > 0) {
  console.error("validate-admin-architecture: violations found");
  for (const v of violations) {
    console.error(`- ${v.file}:${v.line} ${v.message}`);
  }
  process.exit(1);
}

console.log("validate-admin-architecture: OK");
