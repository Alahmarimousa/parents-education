const fs = require('fs');
const path = require('path');
const cheerio = require('cheerio');
const D = require('docx');
const {
  Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType,
  Table, TableRow, TableCell, WidthType, ShadingType, BorderStyle, LevelFormat,
  Footer, PageNumber
} = D;

const FONT = 'Arial';
const CONTENT_W = 9638;           // A4 minus 2cm margins, in DXA
const ROOT = path.resolve(__dirname, '..');

// ---- load the guide data (browser file, so stub window) ----
const src = fs.readFileSync(path.join(ROOT, 'js/data/procedures-guide.js'), 'utf8');
const win = {};
new Function('window', src)(win);
const sections = win.proceduresGuideData.sections;

// ---- run/paragraph helpers: everything is RTL + complex-script aware ----
function run(text, o = {}) {
  const size = o.size || 22;
  return new TextRun({
    text,
    rightToLeft: true,
    font: { ascii: FONT, hAnsi: FONT, cs: FONT },
    size, sizeComplexScript: size,
    bold: !!o.bold, boldComplexScript: !!o.bold,
    color: o.color,
    break: o.break
  });
}
function para(children, o = {}) {
  return new Paragraph({
    children: Array.isArray(children) ? children : [children],
    bidirectional: true,
    alignment: o.alignment || AlignmentType.RIGHT,
    spacing: { before: o.before ?? 60, after: o.after ?? 120, line: o.line ?? 300 },
    indent: o.indent,
    numbering: o.numbering,
    heading: o.heading,
    border: o.border,
    keepNext: o.keepNext,
    pageBreakBefore: o.pageBreakBefore
  });
}
const text = ($, el) => $(el).text().replace(/\s+/g, ' ').trim();

// ---- inline markup -> runs (bold via <strong>, line breaks via <br>) ----
function inlineRuns($, el, base = {}) {
  const out = [];
  const walk = (node, bold) => {
    $(node).contents().each((_, c) => {
      if (c.type === 'text') {
        const t = c.data.replace(/\s+/g, ' ');
        if (t.trim()) out.push(run(out.length ? t : t.replace(/^ /, ''), { ...base, bold }));
      } else if (c.type === 'tag') {
        if (c.name === 'br') out.push(run('', { ...base, break: 1 }));
        else walk(c, bold || c.name === 'strong' || c.name === 'b');
      }
    });
  };
  walk(el, base.bold);
  return out.length ? out : [run(text($, el), base)];
}

// ---- info box: one-cell table, colour-coded, thick border on the right (RTL) ----
const BOX = {
  tip:     { fill: 'E8F2FC', accent: '2563EB' },
  warning: { fill: 'FEF5E7', accent: 'D97706' },
  danger:  { fill: 'FDECEC', accent: 'DC2626' },
  success: { fill: 'E9F7EF', accent: '059669' },
  plain:   { fill: 'F2F4F7', accent: '64748B' }
};
function infoBox($, el) {
  const cls = ($(el).attr('class') || '');
  const kind = ['tip', 'warning', 'danger', 'success'].find(k => cls.includes(k)) || 'plain';
  const { fill, accent } = BOX[kind];
  const body = $(el).find('.info-box-content').length ? $(el).find('.info-box-content')[0] : el;
  const kids = [];
  $(body).children().each((_, c) => {
    if (c.name === 'strong') kids.push(para(inlineRuns($, c, { bold: true, color: accent }), { after: 60 }));
    else if (c.name === 'p') kids.push(para(inlineRuns($, c), { before: 0, after: 60 }));
    else if (c.name === 'ul' || c.name === 'ol') kids.push(...listItems($, c, true));
  });
  if (!kids.length) kids.push(para(inlineRuns($, body)));
  const thin = { style: BorderStyle.SINGLE, size: 2, color: fill };
  return new Table({
    width: { size: CONTENT_W, type: WidthType.DXA },
    columnWidths: [CONTENT_W],
    visuallyRightToLeft: true,
    borders: { top: thin, bottom: thin, left: thin,
               right: { style: BorderStyle.SINGLE, size: 18, color: accent },
               insideHorizontal: thin, insideVertical: thin },
    rows: [new TableRow({ children: [new TableCell({
      width: { size: CONTENT_W, type: WidthType.DXA },
      shading: { type: ShadingType.CLEAR, fill, color: 'auto' },
      margins: { top: 140, bottom: 140, left: 180, right: 180 },
      children: kids
    })] })]
  });
}

function infoBoxFromHtml(html) {
  const $ = cheerio.load(`<div id="root">${html}</div>`, null, false);
  return infoBox($, $('#root').children('.info-box')[0]);
}

