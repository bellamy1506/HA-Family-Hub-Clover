// House fork test helper: the served week calendar card's source, and one
// method's body pulled out of it (the card is one unbundled 26,000-line file,
// with methods at column 0; the card's class comes first, its editor's last).
//
// In a test:  const { src, methodBody } = require("./lib/card_source");
//             methodBody("_name")                  any parameters, sync or async
//             methodBody("_name", "key, field")    exactly these parameters
//             methodBody("async _name")            must be async
// From a shell, print one method:  node tests/lib/card_source.js _settleShapes
const fs = require("fs");
const path = require("path");

const CARD = path.join(__dirname, "..", "..", "custom_components", "family_hub", "card", "family-week-calendar-card.js");
const src = fs.readFileSync(CARD, "utf8");

const escape = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// The card's own class, searched before the rest of the file, so a method
// both classes define (setConfig, connectedCallback) resolves to the card's.
const cardStart = src.indexOf("\nclass FamilyWeekCalendarCard extends");
const cardEnd = cardStart < 0 ? -1 : src.indexOf("\nclass ", cardStart + 1);

// Start of the method's definition line, or -1.
function methodStart(spec, params) {
  const isAsync = spec.startsWith("async ");
  const name = isAsync ? spec.slice(6) : spec;
  const args = params === undefined ? "[^)\\n]*" : escape(params);
  const pattern = new RegExp(`\\n${isAsync ? "async " : "(?:async )?"}${escape(name)}\\(${args}\\) \\{\\n`, "g");
  const ranges = cardStart < 0 ? [[0, src.length]] : [[cardStart, cardEnd < 0 ? src.length : cardEnd], [0, src.length]];
  for (const [from, to] of ranges) {
    pattern.lastIndex = from;
    const match = pattern.exec(src);
    if (match && match.index < to) return match.index + 1;
  }
  return -1;
}

// The text between the method's braces. Throws when the method is missing.
function methodBody(spec, params) {
  const start = methodStart(spec, params);
  if (start < 0) throw new Error(`${spec}(${params === undefined ? "…" : params}) not found in the served card`);
  const open = src.indexOf("{", start);
  let depth = 0;
  for (let i = open; i < src.length; i++) {
    if (src[i] === "{") depth++;
    if (src[i] === "}") depth--;
    if (depth === 0) return src.slice(open + 1, i);
  }
  throw new Error(`${spec} has no end`);
}

// The whole method, definition line included.
function methodText(spec, params) {
  const start = methodStart(spec, params);
  if (start < 0) throw new Error(`${spec} not found in the served card`);
  return src.slice(start, src.indexOf("{", start)) + "{" + methodBody(spec, params) + "}";
}

module.exports = { CARD, src, methodStart, methodBody, methodText };

if (require.main === module) {
  const spec = process.argv[2];
  if (!spec) {
    console.error("usage: node tests/lib/card_source.js <methodName>");
    process.exit(2);
  }
  const start = methodStart(spec);
  if (start < 0) {
    console.error(`${spec} not found in ${path.relative(process.cwd(), CARD)}`);
    process.exit(1);
  }
  const line = src.slice(0, start).split("\n").length;
  console.log(`// ${path.relative(process.cwd(), CARD)}:${line}`);
  console.log(methodText(spec));
}
