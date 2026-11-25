from pathlib import Path
import colorsys
import re

root=Path(__file__).resolve().parents[1]
public=root/'public'

def neutralise(match):
    raw=match.group(1)
    full=''.join(x*2 for x in raw) if len(raw) in (3,4) else raw
    if len(full) not in (6,8): return match.group(0)
    rgb=full[:6].lower();alpha=full[6:]
    r,g,b=[int(rgb[i:i+2],16)/255 for i in (0,2,4)]
    h,l,s=colorsys.rgb_to_hls(r,g,b)
    if rgb in ['00583c','0a6b49','096b48','0d6c4b','bd1226']: replacement='bd1226'
    elif rgb in ['003f2c','003926','00412c']: replacement='171b21'
    elif rgb in ['f4f2e8','f5f4ed','fffdf7','fffef9','faf9f0','faf9f1','faf9f2','faf9f3','fffdf0','fffdf2','ffffee','fffdec','fffdef','fffdf5','fffdf8','fffef6','fffef7','fffef8','fffefb','faf9f2','fffdf2']: replacement='f6f7f9' if l<.98 else 'ffffff'
    elif 65<h*360<180 and s>.07:
        replacement='171b21' if l<.22 else '303945' if l<.36 else '647080' if l<.58 else '929eac' if l<.73 else 'd5dce5' if l<.85 else 'edf0f5' if l<.95 else 'fafbfd'
    else:return match.group(0)
    return '#'+replacement+alpha

# Legacy component styles contain literal greens. Move those to the neutral
# substrate; the shared theme owns red actions and semantic status colours.
for path in public.glob('*.css'):
    if path.name in ['battery-theme.css','factory-identity.css']: continue
    content=path.read_text(encoding='utf-8')
    content=re.sub(r'#([0-9a-fA-F]{8}|[0-9a-fA-F]{6}|[0-9a-fA-F]{4}|[0-9a-fA-F]{3})(?![0-9a-fA-F])',neutralise,content)
    path.write_text(content,encoding='utf-8')

def apply(path):
    html=path.read_text(encoding='utf-8')
    html=html.replace('✳','ϟ')
    html=html.replace('/assets/logo.webp','/assets/shakthi-battery-wordmark.svg')
    html=re.sub(r'<link rel="stylesheet" href="/(?:battery-theme|factory-identity).css">','',html)
    html=html.replace('</head>','<link rel="stylesheet" href="/battery-theme.css"><link rel="stylesheet" href="/factory-identity.css"></head>')
    path.write_text(html,encoding='utf-8')

for path in public.glob('*.html'):apply(path)
apply(root/'templates'/'index.html')
print('Applied the shared charcoal, ivory and gold factory identity to all public pages.')
