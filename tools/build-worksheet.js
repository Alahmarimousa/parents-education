const fs = require('fs');
const path = require('path');
const D = require('docx');
const { Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType,
        Table, TableRow, TableCell, WidthType, ShadingType, BorderStyle, LevelFormat,
        Footer, PageNumber } = D;

const FONT = 'Arial', W = 9638;
const COLS = [2750, 3550, 3338];
const BLANK = 'FFFDEB';      // where the surgeon types
const HEAD = '1E4E8C';

function r(text, o = {}) {
  const size = o.size || 20;
  return new TextRun({ text, font: { ascii: FONT, hAnsi: FONT, cs: FONT },
    size, sizeComplexScript: size, bold: !!o.bold, boldComplexScript: !!o.bold,
    color: o.color, italics: o.italics, rightToLeft: !!o.rtl });
}
function p(children, o = {}) {
  return new Paragraph({ children: Array.isArray(children) ? children : [children],
    alignment: o.alignment || AlignmentType.LEFT, bidirectional: !!o.rtl,
    spacing: { before: o.before ?? 60, after: o.after ?? 100, line: o.line ?? 280 },
    heading: o.heading, numbering: o.numbering, pageBreakBefore: o.pageBreakBefore,
    keepNext: o.keepNext, border: o.border, indent: o.indent });
}
const B = c => ({ style: BorderStyle.SINGLE, size: 4, color: c || 'C7D2E0' });
function cell(children, o = {}) {
  return new TableCell({ width: { size: o.w, type: WidthType.DXA },
    columnSpan: o.span,
    shading: { type: ShadingType.CLEAR, fill: o.fill || 'FFFFFF', color: 'auto' },
    margins: { top: 90, bottom: 90, left: 120, right: 120 },
    children: Array.isArray(children) ? children : [children] });
}

// one procedure block: heading + item table + escape hatches
function block(title, note, items) {
  const out = [];
  out.push(p(r(title, { bold: true, size: 26, color: HEAD }),
             { heading: HeadingLevel.HEADING_2, before: 300, after: 60, keepNext: true }));
  if (note) out.push(p(r(note, { size: 18, italics: true, color: '64748B' }),
                       { before: 0, after: 120, keepNext: true }));

  const rows = [new TableRow({ tableHeader: true, children: [
    cell(p(r('Item', { bold: true, color: 'FFFFFF' }), { before: 0, after: 0 }), { w: COLS[0], fill: HEAD }),
    cell(p(r('What the draft currently says', { bold: true, color: 'FFFFFF' }), { before: 0, after: 0 }), { w: COLS[1], fill: HEAD }),
    cell(p(r('Your correction', { bold: true, color: 'FFFFFF' }), { before: 0, after: 0 }), { w: COLS[2], fill: HEAD })
  ] })];

  items.forEach(([item, current]) => rows.push(new TableRow({ children: [
    cell(p(r(item, { bold: true }), { before: 0, after: 0 }), { w: COLS[0], fill: 'F7F9FC' }),
    cell(p(r(current), { before: 0, after: 0 }), { w: COLS[1] }),
    cell(p(r(''), { before: 0, after: 0 }), { w: COLS[2], fill: BLANK })
  ] })));

  rows.push(new TableRow({ children: [
    cell(p(r('Anything else on this procedure', { bold: true }), { before: 0, after: 0 }), { w: COLS[0], fill: 'F7F9FC' }),
    cell([p(r(''), { before: 0, after: 0 }), p(r(''), { before: 0, after: 0 }), p(r(''), { before: 0, after: 0 })],
         { w: COLS[1] + COLS[2], span: 2, fill: BLANK })
  ] }));

  out.push(new Table({ width: { size: W, type: WidthType.DXA }, columnWidths: COLS,
    borders: { top: B(), bottom: B(), left: B(), right: B(), insideHorizontal: B(), insideVertical: B() },
    rows }));
  out.push(p(r('☐  Everything above is correct as written — no changes needed for this procedure',
               { bold: true, color: '059669' }), { before: 100, after: 80 }));
  return out;
}

const body = [];

// ---------- header ----------
body.push(
  p(r('Parent Education Portal — Paediatric Orthopaedic Surgery Unit', { size: 18, color: '64748B' }), { after: 20 }),
  p(r('Post-Operative Instructions — Correction Worksheet', { bold: true, size: 34, color: '5B21B6' }),
    { heading: HeadingLevel.HEADING_1, after: 60,
      border: { bottom: { style: BorderStyle.SINGLE, size: 10, color: 'C4B5FD', space: 6 } } }),
  p(r('15 procedures · Arabic parent guide · type your corrections in the yellow cells', { size: 20, color: '334155' }), { after: 200 })
);

