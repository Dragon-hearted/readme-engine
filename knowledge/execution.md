---
system: "readme-engine"
type: execution
driver: cli
entry: "bun run src/cli.ts generate --target <root|system:NAME|app:NAME|all>  # detect/update share the same --target"
mode: orchestrate
gates: executor
version: 1
lastUpdated: "2026-06-04"
lastUpdatedBy: build-mode
---

# Execution — ReadmeEngine

How Execute Mode (`/adcelerate-execute`) runs this system. Execute Mode reads ONLY this manifest to decide how to run, then branches on `driver`.

## Invocation
Run the CLI from the monorepo root. `--target` is required (`root`, `system:<name>`, `app:<name>`, or `all`). The three stages run within a single `generate`/`update` invocation.

```
bun run src/cli.ts detect   --target <scope>   # drift report (no writes)
bun run src/cli.ts generate --target <scope>   # full collection → rendering → assembly
bun run src/cli.ts update   --target <scope>   # re-render only if stale
```

## Natural flow (awareness only — the system drives this on the skill path)
1. **collection** — aggregate knowledge for the target scope from systems.yaml, graph.yaml, library.yaml, package manifests, code, and git state.
2. **rendering** — generate the markdown sections (badges, TOC, tech stack, structure, tables, SVG diagrams).
3. **assembly** — assemble the sections into the README(s), write to disk, and save `.fingerprints.json` for drift tracking.

## Where the agent must check / supply input
- **collection** — supply the **`--target` scope** (required): `root`, `system:<name>`, `app:<name>`, or `all`.
- **rendering / assembly** — automated; first run **`detect`** and review the **drift report** (✅ current / ⚠️ stale / ❓ unknown) before deciding whether to `generate`/`update` and overwrite README(s).

## Validation
After execution, validate the output against [acceptance-criteria.md](acceptance-criteria.md) (hard gates inline, soft criteria via the validator). Applies to both drivers.
