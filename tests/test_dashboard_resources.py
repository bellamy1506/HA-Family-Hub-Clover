"""House fork tests: a card file that isn't in the build is neither served
nor registered as a dashboard resource, and one an earlier start registered
is taken away (wave 0, B4: the Right Now card's missing file was requested
on every board open, as .../family-right-now-card.js?v=0). Family Hub's 11
unused cards stop loading, and the house board is served from a folder
whose address carries its hash (#115).

Run: python3 -m unittest discover -s tests   (no dependencies)

Home Assistant isn't installed here, so the resource and serving helpers
are taken out of __init__.py with ast and run against stand-ins; the setup
wiring is checked in its source.
"""
import ast
import asyncio
import collections
import hashlib
import os
import pathlib
import tempfile
import types
import unittest

_PKG_DIR = pathlib.Path(__file__).resolve().parents[1] / "custom_components" / "family_hub"
_SOURCE = (_PKG_DIR / "__init__.py").read_text()
_TREE = ast.parse(_SOURCE)
RIGHT_NOW = "/family_hub_right_now_card/family-right-now-card.js"


def _function(name):
    node = next(n for n in _TREE.body if isinstance(n, (ast.FunctionDef, ast.AsyncFunctionDef)) and n.name == name)
    return ast.get_source_segment(_SOURCE, node)


def _helpers():
    namespace = {
        "HomeAssistant": object,
        "_LOGGER": types.SimpleNamespace(info=lambda *a: None, debug=lambda *a: None),
    }
    exec(_function("_register_dashboard_resource") + "\n\n" + _function("_retire_dashboard_resource"), namespace)
    return namespace["_register_dashboard_resource"], namespace["_retire_dashboard_resource"]


class _Resources:
    loaded = True

    def __init__(self, urls):
        self.items = [{"id": str(i), "url": url, "res_type": "module"} for i, url in enumerate(urls)]
        self.store = object()

    def async_items(self):
        return list(self.items)

    async def async_create_item(self, data):
        self.items.append({"id": str(len(self.items) + 10), **data})

    async def async_update_item(self, item_id, data):
        next(i for i in self.items if i["id"] == item_id).update(data)

    async def async_delete_item(self, item_id):
        self.items = [i for i in self.items if i["id"] != item_id]


def _hass(resources):
    tasks = []
    hass = types.SimpleNamespace(data={"lovelace": types.SimpleNamespace(resources=resources)}, async_create_task=tasks.append)
    return hass, tasks


def _run(tasks):
    for task in tasks:
        asyncio.run(task)


def _serving():
    """_serve_house_board, with what it uses from __init__.py and const.py."""
    const = (_PKG_DIR / "const.py").read_text()
    url = next(n for n in ast.parse(const).body if isinstance(n, ast.Assign) and getattr(n.targets[0], "id", None) == "HOUSE_BOARD_URL")
    namespace = {
        "os": os,
        "hashlib": hashlib,
        "StaticPathConfig": collections.namedtuple("StaticPathConfig", "url_path path cache_headers"),
        "HOUSE_BOARD_URL": ast.literal_eval(url.value),
        "HomeAssistant": object,
        "_LOGGER": types.SimpleNamespace(info=lambda *a: None, debug=lambda *a: None),
    }
    for name in ("_folder_content_hash", "_register_dashboard_resource", "_serve_house_board"):
        exec(_function(name), namespace)
    return namespace["_serve_house_board"]


class RetireResourceTest(unittest.TestCase):
    def test_removes_only_the_missing_cards_resource(self):
        _, retire = _helpers()
        resources = _Resources([f"{RIGHT_NOW}?v=0", "/family_hub_card/family-week-calendar-card.js?v=1a2b3c4d5e", "/local/other.js"])
        hass, tasks = _hass(resources)
        retire(hass, RIGHT_NOW)
        _run(tasks)
        self.assertEqual([i["url"] for i in resources.items], ["/family_hub_card/family-week-calendar-card.js?v=1a2b3c4d5e", "/local/other.js"])

    def test_nothing_to_remove_or_nothing_to_remove_from(self):
        _, retire = _helpers()
        resources = _Resources(["/local/other.js"])
        hass, tasks = _hass(resources)
        retire(hass, RIGHT_NOW)
        _run(tasks)
        self.assertEqual(len(resources.items), 1)
        # YAML-mode resources (no delete), no dashboards at all: no error.
        retire(types.SimpleNamespace(data={"lovelace": types.SimpleNamespace(resources=[])}, async_create_task=tasks.append), RIGHT_NOW)
        retire(types.SimpleNamespace(data={}, async_create_task=tasks.append), RIGHT_NOW)

    def test_register_then_retire(self):
        register, retire = _helpers()
        resources = _Resources([])
        hass, tasks = _hass(resources)
        register(hass, f"{RIGHT_NOW}?v=0")
        _run(tasks)
        self.assertEqual(len(resources.items), 1)
        tasks.clear()
        retire(hass, RIGHT_NOW)
        _run(tasks)
        self.assertEqual(resources.items, [])


def _args(source, name, arg=1):
    """The given argument of every call to name (a function or a method) in
    source, as written, in order."""
    calls = [c for c in ast.walk(ast.parse(source)) if isinstance(c, ast.Call)]
    calls.sort(key=lambda c: (c.lineno, c.col_offset))
    return [ast.unparse(c.args[arg]) for c in calls if name in (getattr(c.func, "id", None), getattr(c.func, "attr", None))]


