# Board next: mission

Branch `house/board-next`, started 2026-10-29. This file is the anchor for every session and loop that works on this branch. Read it first, and keep it short enough to reread. Decisions still live in the house repo's [J008](https://github.com/bellamy1506/House-Modeling/blob/main/records/projects/J008-family-hub.md); this file holds the direction those decisions serve.

## What the owner asked (2026-10-29)

Find avenues to grow the board without bloat, kept intuitive and enjoyable "in the spirit of Apple, not bound by its rules where they constrain without purpose." Look across the whole field of Skylight-like family calendars and wall tablets, open the research avenues the owner isn't naming, and have a fresh reviewer use the board the way the owner or Jenn would, without seeing the code. The owner allowed more divergence from upstream Family Hub than before. In the owner's words, the bar: obligations we don't enjoy still need to get onto the calendar, so adding them should be easy and, if not fun, comfortable; friction minimized; confusion avoided without tutorials; nothing worth having should need digging for.

## The goal behind the goal

**The household runs on one shared picture of what's coming and what's needed, and neither adult has to carry it in their head or tend the system that holds it.**

The board is the visible half of that. The other half is getting things into it. Every family calendar dies the same way: adding things is a chore, so it goes incomplete; once incomplete it can't be trusted; untrusted, nobody looks; unseen, nobody adds. The work on this branch is to run that loop the other way:

> effortless capture → complete → trusted → glanced at → worth adding to

So the root measure is not features. It is: **is the board the place both of you trust and use without thinking about it, at no ongoing cost to the owner?**

Three facts sharpen that:

1. **Jenn wanted a Skylight; the owner wanted control** (J008, Q1). The board has to beat that Skylight on Jenn's terms (simple, pretty, it just works) while keeping what the owner chose it for (no subscription, no lock-in, local, the owner's to shape). If Jenn wouldn't pick it over a Skylight, it isn't done.
2. **The owner must not become the household's IT department.** A system only one person can operate moves the mental load onto that person. Jenn adding, changing and clearing things alone, without asking how, is the test.
3. **Most obligations appear away from the wall:** in a text, an email, a phone call, a school or vet flyer, a conversation in the car. The wall is where the picture is seen; capture has to work from wherever the obligation shows up, in seconds, and feel like relief ("it's handled") rather than homework.

## What success looks like

Observable, not aspirational:

- **Capture:** anything can get onto the board in under about 10 seconds from a phone, by voice, or by forwarding the email or photo it arrived in, and a rough entry ("dentist tue 3") is accepted and tidied, not rejected.
- **Trust:** what's on the board matches the phones within a minute; nothing appears twice, nothing vanishes, and a mistake is one tap to undo.
- **At rest:** with no touch, the board answers *what's now, what's next, is there anything I need to do or bring*. From across the room it has to be structurally clear, not readable: you can see that things are coming up, and roughly when and whose, before you can read them (owner, 2026-10-30). Reading and detail wait for someone to come closer.
- **No manual:** a first-time user (Jenn, a guest, a house-sitter) can do every common thing without being told how, and finds less-common things at the moment they need them.
- **Comfort:** using it feels calm and a little warm. Small, earned moments of pleasure, never nagging, never a game.
- **Floor:** it keeps working through reboots, updates and months of neglect. Each addition costs the owner no recurring attention, or it doesn't ship.

## Principles for this branch

1. **Capture is the product.** Weight work by how much it shortens the trip from "this came up" to "it's on the board."
2. **Calm at rest, rich on approach.** The resting board shows little, in large type; touch or nearness reveals more. Nothing animates for attention unless something needs attention.
3. **Self-evident over explained.** Visible affordances over hidden gestures; the capability appears where and when it's needed (empty states, contextual offers); undo instead of "are you sure?"
4. **Two equal adults.** No feature that only the owner can use or maintain. Jenn's phone and Jenn's habits are first-class.
5. **Less, better.** A feature earns its place by removing a step or a worry. Prefer removing, defaulting and hiding over adding settings. Kid features, rewards, gamification and photo-frame modes stay out.
6. **Push, sparingly.** The system brings what matters to you (the house rule), as rarely as defensible (owner, 2026-10-06).
7. **Durable floor.** Configuration before code; Home Assistant's own pieces before custom ones; every line of house code is weighed against what it costs to keep working.

