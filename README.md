<div align="center">

![ReadmeEngine](images/hero.svg)

### Drift-aware README generator for the monorepo

![Status](https://img.shields.io/badge/Status-active-brightgreen)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Bun](https://img.shields.io/badge/Bun-Runtime-f9f1e1?logo=bun&logoColor=000)](https://bun.sh/)

</div>

---

## 📑 Table of Contents

- [✨ Features](#-features)
- [🏗 Architecture](#-architecture)
- [🛠 Tech Stack](#-tech-stack)
- [🚀 Getting Started](#-getting-started)
- [🚀 Usage](#-usage)
- [💻 Development](#-development)
- [📂 Project Structure](#-project-structure)
- [🤝 Contributing](#-contributing)
- [📄 License](#-license)

---

## ✨ Features

| Feature | Description |
|---------|-------------|
| **Three commands: generate / detect / update** | `generate` builds README.md from knowledge sources; `detect` reports drift as a console table + JSON; `update` is drift-aware and only re-generates when stale/unknown sections exist (no-op otherwise). |
| **Four target scopes** | `--target root` (monorepo README), `system:<name>` (one system, resolved by name or path basename), `app:<name>` (one app under apps/), and `all` (root + every system + every app). |
| **System collector** | Reads systems.yaml plus each system's knowledge/index.md (## Summary) or domain.md fallback and package.json to build name, description, status, stages, task/input/output types, domain tags, and entry point. |
| **Graph collector** | Parses knowledge/graph.yaml for dependency topology + relationships, and graphify-out/GRAPH_REPORT.md for god nodes and communities, feeding the root architecture/dependency section. |
| **Library collector** | Reads library.yaml and returns skill / agent / command counts plus the top 10 skills and agents for the root README's Library catalog. |
| **Code collector** | Collects entry_point values from systems.yaml and walks systems/*/src to a depth of 3 to build source trees and directory lists. |
| **App collector** | Scans apps/*/package.json and builds a 2-level source tree per app (apps are out of scope for this rewrite but the collector still runs under `--target all`). |
| **Drift detection with SHA-256 fingerprints** | Per section, hashes each knowledge source file (Bun CryptoHasher) and combines them into a composite hash stored in .fingerprints.json; compares stored vs current to mark each section current / stale / unknown. |
| **Drift report** | Prints a per-section report with ✅ current, ⚠️ stale, ❓ unknown icons plus actionable recommendations, and (for `detect`) emits the full report as JSON to stdout. |
| **Markdown renderers** | Composable renderers for badges, table of contents, tech-stack detection, project-structure trees, API reference (parses Hono routes under */routes/*), mermaid/dependency graphs, changelog, and GIF demo references. |
| **SVG asset generation** | Generates and writes SVG art into the scope's images/ dir before the README so references resolve: hero.svg always, pipeline.svg when the system declares stages, and platform-overview.svg for the root scope. |
| **Graceful degradation** | Every collector wraps file reads in try/catch and warns instead of failing, so a missing systems.yaml / graph.yaml / library.yaml / knowledge file degrades the affected section rather than aborting generation. |

---

## 🏗 Architecture

![Pipeline](images/pipeline.svg)

ReadmeEngine processes data through a multi-stage pipeline.

---

## 🛠 Tech Stack

### Backend

| Technology | Purpose |
|------------|---------|
| **TypeScript 5.7** | Type safety |
| **Bun** | JavaScript runtime & package manager |
| **js-yaml 4** | YAML parsing |

---

## 🚀 Getting Started

### Prerequisites

- [**Bun**](https://bun.sh/) v1.0+ — `curl -fsSL https://bun.sh/install | bash` (verified with bun 1.3.6)
- [**just**](https://github.com/casey/just) (optional) — runs the justfile recipes (dev / test / build / lint / check)
- Run from within the Adcelerate monorepo — the engine resolves the repo root as `../../..` relative to its own src/ and reads systems.yaml, library.yaml, and knowledge/graph.yaml from there.

### Install

```bash
cd systems/readme-engine
bun install
```

---

## 🚀 Usage

### 1. List commands, scopes, and examples

```bash
bun run src/cli.ts --help
```

> **Expected:** Prints the ReadmeEngine usage banner: commands (generate|detect|update) and targets (root|system:<name>|app:<name>|all). VERIFIED.

### 2. Detect drift for the root README

```bash
bun run src/cli.ts detect --target root
```

> **Expected:** Prints a drift report (overview/architecture/systems/library/graph/apps) with ✅/⚠️/❓ icons + recommendations, then the same report as JSON. VERIFIED — reported `overview` and `library` stale (library.yaml had local edits).

### 3. Detect drift for a single system

```bash
bun run src/cli.ts detect --target system:readme-engine
```

> **Expected:** Reports the per-system sections (knowledge, config, graph) as current/stale/unknown. VERIFIED — all three current immediately after a generate.

### 4. Generate a system README

```bash
bun run src/cli.ts generate --target system:readme-engine
```

> **Expected:** Writes systems/readme-engine/README.md, regenerates images/hero.svg + images/pipeline.svg, and saves 3 drift fingerprints. VERIFIED — '11 sections, 3701 chars'. (Overwriting the system's own README is the expected workflow.)

### 5. Generate the root README

```bash
bun run src/cli.ts generate --target root
```

> **Expected:** Collects systems + graph + library + code, writes /README.md plus images/hero.svg and images/platform-overview.svg. Not executed during recon — overwrites the root README owned by the regeneration task; behavior confirmed by reading generate.ts.

### 6. Drift-aware selective update

```bash
bun run src/cli.ts update --target system:readme-engine
```

> **Expected:** Runs drift detection; if all sections are current it prints 'no update needed' and leaves the file untouched, otherwise it re-generates the full README. Behavior confirmed by reading update.ts.

### 7. Generate everything in one pass

```bash
bun run src/cli.ts generate --target all
```

> **Expected:** Generates root + every registered system + every app README. Not executed during recon — also rewrites out-of-scope apps/* READMEs; behavior confirmed by reading generate.ts (generateAll).

### Command Reference

| Command | Description |
|---------|-------------|
| `bun run src/cli.ts --help` | Print usage: commands and target scopes. |
| `bun run src/cli.ts generate --target <root\|system:NAME\|app:NAME\|all>` | Generate README.md (and SVG assets) for the target scope and save drift fingerprints. |
| `bun run src/cli.ts detect --target <root\|system:NAME\|app:NAME\|all>` | Detect drift between knowledge sources and existing READMEs; prints a report + JSON. |
| `bun run src/cli.ts update --target <root\|system:NAME\|app:NAME\|all>` | Re-generate only when drift is detected; otherwise leave the README unchanged. |
| `bun run dev` | Watch-mode run of src/index.ts (package.json script; also `just dev`). |
| `bun run build` | Bundle src/index.ts to dist/ targeting Bun (package.json script; also `just build`). |
| `bun test` | Run the test suite (package.json script; also `just test`). |
| `bun run lint` | Lint with Biome (`bunx @biomejs/biome check .`; also `just lint`). |
| `bun run check` | Biome check + autofix formatting (`bunx @biomejs/biome check --write .`; also `just check`). |

---

## 💻 Development

| Command | Description |
|---------|-------------|
| `bun run dev` | Start development mode |
| `bun run build` | Build for production |
| `bun test` | Run tests |
| `bun run lint` | Check code quality |

---

## 📂 Project Structure

```
readme-engine/
├── README.md
├── biome.json
├── images
│   ├── hero.svg
│   └── pipeline.svg
├── justfile
├── knowledge
│   ├── acceptance-criteria.md
│   ├── dependencies.md
│   ├── domain.md
│   ├── history.md
│   └── index.md
├── package.json
├── src
│   ├── cli.ts
│   ├── collectors
│   │   ├── app-collector.ts
│   │   ├── code-collector.ts
│   │   ├── graph-collector.ts
│   │   ├── index.ts
│   │   ├── library-collector.ts
│   │   └── system-collector.ts
│   ├── drift
│   │   ├── detector.ts
│   │   ├── fingerprint.ts
│   │   ├── index.ts
│   │   └── report.ts
│   ├── generate.ts
│   ├── index.ts
│   ├── renderers
│   │   ├── api-reference.ts
│   │   ├── architecture.ts
│   │   ├── badges.ts
│   │   ├── changelog.ts
│   │   ├── gif-references.ts
│   │   ├── index.ts
│   │   ├── mermaid.ts
│   │   ├── project-structure.ts
│   │   ├── tech-stack.ts
│   │   └── toc.ts
│   ├── svg-writer.ts
│   ├── templates
│   │   ├── app-readme.ts
│   │   ├── index.ts
│   │   ├── root-readme.ts
│   │   ├── shared-sections.ts
│   │   └── system-readme.ts
│   ├── types.ts
│   └── update.ts
└── tsconfig.json
```

---

## 🤝 Contributing

Contributions are welcome! Here's how to get started:

1. Fork the repository
2. Create a feature branch: `git checkout -b feat/my-feature`
3. Make your changes and ensure tests pass
4. Commit your changes and open a pull request

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).

---

<div align="center">

**Built with** 🧡 **using Bun, TypeScript**

</div>