const intro = [
  'Type straight into the yellow cells. Leave a cell blank if the draft is right.',
  'If a whole procedure is fine as written, tick the green line under its table and skip the rest.',
  'Rough answers are fine — "6 wks not 4", "we never do this", "ask the physio" all work.',
  'Anything you do not fill in stays as drafted, and I will label it as a general-practice assumption.',
  'Send the file back and I will apply every change to the Arabic text, the web portal and the Word document.'
];
intro.forEach(t => body.push(p(r(t), { numbering: { reference: 'wbullets', level: 0 }, before: 0, after: 60 })));

// ---------- A. general ----------
body.push(...block('A.  General — applies to all 15 procedures',
  'These are the blanks I could not fill from general practice, plus the house rules that run through every section.', [
  ['Unit / hospital name', 'Generic: "بوابة تثقيف الأسرة — وحدة جراحة عظام الأطفال". No hospital named.'],
  ['Contact number for red-flag boxes', 'None. Every danger box says "راجع الطوارئ" with no number to call.'],
  ['Clinic / appointments line', 'Not mentioned anywhere.'],
  ['Drug doses', 'Names + duration only; doses deferred to the discharge prescription (your choice). Say if you now want mg/kg printed.'],
  ['Standard discharge analgesia', 'Paracetamol regular + ibuprofen PRN; stronger agent named vaguely ("مسكّن أقوى") for 2-5 days after bigger cases.'],
  ['Antibiotics at discharge', 'Stated as "not usually given — peri-operative dose only", except possibly with exposed K-wires.'],
  ['Vitamin D / calcium', 'Recommended after osteotomy, fusion and in neuromuscular children. Say if this is routine for everyone.'],
  ['Wound care / bathing', 'Dressing left until review; shower 5-7 days; absorbable sutures assumed throughout.'],
  ['Scar care', 'Silicone gel once healed + sun protection for 1 year, cross-referencing your existing silicone gel topic.'],
  ['Physiotherapy pathway', 'Referred to generically. Not stated whether in-house or external, or whether you hand out a printed home programme.'],
  ['Imaging follow-up rhythm', 'Roughly 6 weeks, 3, 6, 12 months, then yearly to skeletal maturity — varied per procedure.'],
  ['Implant removal philosophy', 'Given as ranges per procedure (e.g. plate 9-18 months). Say if you want one firm house rule.'],
  ['Blood transfusion wording', 'Described as "possible and routine when needed" for the bigger hip cases.'],
  ['Arabic register', 'Simplified MSA (فصحى مبسطة), matching your existing topics. No Gulf colloquial.'],
  ['Address to mother or both parents', 'Mixed — mostly feminine singular (أنتِ) in care instructions, as in your existing cast-care topics.']
]));