# Family Hub's 11 cards that no house dashboard uses (#115; the list is in
# load-time.md on research/load-time).
UNUSED = [
    "THEME_SELECTOR_CARD_JS_URL", "TODAY_CARD_JS_URL", "SCREENSAVER_CARD_JS_URL", "CHORES_CARD_JS_URL",
    "MY_CHORES_CARD_JS_URL", "REWARDS_CARD_JS_URL", "GOALS_CARD_JS_URL", "PANTRY_CARD_JS_URL",
    "TODO_CARD_JS_URL", "ACTIVE_TIMERS_CARD_JS_URL", "RECIPE_BOX_CARD_JS_URL",
]


WEEK_CARD = "/family_hub_card/family-week-calendar-card.js?v=1a2b3c4d5e"


class HouseBoardServingTest(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.addCleanup(self.tmp.cleanup)
        self.board = pathlib.Path(self.tmp.name) / "house_board"
        self.resources = _Resources([WEEK_CARD])
        self.hass, self.tasks = _hass(self.resources)
        self.served = []

        async def register_static_paths(configs):
            self.served.extend(configs)

        async def executor(fn, *args):
            return fn(*args)

        self.hass.http = types.SimpleNamespace(async_register_static_paths=register_static_paths)
        self.hass.async_add_executor_job = executor

    def serve(self):
        asyncio.run(_serving()(self.hass, self.tmp.name))
        _run(self.tasks)
        self.tasks.clear()
        return self.served[-1].url_path if self.served else None

    def write(self, name, text):
        self.board.mkdir(exist_ok=True)
        (self.board / name).write_text(text)

    def urls(self):
        return [i["url"] for i in self.resources.items]

    def test_nothing_served_or_registered_without_the_folder(self):
        self.assertIsNone(self.serve())
        self.assertEqual(self.urls(), [WEEK_CARD])

    def test_served_from_an_address_named_by_every_file(self):
        self.write("house-board.js", "import { day } from './when.js';")
        self.write("when.js", "export const day = 1;")
        folder = self.serve()
        self.assertRegex(folder, r"^/family_hub_house_board/[0-9a-f]{10}$")
        self.assertEqual(self.served[-1].path, str(self.board))
        self.assertTrue(self.served[-1].cache_headers, "a new version is a new address, so it can be cached")
        self.assertEqual(self.urls(), [WEEK_CARD, f"{folder}/house-board.js"])
        self.assertEqual(self.serve(), folder, "same files, same address")
        self.write("when.js", "export const day = 2;")
        changed = self.serve()
        self.assertNotEqual(changed, folder, "a sibling file changed")
        self.assertEqual(self.urls(), [WEEK_CARD, f"{changed}/house-board.js"], "the resource moves, it isn't added")
        (self.board / "when.js").rename(self.board / "soon.js")
        self.assertNotEqual(self.serve(), changed, "a renamed file")


class SetupWiringTest(unittest.TestCase):
    def setUp(self):
        self.setup = _function("async_setup_entry")

    def test_the_11_unused_cards_stop_loading_and_the_week_card_stays(self):
        self.assertEqual(sorted(_args(self.setup, "_retire_dashboard_resource")), sorted(UNUSED + ["RIGHT_NOW_CARD_JS_URL"]))
        self.assertEqual(_args(self.setup, "_register_dashboard_resource"), ["card_url_versioned", "right_now_card_url_versioned"])
        # Their hash lines go; their static paths stay until the code cleanup.
        hashed = [a for a, f in zip(_args(self.setup, "async_add_executor_job"), _args(self.setup, "async_add_executor_job", 0)) if f == "_file_content_hash"]
        self.assertEqual(hashed, ["panel_path", "card_path", "right_now_card_path", "icon_path"])
        for url in UNUSED:
            self.assertIn(f"StaticPathConfig({url}, ", self.setup)

    def test_the_house_board_is_served_by_one_line(self):
        self.assertIn("\n    await _serve_house_board(hass, integration_dir)\n", self.setup)

    def test_the_right_now_card_is_not_in_the_build(self):
        # Why the else branch runs on the house. If the file comes back, it's
        # served and registered again with no change here.
        self.assertFalse((_PKG_DIR / "card" / "family-right-now-card.js").exists())

    def test_served_and_registered_only_when_its_file_exists(self):
        listed = self.setup[self.setup.index("static_paths = [") : self.setup.index("]", self.setup.index("static_paths = ["))]
        self.assertNotIn("RIGHT_NOW_CARD_JS_URL", listed, "not in the unconditional list")
        self.assertIn("right_now_card_exists = await hass.async_add_executor_job(os.path.isfile, right_now_card_path)", self.setup)
        self.assertIn("if right_now_card_exists:\n        static_paths.append(StaticPathConfig(RIGHT_NOW_CARD_JS_URL, right_now_card_path, False))", self.setup)
        self.assertIn("if right_now_card_exists:\n        _register_dashboard_resource(hass, right_now_card_url_versioned)\n    else:\n        _retire_dashboard_resource(hass, RIGHT_NOW_CARD_JS_URL)", self.setup)


if __name__ == "__main__":
    unittest.main()
