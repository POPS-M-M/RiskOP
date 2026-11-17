import sys, json
import numpy as np
from PIL import Image
d = sys.argv[1]; out = {}
for ile in ['Zou', 'Alabasta', 'Water_7']:
    for st in ['neutre', 'moi', 'adv', 'ville3']:
        try:
            A = np.asarray(Image.open(f'{d}/avant_{ile}_{st}.png').convert('RGB')).astype(int)
            B = np.asarray(Image.open(f'{d}/apres_{ile}_{st}.png').convert('RGB')).astype(int)
            C = np.asarray(Image.open(f'{d}/avant2_{ile}_{st}.png').convert('RGB')).astype(int)
        except FileNotFoundError:
            continue
        h, w = A.shape[:2]; y0, y1, x0, x1 = int(h*.2), int(h*.85), int(w*.25), int(w*.75)
        def m(X, Y):
            D = np.abs(X - Y)[y0:y1, x0:x1].max(axis=2)
            return {'ecart_moyen_sur_255': round(float(D.mean()), 2), 'px_ecart_sup_16_pct': round(float((D > 16).mean()*100), 2)}
        out[f'{ile} · {st}'] = {'apres_vs_avant': m(A, B), 'bruit_avant_vs_avant': m(A, C)}
        D = np.abs(A - B).max(axis=2); Image.fromarray(np.clip(D*4, 0, 255).astype('uint8')).save(f'{d}/diff_{ile}_{st}.png')
json.dump(out, open(f'{d}/pixels.json', 'w'), ensure_ascii=False, indent=1)
for k, v in out.items(): print(k, v)
