"""House fork tests for copy_sync.py: which of one user's copies get a
settings change (fork issue #5).

Run: python3 -m unittest discover -s tests   (no dependencies)

copy_sync.py has no Home Assistant imports, so it is loaded straight from
its file; importing the package would run __init__.py, which needs Home
Assistant.
"""
import importlib.util
import pathlib
import unittest

_PATH = pathlib.Path(__file__).resolve().parents[1] / "custom_components" / "family_hub" / "copy_sync.py"
_spec = importlib.util.spec_from_file_location("copy_sync", _PATH)
copy_sync = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(copy_sync)

OWNER = "1fd0c2c4a19241c192c77dc39bf472f4"
JENN = "6e16c1f58eef48e0ab02f0db8be9b21c"
TITLE = "familyCalendarTopBarTitleOnlyLocal"
WEEK = "familyCalendarWeekViewVariantLocal"
MONTH = "familyCalendarMonthViewVariantLocal"
NAME = "familyHubDeviceCustomNameLocal"
T1 = "2026-10-26T21:00:00+00:00"
T2 = "2026-10-26T22:00:00+00:00"


def view(title="off", week="week", month="month"):
    return {TITLE: title, WEEK: week, MONTH: month}


def instance(settings, label="family-hub", pending_seq=0, pending=None, applied_seq=None, changed_at=None):
    record = {"settings": dict(settings), "pending_seq": pending_seq, "pending_settings": pending, "instance_label": label}
    if applied_seq is not None:
        record["applied_seq"] = applied_seq
    if changed_at is not None:
        record["changed_at"] = changed_at
    return record


def device(user_id, instances, settings=None):
    record = {"settings": dict(settings or {NAME: ""}), "pending_seq": 0, "pending_settings": None, "instances": instances}
    if user_id is not None:
        record["user_id"] = user_id
    return record


class RecordReport(unittest.TestCase):
    def test_change_is_stored_returned_and_timed(self):
        record = instance(view(title="off"))
        changes = copy_sync.record_report(record, view(title="on"), applied_seq=0, first=False, now=T1)
        self.assertEqual(changes, {TITLE: "on"})
        self.assertEqual(record["settings"][TITLE], "on")
        self.assertEqual(record["changed_at"], T1)
        self.assertEqual(record["applied_seq"], 0)

    def test_same_values_are_no_change(self):
        record = instance(view(title="on"), changed_at=T1)
        changes = copy_sync.record_report(record, view(title="on"), applied_seq=0, first=False, now=T2)
        self.assertEqual(changes, {})
        self.assertEqual(record["changed_at"], T1)

    def test_first_report_is_stored_but_never_a_change(self):
        record = instance({})
        changes = copy_sync.record_report(record, view(title="on"), applied_seq=0, first=True, now=T1)
        self.assertEqual(changes, {})
        self.assertEqual(record["settings"], view(title="on"))
        self.assertNotIn("changed_at", record)

    def test_field_reported_for_the_first_time_is_not_a_change(self):
        # A field added in an update (the theme, say) shows up in every
        # copy's next report; that is the copy's default, not a choice.
        record = instance({TITLE: "off"})
        changes = copy_sync.record_report(record, {TITLE: "off", WEEK: "planner"}, applied_seq=0, first=False, now=T1)
        self.assertEqual(changes, {})
        self.assertEqual(record["settings"][WEEK], "planner")

    def test_value_not_yet_applied_is_kept_and_not_a_change(self):
        # Copy B was sent Title only = on (seq 1) but reports before applying
        # it: its report still says off. That's stale, not a change back.
        record = instance(view(title="on"), pending_seq=1, pending={TITLE: "on"}, applied_seq=0)
        changes = copy_sync.record_report(record, view(title="off", week="planner"), applied_seq=0, first=False, now=T1)
        self.assertEqual(changes, {WEEK: "planner"})
        self.assertEqual(record["settings"][TITLE], "on")

    def test_after_applying_the_report_is_believed(self):
        record = instance(view(title="on"), pending_seq=1, pending={TITLE: "on"}, applied_seq=0)
        changes = copy_sync.record_report(record, view(title="off"), applied_seq=1, first=False, now=T1)
        self.assertEqual(changes, {TITLE: "off"})
        self.assertEqual(record["settings"][TITLE], "off")
        self.assertEqual(record["applied_seq"], 1)

    def test_older_card_without_applied_seq_is_stored_but_passes_nothing_on(self):
        record = instance(view(title="off"))
        changes = copy_sync.record_report(record, view(title="on"), applied_seq=None, first=False, now=T1)
        self.assertEqual(changes, {})
        self.assertEqual(record["settings"][TITLE], "on")
        self.assertNotIn("applied_seq", record)

    def test_device_name_is_never_a_change(self):
        record = device(OWNER, {}, settings={NAME: ""})
        changes = copy_sync.record_report(record, {NAME: "Will"}, applied_seq=0, first=False, now=T1)
        self.assertEqual(changes, {})
        self.assertEqual(record["settings"][NAME], "Will")


