"""House fork: one Home Assistant user's settings follow them between their
copies (fork issue #5).

A copy is one browser storage at one address - what the rest of Family Hub
calls a "device". One phone can hold several (the Home Assistant app keeps a
separate storage for the home address and for Home Assistant Cloud), and a
new copy used to start on household defaults.

This module only decides who gets what. device_settings_websocket_api.py's
ws_report calls it and sends the result through the existing push path
(_push_instance_settings / _push_settings), so live and next-open delivery
work unchanged. No Home Assistant imports, so tests/test_copy_sync.py can
load it on its own.

Records are the device-settings store's own device and instance records.
This module adds three keys to them:
  - user_id (device record): the Home Assistant user who last reported.
  - applied_seq: the copy's own last-applied push seq, from its report.
  - changed_at: when a report last carried a real change.
"""
from __future__ import annotations

from typing import Any, Optional

# Names the copy itself, so it never follows a user to another copy.
NEVER_SYNCED = frozenset({"familyHubDeviceCustomNameLocal"})


def _unapplied(record: dict[str, Any], applied_seq: Optional[int]) -> dict[str, Any]:
    """The pushed fields this copy hasn't applied yet, or {}."""
    pending = record.get("pending_settings")
    if not isinstance(pending, dict) or int(record.get("pending_seq") or 0) <= int(applied_seq or 0):
        return {}
    return pending


def record_report(
    record: dict[str, Any],
    reported: dict[str, Any],
    applied_seq: Optional[int],
    first: bool,
    now: str,
) -> dict[str, Any]:
    """Stores one scope of a copy's report on its record and returns the
    fields that really changed (the ones to pass on).

    Not a change: the copy's first report (`first`); a field the record has
    never held (a field added in an update arrives as the copy's default);
    a field the copy was pushed but hasn't applied yet (its report still
    carries the old value, which is kept); the copy's own name. A report
    without applied_seq comes from a card older than this module: stored as
    upstream stores it, passed on to nobody.
    """
    stored = record.get("settings") or {}
    if applied_seq is None:
        record["settings"] = dict(reported)
        return {}
    unapplied = {} if first else _unapplied(record, applied_seq)
    settled = {k: (stored[k] if k in unapplied and k in stored else v) for k, v in reported.items()}
    changes = {} if first else {
        k: v
        for k, v in settled.items()
        if k in stored and stored[k] != v and k not in unapplied and k not in NEVER_SYNCED
    }
    record["settings"] = settled
    record["applied_seq"] = applied_seq
    if changes:
        record["changed_at"] = now
    return changes


def _other_copies(devices: dict[str, Any], user_id: Optional[str], device_id: str, instance_id: str, label: Optional[str]):
    """(device_id, instance_id, record) for each of this user's other
    placements of the same dashboard (same instance_label), on any copy."""
    if not user_id or not label:
        return
    for dev_id, dev in devices.items():
        if not isinstance(dev, dict) or dev.get("user_id") != user_id:
            continue
        for inst_id, inst in (dev.get("instances") or {}).items():
            if not isinstance(inst, dict) or inst.get("instance_label") != label:
                continue
            if (dev_id, inst_id) == (device_id, instance_id):
                continue
            yield dev_id, inst_id, inst


def _to_queue(target: dict[str, Any], changes: dict[str, Any]) -> dict[str, Any]:
    """The changes the target doesn't already hold, plus anything from an
    earlier push it hasn't applied yet (a push replaces the queued one, so
    leaving that out would lose it). {} if nothing is new for it."""
    stored = target.get("settings") or {}
    fields = {k: v for k, v in changes.items() if k not in NEVER_SYNCED and stored.get(k) != v}
    if not fields:
        return {}
    return {**_unapplied(target, target.get("applied_seq")), **fields}


def plan_pushes(
    devices: dict[str, Any],
    user_id: Optional[str],
    device_id: str,
    instance_id: str,
    label: Optional[str],
    changes: dict[str, Any],
) -> list[tuple[str, str, dict[str, Any]]]:
    """Who gets what for one copy's instance-scoped changes: a list of
    (device_id, instance_id, settings to queue)."""
    if not changes:
        return []
    plan = []
    for dev_id, inst_id, inst in _other_copies(devices, user_id, device_id, instance_id, label):
        settings = _to_queue(inst, changes)
        if settings:
            plan.append((dev_id, inst_id, settings))
    return plan


def seed_for(
    devices: dict[str, Any],
    user_id: Optional[str],
    device_id: str,
    instance_id: str,
    label: Optional[str],
    reported: dict[str, Any],
) -> dict[str, Any]:
    """What a brand-new placement of this dashboard should be sent: the
    settings of this user's placement that changed most recently (by
    changed_at, not last_seen), minus what the new one already reported.
    {} when the user has no other placement, or none has changed yet."""
    sources = [
        inst for _, _, inst in _other_copies(devices, user_id, device_id, instance_id, label)
        if inst.get("changed_at")
    ]
    if not sources:
        return {}
    source = max(sources, key=lambda inst: inst["changed_at"])
    return {
        k: v
        for k, v in (source.get("settings") or {}).items()
        if k not in NEVER_SYNCED and reported.get(k) != v
    }
