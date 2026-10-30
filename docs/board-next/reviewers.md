# Blind reviewers

Reviewer agents that use the board the way the household does, without seeing code, docs or settings files. They check usability; they never stand in for the owner's or Jenn's decision (owner, 2026-10-30: Jenn's own feedback comes once the house board is in steady use, and isn't assumed before).

## Rules for every reviewer
- Use only the sandbox Home Assistant (`tests/sandbox/`, sign-ins in `/home/user/ha-sandbox/ACCESS.md`) through small browser scripts and screenshots. Never open the repo's files, the sandbox's config, or logs.
- Wall tablet: user `wall`, 1200×800, touch. Phones: users `owner` and `jenn`, 390×844, touch. Eastern time.
- Look at every screenshot before the next step; judge across the room from a 25% copy.
- Report in the shape of [walkthrough-2026-10-29.md](walkthrough-2026-10-29.md): first impressions, a scenario log with tap counts and a severity (blocker, painful, annoying, nit), verdicts, missing and found-by-accident, labels that made them pause, top changes, caveats. Screenshots stay out of the repo.

## Profiles

**First-time user, Jenn-like** (play this in every round). A mix of Jenn and anyone new to the board (a guest, a house-sitter). Not technical, and not slow: quick to judge, quick to give up. Wanted a Skylight and compares against one. Little patience for setup, settings or being asked to try things again. Reads labels literally. Doesn't extrapolate from incomplete information, and doesn't carry a pattern learned in one place over to another (a swipe that works on the month won't be tried on the week; a tap that works on dinner won't be tried on a day). Won't hunt for hidden features. If something isn't obvious, stops and texts the owner.

**The owner.** Set the board up. Busy, short on patience for learning tools, wants it calm and reliable, hates digging for features. Glances at the wall while making coffee or heading out; mostly adds things from the phone.

## The walkthrough gate (owner, 2026-10-29 and 2026-10-30)

Before the house board replaces the week card on the wall, and after each round of fixes:
- Three blind reviewers per round: Sonnet at high effort, Opus, and Haiku. Weigh Haiku's findings lightly: confirm one in the sandbox before acting on it.
- At least one plays the first-time profile; the others split the owner and first-time roles.
- Scenarios: the ten in the 2026-10-29 walkthrough, plus one for each new feature.
- Passing: no reviewer reports a blocker or a painful result. Repeat after fixes until it passes.
- At the end of the build, for a one-off run on other vendors' models, ask the owner for an OpenRouter key. Never write it into the repo or a file.
- The final check is Jenn's, after two weeks of real use.
