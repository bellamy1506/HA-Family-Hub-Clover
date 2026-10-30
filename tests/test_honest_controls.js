// House fork test: controls that lied or led nowhere (wave 0, B4). The
// recipe box's buttons hide unless the card's config says recipe_box:
// true; "Suggest" on a meal says it saves an idea, not the meal, and the
// board answers after it. Run: node tests/test_honest_controls.js
//
// Runs the real _answerMealSuggested against stubs and checks the hooks.
// The browser side is the "Recipe box buttons" and "Meal idea" checks in
// tests/browser/test_board_open.js; the Right Now card's resource is
// tests/test_dashboard_resources.py.
const assert = require("assert");

const { src, methodBody } = require("./lib/card_source");

// setConfig: the host attribute the CSS hides by.
assert.ok(methodBody("setConfig", "config").includes('this.toggleAttribute("recipe-box", config.recipe_box === true);'), "recipe_box: true shows them, nothing else does");
assert.ok(src.includes(":host(:not([recipe-box])) .suggestions-btn, :host(:not([recipe-box])) .loved-btn, :host(:not([recipe-box])) .loved-menu-item { display: none !important; }"), "both buttons, and Recipe Box in More");

// The Suggest hint says what happens, without the old wording.
assert.ok(src.includes(">This saves your idea, not the meal. It goes on the board once someone who can change the menu opens this meal and taps Add to menu.</div>"), "the hint");
assert.ok(!src.includes("someone who can edit the menu decides whether it goes on.</div>"), "the old hint is gone");
assert.ok(src.includes('<button type="button" class="menu-suggestion-apply">Add to menu</button>'), "the button the hint names");

// The answer after Suggest, and its Undo.
const answer = new Function("suggestion", methodBody("_answerMealSuggested", "suggestion"));
const shown = [];
const sent = [];
const card = {
  _getBlocksForDay: () => ["Breakfast", "Lunch", "Dinner"],
  _houseDay: () => "Sat Oct 31",
  _showUndoToast: (text, undo) => shown.push({ text, undo }),
  _hass: { connection: { sendMessagePromise: async (msg) => sent.push(msg) } },
  _fetchMenuSuggestions: async () => sent.push("fetch"),
};
answer.call(card, { uid: "s1", date_key: "2026-10-31", block_index: 2, name: "Tacos" });
answer.call(card, null);
assert.strictEqual(shown.length, 1, "nothing to say without a saved suggestion");
assert.strictEqual(shown[0].text, "Saved as an idea: Tacos, dinner on Sat Oct 31. Not on the board until someone adds it.");
(async () => {
  assert.strictEqual(await shown[0].undo(), "Idea taken back: Tacos");
  assert.deepStrictEqual(sent, [{ type: "family_hub/remove_menu_suggestion", uid: "s1" }, "fetch"], "Undo retracts the idea");
  const suggest = methodBody("async _suggestMealFromEditor");
  assert.ok(suggest.includes("const sent = await this._hass.connection.sendMessagePromise({"), "keeps the server's answer");
  assert.ok(suggest.includes("this._closeEditor();\n// House fork: wave 0 (B4), see _answerMealSuggested.\nthis._answerMealSuggested(sent && sent.suggestion);"), "answers once the editor closes");
  console.log("honest controls: all checks passed");
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
