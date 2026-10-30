// House fork test: More > Shopping List opens Grocy's list only when
// Family Hub has Grocy set up; otherwise the household's own
// todo.shopping_list (wave 0, B3). Run: node tests/test_shopping_list.js
//
// Runs the real _grocyConnected and _openShoppingList against stubs, and
// checks the button's one-line hook. The browser side (the popup holds
// Home Assistant's To-do list card for todo.shopping_list, kept current)
// is the "Shopping list" checks in tests/browser/test_board_open.js.
const assert = require("assert");

const { src, methodBody } = require("./lib/card_source");

const AsyncFunction = Object.getPrototypeOf(async () => {}).constructor;
const grocyConnected = new AsyncFunction(methodBody("async _grocyConnected"));
const openShoppingList = new AsyncFunction(methodBody("async _openShoppingList"));

function card(answer) {
  const c = { asked: 0, opened: [] };
  c._hass = { connection: { sendMessagePromise: async (msg) => { assert.strictEqual(msg.type, "family_hub/get_grocy_shopping_lists"); c.asked++; if (answer instanceof Error) throw answer; return answer; } } };
  c._grocyConnected = grocyConnected;
  c._openShoppingList = openShoppingList;
  c._openGrocyShoppingList = () => c.opened.push("grocy");
  c._openHouseShoppingList = () => c.opened.push("house");
  return c;
}

(async () => {
  let c = card({ configured: false, lists: [] });
  await c._openShoppingList();
  await c._openShoppingList();
  assert.deepStrictEqual(c.opened, ["house", "house"], "no Grocy (the house): the household's list");
  assert.strictEqual(c.asked, 1, "asked once per open board");
  c = card({ configured: true, lists: [{ id: 1 }] });
  await c._openShoppingList();
  assert.deepStrictEqual(c.opened, ["grocy"], "Grocy set up: Grocy's list, as before");
  c = card({ configured: true, lists: [], error: "timeout" });
  await c._openShoppingList();
  assert.deepStrictEqual(c.opened, ["grocy"], "Grocy set up but unreachable: Grocy's list, which says so");
  c = card(new Error("unknown command"));
  await c._openShoppingList();
  await c._openShoppingList();
  assert.deepStrictEqual(c.opened, ["house", "house"], "no answer: the household's list");
  assert.strictEqual(c.asked, 2, "a failed question is asked again next time");
  // Wiring: the More menu button, and Home Assistant's updates reach the card.
  assert.ok(src.includes('root.querySelector(".grocy-shopping-list-btn").addEventListener("click", () => this._openShoppingList());'), "the button asks first");
  assert.ok(methodBody("set hass", "hass").includes("if (this._shoppingCard) this._shoppingCard.hass = hass;"), "the card gets every hass update");
  assert.ok(methodBody("async _openHouseShoppingList").includes('helpers.createCardElement({ type: "todo-list", entity });'), "Home Assistant's own To-do list card");
  console.log("shopping list: all checks passed");
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
