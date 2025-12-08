---
name: Stages 3–7 Roadmap (TikTok-first, cohesive UX)
overview: ""
todos:
  - id: 5b28ce03-7ead-491a-af1e-a9134755ea53
    content: Add migration for brand_context, strategy_context, flow_stage to Supabase
    status: completed
  - id: 23c0359d-e53d-4213-a0b4-fe6131ca72fb
    content: Regenerate/update `types/database.types.ts` for new columns
    status: completed
  - id: 97dec069-1daf-4d70-ba08-777dbf2db9b2
    content: Create GET/PUT profile context API at `app/api/profile/context`
    status: completed
  - id: 1ad5b25b-62b3-4468-a2e3-f497411b1fc0
    content: Create GET/PUT project strategy API at `app/api/projects/[id]/strategy`
    status: completed
  - id: be5514af-2e36-445c-ad0e-1fc30621e427
    content: Create POST ideas generation API at `app/api/ideas/generate`
    status: completed
  - id: 62fc4c34-427d-4681-862d-a2562fdd0601
    content: Build Stage 1 page at `projects/[id]/strategy` with form
    status: completed
  - id: 668c13fb-7df9-4f43-a35f-96fd54bdb411
    content: Add `components/IdeaAssistant.tsx` with list/select UX
    status: completed
  - id: 71cff2e0-c1f7-4073-8a5a-0bde34d8cc16
    content: Plumb `ScriptGenerator` to use `strategy_context` and continue flow
    status: completed
  - id: f1fcabb7-53f9-4e20-acec-d52fe5ecc382
    content: On Continue, call `/api/scripts/generate` then redirect to script page
    status: completed
---

# Stages 3–7 Roadmap (TikTok-first, cohesive UX)

## Cohesive UX principles

- Clear primary CTA at each stage advances `projects.flow_stage` and navigates forward; optional “Skip this step” also advances.
- Context flows forward automatically: reuse `users.brand_context` + `projects.strategy_context` for suggestions and defaults.
- Stepper: show stages 1–7; enable link when `step <= flow_stage + 1`; active via pathname; back-nav never reduces `flow_stage`.

## Stage 3: Shoot (real-time guidance)

- Live guidance overlays: brightness (canvas luminance), framing (face detection), energy (WebAudio rms/speaking rate), orientation check.
- CTAs: Primary “Continue to Edit” → `PUT /api/projects/[id]/flow `to 4 → `/projects/{id}/edit`; Secondary “Skip recording”.
- Integration: after upload, we already create a `videos` row; Editor will seed with the latest video; use `LiveGuidance` (lazy-loaded) inside `Recorder`.

## Stage 4: Editor (CapCut-style MVP)

- Data model: `public.edits` table for EDL JSON.
- Seeding: load latest `videos` and last `scripts` to create an initial EDL (one video track clip; captions from script beats).
- UI: `projects/[id]/edit` with timeline (video, captions, music); basics: trim/split/reorder; add b‑roll placeholders.
- Render: `POST /api/videos/render` → Lambda FFmpeg; progress via `jobs`.
- CTA: Primary “Render & Continue to Sound” → set `flow_stage=5`; Secondary “Skip rendering”.

## Stage 5: Sound & Effects

- API: `POST /api/sounds/suggest` (OpenAI) for 5–10 tracks/SFX.
- UI: `SoundPicker` to add a track to EDL music layer with volume.
- CTA: “Continue to Caption & Post” → `flow_stage=6`.

## Stage 6: Caption, Hashtags, Post

- API: `POST /api/posting/caption` → caption + 10–15 hashtags from context.
- UI: panel to copy caption/hashtags and attach to EDL metadata.
- Posting MVP: export MP4 (rendered output) + manual upload guidance.
- CTA: “Mark as Posted → Analyze” → `flow_stage=7`.

## Stage 7: Analyze

- MVP: manual stats input or paste link; advisory via OpenAI using project context.
- Optional: TikTok insights OAuth if available.

## Database migration

- `003_editor_and_edl.sql` (edits table with RLS): as previously outlined.

## Navigation & cohesion

- Extend stepper to 4–7; ensure next-step is clickable right after advancing (`step <= flow_stage+1`).
- Bottom-page CTAs on all stage pages to advance/skip; back links visible but don’t change `flow_stage`.
- Seed data between stages (idea → script → captions; uploaded video → editor; editor → render output → post).