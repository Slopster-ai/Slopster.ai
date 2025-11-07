<!-- e3db46ca-61f7-499b-9e86-c9571900976d 4f8ae2cb-5834-4e67-bbe6-04d04e622e97 -->
# Stages 3–7 Roadmap (TikTok-first, cohesive UX)

## Cohesive UX principles

- Clear primary CTA at each stage advances `projects.flow_stage` and navigates forward; optional “Skip this step” also advances.
- Context flows forward automatically: reuse `users.brand_context` + `projects.strategy_context` for suggestions and defaults.
- Stepper: show stages 1–7; enable link when `step <= flow_stage + 1`; active via pathname; back-nav never reduces `flow_stage`.

## Stage 3: Shoot (real-time guidance)

- Live guidance overlays: brightness (canvas luminance), framing (face detection), energy (WebAudio rms/speaking rate), orientation check.
- CTAs: Primary “Continue to Edit” → `PUT /api/projects/[id]/flow` to 4 → `/projects/{id}/edit`; Secondary “Skip recording”.
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

### To-dos

- [x] Add migration for brand_context, strategy_context, flow_stage to Supabase
- [x] Regenerate/update `types/database.types.ts` for new columns
- [x] Create GET/PUT profile context API at `app/api/profile/context`
- [x] Create GET/PUT project strategy API at `app/api/projects/[id]/strategy`
- [x] Create POST ideas generation API at `app/api/ideas/generate`
- [x] Build Stage 1 page at `projects/[id]/strategy` with form
- [x] Add `components/IdeaAssistant.tsx` with list/select UX
- [x] Plumb `ScriptGenerator` to use `strategy_context` and continue flow
- [x] On Continue, call `/api/scripts/generate` then redirect to script page