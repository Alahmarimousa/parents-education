# من بوابة تثقيف إلى منصة مرافقة للمريض
# From Education Portal to Patient Companion Platform

**Architecture & Roadmap Plan — v1.0**
Repository: `alahmarimousa/parents-education`
Status: **proposed — awaiting sign-off before Phase 0 begins**

---

## 1. Executive summary

Today this repository is a *library*. It holds excellent long-form Arabic content about 18 pediatric
orthopedic conditions, and a family reads it. That is where the interaction ends.

This plan turns it into a *companion* — something a family opens repeatedly across the weeks
around their child's operation, and something the child themself can understand.

Two pillars, both requested:

| Pillar | Arabic name | What it adds |
|---|---|---|
| **1. Procedure Explainer** | دليل العمليات | Every operation the surgeon performs, explained twice: once for the parent, once for the child — same truth, two registers |
| **2. Patient Journey Tools** | رحلتي | A personalised timeline anchored to the child's real surgery date: checklists, pain & medication diary, exercises, red-flag triage, questions for the doctor |

Plus one connecting idea that costs nothing and changes everything:

> **The Prescription QR (وصفة رحلة).** In clinic the surgeon picks a procedure and a date, and the
> app generates a QR code. The parent scans it. Their phone now holds a journey personalised to
> *their* child — right content, right dates, right exercises. No accounts. No server. No database.
> The whole configuration travels inside the URL hash.

**Design constraint that shapes everything below:** this stays a dependency-free static site on
GitHub Pages. No backend, no login, no patient data leaving the device. That is not a limitation we
are tolerating — it is the feature that makes the app deployable in a clinic tomorrow with zero
privacy paperwork.

---

## 2. Where the project stands today

### 2.1 What is here and working

```
index.html            260 lines   shell, nav, splash, print styles
css/styles.css       2072 lines   full design system, RTL, cards, sections
js/app.js            1260 lines   SPA router, search, share, all page renderers
js/data/*.js          510 KB      18 conditions + surgery guide + 3 care guides
js/share.js           317 lines   share sheet, WhatsApp, deep links
js/illustrations.js   197 lines   inline SVG medical diagrams
js/access-gate.js      76 lines   QR token gate
images/                19 MB      X-rays, clinical photos, CT
.github/workflows/                GitHub Pages deploy on push to main
```

Content quality is the asset here. 510 KB of reviewed, structured, Arabic clinical writing is
years of work and **none of it gets thrown away** — Section 4.3 shows how it survives untouched.

### 2.2 What will not survive the expansion

These are not criticisms of the current code — they are the things that are fine at 18 conditions
and break at 18 conditions + 28 procedures + 8 tools.

| # | Issue | Why it blocks growth |
|---|---|---|
| 1 | **Every byte of content loads on every visit** — 6 `<script>` tags, 510 KB parsed before the splash clears | Adding procedures takes this past 1 MB. On hospital wifi the splash screen becomes the product. |
| 2 | **`app.js` is one 1,260-line IIFE** with a `switch` router and inline HTML template strings | Eight new interactive tools cannot live in a switch statement. Nothing is unit-testable. |
| 3 | **No state layer at all** | Every journey tool needs to *remember* things. There is currently nowhere to put them. |
| 4 | **Search requires all content in memory** (`getAllConditions()` concatenates every global) | Directly contradicts fix #1. Needs a prebuilt index. |
| 5 | **Content is a single string per section** | A child-mode toggle needs two registers per block. Strings cannot hold two. |
| 6 | **No service worker** — `manifest.json` exists but the app is not actually offline-capable | A parent in a hospital room with no signal is exactly our user. |
| 7 | **19 MB of unoptimised JPEG/PNG** | Already heavy; procedure illustrations will add more. |
| 8 | **The access gate is obscurity, not security** — the token is a constant in shipped JS | Fine for public educational content. Must never be trusted with anything else. Documented honestly in §7.3. |

### 2.3 The load-bearing decision

Fix #1–#5 *before* building features, not after. Phase 0 exists for exactly this. It ships no new
screens, and skipping it means rewriting Phases 1–3 later.

---

## 3. Target architecture

### 3.1 File layout

