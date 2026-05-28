# MemoryWeave × Coral — Integration Plan

## Branch
`Coral-integration` — hackathon work for **Pirates of the Coral-bean** without destabilizing `main` (live Vercel + Render demo).

## Hackathon context
- **Event:** Pirates of the Coral-bean (WeMakeDevs × Coral)
- **Product:** [Coral](https://withcoral.com) — local-first SQL over APIs, files, and databases; MCP for agents
- **Goal:** Treat operational sources as queryable tables; answer cross-source questions with **one SQL join**, not many bespoke API tools
- **Tracks:** Enterprise Agent (org “smart crew”) · Personal Agent — MemoryWeave fits **Enterprise**

## Why Coral integration is useful for MemoryWeave

### Problem we already solve
MemoryWeave preserves **organizational memory**: who owns what, how incidents were resolved, bus-factor risk when key people leave (Acme Corp / **A. Patel** narrative).

Today we answer that with:
- **Neo4j** — knowledge graph (people, systems, workflows, incidents)
- **ChromaDB** — semantic search over ingested text
- **Custom Python retriever** — glue between stores + Fireworks LLM on `POST /query`

### What Coral adds (judging narrative)
| Without Coral | With Coral |
|---------------|------------|
| Custom retriever + multiple services per question | **One SQL interface** over Slack, incidents, GitHub, graph exports |
| Hard to demo a **single join** across sources | Judges see: `SELECT … FROM slack_messages JOIN incidents …` |
| “We built integrations” | “We use Coral as the **read layer**; MemoryWeave is the **memory product** on top” |
| MCP/tool sprawl story is weak | Coral **MCP server** = first-class agent tool |

### Strategic fit (winnable angle)
**MemoryWeave + Coral** = *organizational memory product* powered by *Coral SQL* for cross-source operational intelligence.

Demo line:
> *"What breaks when Patel doesn't come in Monday?"* → Coral SQL joins **people**, **incidents**, and **Slack** evidence → Neo4j risk + LLM synthesis → structured answer with warnings.

This matches hackathon examples (Coding Agent Debugger: GitHub + Sentry + Slack in one query).

### What we are **not** doing
- Replacing Neo4j graph UI — the SVG graph stays the visual differentiator
- Throwing away the working Render/Vercel deploy on `main` without a plan
- Claiming Coral replaces all ingestion — Fireworks pipeline can remain for graph writes

## Intended architecture (target)

```
Sources (demo JSON, optional live APIs)
  → Coral sources (spec files)
  → Coral SQL (CLI or MCP)
       ↓
  Assistant /query path: Coral context + Neo4j graph context → Fireworks LLM
       ↓
  React UI (unchanged design system)

Neo4j Aura — still source of truth for /graph, /risk-report, seed demo
Chroma — optional; Coral may reduce reliance on Chroma for cross-source reads in demo
```

## Planned integration surface (for upcoming prompts)

1. **Coral sources** — `coral/` or `backend/coral/sources/` mapping:
   - `backend/data/demo/messages.json` (Slack)
   - `backend/data/demo/incidents/*.md`
   - Optional: Neo4j export or static JSON mirror for graph entities
2. **Query path** — extend `POST /query` (or parallel `/query/coral`) to:
   - Run Coral SQL (generated or template) for semantic/tabular context
   - Keep Neo4j `hybrid_retrieve` graph + risk context
   - Merge → existing Fireworks structured JSON response
3. **Demo SQL** — one visible cross-source query for judges (Patel + payment + P-4021)
4. **README / submission** — dual narrative: live product URLs + Coral as core read technology
5. **Local-first** — Coral runs locally per hackathon rules; production Render may stay Neo4j-first until optional Coral sidecar is documented

## Rules & constraints (hackathon)
- Star [withcoral/coral](https://github.com/withcoral/coral) repo + join Coral Discord (manual)
- Coral runs **local-first** — document how judges reproduce SQL demo
- Check eligibility: fresh build vs fork — this branch extends MemoryWeave; confirm current rules before final submit
- Advanced scoring: MCP integration, schema learning, caching — aim for at least MCP or documented SQL sources

## Repo conventions (`.cursorrules`)
- All API calls remain in `frontend/src/services/api.js`
- No new Zustand stores; extend `appStore.js` if needed
- Design tokens / DM Sans / no new graph libraries
- Update `docs/PROJECT_STATUS.md` and `docs/FIXES_AND_LEARNINGS.md` as Coral work lands
- File headers + comments on new modules

## Status on this branch
| Item | Status |
|------|--------|
| Branch `Coral-integration` | Created |
| Coral installed / sources defined | Not started |
| `/query` Coral path | Not started |
| MCP wiring | Not started |
| Submission README section | Not started |

## References
- Coral: https://withcoral.com · https://github.com/withcoral/coral
- Deployed MemoryWeave: see root `README.md`
- Production deploy: `docs/DEPLOY.md`
