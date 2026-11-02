// House board test: the size check. It fails when a file in the house board's
// folder passes 500 lines or the folder passes 3,000, the lean-code limits
// from "How is the house board's code laid out?" (fork issue #44): about a
// ninth of the week card. It counts .js and .css files, never NOTICE.
// Raising a limit means a line here saying why.
// Run: node tests/test_house_board_size.js   (no dependencies)
const assert = require("assert");
const fs = require("fs");
const os = require("os");
const path = require("path");

const FILE_LIMIT = 500;
const FOLDER_LIMIT = 3000;
const FOLDER = path.join(__dirname, "..", "custom_components", "family_hub", "house_board");

const lines = (text) => (text.match(/\n/g) || []).length + (/[^\n]$/.test(text) ? 1 : 0);
function measure(dir) {
  const files = fs.readdirSync(dir, { recursive: true }).filter((f) => /\.(js|css)$/.test(f)).sort();
  const counts = files.map((f) => [f, lines(fs.readFileSync(path.join(dir, f), "utf8"))]);
  const total = counts.reduce((sum, [, n]) => sum + n, 0);
  const problems = counts.filter(([, n]) => n > FILE_LIMIT).map(([f, n]) => `${f}: ${n} lines, over ${FILE_LIMIT}`);
  if (total > FOLDER_LIMIT) problems.push(`the folder: ${total} lines, over ${FOLDER_LIMIT}`);
  return { files, total, problems };
}

// The check itself, on a made-up folder: a file one line over the limit, a
// folder over its limit, and NOTICE never counted.
const scratch = fs.mkdtempSync(path.join(os.tmpdir(), "house-board-size-"));
try {
  const write = (name, n) => fs.writeFileSync(path.join(scratch, name), "x\n".repeat(n));
  write("at-limit.js", FILE_LIMIT);
  write("NOTICE", 9000);
  write("look.css", 10);
  assert.deepStrictEqual(measure(scratch).problems, [], "500 lines and NOTICE are fine");
  assert.strictEqual(measure(scratch).total, FILE_LIMIT + 10);
  write("over.js", FILE_LIMIT + 1);
  assert.deepStrictEqual(measure(scratch).problems, [`over.js: ${FILE_LIMIT + 1} lines, over ${FILE_LIMIT}`]);
  fs.rmSync(path.join(scratch, "over.js"));
  for (const name of ["a.js", "b.js", "c.js", "d.js", "e.js"]) write(name, 499);
  assert.deepStrictEqual(measure(scratch).problems, [`the folder: ${FILE_LIMIT + 10 + 5 * 499} lines, over ${FOLDER_LIMIT}`]);
  assert.strictEqual(lines("one\ntwo"), 2, "a last line without a newline counts");
  assert.strictEqual(lines(""), 0);
} finally {
  fs.rmSync(scratch, { recursive: true, force: true });
}

// The real folder.
const board = measure(FOLDER);
assert.ok(board.files.length > 0, `no .js files in ${FOLDER}`);
assert.deepStrictEqual(board.problems, [], "house board over its size limits");
console.log(`house board size: ${board.total} of ${FOLDER_LIMIT} lines in ${board.files.length} files, none over ${FILE_LIMIT}`);