```
index.html                      shell only — no page markup
sw.js                           NEW  service worker, offline shell + content cache
manifest.json                   extended (shortcuts, maskable icons)

css/
  styles.css                    existing design system (unchanged)
  tokens.css                    NEW  colour/space/type custom properties
  child-mode.css                NEW  the visual language of الوضع البسيط
  journey.css                   NEW  timeline, checklist, diary, exercise components

js/
  core/
    router.js                   NEW  hash routing, route table, params, guards
    store.js                    NEW  localStorage state, schema versioning, export/import
    text.js                     NEW  the register resolver — t(node, mode)
    loader.js                   NEW  lazy <script> data loading with cache + promise dedupe
    dom.js                      NEW  html`` tagged template + escaping + event delegation
    dates.js                    NEW  offsets, Hijri/Gregorian display, "منذ 3 أيام"

  pages/
    home.js  categories.js  condition.js  search.js
    procedure.js              NEW  the procedure explainer page
    journey.js                NEW  رحلتي — the personalised timeline
    diary.js                  NEW  يومياتي — pain, meds, temperature, wound photos
    exercises.js              NEW  تماريني — home programme with timer
    redflags.js               NEW  علامات الخطر — triage
    questions.js              NEW  أسئلتي للطبيب
    childcard.js              NEW  بطاقة طفلي — printable/ER summary
    prescribe.js              NEW  clinician-side: generate the Prescription QR

  components/
    section.js  sharerow.js  quicknav.js          (extracted from app.js)
    modetoggle.js             NEW  👨‍👩‍👧 للوالدين  /  🧒 للطفل
    storyboard.js             NEW  surgery-day strip
    factstrip.js              NEW  normalised procedure facts
    painscale.js              NEW  faces 0–10, child-operable
    checklist.js  timeline.js  timer.js           NEW

  data/
    conditions-*.js           UNCHANGED  (all 510 KB, loaded on demand)
    surgery-guide.js  cast-care.js     UNCHANGED
    procedures/               NEW  one file per procedure
      crpp-supracondylar.js
      ponseti-tenotomy.js
      ddh-open-reduction.js
      ...
    journeys/                 NEW  one file per journey template
      crpp-standard.js  spica-standard.js  ...
    exercises.js              NEW  exercise library, referenced by id
    metaphors.js              NEW  reusable child explanations (see §4.5)
    search-index.js           GENERATED  small, loaded eagerly

tools/
  build-index.js              NEW  Node script → js/data/search-index.js
  new-procedure.js            NEW  scaffolds an authoring stub
  optimize-images.sh          NEW  → WebP + responsive widths

docs/
  PATIENT-PLATFORM-PLAN.md    this file
  AUTHORING.md                NEW  how the surgeon writes a procedure
  CONTENT-GOVERNANCE.md       NEW  review dates, sources, disclaimer policy
```

**Still no build step.** Plain `<script>` tags, plain ES5-compatible syntax where the current code
uses it. `tools/*` are optional Node helpers run by a maintainer or CI, never required to serve the
site. GitHub Pages deploy stays exactly as it is.

### 3.2 Lazy content loading

Replace the six eager `<script src="js/data/...">` tags with one loader:

```js
// js/core/loader.js
const cache = new Map();

export function loadData(name) {            // name: 'conditions-neuro'
  if (cache.has(name)) return cache.get(name);
  const p = new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = `js/data/${name}.js`;
    s.onload = () => resolve(window);       // module sets its own window.* global
    s.onerror = () => reject(new Error(`failed to load ${name}`));
    document.head.appendChild(s);
  });
  cache.set(name, p);
  return p;
}
```

The data files keep their existing `window.conditionsNeuro = [...]` shape — **zero edits to the
510 KB of content**. Only the moment of loading changes.

Route → data mapping lives in one table so the router knows what to fetch before rendering:

```js
const DATA_FOR_ROUTE = {
  'cerebral-palsy':  ['conditions-neuro'],
  'clubfoot':        ['conditions-skeletal'],
  'procedure/:id':   ['procedures/:id'],
  'journey':         ['journeys/:template', 'exercises'],
};
```

Expected first paint: **~40 KB** (shell + router + search index) instead of 510 KB.

### 3.3 Search without loading everything

`tools/build-index.js` walks `js/data/` and emits a compact index — id, name, altNames, keywords,
shortDesc, type, and the section titles. No body content.

```js
window.searchIndex = [
  { id:'cerebral-palsy', t:'condition', n:'الشلل الدماغي',
    a:['شلل دماغي','CP'], k:['شلل','دماغي','تشنج'], s:'اضطراب حركي...' },
  { id:'crpp-supracondylar', t:'procedure', n:'تثبيت كسر فوق اللقمة بالأسلاك',
    a:['تسمير','أسلاك'], k:['كسر','مرفق','عملية'], s:'...' },
];
```

Estimated size: 12–18 KB for ~50 entries. Loaded eagerly; search works instantly and offline.
Regenerated by a CI step on push, so it can never drift from the content.

---

## 4. Pillar 1 — The Procedure Explainer (دليل العمليات)

> *"Explain the procedure I do in a way parents and children understand."*

This is the surgeon's signature feature and the reason the project is worth expanding. Conditions
describe *what is wrong*. Procedures describe *what I am going to do about it* — and that is the
conversation that actually happens in clinic, under time pressure, with a frightened child in the
room.

