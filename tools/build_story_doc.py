# -*- coding: utf-8 -*-
"""构建《NEXUS 虚拟终端故障营救》剧情文档（.docx）。"""

import os
import sys

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from docx import Document
from docx.enum.table import WD_ALIGN_VERTICAL
from docx.enum.text import WD_ALIGN_PARAGRAPH, WD_TAB_ALIGNMENT
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from docx.shared import Cm, Pt, RGBColor

import story_doc_content as C

OUT = os.path.join(
    os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
    'docs', 'NEXUS-剧情文档-序章至第六章.docx',
)

FONT = '微软雅黑'
MONO = 'Consolas'

INK = RGBColor(0x1B, 0x24, 0x2E)
MUTED = RGBColor(0x6B, 0x7A, 0x86)
ACCENT = RGBColor(0x0E, 0x86, 0x83)
WHITE = RGBColor(0xFF, 0xFF, 0xFF)
PALE = RGBColor(0xC7, 0xD6, 0xDC)

SPEAKER_COLORS = {
    'R-07': RGBColor(0x17, 0x6E, 0x6A),
    'MIRA': RGBColor(0x36, 0x68, 0x8E),
    '恩格尔': RGBColor(0x9A, 0x6A, 0x1E),
    'K-0': RGBColor(0x60, 0x45, 0x8A),
    'NEXUS 系统': RGBColor(0x6B, 0x7A, 0x86),
    '系统': RGBColor(0x6B, 0x7A, 0x86),
    '旁白': RGBColor(0x6B, 0x7A, 0x86),
    'GATE-01': RGBColor(0x7A, 0x5A, 0x3E),
    'SOMNIA': RGBColor(0x7A, 0x5A, 0x3E),
    'INDEX-0': RGBColor(0x7A, 0x5A, 0x3E),
    'JUDGMENT-4': RGBColor(0x7A, 0x5A, 0x3E),
    'ENTROPY': RGBColor(0x7A, 0x5A, 0x3E),
    'ECHO 残片': RGBColor(0x7A, 0x5A, 0x3E),
    '？？？': RGBColor(0x7A, 0x5A, 0x3E),
}
MACHINE = {'NEXUS 系统', '系统', '旁白'}

doc = Document()

# ------------------------------------------------------------------ 基础


def set_font(run, name=FONT, size=10.5, bold=None, color=None, italic=None):
    run.font.name = name
    run.font.size = Pt(size)
    rpr = run._element.get_or_add_rPr()
    rfonts = rpr.find(qn('w:rFonts'))
    if rfonts is None:
        rfonts = OxmlElement('w:rFonts')
        rpr.append(rfonts)
    rfonts.set(qn('w:ascii'), name)
    rfonts.set(qn('w:hAnsi'), name)
    rfonts.set(qn('w:eastAsia'), name)
    if bold is not None:
        run.font.bold = bold
    if italic is not None:
        run.font.italic = italic
    if color is not None:
        run.font.color.rgb = color


def letter_space(run, twips=60):
    rpr = run._element.get_or_add_rPr()
    el = OxmlElement('w:spacing')
    el.set(qn('w:val'), str(twips))
    rpr.append(el)


def shade(cell, hexcolor):
    tcpr = cell._tc.get_or_add_tcPr()
    shd = OxmlElement('w:shd')
    shd.set(qn('w:val'), 'clear')
    shd.set(qn('w:color'), 'auto')
    shd.set(qn('w:fill'), hexcolor)
    tcpr.append(shd)


def cell_margins(table, top=60, left=120, bottom=60, right=120):
    tblpr = table._tbl.tblPr
    mar = OxmlElement('w:tblCellMar')
    for name, val in (('top', top), ('left', left), ('bottom', bottom), ('right', right)):
        el = OxmlElement('w:' + name)
        el.set(qn('w:w'), str(val))
        el.set(qn('w:type'), 'dxa')
        mar.append(el)
    tblpr.append(mar)


def table_borders(table, color='D9E1E6', sz=4):
    tblpr = table._tbl.tblPr
    borders = OxmlElement('w:tblBorders')
    for edge in ('top', 'left', 'bottom', 'right', 'insideH', 'insideV'):
        el = OxmlElement('w:' + edge)
        el.set(qn('w:val'), 'single')
        el.set(qn('w:sz'), str(sz))
        el.set(qn('w:space'), '0')
        el.set(qn('w:color'), color)
        borders.append(el)
    tblpr.append(borders)


