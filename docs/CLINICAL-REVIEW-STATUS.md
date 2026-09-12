# Post-operative instructions — clinical review status

**Status: round 1 of clinical review applied and deployed.** The Arabic content in
`js/data/procedures-guide.js` covers 15 procedures. It was drafted from general paediatric
orthopaedic practice, then corrected by the surgeon in review round 1 (see
`corrections-round-1.md`): 26 corrections across 13 procedures, all applied.

Still drafted-but-unconfirmed: the 14 worksheet rows that were deleted rather than answered,
listed in `corrections-round-1.md`. Several of them govern instructions parents act on -
K-wire removal and weight-bearing timings, heterotopic ossification prophylaxis, NSAIDs and
union - so they remain the first thing to settle in round 2.

## Where things live

| | |
|---|---|
| Source of truth | `js/data/procedures-guide.js` — 15 procedures, ~10 subsections each |
| Web portal | page `procedures-guide`, wired in `index.html` + `js/app.js` |
| Word guide | `docs/post-op-instructions-ar.docx` — generated, do not hand-edit |
| Review worksheet | `docs/correction-worksheet.docx` — every assumption, with blanks |
| Generators | `tools/` — see `tools/README.md` |

## Applying corrections when they come back

1. Edit `js/data/procedures-guide.js` — it is the only place content should be changed.
2. `cd tools && npm install && npm run build` to regenerate both Word files.
3. Move the corrected item from the "assumed" list below to confirmed, so the next person
   knows what has actually been signed off.

Corrections may arrive as the filled worksheet, as tracked changes in the Arabic `.docx`
(read `w:ins` / `w:del` out of `word/document.xml`), as comments, or just as chat messages.

## Blanks that need the unit's input

These could not be drafted at all and are currently missing from the guide:

- **Unit / hospital name** — the document says only "وحدة جراحة عظام الأطفال".
- **Clinic / appointments line.**
- **Physiotherapy pathway** — in-house or external referral, and whether a printed home
  programme is handed out.

Settled in round 1: the red-flag boxes now close with
"في حالة الطوارئ - مراجعة أقرب طوارئ لديكم" rather than a phone number, at the
surgeon's instruction.

## House rules chosen, open to reversal

- Drug **names and durations only, no doses** — doses deferred to the discharge prescription.
  This was the surgeon's explicit choice; reversing it means adding mg/kg throughout.
- Discharge analgesia: paracetamol regular + ibuprofen, stronger agent unnamed for 2-5 days.
- Antibiotics: not routinely given at discharge, except possibly with exposed K-wires.
- Simplified MSA, matching the existing topics. Care instructions address the mother
  (feminine singular), consistent with the existing cast-care content.

## Assumed clinical parameters, by procedure

Highest-risk assumptions only — the full item-by-item list is in the correction worksheet.

| # | Procedure | Key assumptions |
|---|---|---|
| 1 | DDH closed reduction | Routine arthrogram + adductor tenotomy; spica ~3 months; change under GA at 6 wks; CT/MRI confirmation; brace full-time 4-6 wks then nights 2-3 months; AVN quoted 5-10% |
| 2 | DDH open + pelvic osteotomy | Bikini approach; Salter/Dega/Pemberton; spica 6-12 wks; K-wires out 6 wks; femoral plate 9-18 months |
| 3 | Pelvic osteotomy alone | Cast 4-6 wks, or no cast + NWB 6 wks in older children (no age threshold set); wires out 6-8 wks |
| 4 | SCFE screw fixation | Single screw; stable = partial WB + crutches 4-6 wks; unstable = NWB 6-8 wks; screw usually retained; contralateral fixation presented as a discussion, leaning to fix under 10-12 yrs |
| 5 | Proximal femoral osteotomy | No cast with a blade plate; NWB 4-6 wks; plate out 9-18 months |
| 6 | NM hip reconstruction | No spica — wedge + immobilisers 3-6 wks; diazepam 2-3 wks tapered; laxative near-mandatory; strong fragility-fracture warning |
| 7 | PF guided growth | Day case or 1 night; no cast; review every 4-6 months; screw exchange/removal on migration percentage |
| 8 | PF resection | Skin traction 3-6 wks, written as "your protocol"; HO prophylaxis mentioned, no agent named; pain relief quoted honestly as 3-6 months |
| 9 | NM soft tissue releases | Immobilisers/casts 3-4 wks; early standing 1-3 days; AFO + night splints after; physio 3-6 months |
| 10 | Arthroereisis + calf lengthening | BK cast 4-6 wks, WB in cast; implant removal planned at 1-2 yrs |
| 11 | NM foot fusion | NWB 6 wks then walking cast 4-6 wks (10-12 total); NSAID/union preference flagged as unresolved |
| 12 | Knee 8-plate | Day case; immediate full WB; review every 3-4 months; removal 12-24 months; rebound counselling under age 10 |
| 13 | Achilles lengthening | BK cast 4-6 wks, WB in cast; AFO then night splint; explicit over-lengthening / calcaneus gait warning |
| 14 | Clubfoot tenotomy | Clinic under local anaesthetic (GA given as alternative); cast 3 wks; Denis Browne 23h × 3 months then nights to age 4-5; bar 60-70° / 30-40° |
| 15 | Clubfoot surgery | TATT after age 3-4 for dynamic supination; TATT cast 4-6 wks; PMR 6-12 wks with change at 6 wks; K-wires 4-6 wks; antibiotic policy with exposed wires unspecified |

## Known defect fixed alongside this work

`bindFAQToggles()` was never called for the combined-guide page type, so **every FAQ answer on
the pre-existing surgery guide was impossible to open**. Fixed in `js/app.js` for both that page
and the new one.
