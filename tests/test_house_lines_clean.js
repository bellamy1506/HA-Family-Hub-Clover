// House fork test: the house's changes are clean. Lines it added carry no
// invisible characters, and it never edits the unused card copies. (A
// literal no-break space reached the served card twice on 2026-10-26; write
// the escape instead.) Only lines added since the reviewed upstream version are
// checked: upstream's own code legitimately contains such characters.
// Run: node tests/test_house_lines_clean.js   (needs git; FH_REQUIRE_UPSTREAM=1
// makes a missing upstream ref fail instead of skip, as CI sets it)
const { execFileSync } = require("child_process");
const path = require("path");

const root = path.join(__dirname, "..");
const git = (...args) => execFileSync("git", args, { cwd: root, encoding: "utf8", maxBuffer: 64 * 1024 * 1024 });
const base = ["upstream-1.168.84", "origin/upstream-1.168.84"].find((ref) => {
  try {
    git("rev-parse", "--verify", "-q", `${ref}^{commit}`);
    return true;
  } catch (e) {
    return false;
  }
});
if (!base) {
  console.log("house lines clean: skipped, upstream-1.168.84 not fetched");
  process.exit(process.env.FH_REQUIRE_UPSTREAM ? 1 : 0);
}

// Built from code points: escapes typed into this file can arrive as the
// characters themselves, which is how they reached the card.
const CODES = { 0xa0: "no-break space", 0x200b: "zero-width space", 0x200c: "zero-width non-joiner", 0x200d: "zero-width joiner", 0x200e: "left-to-right mark", 0x200f: "right-to-left mark", 0x2028: "line separator", 0x2029: "paragraph separator", 0x2060: "word joiner", 0xfeff: "byte-order mark" };
const isInvisible = (ch) => Object.prototype.hasOwnProperty.call(CODES, ch.codePointAt(0));
const found = [];
let file = null;
let line = 0;
for (const text of git("diff", "--unified=0", "--no-color", base, "--", "custom_components", "tests", "docs").split("\n")) {
  if (text.startsWith("+++ ")) file = text.slice(6);
  else if (text.startsWith("@@")) line = parseInt(/\+(\d+)/.exec(text)[1], 10);
  else if (text.startsWith("+")) {
    const ch = [...text].find(isInvisible);
    if (ch) {
      const code = ch.codePointAt(0);
      found.push(`${file}:${line}: ${CODES[code]} (U+${code.toString(16).toUpperCase().padStart(4, "0")})`);
    }
    line++;
  }
}
// The unused copies: a top-level custom_components/family_hub/<card>.js
// whose same-named file under card/ (or panel/) is the one Home Assistant
// serves. House changes there do nothing on the board (fork PR #2).
const fsMod = require("fs");
const famDir = path.join(root, "custom_components", "family_hub");
const unused = fsMod.readdirSync(famDir).filter((f) => f.endsWith(".js") && ["card", "panel"].some((d) => fsMod.existsSync(path.join(famDir, d, f))));
const touched = git("diff", "--name-only", base, "--", ...unused.map((f) => `custom_components/family_hub/${f}`)).split("\n").filter(Boolean);
for (const f of touched) found.push(`${f}: an unused copy; edit the served one under card/ or panel/`);

// New files not yet added to git aren't in the diff: check all their lines.
for (const rel of git("ls-files", "--others", "--exclude-standard", "--", "custom_components", "tests", "docs").split("\n").filter(Boolean)) {
  let text;
  try {
    text = require("fs").readFileSync(path.join(root, rel), "utf8");
  } catch (e) {
    continue;
  }
  text.split("\n").forEach((lineText, i) => {
    const ch = [...lineText].find(isInvisible);
    if (ch) {
      const code = ch.codePointAt(0);
      found.push(`${rel}:${i + 1}: ${CODES[code]} (U+${code.toString(16).toUpperCase().padStart(4, "0")}) (new file)`);
    }
  });
}
if (found.length) {
  console.log(`house lines clean: ${found.length} problem(s). For an invisible character, write the escape instead (from a script if the editor turns it into the character):\n  ${found.join("\n  ")}`);
  process.exit(1);
}
console.log(`house lines clean: all lines added since ${base} checked`);