// ---------- B. per procedure ----------
const P = [
['B1.  DDH — Closed Reduction', '', [
  ['Arthrogram', 'Routine in every case.'],
  ['Adductor tenotomy', 'Routine in most cases, described as protecting the femoral head.'],
  ['Total spica time', '~3 months (said it may extend to 4).'],
  ['Cast change', 'At 6 weeks under GA, with exam + imaging, then a fresh cast in less flexion.'],
  ['Confirmation imaging', 'Limited CT or MRI after reduction to confirm concentricity.'],
  ['Hospital stay', '1 night, occasionally 2; same-day discharge in some centres.'],
  ['Abduction brace', 'Full-time 4-6 weeks, then nights for 2-3 months. Denis Browne / removable hip brace.'],
  ['Follow-up', '6 wks, cast off ~3 mo, then 3, 6, 12 months, yearly to maturity; focus at 4-5 yrs and puberty.'],
  ['AVN risk quoted', '5-10%.'],
  ['Further surgery quoted', '15-25% need a later pelvic osteotomy, usually age 3-7.']]],

['B2.  DDH — Open Reduction + Pelvic Osteotomy', '', [
  ['Approach', 'Anterior bikini incision.'],
  ['Pelvic osteotomy', 'Salter / Dega / Pemberton — chosen by socket shape and age.'],
  ['Femoral shortening / derotation', 'Added in older children or high dislocation. No age threshold stated.'],
  ['Fixation', 'K-wires or screws in pelvis; plate on femur when shortened.'],
  ['K-wire removal', '~6 weeks.'],
  ['Femoral plate removal', '9-18 months.'],
  ['Spica duration', '6 weeks simple cases, up to 12 weeks with femoral shortening; change at 6 weeks under GA.'],
  ['Hospital stay', '2-4 days.'],
  ['Analgesia', 'Caudal/epidural or regular IV, then oral. Diazepam for spasm.'],
  ['Drain', 'Possible, removed in 24-48 h.'],
  ['Weight-bearing', 'Not immediate after cast; sitting/crawling/standing 2-4 weeks before walking.'],
  ['Post-cast brace', 'Night abduction brace "for some surgeons" if socket still shallow.']]],

['B3.  DDH — Pelvic Osteotomy Alone', '', [
  ['Osteotomy type', 'Salter / Dega / Pemberton by age and socket shape.'],
  ['Cast', '4-6 weeks single-leg spica, OR no cast in older children with solid fixation.'],
  ['Age threshold for no cast', 'Not specified — written as "older children".'],
  ['Weight-bearing', 'NWB 6 weeks, then partial to full over 2-4 weeks.'],
  ['Wire removal', '6-8 weeks.'],
  ['Hospital stay', '2-3 days.'],
  ['Typical age range', 'Given as 18 months to 10 years, with different techniques for adolescents.']]],

['B4.  SCFE — Screw Fixation', '', [
  ['Number of screws', 'One in stable slips; two considered in unstable.'],
  ['Contralateral prophylactic fixation', 'Presented as a discussion with you. Leans toward fixing if under 10-12 yrs, endocrinopathy, or unreliable follow-up.'],
  ['Contralateral risk quoted', '20-40% within 12-18 months.'],
  ['Weight-bearing — stable', 'Partial (weight of the limb), crutches 4-6 weeks.'],
  ['Weight-bearing — unstable', 'Strictly NWB, crutches 6-8 weeks or longer.'],
  ['Reduction', 'No forced reduction; in-situ fixation. Gentle handling in unstable slips.'],
  ['Hospital stay', '1-2 days.'],
  ['Endocrine / metabolic workup', 'Suggested when under 10 yrs or normal weight — thyroid, hormones, vitamin D.'],
  ['Screw removal', 'Usually left in; removed only if symptomatic and after physeal closure.'],
  ['Return to sport', 'Light 3-4 months; contact/jumping 4-6 months with explicit clearance.'],
  ['Follow-up', '6 wks, 3 mo, then every 4-6 months until physeal closure, both hips.']]],

['B5.  Proximal Femoral Osteotomy / Blade Plate', '', [
  ['Immobilisation', 'Usually none — abduction pillow / knee immobiliser. Cast only for small children, poor bone, poor compliance, or combined pelvic osteotomy.'],
  ['Cast duration when used', '3-6 weeks, single or double leg spica.'],
  ['Weight-bearing', 'None or minimal for 4-6 weeks, then graded.'],
  ['Hospital stay', '2-4 days.'],
  ['Analgesia', 'Caudal/epidural or regular IV; muscle relaxant for spasm.'],
  ['Plate removal', '9-18 months, presented as planned and important in young children.'],
  ['Physiotherapy start', 'Knee/ankle movement at 24-72 h; hip and knee flexion 2-6 weeks per your plan.'],
  ['Bilateral in one sitting', 'Described as common and discussed with the family.'],
  ['Gait expectation', 'May look worse for months; real improvement 6-12 months.']]],

['B6.  Neuromuscular Hip Reconstruction', '', [
  ['Components', 'VDRO + shortening, Dega pelvic osteotomy, adductor/psoas release, capsulorrhaphy.'],
  ['Immobilisation', 'Usually no spica — abduction wedge + knee immobilisers 3-6 weeks.'],
  ['When spica is used', 'Poor bone, severe spasticity, or difficulty holding position.'],
  ['Hospital stay', '3-7 days; HDU/ICU first night when respiratory or feeding risk.'],
  ['Spasticity meds', 'Diazepam 2-3 weeks tapered; baclofen continued and never stopped abruptly; gabapentin sometimes.'],
  ['Bowel / gastric protection', 'Laxative treated as near-mandatory; gastric protection with NSAIDs.'],
  ['Vitamin D / bone health', 'Emphasised; no bisphosphonate policy stated.'],
  ['Transfusion', 'Expected in bilateral cases.'],
  ['Sitting / standing programme', 'Sitting graded from week 1-2; standing frame after the immobilisation period, with therapist.'],
  ['Seating review', 'Written as mandatory after surgery.'],
  ['Hip surveillance', 'X-ray every 6-12 months to maturity.'],
  ['Plate removal', 'Discussed at 6-12 months.'],
  ['Fracture warning', 'Strong warning about fragility fracture after immobilisation.']]],

['B7.  Proximal Femur Guided Growth', '', [
  ['Implant', 'Screw (or screws) across part of the proximal femoral physis.'],
  ['Concomitant soft tissue release', 'Described as frequently added (adductor / psoas).'],
  ['Hospital stay', 'Day case or 1 night.'],
  ['Immobilisation', 'None. Wedge/immobiliser 2-4 weeks only if releases were added.'],
  ['Return to standing / PT', 'Within days to 2 weeks.'],
  ['Follow-up', 'X-ray at 3 months, then every 4-6 months with migration percentage.'],
  ['Screw exchange / removal', 'Exchange for longer screw if outgrown; removal when corrected.'],
  ['Patient selection', 'Written as: enough growth remaining, hip not yet badly displaced.'],
  ['Expected correction time', '1-2 years, no visible change early on.'],
  ['Leg length effect', 'Described as minor and monitored.']]],

['B8.  CP Hip Salvage — Proximal Femoral Resection', '', [
  ['Technique', 'Resection of head and neck with muscle/capsule interposition over the femoral stump.'],
  ['Post-op traction', 'Skin traction 3-6 weeks — written as "your protocol" (traction OR cast OR external fixator).'],
  ['Heterotopic ossification prophylaxis', 'Mentioned as prescribed by some surgeons. No agent named.'],
  ['Hospital stay', '4-7 days.'],
  ['Analgesia', 'Described as one of the most painful weeks; diazepam + gabapentin commonly.'],
  ['Sitting programme', 'Starts 2-4 weeks, graded over 6-12 weeks.'],
  ['Pain relief timeline', 'Told honestly as 3-6 months, sometimes longer, and not guaranteed 100%.'],
  ['Unilateral vs bilateral', 'Presented as an individual decision including pelvic obliquity.'],
  ['Standing frame after', 'Written as possible in some children, by your decision.']]],

['B9.  Neuromuscular Soft Tissue Releases (hip / knee / ankle)', '', [
  ['Typical combination', 'Single-event multilevel surgery — adductor/psoas, hamstrings, gastroc or TAL.'],
  ['Knee immobilisers', '3-4 weeks after hamstring lengthening, then nights.'],
  ['Below-knee cast', '3-6 weeks after ankle lengthening.'],
  ['Abduction wedge', '3-4 weeks after adductor release.'],
  ['Early standing / walking', 'Encouraged within 1-3 days in casts for walkers.'],
  ['Hospital stay', '1-3 days, up to 4-5 for multilevel.'],
  ['Post-cast orthoses', 'AFO + night splints, refitted to the new position.'],
  ['Physiotherapy', '3-6 months, described as determining the result more than the surgery.'],
  ['Temporary weakness', '6-12 weeks, explained as expected not a complication.'],
  ['Botox relationship', 'Explained as complementary; may resume after surgery.']]],

['B10.  Subtalar Arthroereisis + Calf Lengthening', '', [
  ['Implant', 'Sinus tarsi implant, joints not fused.'],
  ['Calf procedure', 'Gastrocnemius or Achilles lengthening — treated as an essential part, not optional.'],
  ['Cast', 'Below-knee, 4-6 weeks.'],
  ['Weight-bearing in cast', 'Allowed from a few days to 2 weeks.'],
  ['Hospital stay', 'Day case or 1 night.'],
  ['Post-cast orthosis', 'AFO or SMO, or supportive insole in milder cases.'],
  ['Implant removal', 'Planned at 1-2 years by many surgeons, or earlier if painful.'],
  ['Lateral foot pain', 'Described as common for 6-12 weeks.']]],

['B11.  Neuromuscular Foot Fusion', '', [
  ['Which joints', 'Written generically (subtalar / triple). Not specified.'],
  ['Cast sequence', '2 wks first cast, to 6 wks NWB, then walking cast 4-6 wks. Total 10-12 weeks.'],
  ['Weight-bearing', 'Strictly none for the first 6 weeks.'],
  ['Hospital stay', '1-3 days.'],
  ['Ibuprofen', 'Flagged that some surgeons limit NSAIDs because of union — say your preference.'],
  ['Vitamin D / nutrition', 'Emphasised as a union factor.'],
  ['Hardware removal', 'Left unless prominent; removal after 1 year minimum.'],
  ['Union assessment', 'X-ray at 6 wks, 10-12 wks, 6 months.'],
  ['Adjacent joint counselling', 'Long-term adjacent joint wear mentioned, with shock-absorbing shoe advice.']]],

['B12.  Knee Guided Growth (8-plate)', '', [
  ['Setting', 'Day case mostly; 1 night for small children or bilateral.'],
  ['Immobilisation', 'None. Soft dressing or knee immobiliser for comfort a few days.'],
  ['Weight-bearing', 'Immediate and full; crutches optional for comfort.'],
  ['Growth remaining needed', 'Stated as at least 1 year, preferably more.'],
  ['Follow-up interval', 'Every 3-4 months — framed as part of treatment, not routine.'],
  ['Plate removal', 'Typically 12-24 months, as soon as aligned, to avoid overcorrection.'],
  ['Rebound counselling', 'Flagged especially under age 10.'],
  ['Correction rate quoted', 'About 1 degree per 1-2 months.'],
  ['Return to sport', '4-6 weeks; school ~1 week.'],
  ['Imaging', 'Long standing alignment film at correction assessment.']]],

['B13.  Achilles Tendon Lengthening', '', [
  ['Technique', 'Three presented: percutaneous, gastrocnemius recession, open Z — with Silfverskiöld logic explained.'],
  ['Cast', 'Below-knee 4-6 weeks in neutral/right angle.'],
  ['Weight-bearing in cast', 'Usually allowed within days to 2 weeks after percutaneous; restricted after open.'],
  ['Hospital stay', 'Day case or 1 night.'],
  ['Post-cast AFO', 'Daytime for several months, then nights — described as individualised.'],
  ['Night splint duration', 'Up to a year or more in neuromuscular children.'],
  ['Physiotherapy', '2-4 months, with calf strengthening emphasised.'],
  ['Over-lengthening warning', 'Explicit calcaneus gait warning; states you deliberately under-lengthen.'],
  ['Recurrence', 'Acknowledged, higher the younger the child.']]],

['B14.  Clubfoot — Percutaneous Achilles Tenotomy', '', [
  ['Setting / anaesthetic', 'Clinic under local anaesthetic mostly, light GA as alternative. Say which you use.'],
  ['Proportion needing tenotomy', '80-90%.'],
  ['Level of cut', 'About 1.5 cm above the calcaneus, complete division.'],
  ['Immediate gain quoted', '15-20 degrees.'],
  ['Final cast', '3 weeks (noted some use 4), above-knee, knee at 90 degrees.'],
  ['Cast position', 'Abduction 60-70 degrees, dorsiflexion 15-20 degrees.'],
  ['Observation after procedure', '1-2 hours, watching for bleeding.'],
  ['Brace type', 'Denis Browne bar and shoes.'],
  ['Brace schedule', '23 h/day for 3 months, then nights and naps until age 4-5.'],
  ['Bar settings', 'Affected 60-70°, normal 30-40°, width = shoulder width.'],
  ['Relapse figures quoted', 'Over 80% without bracing vs under 10% with.'],
  ['Follow-up', '3 wks, 2 wks after bracing, 3 months, then every 3-4 months to age 4, yearly to maturity.']]],

['B15.  Clubfoot — Releases, Tendon Transfer, Reconstruction', '', [
  ['Proportion needing surgery', 'Under 5% of clubfeet.'],
  ['Tibialis anterior transfer — age', 'After 3-4 years, once the lateral cuneiform ossifies.'],
  ['Tibialis anterior transfer — indication', 'Dynamic supination during gait with normal resting shape.'],
  ['Transfer site', 'Lateral cuneiform / mid dorsum. No joints opened.'],
  ['Casting after transfer', 'Above-knee 4-6 weeks, walking in cast from ~2 weeks.'],
  ['Posteromedial release casting', '6-12 weeks, change under GA at 6 weeks, NWB first 6 weeks.'],
  ['K-wires', '4-6 weeks; removed in clinic if exposed, under short GA if buried.'],
  ['Antibiotics with exposed wires', 'Written as per your policy — not specified.'],
  ['Casting before transfer', 'Mentioned that short casting often precedes transfer to correct shape first.'],
  ['Bracing after surgery', 'Back to Denis Browne at night for under-5s; AFO for older children.'],
  ['Osteotomy add-ons', 'Calcaneal / midfoot osteotomy for fixed bony deformity in older children.'],
  ['Over-release counselling', 'Explicit: wide release looks good in childhood, stiff and painful in adolescence.']]]
];
P.forEach(([t, n, items]) => body.push(...block(t, n, items)));

