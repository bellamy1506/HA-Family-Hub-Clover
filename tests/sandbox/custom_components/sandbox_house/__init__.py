"""Family Hub sandbox only: make the stand-in calendars act like the house's.

The sandbox uses Local Calendar for every column, which can add, edit and
delete. On the house, Will, Home and Work are iCloud through CalDAV, which
Home Assistant 2026.10 lets the board add to only (no edit, no delete), and
Jenn's planned Google calendar is read only on both paths J008 plans. Family
Hub decides what to offer from each calendar's supported features, so this
narrows them, both on the entity (what Home Assistant enforces) and in its
state (what the board reads).

configuration.yaml:
    sandbox_house:
      calendar_features:
        calendar.wills_calendar: 1   # 1 add, 2 delete, 4 edit; 0 read only

Applied when Home Assistant has started, and by the service
sandbox_house.apply_calendar_features (restrict: false gives every listed
calendar full features back, which the seed script uses to write events).
"""
from __future__ import annotations

import logging

import voluptuous as vol

from homeassistant.components.calendar import CalendarEntityFeature
from homeassistant.components.calendar.const import DATA_COMPONENT
from homeassistant.const import EVENT_HOMEASSISTANT_STARTED
from homeassistant.core import HomeAssistant, ServiceCall
from homeassistant.helpers import config_validation as cv

DOMAIN = "sandbox_house"
_LOGGER = logging.getLogger(__name__)
FULL = CalendarEntityFeature.CREATE_EVENT | CalendarEntityFeature.DELETE_EVENT | CalendarEntityFeature.UPDATE_EVENT

CONFIG_SCHEMA = vol.Schema(
    {DOMAIN: vol.Schema({vol.Optional("calendar_features", default={}): {cv.entity_id: vol.All(int, vol.Range(min=0, max=7))}})},
    extra=vol.ALLOW_EXTRA,
)


async def async_setup(hass: HomeAssistant, config: dict) -> bool:
    features: dict[str, int] = config.get(DOMAIN, {}).get("calendar_features", {})

    def apply(restrict: bool = True) -> None:
        component = hass.data.get(DATA_COMPONENT)
        for entity_id, value in features.items():
            entity = component.get_entity(entity_id) if component else None
            if entity is None:
                # Normal on the first start: the calendars come later.
                _LOGGER.info("sandbox_house: %s not there yet", entity_id)
                continue
            entity._attr_supported_features = CalendarEntityFeature(value if restrict else FULL)
            entity.async_write_ha_state()

    async def on_started(_event) -> None:
        apply(True)

    async def service(call: ServiceCall) -> None:
        apply(call.data.get("restrict", True))

    hass.bus.async_listen_once(EVENT_HOMEASSISTANT_STARTED, on_started)
    hass.services.async_register(DOMAIN, "apply_calendar_features", service, schema=vol.Schema({vol.Optional("restrict", default=True): bool}))
    return True