### 4.1 The core idea: one truth, two registers

Every explanatory field is authored **twice** — never as a simplified half-truth, but as the same
fact told at two levels:

```js
problem: {
  parent: "الكسر فوق اللقمة هو انفصال في الجزء السفلي من عظم العضد فوق مفصل المرفق مباشرة. " +
          "إذا التأم في وضع غير سليم فقد يترك تشوهاً دائماً في زاوية المرفق، ولذلك نعيد " +
          "العظم إلى مكانه الصحيح ونثبته.",
  child:   "العظمة اللي فوق كوعك انكسرت لنصين، زي ما ينكسر غصن الشجرة. " +
           "لازم نرجّع النصين مع بعض بالظبط عشان يلتحموا صح ويرجع كوعك يشتغل زي الأول."
}
```

Rules for the `child` register, enforced in `docs/AUTHORING.md`:

- Target reading age **6–12**. Short sentences. Everyday vocabulary, not simplified medical terms.
- **Never frightening, never false.** "You will sleep and you will not feel anything" is true.
  "It will not hurt at all" is not — post-op pain is real, so we say "afterwards it will ache a
  bit, and we have medicine that makes the ache go away."
- Concrete, physical metaphors (§4.5) — children reason about tent pegs, not about fixation.
- Address the child directly: **كوعك**, **تنام**, **ترجع تلعب** — never "the patient".
- Always name what the child *keeps control of*: choosing which cast colour, holding the mask
  themself, bringing their own toy.

### 4.2 The mode toggle (وضع القراءة)

A persistent control in the header, remembered in `store.prefs.readingMode`:

```
┌──────────────────────────────┐
│  👨‍👩‍👧 للوالدين  │  🧒 للطفل  │
└──────────────────────────────┘
```

Switching re-renders the current page in place and keeps scroll position. In `child` mode the app
also changes *appearance*, not just words (`child-mode.css`): larger type, rounder cards, warmer
palette, illustrations promoted above text, clinical tables and risk statistics hidden. Child mode
is not a smaller adult mode — it is a different room.

### 4.3 How existing content survives untouched

The resolver treats a plain string as parent-register:

```js
// js/core/text.js
export function t(node, mode = store.prefs.readingMode) {
  if (node == null) return '';
  if (typeof node === 'string') return node;        // ← all 510 KB of legacy content
  return node[mode] ?? node.parent ?? '';           // ← graceful fallback
}
```

So: **every existing condition page keeps working on day one**, in parent mode, with no edits. Child
registers get added incrementally, condition by condition, forever — and any block that has not been
written yet quietly falls back to the parent text rather than breaking.

### 4.4 Procedure schema

```js
window.procedures = window.procedures || {};
window.procedures['crpp-supracondylar'] = {
  id: 'crpp-supracondylar',
  name: 'تثبيت كسر فوق اللقمة بالأسلاك',
  englishName: 'Closed Reduction & Percutaneous Pinning (CRPP)',
  shortName: 'تثبيت بالأسلاك',
  icon: '🦾',
  conditions: ['supracondylar-fracture'],     // back-links to condition pages
  category: 'fracture-surgery',

  // ── normalised, comparable across every procedure ──────────────────
  facts: {
    anesthesia:       'تخدير عام كامل',
    duration:         '30–45 دقيقة',
    incision:         'بدون شق جراحي — ثقوب صغيرة بحجم رأس القلم',
    stay:             'ليلة واحدة غالباً',
    cast:             'جبس فوق المرفق',
    castWeeks:        4,
    weightBearing:    null,                    // n/a for upper limb
    schoolReturn:     'أسبوع واحد',
    sportReturn:      '8–12 أسبوع',
    hardwareRemoval:  'تُسحب الأسلاك في العيادة بعد 3–4 أسابيع، بدون تخدير غالباً',
    scar:             'ندبات نقطية صغيرة تختفي مع الوقت'
  },

  // ── the four-beat explanation, both registers ─────────────────────
  explain: {
    problem: { parent: '…', child: '…' },      // what is wrong now
    goal:    { parent: '…', child: '…' },      // what we are trying to achieve
    how:     { parent: '…', child: '…' },      // what I will actually do
    after:   { parent: '…', child: '…' }       // what life looks like afterwards
  },

  // ── surgery day, beat by beat (§4.6) ──────────────────────────────
  storyboard: [
    { time:'الصباح',      icon:'🏥', title:{parent:'الوصول للمستشفى', child:'نوصل المستشفى'},
      body:{parent:'…', child:'…'} },
    { time:'قبل العملية', icon:'👕', title:{parent:'تغيير الملابس', child:'نلبس بيجاما المستشفى'},
      body:{parent:'…', child:'…'} },
    /* … */
  ],

  metaphors: ['anesthesia-sleepy-air', 'pins-tent-pegs', 'cast-armor'],

  // ── honest risk, parent register only ─────────────────────────────
  risks: [
    { label:'إصابة عصب مؤقتة', frequency:'حوالي 10–15%', severity:'low',
      note:'تتحسن تلقائياً خلال أسابيع إلى أشهر في الغالبية العظمى' },
    { label:'التهاب حول الأسلاك', frequency:'2–3%', severity:'low',
      note:'يُعالج بالمضاد الحيوي وأحياناً بسحب السلك مبكراً' },
    { label:'تيبس مؤقت في المرفق', frequency:'شائع', severity:'low',
      note:'يتحسن بالحركة التدريجية بعد رفع الجبس' }
  ],

  alternatives:  [{ label:'الجبس وحده بدون تثبيت', when:'…', tradeoff:'…' }],
  whatIfNothing: { parent:'…', child:'…' },

  exercises:       ['elbow-rom-gentle', 'grip-squeeze'],   // → js/data/exercises.js
  journeyTemplate: 'crpp-standard',                        // → js/data/journeys/
  media:  { hero:'images/procedures/crpp/hero.webp',
            xrayBefore:'…', xrayAfter:'…', diagram:'…' },

  // ── clinical governance (§7.2) ────────────────────────────────────
  reviewedBy: 'د. …', reviewedOn: '2026-09', nextReview: '2028-09',
  sources: [{ label:'AAOS Clinical Practice Guideline', url:'…' }]
};
```

