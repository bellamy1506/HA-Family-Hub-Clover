"""House fork: each copy's last few opens and last error, kept for a session
to read after each install (#111, #115).

A copy is one browser storage at one address (CONTEXT.md). Each copy of the
house board reports when it opens and when an error happens; a session reads
every copy at once in Family Hub's diagnostics (diagnostics.py), so no copy
needs an entity of its own. No Home Assistant imports, so
tests/test_copy_reports.py can load this on its own; the wiring is in
copy_reports_websocket_api.py.

Kept per copy id, most recently seen last:
  {"user": "Jenn", "label": "home, iPhone", "seen": <when>,
   "opens": [[<when>, <first content ms>, <all live ms or None>], ...],
   "error": [<when>, <text>] or None}

A copy that's gone for good (cleared storage, a retired phone) stays until
20 newer copies push it out; its "seen" shows that. A note, not code.
"""
from __future__ import annotations

from typing import Any, Optional

KEEP_OPENS = 5
KEEP_COPIES = 20
ERROR_CHARS = 300


def record(reports: dict[str, dict], report: dict[str, Any], user: Optional[str], now: str) -> None:
    """Files one copy's report into reports, in place. report holds "copy"
    and "label", and may hold "open" ([first content ms, all live ms]) and
    "error" (text)."""
    kept = reports.pop(report["copy"], None) or {"opens": [], "error": None}
    kept.update(user=user, label=report["label"], seen=now)
    if "open" in report:
        kept["opens"] = [[now, *report["open"]], *kept["opens"]][:KEEP_OPENS]
    if "error" in report:
        kept["error"] = [now, report["error"][:ERROR_CHARS]]
    reports[report["copy"]] = kept
    while len(reports) > KEEP_COPIES:
        del reports[next(iter(reports))]
