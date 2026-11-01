# Google Weather in Home Assistant: what the board can read, and how many requests a day

Research note, 2026-11-01, for [#109](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/109). Question: what does Home Assistant's Google Weather integration give the house board, and how many Weather API requests a day does it make? The board will read only this entity: hourly for the next 24 hours, daily after that, an icon on every day, a chance of rain under rainy days, and Month's 10 days ([switch-over plan, Google Weather](../board-next/switch-over.md#before-slice-1-beside-it-google-weather)).

Versions read: Home Assistant core at tag **2026.10.4** (the house's version), and the client library it pins, **python-google-weather-api 0.0.7** ([manifest.json](https://github.com/home-assistant/core/blob/2026.10.4/homeassistant/components/google_weather/manifest.json)). The library has no git tags; 0.0.7 is commit [`1b68a63`](https://github.com/tronikos/python-google-weather-api/commit/1b68a63), released 2026-09-06 ([commit list](https://github.com/tronikos/python-google-weather-api/commits/main), [PyPI history](https://pypi.org/project/python-google-weather-api/#history)).

Lines marked **[inference]** are my own reading or arithmetic, not something a source states. Everything else cites the source that says it. Nothing here was tested on the house's Home Assistant; it is read from code and docs.

**Method note.** Pages were found with WebSearch and opened with WebFetch. WebFetch would not quote whole source files, so the source files at the tag were opened with Firecrawl's single-page fetch, the owner's fallback for a page WebFetch can't open.

## Answers in brief

1. **Entity and types.** One weather entity per location, `weather.<location name>` (the name defaults to Home Assistant's own location name) *[inference on the exact id]*. It supports **daily, hourly and twice daily**.
2. **Reach.** Daily: **10 days** from the current day. Hourly: **exactly 24 entries, starting with the current hour**, so it reaches 23 to 24 hours ahead of now, not a full 24.
3. **Fields.** Every entry has `datetime`, `condition`, `temperature` and `precipitation_probability`; daily adds `templow`. A daily `datetime` is **neither local nor UTC midnight**: it is the start of Google's forecast day, **7 a.m. local, written in UTC** (for example `…T12:00:00Z` in winter, `…T11:00:00Z` in summer in New York). Its UTC date and its local date are the same day, so borrow §10's trap doesn't bite.
4. **Subscription.** `weather/subscribe_forecast` works for all three types. It pushes once right away, then **about once an hour** for daily and for hourly, each time the integration refetches.
5. **Requests.** Current conditions every 15 minutes (96), daily every hour (24), hourly every hour (24): **144 a day** while the board is subscribed, plus 3 per Home Assistant restart. That's 4,464 in a 31-day month. **A 300-a-day cap fits with 156 to spare.** Keep 300.
6. **Price.** One SKU, "Weather Usage" (Essentials): **10,000 successful requests a month free**, then **$0.15 per 1,000** up to 100,000. Cap: Cloud console, Google Maps Platform > Quotas, Weather API, edit the per-day quota. Key: Google Maps Platform > Keys & Credentials > Create credentials > API key, with only Weather API kept under API restrictions.
7. **Other APIs and running out.** Only the Weather API is needed, plus billing on the project. When the daily quota runs out, Google answers 429, and within 15 minutes the entity goes **unavailable**. At the next hourly fetch, a board already subscribed gets **one last push**, either the old forecast or `forecast: null` depending on sub-second timing, then nothing more. A board that subscribes during the outage gets `null`. It all recovers on its own after Google's reset at midnight Pacific (3 a.m. Eastern).

## 1. The entity id and forecast types

- **One weather entity per location.** Setup asks for an API key, a name and a location. The name defaults to `hass.config.location_name` and the location to the home's latitude and longitude ([config_flow.py](https://github.com/home-assistant/core/blob/2026.10.4/homeassistant/components/google_weather/config_flow.py), `_get_location_schema`). Each location is a config subentry, and `weather.py` adds one `GoogleWeatherEntity` per subentry ([weather.py](https://github.com/home-assistant/core/blob/2026.10.4/homeassistant/components/google_weather/weather.py), `async_setup_entry`).
- **Naming.** The weather entity sets `_attr_name = None` (weather.py). The base entity sets `_attr_has_entity_name = True` and names the device after the subentry title ([entity.py](https://github.com/home-assistant/core/blob/2026.10.4/homeassistant/components/google_weather/entity.py)). So the entity takes the device's name, and its id is `weather.` plus that name in slug form: `weather.home` if the location is called "Home" **[inference: Home Assistant's general naming rule; the house's location name was not checked, and a clash would add `_2`]**. The house's current forecast entity is `weather.forecast_home` ([J006](https://github.com/bellamy1506/Clover-Home/blob/main/records/projects/J006-home-assistant-automations.md)), so the two don't collide.
- **Forecast types.** `_attr_supported_features = FORECAST_DAILY | FORECAST_HOURLY | FORECAST_TWICE_DAILY` (weather.py).
- **Sensors too.** 17 sensors for current conditions, 5 enabled by default (temperature, feels like, humidity, precipitation intensity, cloud cover). They read the same current-conditions data, so they add no requests ([sensor.py](https://github.com/home-assistant/core/blob/2026.10.4/homeassistant/components/google_weather/sensor.py)).

## 2. How far each forecast reaches

- **Daily: 10 days.** The daily coordinator calls `async_get_daily_forecast` with its default `days=10` ([coordinator.py](https://github.com/home-assistant/core/blob/2026.10.4/homeassistant/components/google_weather/coordinator.py); [library api.py](https://github.com/tronikos/python-google-weather-api/blob/1b68a63/src/google_weather_api/api.py)). Google: `days` "Limits the amount of total days to fetch starting from the current day - a value from 1 to 10" ([forecast.days.lookup](https://developers.google.com/maps/documentation/weather/reference/rest/v1/forecast.days/lookup)). So Month's 10 days are covered. Twice daily gives 20 entries from the same 10 days (weather.py).
- **Hourly: 24 entries from the current hour.** `HOURLY_FORECAST_HOURS = 24`, with the comment "The API returns at most 24 hourly records per request, so asking for more than that costs an extra request per update. Keep it to a single page." (coordinator.py). Google: `hours` "Limits the amount of total hours to fetch starting from the current hour"; `pageSize` is "a value from 1 to 24" ([forecast.hours.lookup](https://developers.google.com/maps/documentation/weather/reference/rest/v1/forecast.hours/lookup)). The first entry is the hour already under way. **[inference]** At 2:40 pm the last entry covers 1 to 2 pm tomorrow, so hourly ends 23 h 20 min ahead; in general it ends 23 to 24 hours ahead, depending on the minute. The board's "hourly for the next 24 hours, daily after that" should hand over to daily wherever the hourly list ends, not at a fixed 24 hours. The rain line only needs the rest of today, which 24 entries always cover.

## 3. The fields in each forecast entry

The integration builds each entry from Google's response (weather.py, `_async_forecast_daily`, `_async_forecast_hourly`, `_async_forecast_twice_daily`). Home Assistant then converts units and renames the keys before sending them (`_convert_forecast` in [weather/\_\_init\_\_.py](https://github.com/home-assistant/core/blob/2026.10.4/homeassistant/components/weather/__init__.py)). What the board receives:

| Key | Daily | Hourly | Twice daily |
|---|---|---|---|
| `datetime` | start of the forecast day (7 a.m. local, in UTC) | start of the hour, UTC | start of the day part (7 a.m. or 7 p.m. local, in UTC) |
| `condition` | the **daytime** condition | that hour's | that part's |
| `temperature` | day's max | that hour's | day: max; night: min |
| `templow` | day's min | none | none |
| `precipitation_probability` | the **higher** of day and night, % | that hour's, % | that part's, % |
| `precipitation` | day plus night amount | that hour's | that part's |
| `is_daytime` | **none** | from Google's `isDaytime` | true or false |
| also | humidity, cloud cover, UV, wind, feels-like max | humidity, cloud cover, UV, wind, feels-like, pressure, dew point | humidity, cloud cover, UV, wind, feels-like |

- **The condition** comes from a fixed map of Google's condition types to Home Assistant's ([weather.py](https://github.com/home-assistant/core/blob/2026.10.4/homeassistant/components/google_weather/weather.py), `_CONDITION_MAP`). It never yields `fog`, `exceptional`, `lightning` or `windy-variant`. "Clear" turns into `clear-night` only when the entry isn't daytime, so a daily entry is always `sunny`, never `clear-night`.
- **Units.** Values arrive in Home Assistant's own units (or the entity's unit setting), converted from the metric the integration asks Google for ([\_\_init\_\_.py](https://github.com/home-assistant/core/blob/2026.10.4/homeassistant/components/google_weather/__init__.py), `units_system="METRIC"`; `_convert_forecast`). Temperatures are rounded to whole degrees unless the unit is Celsius (`precision` in weather/\_\_init\_\_.py).
- **`precipitation_probability`** is a whole-number percent (`percent: int` in the library's [model.py](https://github.com/tronikos/python-google-weather-api/blob/1b68a63/src/google_weather_api/model.py)). So the chance of rain the board wants is there for every daily and hourly entry. The house's current forecast doesn't give it ([switch-over plan](../board-next/switch-over.md#before-slice-1-beside-it-google-weather)).

### The daily `datetime` (borrow §10's trap)

- **The value is Google's own string, passed through.** The library types the interval's `start_time` as `str` (model.py). The integration sets `datetime` to `item.interval.start_time` (weather.py), and `_convert_forecast` leaves `datetime` alone.
- **Google's day runs 7 a.m. to 7 a.m.** forecastDays `interval` is "The UTC time interval when this forecasted day is starts (inclusive) and ends (exclusive)", with the note "a day starts at 7am and ends at 7am next day, local time" ([forecast.days.lookup](https://developers.google.com/maps/documentation/weather/reference/rest/v1/forecast.days/lookup)). Google's example for Mountain View: `startTime "2025-02-10T15:00:00Z"`, `displayDate` 2025-02-10 ([daily forecast guide](https://developers.google.com/maps/documentation/weather/daily-forecast)). 15:00 UTC is 7 a.m. Pacific.
- **[inference]** In New York the stamp is `T12:00:00Z` in winter and `T11:00:00Z` in summer. Its UTC date and its local date are the same day. So keying by the local date of the instant, as borrow §10 plans, files each day correctly, and the UTC-midnight trap ([code-data.md §6](calendar-card-pro/code-data.md#6-weather)) doesn't apply to this entity. Keep the local-date key anyway: it's the rule that's right for any provider.
- **Hourly** stamps are UTC hour starts, such as `"2025-02-05T23:00:00Z"` ([hourly forecast guide](https://developers.google.com/maps/documentation/weather/hourly-forecast)). Each one is unique in UTC, so the fall-back night's repeated 1 a.m. only appears once they're converted to local hours, as borrow §10 already notes.

## 4. `weather/subscribe_forecast`, and how often it pushes

- **It works for all three types.** The websocket command only checks that the entity supports the requested type ([websocket_api.py](https://github.com/home-assistant/core/blob/2026.10.4/homeassistant/components/weather/websocket_api.py)). This entity supports daily, hourly and twice daily (section 1).
- **An immediate push on subscribing.** The handler sends its result, then "Push an initial forecast update" (`await entity.async_update_listeners({forecast_type})`, websocket_api.py). Each message is `{"type": <forecast type>, "forecast": [...]}`.
- **Then once per refetch, about hourly.** The first subscriber to a type adds a listener to that type's coordinator (`_async_subscription_started`, weather/\_\_init\_\_.py). Each coordinator refresh calls `_handle_forecast_update`, which pushes the whole list to every subscriber (same file). The daily and hourly coordinators refresh every hour (coordinator.py). Home Assistant's coordinators notify listeners after every refresh by default (`always_update: bool = True`), except when this refresh and the one before both failed ([update_coordinator.py](https://github.com/home-assistant/core/blob/2026.10.4/homeassistant/helpers/update_coordinator.py)).
- **Daily and twice daily share one fetch.** The entity passes the same daily coordinator for both (`twice_daily_coordinator=…coordinator_daily_forecast`, weather.py).
- **[inference]** So the board gets daily and hourly lists at subscribe time and then once an hour each, roughly together. It never needs to poll. A push of `forecast: null` means the integration has no successful fetch from the last hour (section 7).

## 5. Requests a day

**The intervals** (coordinator.py, matching the [integration docs](https://www.home-assistant.io/integrations/google_weather), "Data updates"):

| Data | Interval | Requests a day |
|---|---|---|
| Current conditions | 15 minutes | 96 |
| Daily forecast (10 days) | 1 hour | 24 |
| Hourly forecast (24 hours) | 1 hour | 24 |
| **Total, one location** | | **144** |

- **Each fetch is one request.** The library follows pages until it has the asked-for number of records, and asks for that many per page (`_async_get_all_pages`, `page_size: limit`, [api.py](https://github.com/tronikos/python-google-weather-api/blob/1b68a63/src/google_weather_api/api.py)). Daily asks for 10 per page, and Google allows up to 10. Hourly asks for 24, and Google allows up to 24 ([days](https://developers.google.com/maps/documentation/weather/reference/rest/v1/forecast.days/lookup), [hours](https://developers.google.com/maps/documentation/weather/reference/rest/v1/forecast.hours/lookup)). So neither ever needs a second page.
- **Home Assistant's own figure agrees.** "This results in 4,464 requests per month, meaning you could have up to 2 locations and still stay under the 10,000 free usage cap" ([docs](https://www.home-assistant.io/integrations/google_weather)). That's 144 × 31.
- **Current conditions always polls.** The weather entity and the sensors listen to it from the start.
- **The forecasts poll only while something subscribes.** A coordinator schedules its next refresh only while it has listeners (`if not auth_failed and self._listeners and not self.hass.is_stopping`, update_coordinator.py). The forecast coordinators get a listener only from a subscription (section 4). With nothing subscribed, a forecast is fetched only on demand: by `weather.get_forecasts` or a new subscription, and only when the held copy is an hour old or more (`_async_refresh_forecast`, weather/\_\_init\_\_.py). The docs' line that `get_forecasts` "will not issue any additional API calls to Google" holds only while a subscriber keeps the copy fresh **[inference from the code]**. The wall board stays subscribed, so assume the full 144.
- **Extra viewers add nothing.** A phone opening the board subscribes to the same coordinator. A refetch it triggers resets the hourly timer: the next refresh is scheduled from the end of the last one, cancelling any pending one first (update_coordinator.py, `_schedule_refresh`). **[inference]** So no mix of viewers can push a coordinator past one fetch per interval.
- **One-off extras.** Each Home Assistant start or integration reload refreshes all three coordinators at once (`async_setup_entry`, [\_\_init\_\_.py](https://github.com/home-assistant/core/blob/2026.10.4/homeassistant/components/google_weather/__init__.py)): +3. Setup, re-authentication and adding a location each check the key with one current-conditions call (`_validate_input`, config_flow.py): +1.

**Against the cap [inference]:**
- 144 a day leaves 156 of 300, which is about 50 restarts in one day. The switch-over plan's "about 150" was right; it is 144 plus 3 per restart.
- **Keep 300.** 300 × 31 = 9,300, under the free 10,000 even if the cap were hit every day of a 31-day month. So the cap is what makes "never billed" hold, not the usual 144. There's no reason to raise it, and lowering it only removes restart headroom.
- Google's quota day starts at midnight Pacific ("daily quotas reset at midnight Pacific time", [Manage costs](https://developers.google.com/maps/billing-and-pricing/manage-costs)), which is 3 a.m. Eastern.

## 6. Price, free allowance, and the cap and key in Google Cloud

**Price.**
- **One SKU covers every call the integration makes.** "Weather Usage", Essentials, SKU 9DB8-727A-ACFE. Its billable event is a "Successful request to the Weather API", on currentConditions, forecast.days, forecast.hours, history.hours and publicAlerts ([Environment SKU details](https://developers.google.com/maps/billing-and-pricing/sku-details/environment)). So current conditions, daily and hourly all draw on the same 10,000.
- **Free allowance.** 10,000 a month. Then $0.15 per 1,000 for 10,001 to 100,000, $0.12 for 100,001 to 500,000, and lower above that ([pricing list](https://developers.google.com/maps/billing-and-pricing/pricing)). Essentials SKUs get "10,000 free calls / mo per SKU". Free usage "resets on the first day of each month, at midnight Pacific US time", and "Free usage caps replace monthly $200 credit" (March 2025) ([pricing overview](https://developers.google.com/maps/billing-and-pricing/overview)). Volume is added up "for all projects linked to the customer billing account" (pricing list). **[inference]** So any other Weather API use on the same billing account shares the 10,000.
- **Billing is required.** "A valid billing account is required to use the Weather API" ([Weather API FAQ](https://developers.google.com/maps/documentation/weather/faq)).

**The per-day cap.**
- **Where.** Cloud console, Google Maps Platform > Quotas, choose the API, then edit its per-day quota ([Manage costs](https://developers.google.com/maps/billing-and-pricing/manage-costs); [Reporting](https://developers.google.com/maps/reporting-and-monitoring/reporting)).
- **What it does.** Google: "To put a hard cap on usage of an API, lower its per-day quota. When your project reaches the limit, requests to that API fail for the rest of the day."
- **Budgets don't stop anything.** Budgets and alerts "don't automatically prevent the use or billing of your services" (Manage costs). So the switch-over's optional $1 budget alert only emails.
- **What counts.** "Only successful requests and requests that cause server errors count against quota. Requests that fail authentication do not count against quota" ([Weather API reporting](https://developers.google.com/maps/documentation/weather/report-monitor)).
- **Rate limit.** The default is 6,000 queries a minute (FAQ), far above anything here.
- The quota's exact label on the Weather API's page isn't documented. Look for the per-day one ("per day" is one of the three kinds: "per day, per minute, and per user per minute", Reporting).

**A key limited to the Weather API.**
- **Before the key.** The project needs billing, and the API must be enabled first ([Use API keys with Weather API](https://developers.google.com/maps/documentation/weather/get-api-key)).
- **Steps.** Google Maps Platform > Keys & Credentials > Create credentials > API key. In "Select API restrictions", "Clear any APIs that this key doesn't need, and make sure Weather API stays selected", then Create. Selecting it there doesn't enable the API (same page).
- **Optional application restriction.**
  - Google recommends an IP-address restriction for server-side calls ("Server-side applications relying on API keys are best secured through IP address restrictions", [API security best practices](https://developers.google.com/maps/api-security-best-practices)). **[inference]** A home internet address can change, which would break the weather until the key is edited.
  - The integration also has an optional "HTTP referrer" field, "Specify this only if the API key has a website application restriction" ([strings.json](https://github.com/home-assistant/core/blob/2026.10.4/homeassistant/components/google_weather/strings.json)). The library sends it as the `Referer` header (api.py). **[inference]** That pairs with a Websites restriction and doesn't depend on the house's address. It is weaker than an IP restriction, since a referrer is just a header.
  - The API restriction plus the 300 cap already limit a leaked key to free usage of one API. So the application restriction is optional.

## 7. Other APIs, and what happens when the quota runs out

- **Only the Weather API.** The library calls three endpoints on `https://weather.googleapis.com/v1`: `currentConditions:lookup`, `forecast/days:lookup` and `forecast/hours:lookup` (api.py). The location is Home Assistant's own latitude and longitude, not looked up (config_flow.py). So no Geocoding, Places or Maps API is needed, only the Weather API and billing on the project.
- **Running out gives a 429.** "If you exceeded a quota value with an HTTP/REST request, Google Cloud returns an HTTP `429 TOO MANY REQUESTS` status code" ([Cloud Quotas troubleshooting](https://docs.cloud.google.com/docs/quotas/troubleshoot)). The library raises an auth error only for 401, 403 and a 400 with `API_KEY_INVALID`; anything else becomes `GoogleWeatherApiResponseError` (api.py). The integration turns that into `UpdateFailed` and logs "Error fetching … " (coordinator.py).
- **What the house sees then:**
  - **Entity unavailable.** Within 15 minutes, the next current-conditions fetch fails. The weather entity and its sensors go unavailable, since a coordinator entity's `available` is `last_update_success` (update_coordinator.py).
  - **One last push, old forecast or null.** The first failed forecast fetch notifies subscribers, since success turned to failure. That push serves the forecast only if its last successful fetch is under an hour old. Otherwise `_async_refresh_forecast` retries once, fails, returns False, and `_async_forecast` returns None, which is sent as `forecast: null` (`forecast_valid` defaults to the interval; weather/\_\_init\_\_.py).
  - **[inference]** The scheduled refetch starts about an hour after the last success, give or take a second: the timer is `int(loop.time()) + self._microsecond + update_interval`, with a 0.05 to 0.5 s offset (update_coordinator.py). So whether that push carries the old forecast or `null` is a coin toss.
  - **No more pushes until it recovers.** Further failures send nothing, because listeners aren't notified when two refreshes in a row fail (update_coordinator.py). So a board that got the old forecast keeps showing it, unmarked, until the reset. A board that subscribes during the outage (a phone opening, or the wall reconnecting) gets `null`, because its initial push finds the copy over an hour old.
  - **Recovery is automatic.** Polling continues at the normal intervals, with no backoff (update_coordinator.py). The first success after the reset (midnight Pacific, 3 a.m. Eastern) restores the entity and pushes fresh forecasts.
  - **[inference]** The failed requests cost nothing. Billing counts "successful" requests, and quota counts successful requests and server errors, which a 429 is not.
- **A different failure: key, API or billing switched off. [inference, medium confidence]**
  - A 401 or 403 becomes `ConfigEntryAuthFailed` (coordinator.py), which starts a re-authentication prompt and stops that coordinator's polling (update_coordinator.py: no reschedule when `auth_failed`).
  - Google's errors for a disabled API or disabled billing are 403s (for example the Monitoring API's "403 PERMISSION_DENIED … Billing account disabled", [Monitoring troubleshooting](https://docs.cloud.google.com/monitoring/api/troubleshooting)); no Weather API page states the code.
  - If that holds, a lapsed card blanks the weather **until the card is fixed and someone answers Home Assistant's re-authentication prompt** (re-enter the same key) or reloads the integration. Fixing the card alone isn't enough. The switch-over plan's "goes blank until it's renewed" understates this.

## 8. What this changes for the board  [inference]

- **The switch-over steps stand.** Weather API only, a 300-a-day cap, and a key restricted to it. "About 150 a day" becomes "144, plus 3 per restart".
- **The switch-over plan's cost line needs one change.** If the card lapses, the weather stays blank after renewal until the integration is re-authenticated or reloaded (section 7, medium confidence).
- **Borrow §10's two "not checked" items are settled for this entity.**
  - Daily reaches 10 days.
  - Daily stamps are 7 a.m. local in UTC, so local-date keys file them correctly.
- **Read the right fields.** Read `precipitation_probability` from hourly for the rain line and from daily for the chance under each day. Daily `condition` is the daytime condition; hourly `condition` and `is_daytime` give night icons.
- **The board needs a rule for `forecast: null`.** Either drop the weather, or keep the last forecast for a while, like the calendar's "stops answering" rule. That's a board decision, not answered here.
- **`null` alone won't reveal an outage.** An open board may keep the old forecast instead (section 7). The entity's own state turning `unavailable` within 15 minutes is the dependable signal, if the board ever wants to mark old weather.
- **Hand hourly to daily where the hourly list ends**, 23 to 24 hours out, not at a fixed 24 hours.

## Gaps

- Not checked on the live Home Assistant (out of bounds for this ticket): the house's location name, which sets the entity id, and real forecast output.
- Google doesn't document whether, between midnight and 7 a.m. local, the first daily entry is the forecast day that began the previous morning. If so, the first entry's local date is yesterday and the 10 entries reach one day less far. Keying by local date handles it either way; check once the entity exists.
- The HTTP status for a disabled-billing or disabled-API call to the Weather API is inferred as 403 from other Google APIs, not stated on a Weather API page.
- The exact name of the Weather API's per-day quota in the console isn't documented.
- The failure-mode behaviour in section 7 is read from code, not observed.
