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

    def test_another_page_of_the_same_copy_keeps_its_own_settings(self):
        # Upstream keeps view settings per page on one copy; only other
        # copies follow.
        self.devices["dev-home"]["instances"]["inst-home-2"] = instance(view(title="off"))
        targets = {(d, i) for d, i, _ in self.plan({TITLE: "on"})}
        self.assertEqual(targets, {("dev-cloud", "inst-cloud")})

    def test_every_page_of_the_dashboard_on_another_copy_follows(self):
        self.devices["dev-cloud"]["instances"]["inst-cloud-2"] = instance(view(title="off"))
        targets = {(d, i) for d, i, _ in self.plan({TITLE: "on"})}
        self.assertEqual(targets, {("dev-cloud", "inst-cloud"), ("dev-cloud", "inst-cloud-2")})

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


class SeedNewCopy(unittest.TestCase):
    def seed(self, devices, reported=None, user=OWNER):
        return copy_sync.seed_for(devices, user, "dev-new", "inst-new", "family-hub", reported or view())

    def test_new_copy_gets_the_users_changed_settings(self):
        devices = {
            "dev-home": device(OWNER, {"inst-home": instance(view(title="on", week="planner"), changed_at=T1)}),
            "dev-new": device(OWNER, {"inst-new": instance(view())}),
        }
        self.assertEqual(self.seed(devices), {TITLE: "on", WEEK: "planner"})

    def test_most_recently_changed_copy_wins_not_the_one_seen_last(self):
        devices = {
            "dev-home": device(OWNER, {"inst-home": instance(view(title="on"), changed_at=T2)}),
            "dev-cloud": device(OWNER, {"inst-cloud": instance(view(title="off", month="split"), changed_at=T1)}),
            "dev-new": device(OWNER, {"inst-new": instance(view())}),
        }
        devices["dev-cloud"]["instances"]["inst-cloud"]["last_seen"] = "2026-10-26T23:59:00+00:00"
        self.assertEqual(self.seed(devices), {TITLE: "on"})

    def test_users_first_copy_gets_nothing(self):
        devices = {"dev-new": device(OWNER, {"inst-new": instance(view())})}
        self.assertEqual(self.seed(devices), {})

    def test_with_no_change_recorded_the_copy_seen_last_is_used(self):
        # Copies set up before this shipped have no change time yet.
        home = instance(view(title="on"))
        home["last_seen"] = T2
        cloud = instance(view(title="off", month="split"))
        cloud["last_seen"] = T1
        devices = {
            "dev-home": device(OWNER, {"inst-home": home}),
            "dev-cloud": device(OWNER, {"inst-cloud": cloud}),
            "dev-new": device(OWNER, {"inst-new": instance(view())}),
        }
        self.assertEqual(self.seed(devices), {TITLE: "on"})

    def test_a_recorded_change_beats_a_later_visit(self):
        home = instance(view(title="on"), changed_at=T1)
        home["last_seen"] = T1
        cloud = instance(view(title="off", month="split"))
        cloud["last_seen"] = T2
        devices = {
            "dev-home": device(OWNER, {"inst-home": home}),
            "dev-cloud": device(OWNER, {"inst-cloud": cloud}),
            "dev-new": device(OWNER, {"inst-new": instance(view())}),
        }
        self.assertEqual(self.seed(devices), {TITLE: "on"})

    def test_new_page_on_an_existing_copy_is_not_seeded_from_its_own_pages(self):
        devices = {
            "dev-new": device(OWNER, {
                "inst-old-page": instance(view(title="on"), changed_at=T1),
                "inst-new": instance(view()),
            }),
        }
        self.assertEqual(self.seed(devices), {})

    def test_other_users_and_dashboards_are_not_a_source(self):
        devices = {
            "dev-jenn": device(JENN, {"inst-jenn": instance(view(title="on"), changed_at=T2)}),
            "dev-home": device(OWNER, {"inst-other": instance(view(title="on"), label="other", changed_at=T2)}),
            "dev-new": device(OWNER, {"inst-new": instance(view())}),
        }
        self.assertEqual(self.seed(devices), {})

    def test_no_user_no_seed(self):
        devices = {"dev-home": device(None, {"inst-home": instance(view(title="on"), changed_at=T1)})}
        self.assertEqual(self.seed(devices, user=None), {})

    def test_device_name_never_seeded(self):
        devices = {
            "dev-home": device(OWNER, {"inst-home": instance({NAME: "Will", TITLE: "on"}, changed_at=T1)}),
        }
        self.assertEqual(self.seed(devices), {TITLE: "on"})