### 4.5 The metaphor library (`js/data/metaphors.js`)

Children meet the same frightening abstractions across every procedure — anaesthesia, metalwork,
casts, X-rays. Writing a fresh explanation each time produces inconsistency and, worse, contradiction
between two leaflets from the same clinic. So they are written **once**, centrally, and referenced by id:

| id | Concept | Child explanation (abridged) |
|---|---|---|
| `anesthesia-sleepy-air` | General anaesthesia | "دكتور التخدير عنده هواء بطعم حلو. تشمّه شوي وتنام نومة عميقة… وما تحس بأي شي. وهو قاعد جنبك طول الوقت يراقبك، وأول ما نخلص تفتح عيونك وماما جنبك." |
| `pins-tent-pegs` | K-wires | "الأسلاك زي أوتاد الخيمة — تمسك العظمتين مع بعض عشان ما يتحركوا وهم يلتحموا. وبعدين نسحبهم بسهولة." |
| `plate-screws-bridge` | Plate & screws | "الشريحة زي جسر صغير يربط طرفي العظم…" |
| `cast-armor` | Cast | "الجبس زي درع الفارس — يحمي العظم وهو يشتغل على نفسه." |
| `bone-heals-itself` | Bone healing | "العظم هو الوحيد في جسمك اللي يصلّح نفسه بنفسه — إحنا بس نمسكه في المكان الصح ونتركه يشتغل." |
| `xray-bone-camera` | X-ray | "كاميرا تصوّر العظم من جوّه. ما تحس بشي، بس تقف ثابت ثانية وحدة." |
| `iv-straw` | IV cannula | "أنبوب رفيع زي الشلمونة يوصّل الدوا لجسمك بدون ما نضطر نحطّ إبرة كل مرة." |
| `physio-training` | Physiotherapy | "زي تمرين اللاعبين — كل يوم شوي، وكل يوم تصير أقوى." |

Each entry carries a `parent` register too, so the same concept is explained consistently to adults.

### 4.6 The surgery-day storyboard

The single highest-anxiety object in the whole product. Rendered as a horizontal, swipeable strip of
illustrated beats — in child mode, large and wordless-first:

```
🏥 نوصل  →  👕 نلبس  →  🎨 نختار لون الجبس  →  😴 هواء حلو وننام
   →  👨‍⚕️ الدكتور يصلّح العظم  →  🛏️ نفتح عيوننا وماما جنبنا  →  🍦 نشرب ونأكل  →  🏠 نرجع البيت
```

Design notes:

- **Ends at home.** A child's fear is not of the operation, it is of not coming back.
- **Anchors the parent's presence** at both ends — the last thing before sleep, the first thing after.
- Beat count per procedure: 6–9. Fewer is vague, more is a wall.
- Same data drives the printed child leaflet (§4.8) and the Journey timeline (§5), so it is authored once.

### 4.7 The procedure catalogue

Derived from the 18 conditions already in the repository. **~28 procedures**, proposed in three waves:

