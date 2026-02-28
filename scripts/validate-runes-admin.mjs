import fs from "node:fs";
import path from "node:path";

const ROOT = path.resolve("src/components/admin");
const SVELTE_EXT = ".svelte";
const LEGACY_PATTERN = /\$[A-Za-z_][A-Za-z0-9_]*(Query|Mutation)\b/g;

function walk(dir, acc = []) {
	const entries = fs.readdirSync(dir, { withFileTypes: true });
	for (const entry of entries) {
		const fullPath = path.join(dir, entry.name);
		if (entry.isDirectory()) {
			walk(fullPath, acc);
			continue;
		}
		if (entry.isFile() && fullPath.endsWith(SVELTE_EXT)) acc.push(fullPath);
	}
	return acc;
}

const files = walk(ROOT);
const violations = [];

for (const file of files) {
	const content = fs.readFileSync(file, "utf8");
	const lines = content.split("\n");
	for (let i = 0; i < lines.length; i += 1) {
		const line = lines[i];
		const match = line.match(LEGACY_PATTERN);
		if (!match) continue;
		violations.push({
			file: path.relative(process.cwd(), file),
			line: i + 1,
			token: match[0],
		});
	}
}

if (violations.length > 0) {
	console.error(
		"Found legacy auto-subscribe query/mutation usage in admin runes components:",
	);
	for (const v of violations) {
		console.error(`- ${v.file}:${v.line} uses \`${v.token}\``);
	}
	process.exit(1);
}

console.log("validate-runes-admin: OK");