// ---------- C. open questions ----------
body.push(p(r('C.  Open questions — free text', { bold: true, size: 26, color: HEAD }),
  { heading: HeadingLevel.HEADING_2, before: 340, after: 120, pageBreakBefore: true, keepNext: true }));

const open = [
  ['Procedures to add', 'Any operation you want covered that is not in the 15. I will draft it in the same format.'],
  ['Anything to remove or soften', 'Figures, risks or wording you would rather not put in front of parents.'],
  ['Tone', 'Is the level of detail right? Too much, too little, too frank about risk?'],
  ['Things parents actually ask you', 'Real questions from clinic that I have not covered — the FAQ sections are the easiest part to extend.'],
  ['Known local practice differences', 'Anything where your practice deliberately differs from what is published elsewhere, so I do not "correct" it back.'],
  ['Who reviews this before use', 'Name/role, if you want a review line printed on the document.']
];
const openRows = [new TableRow({ tableHeader: true, children: [
  cell(p(r('Question', { bold: true, color: 'FFFFFF' }), { before: 0, after: 0 }), { w: 3200, fill: HEAD }),
  cell(p(r('Your answer', { bold: true, color: 'FFFFFF' }), { before: 0, after: 0 }), { w: W - 3200, fill: HEAD })
] })];
open.forEach(([q, hint]) => openRows.push(new TableRow({ children: [
  cell([p(r(q, { bold: true }), { before: 0, after: 40 }), p(r(hint, { size: 17, italics: true, color: '64748B' }), { before: 0, after: 0 })],
       { w: 3200, fill: 'F7F9FC' }),
  cell([p(r(''), { before: 0, after: 0 }), p(r(''), { before: 0, after: 0 }), p(r(''), { before: 0, after: 0 })],
       { w: W - 3200, fill: BLANK })
] })));
body.push(new Table({ width: { size: W, type: WidthType.DXA }, columnWidths: [3200, W - 3200],
  borders: { top: B(), bottom: B(), left: B(), right: B(), insideHorizontal: B(), insideVertical: B() },
  rows: openRows }));