**Wave 1 — the six highest-volume (Phase 1)**
1. `crpp-supracondylar` — تثبيت كسر فوق اللقمة بالأسلاك
2. `ponseti-tenotomy` — سلسلة بونسيتي وبضع وتر أخيل
3. `ddh-closed-reduction-spica` — الرد المغلق والجبيرة الحوضية
4. `esin-femur` — تسمير عظم الفخذ بالمسامير المرنة
5. `guided-growth-8plate` — توجيه النمو بالشريحة الثمانية
6. `scfe-in-situ-pinning` — تثبيت انزلاق رأس الفخذ بالمسمار

**Wave 2 — common reconstructive (Phase 4a)**
`ddh-open-reduction` · `salter-osteotomy` · `dega-osteotomy` · `femoral-vdro` ·
`achilles-lengthening` · `gastroc-recession` · `evans-calcaneal-lengthening` ·
`coalition-resection` · `tat-transfer` · `hardware-removal`

**Wave 3 — complex & neuromuscular (Phase 4b)**
`semls-cp` · `adductor-release` · `hamstring-lengthening` · `hip-reconstruction-cp` ·
`fd-rodding-oi` · `perthes-containment` · `limb-lengthening` · `forearm-plating` ·
`tibia-esin` · `eua-cast-change` · `arthrogryposis-release` · `neuromuscular-scoliosis`

Wave 1 alone covers a large share of a typical paediatric orthopaedic operative list, and proves the
format before the content investment scales.

### 4.8 Printed output — the leaflet the surgeon hands over

The repo already has print CSS and a QR generator; this extends both.

- **`?print=child`** — one A4 page: storyboard as pictures, six short sentences, cast colour box,
  a "my questions" ruled area, clinic phone number. Designed to go on a fridge.
- **`?print=parent`** — two A4 pages: full explanation, facts strip, honest risks, red flags with
  the clinic number in large type, post-op day-by-day expectations.
- **Per-procedure QR** — printed on the leaflet, deep-links straight to that procedure page.
  Extends the existing `generate-qr.html`.

---

## 5. Pillar 2 — Patient Journey Tools (رحلتي)

### 5.1 The journey engine

A **template** is generic clinical knowledge, versioned in the repo. An **instance** is one child's
copy of it, anchored to a real date, living only on that family's phone.

```js
// js/data/journeys/crpp-standard.js  — TEMPLATE (in the repo)
window.journeys['crpp-standard'] = {
  id: 'crpp-standard',
  procedure: 'crpp-supracondylar',
  anchor: 'surgeryDate',
  phases: [
    {
      id: 'prep', offsetDays: [-14, -1],
      title: { parent:'التحضير للعملية', child:'نستعد للعملية' },
      tasks: [
        { id:'fasting', type:'info', dueOffset:-1, critical:true,
          title:{ parent:'الصيام قبل العملية', child:'نوقف الأكل بالليل' },
          body:{ parent:'إيقاف الطعام الصلب 6 ساعات، الحليب 4 ساعات، الماء الصافي ساعتين قبل الموعد.',
                 child:'بنوقف الأكل من الليل عشان بطنك تكون فاضية وتنام مرتاح.' } },
        { id:'bag',   type:'check', dueOffset:-1,
          title:{ parent:'تجهيز حقيبة المستشفى', child:'نجهّز شنطتنا' } },
        { id:'read-procedure', type:'read', dueOffset:-7, target:'procedure/crpp-supracondylar' }
      ]
    },
    { id:'surgery-day', offsetDays:[0,0],  /* storyboard renders here */ },
    { id:'first-week',  offsetDays:[1,7],
      tasks:[ { id:'pain-log', type:'log', repeat:'daily', target:'diary' },
              { id:'elevate',  type:'check', repeat:'daily',
                title:{ parent:'رفع الطرف فوق مستوى القلب', child:'نرفع إيدك على المخدة' } } ] },
    { id:'cast-weeks',  offsetDays:[8,28] },
    { id:'after-cast',  offsetDays:[29,60], tasks:[ { id:'rom', type:'exercise',
                                                      target:'elbow-rom-gentle', repeat:'daily' } ] },
    { id:'back-to-normal', offsetDays:[61, 90] }
  ],
  redFlags: ['cast-tight','fingers-blue','fever-high','severe-pain','wound-discharge']
};
```

```js
// localStorage — INSTANCE (never leaves the device)
{
  id: 'j_8f2a', templateId: 'crpp-standard',
  anchorDate: '2026-10-14',
  childName: 'سارة', side: 'يسار', castColor: 'أزرق',
  taskState: { 'bag': { done:true, at:'2026-10-13T19:02:00' },
               'elevate': { '2026-10-15':true, '2026-10-16':true } },
  createdAt: '2026-09-30T10:00:00'
}
```