def fix_widths(table, widths):
    table.autofit = False
    tblpr = table._tbl.tblPr
    layout = OxmlElement('w:tblLayout')
    layout.set(qn('w:type'), 'fixed')
    tblpr.append(layout)
    for idx, w in enumerate(widths):
        table.columns[idx].width = w
    for row in table.rows:
        for idx, w in enumerate(widths):
            row.cells[idx].width = w


def bottom_rule(paragraph, color='C9D6DC', sz=6, space=8):
    ppr = paragraph._p.get_or_add_pPr()
    pbdr = OxmlElement('w:pBdr')
    bottom = OxmlElement('w:bottom')
    bottom.set(qn('w:val'), 'single')
    bottom.set(qn('w:sz'), str(sz))
    bottom.set(qn('w:space'), str(space))
    bottom.set(qn('w:color'), color)
    pbdr.append(bottom)
    ppr.append(pbdr)


def left_rule(paragraph, color='0E8683', sz=18):
    ppr = paragraph._p.get_or_add_pPr()
    pbdr = OxmlElement('w:pBdr')
    left = OxmlElement('w:left')
    left.set(qn('w:val'), 'single')
    left.set(qn('w:sz'), str(sz))
    left.set(qn('w:space'), '8')
    left.set(qn('w:color'), color)
    pbdr.append(left)
    ppr.append(pbdr)


def spacer(pts=6):
    p = doc.add_paragraph()
    p.paragraph_format.space_after = Pt(0)
    p.paragraph_format.space_before = Pt(0)
    p.paragraph_format.line_spacing = 1.0
    run = p.add_run('')
    set_font(run, size=pts)
    return p


def setup():
    sec = doc.sections[0]
    sec.page_width = Cm(21)
    sec.page_height = Cm(29.7)
    sec.left_margin = Cm(2.4)
    sec.right_margin = Cm(2.4)
    sec.top_margin = Cm(2.2)
    sec.bottom_margin = Cm(2.2)
    sec.header_distance = Cm(1.2)
    sec.footer_distance = Cm(1.2)

    normal = doc.styles['Normal']
    normal.font.name = FONT
    normal.font.size = Pt(10.5)
    normal.font.color.rgb = INK
    rpr = normal.element.get_or_add_rPr()
    rfonts = rpr.find(qn('w:rFonts'))
    if rfonts is None:
        rfonts = OxmlElement('w:rFonts')
        rpr.append(rfonts)
    for attr in ('w:ascii', 'w:hAnsi', 'w:eastAsia'):
        rfonts.set(qn(attr), FONT)
    pf = normal.paragraph_format
    pf.line_spacing = 1.5
    pf.space_after = Pt(5)
    pf.space_before = Pt(0)

    for name, size in (('Heading 1', 22), ('Heading 2', 13.5), ('Heading 3', 11.5)):
        st = doc.styles[name]
        st.font.name = FONT
        st.font.size = Pt(size)
        st.font.bold = True
        st.font.color.rgb = INK
        srpr = st.element.get_or_add_rPr()
        srfonts = srpr.find(qn('w:rFonts'))
        if srfonts is None:
            srfonts = OxmlElement('w:rFonts')
            srpr.append(srfonts)
        for attr in ('w:ascii', 'w:hAnsi', 'w:eastAsia'):
            srfonts.set(qn(attr), FONT)
        st.paragraph_format.keep_with_next = True
        st.paragraph_format.space_before = Pt(16)
        st.paragraph_format.space_after = Pt(6)


def no_borders(table):
    tblpr = table._tbl.tblPr
    borders = OxmlElement('w:tblBorders')
    for edge in ('top', 'left', 'bottom', 'right', 'insideH', 'insideV'):
        el = OxmlElement('w:' + edge)
        el.set(qn('w:val'), 'nil')
        borders.append(el)
    tblpr.append(borders)