// ---------- D. how to send back ----------
body.push(p(r('D.  Sending it back', { bold: true, size: 26, color: HEAD }),
  { heading: HeadingLevel.HEADING_2, before: 340, after: 100, keepNext: true }));
[ 'Save and send this file back — I read .docx directly, including tracked changes and comments.',
  'You can also just reply in the chat: "B4 — unstable slips NWB 8 weeks, and we always fix the other side" is enough.',
  'Or edit the Arabic Word document itself with track changes on, and I will pull your edits out of it.',
  'Every correction goes into the source data file, so the web portal and the Word document update together and cannot drift apart.'
].forEach(t => body.push(p(r(t), { numbering: { reference: 'wbullets', level: 0 }, before: 0, after: 60 })));

const doc = new Document({
  creator: 'Parent Education Portal — Paediatric Orthopaedic Surgery Unit',
  title: 'Post-Operative Instructions — Correction Worksheet',
  description: 'Clinical review worksheet for the Arabic parent post-operative instruction guide',
  styles: { default: { document: { run: { font: { ascii: FONT, hAnsi: FONT, cs: FONT }, size: 20, sizeComplexScript: 20 } } } },
  numbering: { config: [{ reference: 'wbullets', levels: [{ level: 0, format: LevelFormat.BULLET, text: '●',
      alignment: AlignmentType.LEFT,
      style: { paragraph: { indent: { left: 360, hanging: 240 } },
               run: { font: { ascii: FONT, hAnsi: FONT, cs: FONT }, size: 14, color: '5B21B6' } } }] }] },
  sections: [{
    properties: { page: { margin: { top: 1134, bottom: 1134, left: 1134, right: 1134 } } },
    footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER,
      children: [new TextRun({ children: ['Correction worksheet — page ', PageNumber.CURRENT, ' of ', PageNumber.TOTAL_PAGES],
        font: { ascii: FONT, hAnsi: FONT, cs: FONT }, size: 16, sizeComplexScript: 16, color: '64748B' })] })] }) },
    children: body
  }]
});

const OUT = process.argv[2] || path.join(__dirname, '..', 'docs', 'correction-worksheet.docx');
Packer.toBuffer(doc).then(b => { fs.writeFileSync(OUT, b);
  console.log('wrote', OUT, (b.length/1024).toFixed(0)+' KB'); });