Rendering is then pure arithmetic: `taskDate = anchorDate + offsetDays`. The engine computes
"today you are on **day 3 after the operation**", surfaces only that phase's tasks, and keeps the
rest collapsed. Past phases collapse to a completion summary; future phases are visible but dimmed —
parents want to see the whole road, they just should not be asked to act on week 6 today.

### 5.2 The eight tools

| # | Tool | Arabic | What it does |
|---|---|---|---|
| 1 | **My Journey** | رحلتي | The timeline above. The app's new home screen once a journey exists. |
| 2 | **My Plan** | خطتي | Today's tasks only, as a checklist. Fasting clock computed backwards from the real admission time. |
| 3 | **Diary** | يومياتي | Daily pain (faces scale, child can tap it themself), medication doses given, temperature, wound photo (stored as local blob, never uploaded). Renders a chart the family shows at follow-up. |
| 4 | **Exercises** | تماريني | Phase-appropriate home programme. Sets/reps, built-in timer, illustrated, daily tick, streak counter. |
| 5 | **Red flags** | علامات الخطر | Guided questions → traffic-light result. Green "this is expected" / amber "call the clinic tomorrow" / red "go to emergency now". **Every path ends with the clinic's phone number as a tap-to-call button.** |
| 6 | **Questions for my doctor** | أسئلتي للطبيب | Accumulate questions between visits, seeded with good suggested questions per phase. Printable / shareable. Answers can be typed in afterwards. |
| 7 | **Appointments** | مواعيدي | Dates, what will happen at each ("the cast comes off today — bring shorts"), `.ics` export to the phone's own calendar (§5.3). |
| 8 | **Child card** | بطاقة طفلي | One printable/screenshot summary: diagnosis, procedure, date, surgeon, implants, cast, precautions, allergies. For the ER at 2 a.m. in another city. |

### 5.3 Reminders — an honest constraint

True push notifications require a server and a push subscription. We have neither, and adding them
would drag patient data off-device.

**What we do instead** — three layers, in order of reliability:

1. **`.ics` calendar export.** Appointments and critical reminders (fasting time, medication
   schedule, cast-removal date) export to the phone's native calendar, which already has
   notifications the family trusts. Works fully offline, survives the app being closed.
2. **Local notifications while the app is open**, via the Notifications API — useful for exercise
   timers and the medication interval during an active session.
3. **A badge on next open** — "3 tasks waiting" — so nothing is silently missed.

This is a deliberate trade: slightly weaker reminders, zero backend, zero PHI in transit. If true
push is later judged essential, it is an additive change, and §9 flags it as a decision point.

### 5.4 The Prescription QR (وصفة رحلة) — the clinic-to-home bridge

**The problem:** a family leaves clinic with a paper leaflet and a date they will misremember.

**The mechanism:** the surgeon opens `#page=prescribe` on the clinic machine, selects procedure,
surgery date, side, and optional child name. The app encodes that into a URL hash and renders a QR:

```
https://…/index.html#access=TOKEN&rx=eyJwIjoiY3JwcC1zdXByYWNvbmR5bGFyIiwiZCI6IjIwMjYtMTAtMTQiLCJzIjoibCJ9
                                        └─ base64url of {"p":"crpp-supracondylar","d":"2026-10-14","s":"l"}
```

The parent scans it in the room. Their phone opens the app, decodes `rx`, shows a confirmation
("رحلة سارة — تثبيت كسر فوق اللقمة — 14 أكتوبر. هل نبدأ؟"), and on confirm writes the journey
instance to their own localStorage.

**Why this is the right design here:**

- Zero backend, zero accounts, zero data transmitted — the payload is ~60 characters of clinical
  configuration, no identifiers unless the surgeon types a first name, and even that never leaves
  the URL.
- Reuses the QR infrastructure already in the repo.
- Works on any phone, no install, no app store.
- The surgeon can also **print** the QR onto the leaflet for families who prefer paper.

**Boundary to respect:** `rx` carries *clinical configuration only*. It must never carry a medical
record number, national ID, phone number, or free-text clinical notes. Enforced by validating the
decoded payload against a strict allow-list of keys before it is honoured, and by never round-tripping
it anywhere off-device.

---

## 6. State, privacy, and data

### 6.1 Single versioned key

```js
localStorage['pe.patient.v2'] = {
  schema: 2,
  prefs:    { readingMode:'parent', fontScale:1, reduceMotion:false, clinicPhone:'…' },
  profile:  { childName:'', birthYear:null, condition:null },   // optional, never required
  journeys: [ /* instances — §5.1 */ ],
  diary:    [ { date:'2026-10-15', pain:4, meds:[{name:'باراسيتامول', at:'08:00'}],
                temp:37.1, note:'', photo:null } ],
  exercises:{ 'elbow-rom-gentle': { log:{ '2026-10-15':2 }, streak:3 } },
  questions:[ { id:'q1', text:'متى يقدر يرجع للمدرسة؟', answered:false, answer:'' } ],
  appointments:[ { id:'a1', date:'2026-11-11', title:'رفع الجبس', prep:'…' } ]
};
```

