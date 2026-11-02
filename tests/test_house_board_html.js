// House board test: html.js, the template every view draws through.
// Run: node tests/test_house_board_html.js   (no dependencies)
//
// Like every house board test, it loads the served module itself with
// require(), which Node runs on an ES module as written: no build, no copy.
const assert = require("assert");
const { html } = require("../custom_components/family_hub/house_board/html.js");

const text = (view) => String(view);

// A hostile title, as an iCloud invitation from someone else could carry,
// comes out as text.
const title = `<img src=x onerror="alert('hi')"> & more`;
assert.strictEqual(
  text(html`<p>${title}</p>`),
  "<p>&lt;img src=x onerror=&quot;alert(&#39;hi&#39;)&quot;&gt; &amp; more</p>",
);
// The same inside a quoted attribute: it can't close the quote.
assert.strictEqual(text(html`<p title="${'" onclick="x'}">`), '<p title="&quot; onclick=&quot;x">');

// A value that is itself html is kept as markup, and escaped only once.
const row = html`<b>${"Tacos & salsa"}</b>`;
assert.strictEqual(text(html`<li>${row}</li>`), "<li><b>Tacos &amp; salsa</b></li>");

// Arrays join, each item escaped or kept on its own.
assert.strictEqual(text(html`<ul>${["<x>", html`<li>y</li>`]}</ul>`), "<ul>&lt;x&gt;<li>y</li></ul>");
assert.strictEqual(text(html`<ul>${[]}</ul>`), "<ul></ul>");

// Numbers show; nothing, undefined and false show nothing, so a view can
// write ${cond && html`...`}.
assert.strictEqual(text(html`${0}|${null}|${undefined}|${false}`), "0|||");

// Only html`` marks markup: anything else is text, however it looks.
assert.strictEqual(text(html`${{ toString: () => "<b>" }}`), "&lt;b&gt;");
const forged = { ...html`<i>x</i>` };
assert.strictEqual(text(html`${forged}`).includes("<i>"), false, "a copy of an html value's fields is not html");

console.log("house board html: all checks passed");
