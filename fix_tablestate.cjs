const fs = require('fs');
const path = require('path');

const dir = './src/components/admin/pages';
const files = fs.readdirSync(dir).filter(f => f.endsWith('.svelte'));

let regexSetRows = /\s*\$effect\(\(\) => \{\n\s*if\s*\([^)]+\)\s*\{\n\s*tableState\.setRows\([^)]+\);\n\s*\}\n\s*\}\);\n/g;
// Or simpler, just remove tableState.setRows
let regexSetRowsLine = /^\s*tableState\.setRows\(.*\);\s*$/gm;

for (let file of files) {
  let filepath = path.join(dir, file);
  let content = fs.readFileSync(filepath, 'utf8');
  let original = content;

  // Replace createTableState instantiation
  content = content.replace(/createTableState<([^>]+)>\([^)]*\)/g, "createTableState<$1>(() => currentRows)");
  
  // Actually, some don't have generics or arguments:
  content = content.replace(/createTableState\(\)/g, "createTableState(() => currentRows)");

  // remove $effect blocks containing tableState.setRows
  content = content.replace(/\s*\$effect\(\(\) => \{\n\s*if\s*\([^)]+\)\s*\{\n\s*tableState\.setRows\([^)]+\);\n\s*\}\n\s*\}\);/g, "");
  
  // also specifically target exact lines if any left
  content = content.replace(/tableState\.setRows\(.*\);/g, "");

  if (content !== original) {
    fs.writeFileSync(filepath, content);
    console.log("Updated", file);
  }
}