// ---- lists ----
function listItems($, el, inBox = false) {
  const out = [];
  $(el).children('li').each((_, li) => {
    out.push(para(inlineRuns($, li), {
      numbering: { reference: inBox ? 'box-bullets' : 'bullets', level: 0 },
      before: 0, after: 60
    }));
  });
  return out;
}

// ---- data tables ----
function dataTable($, el) {
  const headCells = $(el).find('thead tr').first().children().toArray();
  const n = headCells.length || $(el).find('tbody tr').first().children().length;
  let widths;
  if (n === 2) widths = [Math.round(CONTENT_W * 0.34), CONTENT_W - Math.round(CONTENT_W * 0.34)];
  else if (n === 3) widths = [Math.round(CONTENT_W * 0.3), Math.round(CONTENT_W * 0.42),
                              CONTENT_W - Math.round(CONTENT_W * 0.3) - Math.round(CONTENT_W * 0.42)];
  else widths = Array.from({ length: n }, (_, i) =>
        i === n - 1 ? CONTENT_W - Math.floor(CONTENT_W / n) * (n - 1) : Math.floor(CONTENT_W / n));

  const mkRow = (cells, header) => new TableRow({
    tableHeader: header,
    children: cells.map((c, i) => new TableCell({
      width: { size: widths[i], type: WidthType.DXA },
      shading: { type: ShadingType.CLEAR, fill: header ? '1E4E8C' : 'FFFFFF', color: 'auto' },
      margins: { top: 80, bottom: 80, left: 120, right: 120 },
      children: [para(inlineRuns($, c, header ? { bold: true, color: 'FFFFFF' } : {}),
                      { before: 0, after: 0, line: 280 })]
    }))
  });

  const rows = [];
  if (headCells.length) rows.push(mkRow(headCells, true));
  $(el).find('tbody tr').each((_, tr) => rows.push(mkRow($(tr).children().toArray(), false)));
  const b = { style: BorderStyle.SINGLE, size: 4, color: 'C7D2E0' };
  return new Table({
    width: { size: CONTENT_W, type: WidthType.DXA },
    columnWidths: widths,
    visuallyRightToLeft: true,
    borders: { top: b, bottom: b, left: b, right: b, insideHorizontal: b, insideVertical: b },
    rows
  });
}

// ---- walk one section's HTML ----
function renderHtml(html) {
  const $ = cheerio.load(`<div id="root">${html}</div>`, null, false);
  const out = [];
  const handle = (el) => {
    const cls = $(el).attr('class') || '';
    switch (el.name) {
      case 'h3':
        out.push(para(inlineRuns($, el, { bold: true, size: 26, color: '1E4E8C' }),
                      { heading: HeadingLevel.HEADING_2, before: 260, after: 100, keepNext: true }));
        break;
      case 'h4':
        out.push(para(inlineRuns($, el, { bold: true, size: 23, color: '2C5F8D' }),
                      { heading: HeadingLevel.HEADING_3, before: 180, after: 60, keepNext: true }));
        break;
      case 'p':
        out.push(para(inlineRuns($, el)));
        break;
      case 'ul': case 'ol':
        out.push(...listItems($, el));
        break;
      case 'table':
        out.push(dataTable($, el), para(run(''), { before: 0, after: 60 }));
        break;
      case 'div':
        if (cls.includes('info-box')) {
          out.push(infoBox($, el), para(run(''), { before: 0, after: 80 }));
        } else if (cls.includes('responsive-table')) {
          $(el).children('table').each((_, t) => handle(t));
        } else if (cls.includes('section-intro')) {
          $(el).children('p').each((_, p) =>
            out.push(para(inlineRuns($, p, { size: 23 }), { after: 160 })));
        } else if (cls.includes('steps-list')) {
          $(el).children('.step-item').each((_, s) => {
            const num = $(s).attr('data-step') || '';
            const title = text($, $(s).children('h4'));
            out.push(para(run(`${num}. ${title}`, { bold: true, color: '2C5F8D' }),
                          { before: 140, after: 40, keepNext: true, indent: { start: 240 } }));
            $(s).children('p').each((_, p) =>
              out.push(para(inlineRuns($, p), { before: 0, after: 80, indent: { start: 480 } })));
          });
        } else if (cls.includes('faq-item')) {
          const q = $(el).children('.faq-question')[0];
          const a = $(el).children('.faq-answer')[0];
          if (q) out.push(para(inlineRuns($, q, { bold: true, color: '1E4E8C' }),
                               { before: 160, after: 40, keepNext: true }));
          if (a) out.push(para(inlineRuns($, a), { before: 0, after: 80, indent: { start: 240 } }));
        } else {
          $(el).children().each((_, c) => handle(c));
        }
        break;
      default:
        $(el).children().each((_, c) => handle(c));
    }
  };
  $('#root').children().each((_, el) => handle(el));
  return out;
}

