"""House fork: Family Hub's diagnostics hold each copy's reports
(copy_reports.py, #115). A session reads them, read-only, with the
connector's ha_get_integration(entry_id=..., include_diagnostics=True,
diagnostics_fields=["copy_reports"]); an admin can also download them from
the Family Hub entry's menu. Admins only, as Home Assistant serves them.
"""
from __future__ import annotations

from .const import DOMAIN


async def async_get_config_entry_diagnostics(hass, entry) -> dict:
    return {"copy_reports": hass.data[DOMAIN].get("copy_reports", {})}
