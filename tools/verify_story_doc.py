# -*- coding: utf-8 -*-
"""校验生成的剧情文档：占位符、章节标题、结构完整性。"""
import os
import sys

from docx import Document

OUT = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
                   'docs', 'NEXUS-剧情文档-序章至第六章.docx')

d = Document(OUT)
texts = [p.text for p in d.paragraphs]
full = '\n'.join(texts)
for t in d.tables:
    for row in t.rows:
        for cell in row.cells:
            full += '\n' + cell.text

print('file size:', os.path.getsize(OUT))
print('paragraphs:', len(texts), 'tables:', len(d.tables))
print('stray placeholders:', [x for x in ('{{code}}', '{player}', '{{', '}}') if x in full])

heads = [p.text for p in d.paragraphs if p.style.name in ('Heading 1',)]
print('H1 count:', len(heads))
for h in heads:
    print('  H1:', h)

must = ['序章 · 沉睡的意识', '训练终端 · 接驳完成', '失落的数据港', '破碎的记忆花园',
        '被遗忘的实验档案', '失控的核心工坊', '黎明崩塌的真相', '起源之外',
        'ORIGIN PROTOCOL', '新的黎明', '永恒秩序', '超越起源', '初始指令', '守护者的约定']
missing = [m for m in must if m not in full]
print('missing titles:', missing)
print('dialogue-ish lines:', sum(1 for t in texts if '：' in t))

# 关键台词抽查
probes = [
    '从今天起，你的每一次修复，都会让这个世界多亮一点。',
    '我选第三个。',
    '我不签字。不是因为我做不到——是因为不该由我一个人做。',
    '起源之外没有答案，只有下一个问题。',
]
print('probe failures:', [p for p in probes if p not in full])