def footer():
    sec = doc.sections[0]
    sec.different_first_page_header_footer = True
    f = sec.footer
    p = f.paragraphs[0]
    p.paragraph_format.space_before = Pt(0)
    p.paragraph_format.space_after = Pt(0)
    p.paragraph_format.tab_stops.add_tab_stop(Cm(15.9), WD_TAB_ALIGNMENT.RIGHT)
    run = p.add_run('NEXUS · 剧情档案')
    set_font(run, size=8, color=MUTED)
    run2 = p.add_run('\t— ')
    set_font(run2, size=8, color=MUTED)
    fld = OxmlElement('w:fldSimple')
    fld.set(qn('w:instr'), 'PAGE')
    r = OxmlElement('w:r')
    rpr = OxmlElement('w:rPr')
    sz = OxmlElement('w:sz')
    sz.set(qn('w:val'), '16')
    rpr.append(sz)
    color = OxmlElement('w:color')
    color.set(qn('w:val'), '6B7A86')
    rpr.append(color)
    r.append(rpr)
    tt = OxmlElement('w:t')
    tt.text = '1'
    r.append(tt)
    fld.append(r)
    p._p.append(fld)
    run4 = p.add_run(' —')
    set_font(run4, size=8, color=MUTED)


# ------------------------------------------------------------------ 组件


def h1(num, title, kicker=None, first=False):
    label = doc.add_paragraph()
    label.paragraph_format.space_before = Pt(0 if first else 0)
    label.paragraph_format.space_after = Pt(2)
    label.paragraph_format.keep_with_next = True
    if not first:
        label.paragraph_format.page_break_before = True
    lr = label.add_run(kicker or ('SECTION ' + num))
    set_font(lr, size=8, bold=True, color=ACCENT)
    letter_space(lr, 80)

    p = doc.add_paragraph(style='Heading 1')
    p.paragraph_format.space_before = Pt(0)
    p.paragraph_format.space_after = Pt(10)
    r = p.add_run(title)
    set_font(r, size=22, bold=True, color=INK)
    bottom_rule(p, color='C9D6DC', sz=8, space=10)
    return p


def h2(title, space_before=14):
    p = doc.add_paragraph(style='Heading 2')
    p.paragraph_format.space_before = Pt(space_before)
    r = p.add_run(title)
    set_font(r, size=13.5, bold=True, color=INK)
    return p


def scene_head(title, subtitle=''):
    p = doc.add_paragraph(style='Heading 3')
    p.paragraph_format.space_before = Pt(14)
    p.paragraph_format.space_after = Pt(4)
    p.paragraph_format.left_indent = Cm(0.1)
    left_rule(p, color='0E8683', sz=18)
    r2 = p.add_run(title)
    set_font(r2, size=11.5, bold=True, color=INK)
    if subtitle:
        r3 = p.add_run('　　' + subtitle)
        set_font(r3, size=9, color=MUTED)
    return p


def para(text, size=10.5, color=INK, indent=0, after=5, before=0):
    p = doc.add_paragraph()
    p.paragraph_format.first_line_indent = Cm(indent)
    p.paragraph_format.space_after = Pt(after)
    p.paragraph_format.space_before = Pt(before)
    r = p.add_run(text)
    set_font(r, size=size, color=color)
    return p


def dialogue(speaker, text):
    p = doc.add_paragraph()
    pf = p.paragraph_format
    pf.left_indent = Cm(0.55)
    pf.space_before = Pt(1)
    pf.space_after = Pt(1)
    pf.line_spacing = 1.45
    color = SPEAKER_COLORS.get(speaker, INK)
    machine = speaker in MACHINE
    r = p.add_run(speaker + '：')
    set_font(r, size=9.5, bold=True, color=color)

    parts = text.split('\n')
    body_color = MUTED if machine else INK
    body_size = 9.5 if machine else 10.5
    r2 = p.add_run(parts[0])
    set_font(r2, size=body_size, color=body_color)
    for extra in parts[1:]:
        p.add_run().add_break()
        r3 = p.add_run(extra)
        set_font(r3, size=body_size, color=body_color)
    return p


def note(text):
    p = doc.add_paragraph()
    pf = p.paragraph_format
    pf.left_indent = Cm(0.55)
    pf.space_before = Pt(2)
    pf.space_after = Pt(2)
    r = p.add_run('▸ ' + text)
    set_font(r, size=9, color=MUTED)
    return p


def callout(text, fill='F3F7F8', size=10.5, accent='0E8683'):
    t = doc.add_table(rows=1, cols=1)
    cell = t.cell(0, 0)
    cell.width = Cm(16.2)
    shade(cell, fill)
    cell.vertical_alignment = WD_ALIGN_VERTICAL.CENTER
    cell_margins(t, top=100, left=180, bottom=100, right=180)
    table_borders(t, color=fill, sz=2)
    p = cell.paragraphs[0]
    p.paragraph_format.space_after = Pt(0)
    p.paragraph_format.line_spacing = 1.4
    left_rule(p, color=accent, sz=18)
    r = p.add_run(text)
    set_font(r, size=size, color=INK)
    spacer(4)