`store.js` owns migrations (`v1 → v2 → …`), so a schema change never silently drops a family's diary.
Every write is validated against a shape before it lands; a corrupted key is quarantined to
`pe.patient.corrupt.<ts>` rather than thrown away, so nothing is lost irrecoverably.

### 6.2 Privacy stance — stated plainly in the app

A permanent, plainly-worded panel in the settings and on first run of any journey tool:

> **بياناتك تبقى في جهازك.**
> كل ما تكتبه هنا — التواريخ، الألم، الأدوية، الصور — محفوظ داخل متصفح جهازك فقط.
> لا يُرسل إلى أي خادم، ولا نستطيع نحن الاطلاع عليه. إذا حذفت بيانات المتصفح ستُحذف معها.
> **لذلك: احفظ نسخة احتياطية بانتظام.**

Design consequences, all non-negotiable:

- **No analytics, no tracking pixels, no third-party fonts or scripts.** The CSP should enforce this.
- **No network request ever carries journey, diary, or profile content.** The only outbound traffic is
  fetching the site's own static assets.
- **Export / import** to a JSON file, offered proactively — because "the browser cleared my data" is a
  real way to lose eight weeks of a child's recovery record.
- **Wound photos** are stored as local blobs in IndexedDB (localStorage cannot hold them), and the
  export explicitly warns before including them.
- The **share** feature must share *content pages only*, never journey state. A separate code path
  from the existing share sheet, so the two can never be confused.

### 6.3 Storage budget

localStorage is ~5 MB. Text state is measured in kilobytes and will never approach it. Photos go to
IndexedDB with a soft cap (~20 photos) and a clear "oldest will be removed" warning — the app should
never fail a write silently.

---

## 7. Cross-cutting concerns

### 7.1 Offline (`sw.js`)

The target user is a parent in a hospital room with one bar of signal.

- **Shell** (HTML, CSS, core JS, search index) — cache-first, updated on new deploy.
- **Content data** — stale-while-revalidate; once a condition or procedure has been read, it is
  permanently available.
- **The active journey's content** — prefetched on journey creation, so everything the family needs
  across the next eight weeks is already on the device before they reach the hospital.
- **Images** — cache on view, with a size ceiling.
- Explicit "متاح بدون إنترنت ✓" indicator, so the family *knows* they can rely on it.

### 7.2 Clinical governance (`docs/CONTENT-GOVERNANCE.md`)

Medical content that patients act on needs provenance. Every condition and procedure carries
`reviewedBy`, `reviewedOn`, `nextReview`, and `sources`. The footer of every content page renders
"روجعت في 09/2026" — and `tools/build-index.js` fails CI on any content past its `nextReview` date,
so the review cycle cannot be quietly skipped.

The existing disclaimer ("هذا المحتوى للأغراض التعليمية فقط") stays, and gets stronger where the app
moves from *informing* to *guiding*: the red-flag tool in particular must state that it does not
diagnose and must always offer the clinic number and emergency instructions.

### 7.3 The access gate — honest assessment

`ACCESS_TOKEN = 'PedOrtho-Portal-2026'` is a constant in shipped JavaScript. Anyone who opens
DevTools has it. It is obscurity, not access control, and the plan does not pretend otherwise.

That is **acceptable** for this app, for one specific reason: the gated material is public
educational content, and the genuinely sensitive material — the child's diary, photos, and dates —
never leaves the device and is therefore not protected by the gate in the first place. The gate
keeps the portal from being casually indexed and shared out of clinical context. That is all it does,
and all it should ever be asked to do.

Two requirements follow: the gate must never be extended to protect anything real, and the QR
deep-link flow (`rx`) must remain safe to hand to a stranger — which it is, as long as §5.4's
allow-list holds.

### 7.4 Accessibility & performance targets

- Full keyboard navigation; visible focus; correct landmarks and heading order; `aria-live` for
  async page swaps. RTL correctness is already strong — protect it in every new component.
- Respect `prefers-reduced-motion` (the storyboard and timeline animate).
- Font scaling control — grandparents are frequent caregivers.
- Child-mode tap targets ≥ 56 px: a six-year-old is operating the pain scale.
- Targets: first contentful paint < 1.5 s on 3G; Lighthouse PWA ≥ 90; total first load ≤ 150 KB.
- Images → WebP with responsive widths (`tools/optimize-images.sh`); `loading="lazy"` everywhere.
  The existing 19 MB should compress by roughly 60–70% with no visible quality loss.

