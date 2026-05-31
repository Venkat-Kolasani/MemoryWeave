# Publishing Captain's Log articles (Medium + Hashnode)

Three drafts live in this folder:

| File | Use for |
|------|---------|
| `captains-log-memoryweave-coral.md` | Master copy (edit here first) |
| `medium-captains-log-memoryweave-coral.md` | Paste into Medium (slightly tighter) |
| `hashnode-captains-log-memoryweave-coral.md` | Hashnode (includes YAML frontmatter) |

## Before you publish

1. Add **2–4 screenshots** (you must capture these — not in repo):
   - Reports → Live Cross-Source SQL card with preview table
   - Settings → Coral Live + registered tables
   - Assistant → answer with `coral_sql` footer expanded
   - Optional: architecture diagram (draw.io / Excalidraw)

2. Replace or set Hashnode `coverImageURL` in frontmatter if you upload a cover.

3. Warm production before screenshots: open `/reports` once, wait for data.

## Medium

1. [medium.com/new-story](https://medium.com/new-story)
2. Title: **How I Built an Organizational Memory Agent with Coral SQL, Cursor, and a Bus-Factor Story**
3. Paste body from `medium-captains-log-memoryweave-coral.md` (Medium uses its own formatting — paste markdown or use import).
4. Add screenshots after relevant sections.
5. Tags: `Artificial Intelligence`, `Software Engineering`, `Open Source`, `Hackathon`, `SQL`
6. Publish → **Unlisted** or **Public** (hackathon needs a shareable link).
7. Copy URL into `docs/CORAL-DEMO-SCRIPT.md` and hackathon form.

**Canonical:** Medium can be canonical; set Hashnode `canonical_url` to Medium URL if you publish Medium first.

## Hashnode

1. [hashnode.com](https://hashnode.com) → Write article
2. Switch to **Markdown** mode.
3. Paste entire `hashnode-captains-log-memoryweave-coral.md` (frontmatter may auto-map on import; otherwise set title/tags in UI).
4. Publication: your blog (e.g. `yourname.hashnode.dev`)
5. Add same screenshots.
6. Publish and copy URL for hackathon “Captain's Log” field.

**Tip:** If Hashnode strips frontmatter, set title/slug/tags manually to match the file header.

## Hackathon submission

- **Captain's Log:** submit **both** URLs if the form allows two links, or the one with more traction.
- Mention: reproducible guide, live demo, GitHub, Coral cross-source JOIN + production Docker CLI.

## Plagiarism / originality

These drafts were written from this repository’s implementation and docs only. After you edit, run your usual check; add personal anecdotes (e.g. one debugging session) to make the voice unmistakably yours.

## Sync edits

Edit `captains-log-memoryweave-coral.md` first, then refresh Medium/Hashnode variants or repaste sections you changed.