def kv_table(rows, widths=(Cm(3.6), Cm(12.6)), key_fill='F3F7F8'):
    t = doc.add_table(rows=0, cols=2)
    cell_margins(t)
    table_borders(t)
    for k, v in rows:
        row = t.add_row()
        kc, vc = row.cells
        shade(kc, key_fill)
        kc.vertical_alignment = WD_ALIGN_VERTICAL.CENTER
        kp = kc.paragraphs[0]
        kp.paragraph_format.space_after = Pt(0)
        kp.paragraph_format.line_spacing = 1.3
        kr = kp.add_run(k)
        set_font(kr, size=9, bold=True, color=ACCENT)
        vc.vertical_alignment = WD_ALIGN_VERTICAL.CENTER
        vp = vc.paragraphs[0]
        vp.paragraph_format.space_after = Pt(0)
        vp.paragraph_format.line_spacing = 1.35
        vr = vp.add_run(v)
        set_font(vr, size=9.5, color=INK)
    fix_widths(t, widths)
    spacer(6)
    return t


def grid_table(headers, rows, widths):
    t = doc.add_table(rows=1, cols=len(headers))
    cell_margins(t)
    table_borders(t)
    head = t.rows[0]
    trpr = head._tr.get_or_add_trPr()
    th = OxmlElement('w:tblHeader')
    trpr.append(th)
    for idx, text in enumerate(headers):
        cell = head.cells[idx]
        shade(cell, 'EDF3F4')
        cell.vertical_alignment = WD_ALIGN_VERTICAL.CENTER
        p = cell.paragraphs[0]
        p.paragraph_format.space_after = Pt(0)
        r = p.add_run(text)
        set_font(r, size=9, bold=True, color=INK)
    for row_data in rows:
        row = t.add_row()
        for idx, text in enumerate(row_data):
            cell = row.cells[idx]
            cell.vertical_alignment = WD_ALIGN_VERTICAL.CENTER
            p = cell.paragraphs[0]
            p.paragraph_format.space_after = Pt(0)
            p.paragraph_format.line_spacing = 1.35
            r = p.add_run(text)
            set_font(r, size=9.5, color=INK)
    fix_widths(t, widths)
    spacer(6)
    return t


def render_lines(lines):
    """渲染一段对话；标题与首行绑定，避免标题落单在页脚。"""
    for idx, (speaker, text) in enumerate(lines):
        p = note(text) if speaker == '>' else dialogue(speaker, text)
        if idx == 0:
            p.paragraph_format.keep_with_next = True


# ------------------------------------------------------------------ 页面


def cover():
    spacer(40)
    t = doc.add_table(rows=1, cols=1)
    t.autofit = False
    cell = t.cell(0, 0)
    cell.width = Cm(16.2)
    shade(cell, '0E161D')
    cell_margins(t, top=680, left=680, bottom=680, right=680)
    table_borders(t, color='0E161D', sz=2)
    cell.vertical_alignment = WD_ALIGN_VERTICAL.CENTER
    t.rows[0].height = Cm(7.6)

    p0 = cell.paragraphs[0]
    p0.paragraph_format.space_after = Pt(18)
    r0 = p0.add_run(C.META['label'])
    set_font(r0, size=8.5, bold=True, color=RGBColor(0x5F, 0xC9, 0xC4))
    letter_space(r0, 100)

    p1 = cell.add_paragraph()
    p1.paragraph_format.space_after = Pt(4)
    p1.paragraph_format.line_spacing = 1.15
    r1 = p1.add_run(C.META['title'])
    set_font(r1, size=34, bold=True, color=WHITE)

    p2 = cell.add_paragraph()
    p2.paragraph_format.space_before = Pt(6)
    p2.paragraph_format.space_after = Pt(0)
    r2 = p2.add_run(C.META['subtitle'])
    set_font(r2, size=13, color=PALE)

    # 封面引文
    spacer(30)
    q = doc.add_paragraph()
    q.paragraph_format.left_indent = Cm(0.2)
    q.paragraph_format.space_after = Pt(0)
    left_rule(q, color='0E8683', sz=24)
    qr = q.add_run(C.META['quote'])
    set_font(qr, size=11, color=RGBColor(0x3C, 0x4A, 0x55), italic=False)

    spacer(90)

    meta = [
        ('版本', C.META['version']),
        ('整理日期', C.META['date']),
        ('资料来源', C.META['source']),
    ]
    for k, v in meta:
        p = doc.add_paragraph()
        p.paragraph_format.space_after = Pt(2)
        kr = p.add_run(k + '　')
        set_font(kr, size=8.5, bold=True, color=ACCENT)
        vr = p.add_run(v)
        set_font(vr, size=8.5, color=MUTED)