class PlanPushes(unittest.TestCase):
    def setUp(self):
        self.devices = {
            "dev-home": device(OWNER, {"inst-home": instance(view(title="on"))}),
            "dev-cloud": device(OWNER, {"inst-cloud": instance(view(title="off"))}),
            "dev-jenn": device(JENN, {"inst-jenn": instance(view(title="off"))}),
            "dev-unknown": device(None, {"inst-unknown": instance(view(title="off"))}),
        }

    def plan(self, changes, source=("dev-home", "inst-home"), user=OWNER, label="family-hub"):
        return copy_sync.plan_pushes(self.devices, user, source[0], source[1], label, changes)

    def test_change_goes_to_the_same_users_other_copy(self):
        self.assertEqual(self.plan({TITLE: "on"}), [("dev-cloud", "inst-cloud", {TITLE: "on"})])

    def test_other_users_and_unowned_copies_get_nothing(self):
        targets = {(d, i) for d, i, _ in self.plan({TITLE: "on"})}
        self.assertNotIn(("dev-jenn", "inst-jenn"), targets)
        self.assertNotIn(("dev-unknown", "inst-unknown"), targets)

    def test_only_the_same_dashboard(self):
        self.devices["dev-cloud"]["instances"]["inst-other"] = instance(view(title="off"), label="other-dashboard")
        self.assertEqual(self.plan({TITLE: "on"}), [("dev-cloud", "inst-cloud", {TITLE: "on"})])

    def test_same_dashboard_on_another_page_of_the_same_copy(self):
        self.devices["dev-home"]["instances"]["inst-home-2"] = instance(view(title="off"))
        targets = {(d, i) for d, i, _ in self.plan({TITLE: "on"})}
        self.assertEqual(targets, {("dev-cloud", "inst-cloud"), ("dev-home", "inst-home-2")})

    def test_nothing_back_to_the_source(self):
        self.devices["dev-cloud"]["instances"]["inst-cloud"]["settings"][TITLE] = "on"
        self.assertEqual(self.plan({TITLE: "on"}), [])

    def test_only_fields_that_differ_on_the_target(self):
        self.devices["dev-cloud"]["instances"]["inst-cloud"]["settings"][WEEK] = "planner"
        plan = self.plan({TITLE: "on", WEEK: "planner"})
        self.assertEqual(plan, [("dev-cloud", "inst-cloud", {TITLE: "on"})])

    def test_no_changes_no_pushes(self):
        self.assertEqual(self.plan({}), [])

    def test_no_user_no_pushes(self):
        self.assertEqual(self.plan({TITLE: "on"}, user=None), [])

    def test_device_name_is_never_sent(self):
        self.assertEqual(self.plan({NAME: "Will"}), [])

    def test_unapplied_earlier_push_is_kept_in_the_new_one(self):
        # The Cloud copy hasn't opened since Title only was sent (seq 1);
        # a second change must not replace that queued value.
        cloud = self.devices["dev-cloud"]["instances"]["inst-cloud"]
        cloud.update(pending_seq=1, pending_settings={TITLE: "on"}, applied_seq=0)
        cloud["settings"][TITLE] = "on"
        plan = self.plan({WEEK: "planner"})
        self.assertEqual(plan, [("dev-cloud", "inst-cloud", {TITLE: "on", WEEK: "planner"})])

    def test_applied_earlier_push_is_not_resent(self):
        cloud = self.devices["dev-cloud"]["instances"]["inst-cloud"]
        cloud.update(pending_seq=1, pending_settings={TITLE: "on"}, applied_seq=1)
        cloud["settings"][TITLE] = "on"
        self.assertEqual(self.plan({WEEK: "planner"}), [("dev-cloud", "inst-cloud", {WEEK: "planner"})])


class RoundTrip(unittest.TestCase):
    """Report -> push -> stale report -> apply -> report, with the records
    updated the way device_settings_websocket_api.py updates them."""

    def push(self, record, settings):
        # Mirrors _push_instance_settings.
        record["pending_seq"] = record.get("pending_seq", 0) + 1
        record["pending_settings"] = settings
        record["settings"] = {**record["settings"], **settings}

    def test_change_at_home_reaches_cloud_and_does_not_bounce(self):
        home = instance(view(title="off"), applied_seq=0)
        cloud = instance(view(title="off"), applied_seq=0)
        devices = {"dev-home": device(OWNER, {"inst-home": home}), "dev-cloud": device(OWNER, {"inst-cloud": cloud})}

        changes = copy_sync.record_report(home, view(title="on"), applied_seq=0, first=False, now=T1)
        plan = copy_sync.plan_pushes(devices, OWNER, "dev-home", "inst-home", "family-hub", changes)
        self.assertEqual(plan, [("dev-cloud", "inst-cloud", {TITLE: "on"})])
        self.push(cloud, plan[0][2])

        # Cloud opens: its first report still carries the old value.
        changes = copy_sync.record_report(cloud, view(title="off"), applied_seq=0, first=False, now=T2)
        self.assertEqual(changes, {})
        self.assertEqual(copy_sync.plan_pushes(devices, OWNER, "dev-cloud", "inst-cloud", "family-hub", changes), [])

        # Cloud applies seq 1 and reports again.
        changes = copy_sync.record_report(cloud, view(title="on"), applied_seq=1, first=False, now=T2)
        self.assertEqual(changes, {})
        self.assertEqual(home["settings"][TITLE], "on")
        self.assertEqual(home["pending_seq"], 0)


if __name__ == "__main__":
    unittest.main()
