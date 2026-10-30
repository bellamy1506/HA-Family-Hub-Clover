# Who added it: what Home Assistant knows about the author of an event, note or list item

Research note, 2026-10-29. Question ([#42](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/42)): "New since you last looked" and "show the other person what you added" need to know who added or changed each event, note and list item, however it arrived (the board, Clover by voice, an iPhone's own calendar, Home Assistant's own pages). What does Home Assistant already record (the context's user id on service calls, the Activity log, the Local Calendar and Local To-do stores, CalDAV's fields), what does it miss, and what is the smallest thing this project would have to record itself?

Lines marked **[inference]** are my own judgement, not something a source or test states.

**Method.** Home Assistant core 2026.10.4 read from its installed source (the same files are on GitHub under tag [2026.10.4](https://github.com/home-assistant/core/tree/2026.10.4/homeassistant); paths below are relative to `homeassistant/`), its frontend 20260930.5 (compiled, searched for the calls each page makes), and Family Hub as on `house/board-next` (`301c8ee`). Tested in the local sandbox (made-up data, Home Assistant 2026.10.4, users Owner, Jenn and Wall): every path in section 3 was run as Jenn or Wall while a second connection watched the event bus, then the recorder's database (read only), the Activity log and the two stores were read, and every test entry was removed. Script context was checked in a separate, private Home Assistant started in-process from the same package (the sandbox has no scripts, and no Claude agent: its Assist test used Home Assistant's built-in agent). Nothing touched the house.

## The answer in short

Home Assistant knows who started a change only when the change arrives as a **service call** made by a signed-in person: the call carries a context with that person's user id, and scripts pass it on to the calls they make. That covers the board's own adds and to-do changes, Home Assistant's To-do page, and voice through "tell the board" (the phone's signed-in user). It doesn't know for Home Assistant's own Calendar page, Family Hub's own repeating-add, edit and delete commands, Assist's built-in list commands, or anything added in the iPhone's Calendar app. And where it does know, it keeps the name in no place the board can read per item: the stores hold no author, the Activity log says "Us notes changed to 4, by Jenn" without saying which note (and nothing at all for calendar changes), and the raw record sits in the recorder's database for 10 days with no API for it. So the board has to write down "who" itself, at the moment of the call.

## 1. What Home Assistant carries with each change: the context

- A context has three fields: `id`, `parent_id` and `user_id`, "Identifier of the user who started the change," `None` "if no user started it, for example, when an automation did" ([state object docs](https://www.home-assistant.io/docs/configuration/state_object/); `core.py`, `class Context`).
- **A websocket command gets the signed-in user:** `connection.context(msg)` returns `Context(user_id=self.user.id)` (`components/websocket_api/connection.py`). A command handler can also read `connection.user` directly.
- **A service call announces itself first.** `ServiceRegistry.async_call` fires a `call_service` event with the domain, the action, the action's data (for `todo.add_item`, the item's text; for `calendar.create_event`, the title and start) and the caller's context, then runs the handler (`core.py`). Bus listeners marked as callbacks run inside that fire, so before the handler (`core.py`, `_async_dispatch` via `async_run_hass_job`).
- **An entity borrows the caller's context for 5 seconds.** An entity action sets the entity's context to the call's (`helpers/service.py`, `entity.async_set_context(context)`); every state the entity writes in the next 5 s carries it (`helpers/entity.py`, `CONTEXT_RECENT_TIME_SECONDS = 5`). Tested consequence in section 3: a later change through a path that sets no context, even another person's, is stamped with the earlier caller's name.
- **Scripts keep the caller's context.** Calling `script.<name>` runs it with `service.context` (`components/script/__init__.py`, `_service_handler`), and its steps call actions with `context=self._context` (`helpers/script.py`). Checked in-process: a script called with a user's context fired its inner action's `call_service` with the same context id and user id.
- **Voice keeps the phone's user.** The Assist pipeline over the websocket runs with `connection.context(msg)` (`components/assist_pipeline/websocket_api.py`), and the REST conversation endpoint with the request's user (`components/conversation/http.py`). A language model's tool calls a script with `llm_context.context`, which is the conversation input's own context (`helpers/llm.py`, `ScriptTool`; `components/conversation/models.py`, `as_llm_context`). So "tell the board" from Jenn's iPhone reaches `script.board_add_note` and `todo.add_item` as Jenn, as long as that phone's Home Assistant app is signed in as Jenn (J006 sets Jenn up as her own non-admin user; not checked which user each app is signed in as).

## 2. What each place keeps

- **Local Calendar (the Us calendar).** One iCalendar file in `.storage`. The library adds `DTSTAMP`, `CREATED`, `SEQUENCE` and, on edits, `LAST-MODIFIED` (`ical/store.py`, ical 14.3.0), but no person; Home Assistant's event model hands out none of those times, only title, start, end, description, uid, repeat rule, recurrence id, place and status (`components/local_calendar/calendar.py`, `_get_calendar_event`). Creating an event returns nothing, so the caller never learns the new event's uid (`async_create_event`, and the `calendar/event/create` handler sends an empty result); the board's Undo already finds its new event by title and start for this reason ([card-map](../agents/card-map.md), `_answerEventAdded`).
- **Local To-do (Us notes, meals, house reminders).** The same kind of file and the same timestamps, unseen by Home Assistant: a to-do item has only summary, uid, status, due, description and completed (`components/todo/entity.py`, `TodoItem`; `components/local_todo/todo.py`). `todo.add_item` returns no uid either.
- **CalDAV (the iCloud calendars).** Home Assistant copies eight fields from each event: summary, start, end, location, description, uid, recurrence id, status ([`components/caldav/coordinator.py`](https://github.com/home-assistant/core/blob/2026.10.4/homeassistant/components/caldav/coordinator.py)). Whatever iCloud stores about who made an event never reaches Home Assistant. For what it's worth, iCloud's standard CalDAV data names a person only as the `ORGANIZER` of an invitation; a personal event has no creator ([Nylas, a calendar-API vendor, "Identifying Event Creators", updated about six months before 2026-10-29](https://support.nylas.com/hc/en-us/articles/35406964185373-Identifying-Event-Creators-Across-Google-Microsoft-and-iCloud), opened with Firecrawl because it refused WebFetch). Apple does tell people on a shared iCloud calendar when it changes ("you may receive email whenever the shared calendar is updated," [Share iCloud calendars on Mac](https://support.apple.com/en-mk/guide/calendar/icl32362/16.0/mac/26)), so iCloud knows, but keeps that to its own apps.
- **The recorder (history database).** Every `call_service` event, with its data and the caller's user id, and every state change with its context, kept for `purge_keep_days`, 10 by default ([recorder docs](https://www.home-assistant.io/integrations/recorder/); the house's setting isn't recorded). The schema is internal and no websocket command returns raw events to the board.
- **The Activity log** (called Logbook before 2026.7; `components/logbook/manifest.json` names it "Activity"). It lists state changes and names who caused them, but skips `call_service` rows themselves (`components/logbook/processor.py`). A to-do list's state is its count of open items (`components/todo/entity.py`, `state`), so an add or a tick shows as "Us notes changed to 4, triggered by action To-do: Add item, by Jenn," never which item; a rename shows nothing. A calendar's state is only on or off (an event happening now), with the next event in its attributes (`components/calendar/__init__.py`), and Activity lists only changes of the state itself, not attribute-only ones (`components/logbook/queries/common.py`, `last_updated_ts == last_changed_ts`), so adding, moving or deleting an event shows nothing unless it flips the calendar on or off. Non-admins can read it (Jenn's query returned the same rows).
- **Home Assistant's own to-do triggers** ("item added", "item completed", "item removed") work by diffing the list's item uids on each update (`components/todo/trigger.py`, `ItemChangeTriggerBase`): they say which item, not who.

## 3. What the sandbox showed

Each row was done as Jenn unless marked; "bus" is what a watcher saw on the event bus; "Activity" is `logbook/get_events` for the same minutes.

| Path tried | How it writes | User on the bus | Activity log |
|---|---|---|---|
| A. Add a note (the board's add, Home Assistant's To-do page) | `todo.add_item` service | Jenn, on the call and on the count change | "changed to 4", Jenn, To-do: Add item |
| B. Rename the note | `todo.update_item` | Jenn, on the call only | nothing (count unchanged) |
| H. Tick the note done | `todo.update_item` | Jenn | "changed to 4", Jenn |
| C. Add a one-off Us event 7 weeks out (the board's add) | `calendar.create_event` service | Jenn, on the call only | nothing |
| C'. The same, for an event 25 minutes away (it becomes the calendar's next event) | same | Jenn, also on the calendar's state change | nothing (state stayed off) |
| D, I. Add, edit, delete an Us event (Home Assistant's Calendar page) | `calendar/event/create`, `update`, `delete` websocket | nothing at all | nothing |
| I'. Add an event 12 minutes away that way, more than 5 s after any call | `calendar/event/create` | no user on the state change | nothing |
| The same within 5 s of Jenn's service call, and the owner's deletes right after | `calendar/event/create`, `delete` | **Jenn**, on every state change, the owner's too | nothing |
| E. Add a repeating Us event; edit; delete (the board's own commands; edit and delete as Owner, since the sandbox's Jenn lacks Family Hub's edit permission) | `family_hub/calendar/create_event`, `update_event`, `delete_event` | nothing at all | nothing |
| F. "Add … to my shopping list" through Assist (built-in list command) | `HassListAddItem` intent, calls the list directly | no user on the count change | "changed to 8", no one |
| G. Add a note as Wall (the tablet's sign-in) | `todo.add_item` | Wall | "changed to 5", Wall |

Read from the stores afterwards: each test item in the `.ics` files had `UID`, `DTSTAMP`, `CREATED`, `SEQUENCE`, and `LAST-MODIFIED` once edited, and no person. The recorder's database held the five `call_service` rows (A, B, C, G, H) with item text and user; D, E and F left no trace of who.

Family Hub's own commands call the calendar entity directly, as the code says (`custom_components/family_hub/__init__.py`, `_ws_create_calendar_event` and the update and delete handlers), so nothing goes on the bus; the handler does know `connection.user`. Assist's list commands do the same: `ListAddItemIntentHandler` calls `async_create_todo_item` with no context (`components/todo/intent.py`); so do complete and remove.

## 4. Each way in, at the house

| Way in | What it is underneath | Can Home Assistant tell who? |
|---|---|---|
| The board, phone copies: one-off event, notes, meals, lists | `calendar.create_event`, `todo.*` services (`family-week-calendar-card.js`) | Yes: the phone's user |
| The board: repeating event, any event edit or delete | Family Hub's websocket commands | No, but Family Hub's handler can (`connection.user`) |
| The wall copy, any of the above | the same, signed in as Clover | Only "Clover": not which adult was at the wall |
| "Tell the board" by voice (notes, events, meals) | Assist on the phone, Claude, `script.board_add_*` | Yes: the phone app's user (section 1) |
| Voice that uses a built-in list command (groceries; any "tick X off") | `HassListAddItem`, `HassListCompleteItem`, `HassListRemoveItem` | No. Groceries probably go this way: J006 lists no grocery script **[inference]** |
| Home Assistant's To-do page | `todo.*` services (reordering is a websocket command) | Yes |
| Home Assistant's Calendar page | `calendar/event/*` websocket | No; within 5 s of another call, wrongly that caller |
| The iPhone's Calendar app (Will's, Home, Work in iCloud) | CalDAV, outside Home Assistant; it polls | No |
| Family Hub's own rollover of unfinished notes, automations | `todo.update_item` with no user (`__init__.py`, the rollover helper) | No user, correctly: no person did it |
| Claude through the Home Assistant connector, a future email or reminders sync | service calls as their own service user | Yes, as that service user, not as a person **[inference]** |

## 5. Ways to fill the gap, weighed

- **A. Read the recorder.** It already has who and what for every service call, for 10 days. No: internal schema, no API, purged, and blind to the same paths as everything else.
- **B. Read Activity.** No: it names the user but not the item, and misses renames and calendar changes.
- **C. Write the author into the item** (a hidden mark in the description, like the rollover mark). No: only cooperating writers add it, so it covers no more than D; a mark in an iCloud event's notes shows as text on both iPhones; and it rewrites the household's data.
- **D. Record it in Family Hub, at the call.** A listener on the bus for the to-do and calendar service calls, plus one line in Family Hub's own commands. Covers every path that has a user at all, needs no change to the voice scripts, and touches no item. **Chosen.**
- **E. Record it in the card only.** No: misses voice, which is the main way in (mission, "Capture is the product").

## 6. Recommendation

**Record one small "last touched by" note per item in Family Hub's backend, at the moment of the call, and treat everything else as "not known."**

1. **What:** for each item a person adds or changes, `{by: Home Assistant user id, at: time, kind: added | changed}`, in one Family Hub store like its other side stores. Keyed the way the board already names things: a to-do item by list and uid; an event by Family Hub's existing `calendar|start|summary` key (`_event_override_key`), because creating an event returns no uid and `calendar.get_events` has none. Kept two weeks, then pruned **[inference]**; the dot needs a day or two.
2. **Written by:**
   - a bus listener on `call_service` for `todo.add_item`, `todo.update_item`, `todo.remove_item` and `calendar.create_event`, taking the user from the call's context, the list and text or title and start from the call's data. An update names its item by uid or by text, resolved before the handler runs (section 1). An add learns its new uid from the list's own update hook (`async_subscribe_updates`), by the same uid diff Home Assistant's "item added" trigger uses;
   - Family Hub's create, update and delete event commands, from `connection.user.id`.
3. **Not from state changes.** The 5-second borrowed context (section 3) would put Jenn's name on the owner's delete.
4. **Only calls with a user.** No user means a machine did it (the rollover, automations); recording it would mark every rolled-over note as changed each morning.
5. **Read** through one Family Hub websocket command, or alongside a payload the board already fetches; the build ticket picks.

**What it can't know, and what the board should assume:**

- **iPhone Calendar adds** (iCloud): nobody. For a calendar that is one person's column (Will's, Work), that person; for Home, not known **[inference]**.
- **The wall:** "Clover," not which adult. The capture rules forbid asking at capture ([capture-friction.md](capture-friction.md), section 9), so the dot ticket decides how a wall add counts on the phones.
- **Assist's built-in list commands** (likely groceries) and **Home Assistant's Calendar page**: not known. Routing voice groceries through a small script, as notes already are, would carry the user; that's a Home Assistant change for the owner to approve, worth it only if the shopping list gets dots **[inference]**. The Calendar page is a rare path and gets this note only.
- **Service users** (Claude through the connector, a future sync): named as that user; the board can show them as "the house" **[inference]**.

**Cost to own** **[inference]**: about 80 to 120 lines of Python in the backend (the listener, the store and its pruning, one read command, three one-line hooks) and their tests; nothing in the voice scripts or Home Assistant's configuration. It depends on two Home Assistant behaviours that have been stable for years (the `call_service` event and the context's `user_id`) and one newer one (`async_subscribe_updates` on to-do lists, which Home Assistant's own to-do triggers rely on).

This is a technical call, made here; the owner can veto. The one thing the household would notice: a dot or a name can never say which adult added something at the wall.

## Gaps

- **Not checked on the house:** which Home Assistant user each phone's app is signed in as (assumed Jenn's is Jenn); whether Claude adds groceries with `HassListAddItem` (inferred from J006's list of four scripts); the recorder's retention (assumed the default 10 days); whether the iCloud Home calendar is shared with Jenn.
- **Voice was traced through source,** plus an in-process check that a script passes its caller's user on; the sandbox has no voice scripts, phones or Claude agent, so the whole chain from Siri to the to-do list wasn't run end to end.
- **iCloud's own event data wasn't inspected** (no iCloud account here), and Apple's CalendarServer source wasn't read for creator properties; it doesn't matter while Home Assistant copies only eight fields, but a future direct CalDAV reader might find one.
- **Two adds to the same list in the same instant** from different people could swap names in the uid pairing. Rare in a two-adult house; a note, no more effort.
- **The board's "since you last looked" memory** (per device, per person, or per sign-in) is the dot ticket's question; this note covers only who.