def toc():
    label = doc.add_paragraph()
    label.paragraph_format.page_break_before = True
    label.paragraph_format.space_after = Pt(2)
    lr = label.add_run('CONTENTS')
    set_font(lr, size=8, bold=True, color=ACCENT)
    letter_space(lr, 80)

    p = doc.add_paragraph(style='Heading 1')
    p.paragraph_format.space_before = Pt(0)
    p.paragraph_format.space_after = Pt(14)
    r = p.add_run('目录')
    set_font(r, size=22, bold=True, color=INK)
    bottom_rule(p, color='C9D6DC', sz=8, space=10)

    for num, title in C.SECTIONS:
        row = doc.add_paragraph()
        row.paragraph_format.space_after = Pt(7)
        row.paragraph_format.line_spacing = 1.2
        nr = row.add_run(num + '　　')
        set_font(nr, size=10, bold=True, color=ACCENT, name=MONO)
        tr = row.add_run(title)
        set_font(tr, size=11, color=INK)

    spacer(18)
    callout(C.README_NOTE, fill='F3F7F8', size=9.5)


def section_world():
    h1('01', '世界观与时间线', first=True)
    for text in C.WORLD_PARAS:
        para(text)
    h2('速览')
    kv_table(C.WORLD_KV)
    h2('时间线：从黎明协议到苏醒')
    grid_table(['时间点', '发生了什么'], C.TIMELINE, (Cm(3.6), Cm(12.6)))
    callout(
        '五年，是这个世界所有伤口共同的长度：K-0 用五年维持它认为的稳定，'
        'MIRA 用五年拆开自己、守着一段记忆，恩格尔用五年等一个愿意自己走过来的人。',
        fill='F3F7F8', size=10,
    )


def section_characters():
    h1('02', '核心角色')
    para('四位核心角色构成整部剧情的支点：一个被创造的生命、一个学会选择的守护者、一个不完美的创世者，'
         '以及一个坚信自己在拯救世界的裁决者。')
    for ch in C.CHARACTERS:
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(16)
        p.paragraph_format.space_after = Pt(2)
        p.paragraph_format.keep_with_next = True
        nr = p.add_run(ch['name'])
        set_font(nr, size=16, bold=True, color=ACCENT)
        fr = p.add_run('　' + ch['full'])
        set_font(fr, size=9.5, color=MUTED)

        q = doc.add_paragraph()
        q.paragraph_format.left_indent = Cm(0.2)
        q.paragraph_format.space_after = Pt(6)
        left_rule(q, color='C9D6DC', sz=18)
        qr = q.add_run(ch['quote'])
        set_font(qr, size=10, color=RGBColor(0x3C, 0x4A, 0x55))

        kv_table([
            ('身份', ch['role']),
            ('阵营', ch['faction']),
            ('公开档案', ch['bio']),
            ('未公开', ch['secret']),
            ('解锁条件', ch['unlock']),
        ], widths=(Cm(3.0), Cm(13.2)))


def render_chapter(ch):
    h1(ch['num'], ch['title'], kicker=ch.get('kicker'))
    if ch.get('intro'):
        para(ch['intro'])
    if ch.get('info'):
        kv_table(ch['info'], widths=(Cm(3.2), Cm(13.0)))
    for sc in ch['scenes']:
        scene_head(sc['title'], sc.get('subtitle', ''))
        render_lines(sc['lines'])


def section_echo():
    h1(C.ECHO_SIDE['num'], C.ECHO_SIDE['title'], kicker=C.ECHO_SIDE['kicker'])
    para(C.ECHO_SIDE['intro'])
    for sc in C.ECHO_SIDE['scenes']:
        scene_head(sc['title'], sc.get('subtitle', ''))
        render_lines(sc['lines'])


def section_rebirth():
    h1(C.REBIRTH['num'], C.REBIRTH['title'], kicker=C.REBIRTH['kicker'])
    para(C.REBIRTH['intro'])
    for sc in C.REBIRTH['scenes']:
        scene_head(sc['title'], sc.get('subtitle', ''))
        render_lines(sc['lines'])


