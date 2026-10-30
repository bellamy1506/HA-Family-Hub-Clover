"""House fork tests: a card file that isn't in the build is neither served
nor registered as a dashboard resource, and one an earlier start registered
is taken away (wave 0, B4: the Right Now card's missing file was requested
on every board open, as .../family-right-now-card.js?v=0).

Run: python3 -m unittest discover -s tests   (no dependencies)

Home Assistant isn't installed here, so the two resource helpers are taken
out of __init__.py with ast and run against a stand-in resource collection;
the setup wiring is checked in its source.
"""
import ast
import asyncio
import pathlib
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


class SetupWiringTest(unittest.TestCase):
    def setUp(self):
        self.setup = _function("async_setup_entry")

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
