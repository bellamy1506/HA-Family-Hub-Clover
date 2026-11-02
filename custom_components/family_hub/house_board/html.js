// Owns: the html`` template, the only way markup reaches the page.
// Leaves alone: what any view says or looks like.
// Tested by: tests/test_house_board_html.js
//
// Every value is escaped unless it is itself html``; arrays join. Event titles
// can come from invitations other people write, so nothing reaches innerHTML
// any other way. Put values in quoted attributes only; links aren't checked
// (the board draws none from data).

class Html {
  constructor(text) {
    this.text = text;
  }
  toString() {
    return this.text;
  }
}

const ESCAPES = { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" };

function show(value) {
  if (value instanceof Html) return value.text;
  if (Array.isArray(value)) return value.map(show).join("");
  if (value == null || value === false) return "";
  return String(value).replace(/[&<>"']/g, (ch) => ESCAPES[ch]);
}

export function html(strings, ...values) {
  return new Html(strings.reduce((out, part, i) => out + show(values[i - 1]) + part));
}
