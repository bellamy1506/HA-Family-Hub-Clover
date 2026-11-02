"""House fork: the wiring for calendar_cache.py (owner, 2026-10-26).

Two commands for the week calendar card, open to every signed-in user, the
same as Home Assistant's own calendar API: get the copy for a range, and
send back what a live check found. Plus the hourly refresh of every
calendar a board has asked about, also started when a board asks for a
range the copy doesn't hold (#115). Named like device_settings_websocket_api.py
for the same import-shadowing reason.
"""
from __future__ import annotations

import logging
from datetime import timedelta

import voluptuous as vol

from homeassistant.components import websocket_api
from homeassistant.core import HomeAssistant, callback
from homeassistant.helpers.event import async_track_time_interval
from homeassistant.util import dt as dt_util

from . import calendar_cache
from .const import DOMAIN

_LOGGER = logging.getLogger(__name__)

REFRESH_EVERY = timedelta(hours=1)
# The refreshed window: this month's and next month's grids, with room.
WINDOW_BEFORE = timedelta(days=42)
WINDOW_AFTER = timedelta(days=80)


def _cache(hass: HomeAssistant) -> calendar_cache.CalendarCache:
    return hass.data[DOMAIN]["calendar_cache"]


def _range(hass: HomeAssistant, msg: dict):
    tz = dt_util.get_default_time_zone()
    return calendar_cache.parse_time(msg["start"], tz), calendar_cache.parse_time(msg["end"], tz)


def _window():
    """The range the refresh fetches, from today."""
    start = dt_util.start_of_local_day() - WINDOW_BEFORE
    return start, start + WINDOW_BEFORE + WINDOW_AFTER


@websocket_api.websocket_command(
    {
        vol.Required("type"): "family_hub/calendar_cache/get",
        vol.Required("entity_ids"): [str],
        vol.Required("start"): str,
        vol.Required("end"): str,
    }
)
@callback
def ws_get(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict) -> None:
    """The copy for each calendar that covers the range; none for the rest.
    A calendar missing from a range the refresh covers starts the refresh,
    so a phone isn't left waiting on iCloud for up to an hour after each
    restart (#115)."""
    start, end = _range(hass, msg)
    ids = [e for e in msg["entity_ids"] if e.startswith("calendar.") and hass.states.get(e)]
    found = _cache(hass).get(ids, start, end) if start and end else {}
    first, last = _window()
    if start and end and first <= start and end <= last and len(found) < len(ids):
        hass.async_create_background_task(async_refresh(hass), "family_hub calendar copy refresh")
    connection.send_result(msg["id"], {"calendars": found})


@websocket_api.websocket_command(
    {
        vol.Required("type"): "family_hub/calendar_cache/put",
        vol.Required("start"): str,
        vol.Required("end"): str,
        vol.Required("calendars"): {str: [dict]},
    }
)
@callback
def ws_put(hass: HomeAssistant, connection: websocket_api.ActiveConnection, msg: dict) -> None:
    """What a board's live check found, one list per calendar."""
    start, end = _range(hass, msg)
    if start and end:
        now = dt_util.now()
        for entity_id, events in msg["calendars"].items():
            if entity_id.startswith("calendar.") and hass.states.get(entity_id) and len(events) <= calendar_cache.MAX_EVENTS:
                _cache(hass).put(entity_id, start, end, events, now)
    connection.send_result(msg["id"], {})


async def async_refresh(hass: HomeAssistant) -> None:
    """Fetch the whole window fresh for every calendar a board has asked about.
    One at a time: a call while one runs does nothing (#115)."""
    component = hass.data.get("calendar")
    data = hass.data[DOMAIN]
    if component is None or data.get("calendar_cache_refreshing"):
        return
    data["calendar_cache_refreshing"] = True
    try:
        began = dt_util.now()
        start, end = _window()
        for entity_id in _cache(hass).entities():
            entity = component.get_entity(entity_id)
            if entity is None:
                continue
            try:
                events = await entity.async_get_events(hass, start, end)
            except Exception as err:  # noqa: BLE001 - keep the old copy on any failure
                _LOGGER.debug("Calendar copy refresh failed for %s: %s", entity_id, err)
                continue
            _cache(hass).replace(entity_id, start, end, [calendar_cache.api_event(e, dt_util.as_local) for e in events], began)
    finally:
        data["calendar_cache_refreshing"] = False


def async_register_all(hass: HomeAssistant) -> None:
    """Called once from __init__.py's async_setup."""
    hass.data[DOMAIN]["calendar_cache"] = calendar_cache.CalendarCache(dt_util.get_default_time_zone())
    websocket_api.async_register_command(hass, ws_get)
    websocket_api.async_register_command(hass, ws_put)

    async def _hourly(_now) -> None:
        await async_refresh(hass)

    async_track_time_interval(hass, _hourly, REFRESH_EVERY)
