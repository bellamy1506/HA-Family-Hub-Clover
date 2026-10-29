// House fork test: the house's changes are clean. Lines it added carry no
// invisible characters (a literal no-break space reached the served card
// twice on 2026-10-26; write the escape instead), and it never edits the
// unused card copies (fork PR #2). Only changes since the reviewed upstream
// version count: upstream's own code legitimately contains such characters.
// That version's branch is named in tests/upstream_base.txt; taking an
// upstream update moves it (CLAUDE.md, upstream policy).
// Run: node tests/test_house_lines_clean.js   (needs git; FH_REQUIRE_UPSTREAM=1
// makes a missing upstream branch fail instead of skip, as CI sets it)
const { execFileSync } = require("child_process");
const fs = require("fs");
const path = require("path");

const root = path.join(__dirname, "..");
const git = (...args) => execFileSync("git", ["-c", "core.quotePath=false", ...args], { cwd: root, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
const branch = fs.readFileSync(path.join(__dirname, "upstream_base.txt"), "utf8").trim();
const base = [branch, `origin/${branch}`].find((ref) => {
  try {
    git("rev-parse", "--verify", "-q", `${ref}^{commit}`);
    return true;
  } catch (e) {
    return false;
  }
});
if (!base) {
  console.log(`house lines clean: skipped, ${branch} not fetched`);
  process.exit(process.env.FH_REQUIRE_UPSTREAM ? 1 : 0);
}

// Built from code points: escapes typed into this file can arrive as the
// characters themselves, which is how they reached the card.
const CODES = { 0xa0: "no-break space", 0x200b: "zero-width space", 0x200c: "zero-width non-joiner", 0x200d: "zero-width joiner", 0x200e: "left-to-right mark", 0x200f: "right-to-left mark", 0x2028: "line separator", 0x2029: "paragraph separator", 0x2060: "word joiner", 0xfeff: "byte-order mark" };
const invisibleIn = (text) => [...text].find((ch) => Object.prototype.hasOwnProperty.call(CODES, ch.codePointAt(0)));
const describe = (ch) => {
  const code = ch.codePointAt(0);
  return `${CODES[code]} (U+${code.toString(16).toUpperCase().padStart(4, "0")})`;
};
const DIRS = ["custom_components", "tests", "docs"];
const found = [];

// Added lines, file by file. Header lines (diff --git ... up to the first
// @@) never count as content, whatever they start with.
let file = null;
let inHunk = false;
let line = 0;
for (const text of git("diff", "--unified=0", "--no-color", "--no-ext-diff", base, "--", ...DIRS).split("\n")) {
  if (text.startsWith("diff --git ")) {
    inHunk = false;
    file = null;
  } else if (!inHunk && text.startsWith("+++ ")) {
    file = text.slice(4).replace(/\t$/, "").replace(/^b\//, "");
  } else if (text.startsWith("@@")) {
    inHunk = true;
    line = parseInt(/\+(\d+)/.exec(text)[1], 10);
  } else if (inHunk && text.startsWith("+")) {
    const ch = invisibleIn(text);
    if (ch) found.push(`${file}:${line}: ${describe(ch)}`);
    line++;
  }
}

// The unused copies: a top-level custom_components/family_hub/<card>.js
// whose same-named file under card/ (or panel/) is the one Home Assistant
// serves. House changes there do nothing on the board.
const famDir = path.join(root, "custom_components", "family_hub");
const unused = fs.readdirSync(famDir).filter((f) => f.endsWith(".js") && ["card", "panel"].some((d) => fs.existsSync(path.join(famDir, d, f))));
if (unused.length) {
  const touched = git("diff", "--name-only", "-z", base, "--", ...unused.map((f) => `custom_components/family_hub/${f}`)).split("\0").filter(Boolean);
  for (const f of touched) found.push(`${f}: an unused copy; edit the served one under card/ or panel/`);
}

// New files not yet added to git aren't in the diff: check all their lines.
// Binary files (a NUL byte, as git decides; screenshots) have no lines, and
// git's diff leaves them out once added.
for (const rel of git("ls-files", "--others", "--exclude-standard", "-z", "--", ...DIRS).split("\0").filter(Boolean)) {
  let text;
  try {
    const bytes = fs.readFileSync(path.join(root, rel));
    if (bytes.subarray(0, 8000).includes(0)) continue;
    text = bytes.toString("utf8");
  } catch (e) {
    found.push(`${rel}: couldn't read it to check (${e.code || e.message})`);
    continue;
  }
  text.split("\n").forEach((lineText, i) => {
    const ch = invisibleIn(lineText);
    if (ch) found.push(`${rel}:${i + 1}: ${describe(ch)} (new file)`);
  });
}

if (found.length) {
  console.log(`house lines clean: ${found.length} problem(s). For an invisible character, write the escape instead (from a script if the editor turns it into the character):\n  ${found.join("\n  ")}`);
  process.exit(1);
}
console.log(`house lines clean: all changes since ${base} checked`);
