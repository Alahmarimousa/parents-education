# Word document generators

The Arabic post-operative guide lives in `js/data/procedures-guide.js` and is rendered two ways:
the web portal reads it directly, and these scripts turn the same data into Word documents. The
data file is the single source — edit it, re-run the build, and the portal and the `.docx` stay in
step. Never hand-edit the `.docx` and expect it to survive; the next build overwrites it.

## Build

```bash
cd tools
npm install          # docx + cheerio
npm run build        # writes both files into ../docs/
```

| Script | Output | What it is |
|---|---|---|
| `build-docx.js` | `docs/post-op-instructions-ar.docx` | The parent guide: title page, contents, all 15 procedures |
| `build-worksheet.js` | `docs/correction-worksheet.docx` | Clinical review form — every drafted assumption with a blank for the surgeon's correction |

Either script takes an optional output path as its first argument.

## Arabic / RTL notes

Right-alignment alone is not enough for Arabic in Word. `build-docx.js` sets, on every element:

- `bidirectional: true` on each paragraph (`w:bidi`)
- `rightToLeft: true` on each run (`w:rtl`)
- complex-script twins for font, size and bold — `w:cs`, `w:szCs`, `w:bCs`. Without these, Arabic
  bold and font sizing are silently ignored by Word even though the Latin properties are set.
- `visuallyRightToLeft: true` on every table, so the first column sits on the right

The font is Arial for its Arabic coverage on both Windows and Mac.

`build-worksheet.js` is the mirror image: English, left-to-right, and deliberately plain, since it
is a working document rather than something a parent sees.

## Gotchas hit while writing these

- `PageBreak` extends `Run` in docx v9 — putting one inside a `TextRun`'s `children` nests
  `<w:r>` inside `<w:r>` and fails schema validation. Use `pageBreakBefore` on the paragraph, or
  put the `PageBreak` directly in a `Paragraph`.
- Table widths must be `WidthType.DXA` on both the table's `columnWidths` and every cell's
  `width`, and the column widths must sum to the table width.
- `ShadingType.CLEAR`, never `SOLID` — `SOLID` renders as a black fill.

## Verifying output

`soffice` and `pandoc` were unavailable in the environment these were written in, so the render
check was done by loading the real `.docx` in a browser with `docx-preview` and screenshotting it.
Schema validation is the faster first check and catches structural errors on its own.
