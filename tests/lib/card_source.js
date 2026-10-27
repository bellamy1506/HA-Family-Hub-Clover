// House fork test helper: the served week calendar card's source, and one
// method's body pulled out of it (the card is one unbundled 26,000-line file,
// with methods at column 0).
//
// In a test:  const { src, methodBody } = require("./lib/card_source");
//             const fn = new Function("a, b", methodBody("_name"));
// From a shell, print one method:  node tests/lib/card_source.js _settleShapes
const fs = require("fs");
const path = require("path");

const CARD = path.join(__dirname, "..", "..", "custom_components", "family_hub", "card", "family-week-calendar-card.js");
const src = fs.readFileSync(CARD, "utf8");

// The method's definition line, sync or async, whatever its parameters.
function methodStart(name) {
  const match = new RegExp(`\\n(?:async )?${name}\\([^)\\n]*\\) \\{\\n`).exec(src);
  return match ? match.index + 1 : -1;
}

// The text between the method's braces. Throws when the method is missing.
function methodBody(name) {
  const start = methodStart(name);
  if (start < 0) throw new Error(`${name} not found in the served card`);
  const open = src.indexOf("{", start);
  let depth = 0;
  for (let i = open; i < src.length; i++) {
    if (src[i] === "{") depth++;
    if (src[i] === "}") depth--;
    if (depth === 0) return src.slice(open + 1, i);
  }
  throw new Error(`${name} has no end`);
}

// The whole method, definition line included.
function methodText(name) {
  const start = methodStart(name);
  if (start < 0) throw new Error(`${name} not found in the served card`);
  return src.slice(start, src.indexOf("{", start)) + "{" + methodBody(name) + "}";
}

module.exports = { CARD, src, methodStart, methodBody, methodText };

if (require.main === module) {
  const name = process.argv[2];
  if (!name) {
    console.error("usage: node tests/lib/card_source.js <methodName>");
    process.exit(2);
  }
  const start = methodStart(name);
  if (start < 0) {
    console.error(`${name} not found in ${path.relative(process.cwd(), CARD)}`);
    process.exit(1);
  }
  const line = src.slice(0, start).split("\n").length;
  console.log(`// ${path.relative(process.cwd(), CARD)}:${line}`);
  console.log(methodText(name));
}