---

## 8. Phased roadmap

Each phase is independently shippable and leaves `main` deployable.

### Phase 0 — Foundation *(no new screens)*
Module split · `router.js` · `store.js` · `text.js` resolver · `loader.js` lazy loading ·
`tools/build-index.js` + CI step · `sw.js` offline shell · `tokens.css`.

*Acceptance:* every existing page renders identically; first load ≤ 150 KB; search works from the
index; app usable offline after one visit; `store` round-trips and migrates.
**This phase is invisible to users and is the reason every later phase is cheap.**

### Phase 1 — Procedure Explainer
`procedure.js` page · `factstrip`, `storyboard`, `modetoggle` components · `child-mode.css` ·
`metaphors.js` · **Wave 1's six procedures, fully authored in both registers** · print leaflets ·
per-procedure QR · `docs/AUTHORING.md`.

*Acceptance:* a parent and a child can each read all six procedures in their own register; both
leaflets print correctly on A4; every procedure links to and from its condition page.

### Phase 2 — Journey Engine
`journey.js` · timeline & checklist components · six journey templates · **Prescription QR**
(`prescribe.js`) · `childcard.js` · `questions.js` · appointments + `.ics` export · export/import.

*Acceptance:* surgeon generates a QR in clinic → parent scans → correct personalised journey exists
on their phone, offline, with correct dates; the whole flow works with no network after first load.

### Phase 3 — Daily Tools
`diary.js` (pain scale, meds, temperature, photos) · `exercises.js` + exercise library + timer ·
`redflags.js` triage · charts for follow-up visits · IndexedDB photo store.

*Acceptance:* a family can log a full 8-week recovery and show the surgeon a readable chart at
follow-up; every red-flag path terminates in a tap-to-call clinic number.

### Phase 4 — Scale & Polish
Wave 2 and Wave 3 procedures (~22 more) · child registers backfilled across the 18 existing
conditions · image optimisation · accessibility audit · content governance CI · Hijri dates ·
optional English register for expatriate families.

---

## 9. Risks and open decisions

| Risk | Mitigation |
|---|---|
| **Content volume is the real cost.** ~1,200–1,500 words per procedure × 28, in two registers, is the dominant effort — far larger than the code. | Wave 1 of six first. `tools/new-procedure.js` scaffolds the structure so the surgeon only writes prose. Central metaphor library removes the most repetitive writing. |
| **Child-register language needs non-surgeon review.** Clinicians systematically overestimate what children understand. | Have the six Wave 1 child registers read by a paediatric nurse, a play specialist, and ideally two actual children before Phase 1 ships. |
| **Scope creep toward a "real" clinical system.** | Hard line, stated here: no accounts, no server, no PHI. If that line must move, it is a different project with regulatory review, not a phase of this one. |
| **Families losing data via browser clearing.** | Proactive export prompts; clear warning copy; `.ics` for anything time-critical so the phone's calendar holds it too. |
| **Reminders are weaker than a native app's.** | §5.3's three layers; revisit only if families report missed fasting or medication times. |
| **Medico-legal exposure grows** as the app shifts from informing to guiding. | §7.2 governance: review dates enforced in CI, sources cited, red-flag tool explicitly non-diagnostic, clinic number always one tap away. |

**Decisions I need from you before Phase 1:**

1. **Wave 1 list** — are those the right six procedures for your actual operative volume?
2. **Registers** — two (parent + child 6–12) to start, with a teen register deferred to Phase 4? Or is a teen register needed immediately?
3. **Clinic contact** — is there a real phone number the red-flag tool and leaflets should carry? This materially changes their usefulness.
4. **Language** — Arabic only, or is an English register needed for expatriate families? (Cheaper to design in now than to retrofit.)
5. **The Prescription QR** — do you want to use it in clinic yourself, or should the parent set the date manually? This decides whether `prescribe.js` lands in Phase 2 or is dropped.
6. **Reminders** — is `.ics` export enough, or is true push notification a requirement? Only the latter forces a backend, and with it the whole privacy conversation.

---

## 10. What this becomes

A parent leaves clinic having understood the operation. Their child leaves having been told the
truth, in words they can hold onto, ending with "and then you come home." That evening the phone
already knows the surgery date, what to stop eating and when, what the morning will look like, and
what to watch for afterwards — and it keeps knowing it for the eight weeks that follow, with no
signal, no login, and nothing about that child stored anywhere but in their own family's hands.

That is a meaningfully bigger project than a library, and every piece of it is buildable on the
foundation already in this repository.

---

*Plan prepared for review. No feature code has been written — Phase 0 begins on your sign-off.*