// ---- document body ----
const body = [];

// title page
body.push(
  para(run('بوابة تثقيف الأسرة', { bold: true, size: 30, color: '1E4E8C' }),
       { alignment: AlignmentType.CENTER, before: 2400, after: 40 }),
  para(run('وحدة جراحة عظام الأطفال', { size: 24, color: '64748B' }),
       { alignment: AlignmentType.CENTER, after: 900 }),
  para(run('تعليمات ما بعد العمليات الجراحية', { bold: true, size: 48, color: '5B21B6' }),
       { alignment: AlignmentType.CENTER, after: 160 }),
  para(run('دليل الوالدين لخمس عشرة عملية من جراحة عظام الأطفال', { size: 26, color: '334155' }),
       { alignment: AlignmentType.CENTER, after: 120 }),
  para(run('شرح العملية · الإقامة في المستشفى · أدوية الخروج · فترة الجبيرة · العناية بعد إزالتها · المتابعة · التيبّس وإعادة التأهيل · الأجهزة التقويمية · علامات الخطر · أسئلة شائعة',
           { size: 20, color: '64748B' }),
       { alignment: AlignmentType.CENTER, after: 900 })
);
body.push(infoBoxFromHtml('<div class="info-box warning"><div class="info-box-content"><strong>هذا الدليل لا يغني عن تعليمات جراح طفلك</strong><p>المعلومات هنا عامة وتثقيفية. قد تختلف خطة طفلك عن المكتوب هنا لأسباب تخص حالته. إذا وجدت اختلافاً بين هذا الدليل وبين ما قاله لك الجراح أو ما هو مكتوب في ورقة الخروج، اتبع تعليمات الجراح واسأل في العيادة.</p></div></div>'));

// contents
body.push(para(run('المحتويات', { bold: true, size: 34, color: '1E4E8C' }),
               { heading: HeadingLevel.HEADING_1, alignment: AlignmentType.RIGHT,
                 after: 220, pageBreakBefore: true }));
sections.forEach(s => body.push(para(run(s.title, { size: 23 }),
  { numbering: { reference: 'bullets', level: 0 }, before: 0, after: 80 })));

// sections
sections.forEach(s => {
  body.push(para(run(s.title, { bold: true, size: 30, color: '5B21B6' }),
                 { heading: HeadingLevel.HEADING_1, pageBreakBefore: true, before: 0, after: 60,
                   border: { bottom: { style: BorderStyle.SINGLE, size: 10, color: 'C4B5FD', space: 6 } } }));
  body.push(...renderHtml(s.content));
});

const doc = new Document({
  creator: 'بوابة تثقيف الأسرة - وحدة جراحة عظام الأطفال',
  title: 'تعليمات ما بعد العمليات الجراحية',
  description: 'دليل الوالدين لتعليمات ما بعد العمليات الجراحية في جراحة عظام الأطفال',
  styles: {
    default: {
      document: { run: { font: { ascii: FONT, hAnsi: FONT, cs: FONT }, size: 22, sizeComplexScript: 22 } }
    }
  },
  numbering: {
    config: [
      { reference: 'bullets', levels: [{ level: 0, format: LevelFormat.BULLET, text: '●',
          alignment: AlignmentType.RIGHT,
          style: { paragraph: { indent: { start: 460, hanging: 240 } },
                   run: { font: { ascii: FONT, hAnsi: FONT, cs: FONT }, size: 16, color: '5B21B6' } } }] },
      { reference: 'box-bullets', levels: [{ level: 0, format: LevelFormat.BULLET, text: '●',
          alignment: AlignmentType.RIGHT,
          style: { paragraph: { indent: { start: 340, hanging: 220 } },
                   run: { font: { ascii: FONT, hAnsi: FONT, cs: FONT }, size: 14 } } }] }
    ]
  },
  sections: [{
    properties: {
      page: { margin: { top: 1134, bottom: 1134, left: 1134, right: 1134 } }
    },
    footers: {
      default: new Footer({ children: [new Paragraph({
        bidirectional: true, alignment: AlignmentType.CENTER,
        children: [new TextRun({ children: ['صفحة ', PageNumber.CURRENT, ' من ', PageNumber.TOTAL_PAGES],
          rightToLeft: true, font: { ascii: FONT, hAnsi: FONT, cs: FONT },
          size: 18, sizeComplexScript: 18, color: '64748B' })]
      })] })
    },
    children: body
  }]
});

Packer.toBuffer(doc).then(buf => {
  const out = process.argv[2] || path.join(ROOT, 'docs', 'post-op-instructions-ar.docx');
  fs.writeFileSync(out, buf);
  console.log('wrote', out, (buf.length / 1024).toFixed(0) + ' KB', '|', sections.length, 'sections');
});
