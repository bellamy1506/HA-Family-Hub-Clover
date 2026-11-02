"""House fork: the wiring for copy_reports.py (#111, #115).

One command, family_hub/copy_report, open to every signed-in user (the wall
and Jenn aren't admins), the same as calendar_cache/put. Home Assistant
says who sent it, so a copy can't report under another user's name. The
reports live in one Store, written once reports stop for 30 s, so they
survive restarts; diagnostics.py hands them to a session. Named like
device_settings_websocket_api.py for the same import-shadowing reason.
"""
from __future__ import annotations

import voluptuous as vol

from homeassistant.components import websocket_api
from homeassistant.core import HomeAssistant, callback
from homeassistant.helpers.storage import Store
from homeassistant.util import dt as dt_util

from . import copy_reports
from .const import DOMAIN

STORAGE_KEY = "family_hub_copy_reports"
SAVE_AFTER = 30  # seconds without a report
# Milliseconds since the page began loading; a fraction is dropped.
_MS = vol.Any(None, vol.All(vol.Coerce(int), vol.Range(min=0, max=600_000)))


@websocket_api.websocket_command(
    {
        vol.Required("type"): "family_hub/copy_report",
        vol.Required("copy"): vol.All(str, vol.Length(min=1, max=40)),
        vol.Required("label"): vol.All(str, vol.Length(max=40)),
        vol.Optional("open"): vol.All([_MS], vol.Length(min=2, max=2)),  # first content, all live
        vol.Optional("error"): str,
    }
)
@callback
def ws_report(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict) -> None:
    """One copy's open or error."""
    data = hass.data[DOMAIN]
    copy_reports.record(data["copy_reports"], msg, connection.user.name, dt_util.now().isoformat(timespec="seconds"))
    data["copy_reports_store"].async_delay_save(lambda: data["copy_reports"], SAVE_AFTER)
    connection.send_result(msg["id"])


async def async_register_all(hass: HomeAssistant) -> None:
    """Called once from __init__.py's async_setup."""
    store = Store(hass, 1, STORAGE_KEY)
    hass.data[DOMAIN]["copy_reports_store"] = store
    hass.data[DOMAIN]["copy_reports"] = await store.async_load() or {}
    websocket_api.async_register_command(hass, ws_report)
