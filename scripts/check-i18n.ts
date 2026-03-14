import fs from "node:fs";
import path from "node:path";

const TRANSLATIONS_PATH = path.join(process.cwd(), "src/lib/i18n/translations.ts");
const SRC_DIR = path.join(process.cwd(), "src");

// Utility to read all files in a directory recursively
function getAllFiles(dirPath: string, arrayOfFiles: string[] = []): string[] {
  const files = fs.readdirSync(dirPath);

  files.forEach((file) => {
    if (fs.statSync(path.join(dirPath, file)).isDirectory()) {
      arrayOfFiles = getAllFiles(path.join(dirPath, file), arrayOfFiles);
    } else {
      const ext = path.extname(file);
      if ([".svelte", ".astro", ".ts"].includes(ext)) {
        arrayOfFiles.push(path.join(dirPath, file));
      }
    }
  });

  return arrayOfFiles;
}

import { id } from "../src/lib/i18n/translations.ts";

// 1. Parse translations.ts to get all available keys
const availableKeys = new Set<string>();
try {
  function flattenObj(obj: any, parent: string = "", res: string[] = []) {
    for (const key in obj) {
      const propName = parent ? `${parent}.${key}` : key;
      if (typeof obj[key] === "object") {
        flattenObj(obj[key], propName, res);
      } else {
        res.push(propName);
      }
    }
    return res;
  }
  const keys = flattenObj(id);
  for (const k of keys) {
    availableKeys.add(k);
  }
} catch (e: any) {
  console.error("Failed to parse translations:", e.message);
  process.exit(1);
}

// 2. Scan all files for usage of t("key") or tServer(lang, "key")
const usedKeysMap = new Map<string, Set<string>>(); // key -> list of files where used
let totalOccurrences = 0;

const filesToScan = getAllFiles(SRC_DIR);

filesToScan.forEach((file) => {
  const content = fs.readFileSync(file, "utf8");
  // Matches t("key"), t('key'), tServer(lang, "key"), tServer(lang, 'key')
  // Also matches string interpolations slightly if they use literal quotes inside, e.g. t(`...${...}...`) is harder, we'll focus on static strings.
  const regex = /\b(?:t|tServer)\s*\(\s*(?:[\w]+,\s*)?["'`]([a-zA-Z0-9_.-]+)["'`]/g;

  for (const match of content.matchAll(regex)) {
    const key = match[1];

    // Ignore keys from dynamic usages like t(`invoices.status_${invoice.status}`) if we matched only part of it,
    // but the regex won't match the variable part easily. We might match "invoices.status_" which we can ignore or report.
    if (key.endsWith("_")) continue;

    if (!usedKeysMap.has(key)) {
      usedKeysMap.set(key, new Set<string>());
    }
    usedKeysMap.get(key)!.add(file.replace(`${process.cwd()}/`, ""));
    totalOccurrences++;
  }

  // Custom check for dynamic keys like t(`invoices.status_${...}`)
  // This is a naive heuristic: if the code contains t(`invoices.status_${x}`), we assume "invoices.status_" + "paid/overdue/issued/void" are used.
  // Instead of complex AST, we can just say "dynamic usage allowed".
});

console.log(`\n🔍 i18n Validation Report`);
console.log(`=========================`);
console.log(`Total available keys: ${availableKeys.size}`);
console.log(`Total used keys: ${usedKeysMap.size}`);
console.log(`Total occurrences in code: ${totalOccurrences}`);

const missingKeys: { key: string; files: string[] }[] = [];
const unusedKeys: string[] = [];

// Find missing keys (used in code, but not in translations.ts)
for (const [key, files] of usedKeysMap.entries()) {
  if (!availableKeys.has(key)) {
    // If it's a dynamic key part, we skip if we can't be sure
    missingKeys.push({ key, files: Array.from(files) });
  }
}

// Find unused keys (in translations.ts, but not used in code)
for (const key of availableKeys) {
  if (!usedKeysMap.has(key)) {
    // We might have dynamic keys like status_paid that are constructed dynamically.
    // Check if the key matches any known dynamic patterns.
    const isDynamic = ["status_", "sample_", "nav_breadcrumb_", "type_", "button_"].some((prefix) =>
      key.includes(prefix),
    );
    if (!isDynamic) {
      unusedKeys.push(key);
    }
  }
}

console.log(`\n❌ Missing Keys (Used in code, but missing from translation file):`);
if (missingKeys.length === 0) {
  console.log("   (None! Perfect 🎉)");
} else {
  missingKeys.forEach((m) => {
    console.log(`   - "${m.key}"`);
    console.log(`     Used in: \n       ${m.files.join("\n       ")}`);
  });
}

console.log(`\n♻️  Unused Keys (Defined in translation file, but never used statically):`);
if (unusedKeys.length === 0) {
  console.log("   (None! Very clean 🧹)");
} else {
  // Group to avoid spamming too much output
  const unusedByPrefix = unusedKeys.reduce((acc: Record<string, string[]>, key: string) => {
    const prefix = key.split(".")[0] || "other";
    acc[prefix] = acc[prefix] || [];
    acc[prefix].push(key);
    return acc;
  }, {});

  for (const [group, keys] of Object.entries(unusedByPrefix)) {
    const typedKeys = keys as string[];
    console.log(`   - [${group}] ${typedKeys.length} keys`);
    if (typedKeys.length < 5) {
      for (const k of typedKeys) console.log(`       "${k}"`);
    } else {
      console.log(
        `       "${typedKeys[0]}", "${typedKeys[1]}", "${typedKeys[2]}", ... and ${typedKeys.length - 3} more`,
      );
    }
  }
}

console.log(`\nNote: Unused keys might be constructed dynamically (e.g., t(\`status_\${val}\`)).`);
// If any missing keys, exit code 1 to fail CI
if (missingKeys.length > 0) {
  process.exit(1);
}
