"""Recopie la carte 2 (carte2.json, produite par carte_canon.py) dans src/base/grand_line_origine.html (bloc MAPS[2]).
Usage : python3 art/data/carte/injecter.py"""
import json, os, re
ROOT = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', '..', '..'))
C = json.load(open(os.path.join(os.path.dirname(__file__), 'carte2.json'), encoding='utf-8'))
js = lambda o: json.dumps(o, ensure_ascii=False, separators=(',', ':'))
f = os.path.join(ROOT, 'src', 'base', 'grand_line_origine.html'); s = open(f, encoding='utf-8').read()
blk = '  2:{I:%s,\n  E:%s,\n  B:%s,\n  CAPS:%s,PONE:%s,LAB:%s}};' % (js(C['I']), js(C['E']), js(C['B']), js(C['CAPS']), js(C['PONE']), js(C['LAB']))
s2, n = re.subn(r'  2:\{I:.*?\}\};', lambda m: blk, s, count=1, flags=re.S)
assert n == 1, 'bloc MAPS[2] introuvable'
s2, n = re.subn(r'const SHAPE_KEY=\{.*?\},shapeKey=', lambda m: 'const SHAPE_KEY=' + js(C['SHAPE_KEY']) + ',shapeKey=', s2, count=1)
assert n == 1
open(f, 'w', encoding='utf-8').write(s2); print('carte 2 injectée' + (' (inchangée)' if s2 == s else ''))