## Own project (owner, 2026-10-29)

The owner decided this becomes the house's own project: upstream Family Hub is a source of ideas, not of merges. In the owner's words, upstream "wasn't exactly long-development or feature complete," and "we can do better if we put our hearts and souls into it." The numbers agree: upstream's first release was 2026-08-29, it has one maintainer and no tests, and in the four days after the fork point it rewrote about 23,000 lines of the week card (14,061 added, 9,072 removed), so merging it was already impractical.

What that means:
- **No more upstream merges.** Upstream releases are read for ideas; anything worth having is rebuilt or ported here with tests. The license stays GPL-3.0 (this is a derivative work) and the repo stays public.
- **Merge cost is no longer the brake; ownership cost is.** Every line this repo keeps is a line future sessions must keep working, so size, tests and readability matter more now, not less. Code the house doesn't use (chores, rewards, goals, routines, recipe box, pantry, timers) can be removed when that makes the rest simpler.
- **The board may be rebuilt.** A house-owned board replacing the week card is an open path, not a last resort. Upstream's backend and admin panel stay as the base until something better replaces each piece.
- **How much to rebuild, and in what order,** is the synthesis's main question.

Tiers, as a cost ladder:

1. **Settings and Home Assistant configuration** (no code).
2. **Changes inside the existing cards**, as the fork has made so far.
3. **New house-owned cards beside the existing ones** (for example a resting view or a capture sheet).
4. **A house-owned board** replacing the week card on the wall and the phones, reading the same calendars, lists and Family Hub storage.

A move up a tier needs a reason this file's measures can see (capture time, trust, calm, no-manual, floor) and an estimate of what it costs to own.

## What's already built or decided (don't redesign beside it)

- Installed: Family Hub at fork `32c486e` with the owner's 2026-10-29 picks; the Clover Tablet's own settings (Week, 4 days from today, timeline, Liquid Glass Tablet theme). J008 has the details.
- Capture that exists: "Hey Siri, tell the board / ask the board" through Assist with the `board_add_event`, `board_add_note`, `board_set_meal` scripts; the email bot in the house repo; iCloud calendars writable from the board (create only).
- Planned, not built: the Clover Tablet watchdog; Kiosk Mode for the tablet login (J008 build step 6); the house reminders two-way sync (J008 build step 4); Jenn's calendar. (Both board Shortcuts already work on Jenn's iPhone, J006 2026-10-29.)
- Open: fork issue [#31](https://github.com/bellamy1506/HA-Family-Hub-Clover/issues/31) (meal slots, per-column icons in place of "W", the first-hour label, timeline and Agenda text, Split wrapping, a more premium now line, the sidebar and dashboard switching, a DST bug inherited from upstream).

## The work on this branch, in order

1. **Research** (2026-10-29): the field of family calendars and wall displays, plus four lenses the owner didn't name. Files in [docs/research/](../research/); index in [research-index.md](research-index.md).
2. **Fresh-eyes walkthrough** (2026-10-29): a reviewer that has never seen the code uses the board in a local Home Assistant sandbox with made-up data, as the owner and as Jenn. Report in this folder.
3. **Synthesis:** one ranked list of development avenues, each tied to a measure above, its tier, and what it costs to build and own. The owner picks; picks become issues.
4. **Build:** small tested PRs into this branch; the owner approves anything that reaches `main`, as always.

## Rules that still hold

The fork's [CLAUDE.md](../../CLAUDE.md) and the house repo's rules: explain any Home Assistant change before making it; the lock-in check; Eastern time; plain-word commit subjects; the repo is public, so no real board screenshots or event data; tests for every behavior change (`bash tests/run_all.sh`).