THEME = "familyHubDeviceThemeOverrideLocal"


class ThemeFollowsTheCopy(unittest.TestCase):
    """The theme is device-scoped: one per copy, whatever the dashboard.
    Device scope is asked for with instance_id=None and label=None."""

    def setUp(self):
        self.devices = {
            "dev-home": device(OWNER, {}, settings={NAME: "Will", THEME: "liquidglassdark"}),
            "dev-cloud": device(OWNER, {}, settings={NAME: "", THEME: ""}),
            "dev-jenn": device(JENN, {}, settings={NAME: "", THEME: ""}),
        }

    def test_theme_change_reaches_the_users_other_copies_only(self):
        plan = copy_sync.plan_pushes(self.devices, OWNER, "dev-home", None, None, {THEME: "liquidglassdark"})
        self.assertEqual(plan, [("dev-cloud", None, {THEME: "liquidglassdark"})])

    def test_any_dashboard_label_is_ignored_for_device_scope(self):
        self.devices["dev-cloud"]["instances"] = {"inst": instance({}, label="other")}
        plan = copy_sync.plan_pushes(self.devices, OWNER, "dev-home", None, None, {THEME: "__default__"})
        self.assertEqual(plan, [("dev-cloud", None, {THEME: "__default__"})])

    def test_household_theme_empty_value_syncs_too(self):
        self.devices["dev-cloud"]["settings"][THEME] = "liquidglassdark"
        plan = copy_sync.plan_pushes(self.devices, OWNER, "dev-home", None, None, {THEME: ""})
        self.assertEqual(plan, [("dev-cloud", None, {THEME: ""})])

    def test_theme_change_is_a_change_but_name_is_not(self):
        record = self.devices["dev-home"]
        changes = copy_sync.record_report(record, {NAME: "Will's phone", THEME: "ha:Dark"}, applied_seq=0, first=False, now=T1)
        self.assertEqual(changes, {THEME: "ha:Dark"})
        self.assertEqual(record["settings"][NAME], "Will's phone")
        self.assertEqual(record["changed_at"], T1)

    def test_name_never_queued_even_if_asked(self):
        plan = copy_sync.plan_pushes(self.devices, OWNER, "dev-home", None, None, {NAME: "Will", THEME: "ha:Dark"})
        self.assertEqual(plan, [("dev-cloud", None, {THEME: "ha:Dark"})])

    def test_new_copy_is_seeded_with_the_theme_not_the_name(self):
        self.devices["dev-home"]["changed_at"] = T1
        seed = copy_sync.seed_for(self.devices, OWNER, "dev-new", None, None, {NAME: "", THEME: ""})
        self.assertEqual(seed, {THEME: "liquidglassdark"})

    def test_instance_scope_still_needs_a_label(self):
        self.devices["dev-cloud"]["instances"] = {"inst": instance(view(title="off"))}
        self.assertEqual(copy_sync.plan_pushes(self.devices, OWNER, "dev-home", "inst-home", None, {TITLE: "on"}), [])


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

    def test_admin_push_of_start_view_to_one_copy_goes_nowhere_else(self):
        # House fork (Clover Tablet loop, 2026-10-29): the tablet copy is
        # pushed Start view = week. When it applies the push and reports,
        # nothing has changed, so the same user's phones keep their own.
        start = "familyCalendarStartViewLocal"
        tablet = instance({**view(), start: "household"}, applied_seq=0)
        phone = instance({**view(), start: "household"}, applied_seq=0)
        devices = {"dev-tablet": device(OWNER, {"inst-tablet": tablet}), "dev-phone": device(OWNER, {"inst-phone": phone})}
        self.push(tablet, {start: "week"})
        changes = copy_sync.record_report(tablet, {**view(), start: "week"}, applied_seq=1, first=False, now=T1)
        self.assertEqual(changes, {})
        self.assertEqual(copy_sync.plan_pushes(devices, OWNER, "dev-tablet", "inst-tablet", "family-hub", changes), [])
        self.assertEqual(phone["settings"][start], "household")


if __name__ == "__main__":
    unittest.main()