def section_endings():
    h1(C.ENDINGS['num'], C.ENDINGS['title'], kicker=C.ENDINGS['kicker'])
    para(C.ENDINGS['intro'])
    for item in C.ENDINGS['items']:
        p = doc.add_paragraph()
        p.paragraph_format.space_before = Pt(16)
        p.paragraph_format.space_after = Pt(2)
        p.paragraph_format.keep_with_next = True
        tr = p.add_run(item['title'])
        set_font(tr, size=16, bold=True, color=INK)
        br = p.add_run('　' + item['kind'])
        set_font(br, size=9, bold=True, color=ACCENT)

        cp = doc.add_paragraph()
        cp.paragraph_format.space_after = Pt(4)
        cr = cp.add_run('解锁条件：' + item['condition'])
        set_font(cr, size=9, color=MUTED)
        para(item['summary'], size=10, color=RGBColor(0x3C, 0x4A, 0x55), after=6)
        render_lines(item['lines'])


def section_fragments():
    h1('14', '创世主碎片档案', kicker='ARCHIVE')
    para('六枚创世主碎片是恩格尔拆开的最后权限，也是主线收集目标。每枚碎片在档案馆中都有完整剧情与一段恩格尔记忆影像。'
         '另有一段由 MIRA 信任度解锁的隐藏记忆。')
    rows = [(f['id'], f['title'], f['chapter'], f['boss']) for f in C.FRAGMENTS]
    grid_table(['编号', '碎片名称', '所在章节', '出处 Boss'], rows,
               (Cm(3.2), Cm(5.4), Cm(3.4), Cm(4.2)))
    for f in C.FRAGMENTS:
        h2(f['id'] + '　《' + f['title'] + '》', space_before=18)
        p = doc.add_paragraph()
        p.paragraph_format.space_after = Pt(6)
        sr = p.add_run(f['subtitle'])
        set_font(sr, size=9.5, color=MUTED)
        callout(f['quote'], fill='F6F4EF', size=10.5, accent='C08A32')
        for text in f['story']:
            para(text)
        sp = doc.add_paragraph()
        sp.paragraph_format.space_before = Pt(6)
        sp.paragraph_format.space_after = Pt(2)
        sr2 = sp.add_run('恩格尔记忆影像')
        set_font(sr2, size=9, bold=True, color=ACCENT)
        for text in f['memory']:
            dialogue('恩格尔', text)

    h2('隐藏记忆', space_before=22)
    p = doc.add_paragraph()
    p.paragraph_format.space_after = Pt(6)
    sr = p.add_run(C.HIDDEN_MEMORY['subtitle'])
    set_font(sr, size=9.5, color=MUTED)
    for text in C.HIDDEN_MEMORY['lines']:
        dialogue('MIRA', text)


def section_events():
    h1('15', '剧情事件一览', kicker='EVENTS')
    para('剧情事件是解锁与阅读统计的最小单位。下表与游戏内「剧情事件」面板一一对应，共 14 项。')
    rows = [(str(i + 1).zfill(2), t, k, cond) for i, (t, k, cond) in enumerate(C.EVENTS)]
    grid_table(['#', '事件', '类型', '解锁条件'], rows,
               (Cm(1.4), Cm(8.2), Cm(2.2), Cm(4.4)))
    callout('第一章与第二章的 Boss 旧代号 ECHO-01 / ECHO-02 仍保留在事件表中，'
            '但现版本已分别更名为 GATE-01 与 SOMNIA；ECHO-03 至 ECHO-05 则作为回响支线保留。')


def main():
    setup()
    footer()
    cover()
    toc()
    section_world()
    section_characters()
    render_chapter(C.PROLOGUE)
    render_chapter(C.TUTORIAL)
    for ch in C.CHAPTERS:
        render_chapter(ch)
    section_echo()
    section_rebirth()
    section_endings()
    section_fragments()
    section_events()

    doc.core_properties.title = 'NEXUS 虚拟终端故障营救 · 剧情文档'
    doc.core_properties.subject = '序章 — 第六章 全流程剧情'
    doc.core_properties.author = 'NEXUS 剧情档案'

    os.makedirs(os.path.dirname(OUT), exist_ok=True)
    doc.save(OUT)
    print('saved:', OUT)
    print('paragraphs:', len(doc.paragraphs), 'tables:', len(doc.tables))


if __name__ == '__main__':
    main()
