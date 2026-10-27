# Domain docs

How agents should read this repo's domain documentation before working. Layout: **single context**.

## Before exploring, read these

- **[CONTEXT.md](../../CONTEXT.md)**: this repo's vocabulary. Use its terms; avoid the synonyms it lists.
- **[CLAUDE.md](../../CLAUDE.md)**: the upstream policy and the owner's rules for this fork.
- **[J008](https://github.com/bellamy1506/House-Modeling/blob/main/records/projects/J008-family-hub.md)** in the house repo: the plan and the owner's decisions. A dated "(owner, YYYY-MM-DD)" decision there plays the role of an ADR.
- **[card-map.md](card-map.md)**: the map of the week calendar card for agents: where things are, house changes, storage, tests.
- **[PROJECT_CONTEXT.md](../../PROJECT_CONTEXT.md)** and **[DOCUMENTATION.md](../../DOCUMENTATION.md)**: upstream's description of the code.

There is no `docs/adr/` yet. Create it only for a decision about this fork's code that J008 doesn't hold.

## Use the vocabulary

When output names a concept (an issue title, a commit subject, a proposal), use the term as CONTEXT.md defines it. If a needed concept is missing, add it to CONTEXT.md in the same change.

## Flag conflicts

If output contradicts a dated owner decision in J008 or CLAUDE.md, say so explicitly rather than overriding it.
