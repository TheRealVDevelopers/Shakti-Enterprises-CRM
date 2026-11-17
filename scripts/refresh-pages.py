from pathlib import Path
import re
root=Path(__file__).resolve().parents[1]
public=root/'public'
for name in ['about','services','infrastructure','materials','quality','contact','catalogue']:
    path=public/(name+'.html')
    html=path.read_text(encoding='utf-8')
    if '/inner-3d.css' not in html:
        html=html.replace('</head>','<link rel="stylesheet" href="/inner-3d.css"><script type="module" src="/inner-3d.js"></script></head>')
    if '/inner-caeli.css' not in html:
        html=html.replace('</head>','<link rel="stylesheet" href="/inner-caeli.css"></head>')
    if 'href="/crm"' not in html:
        html=html.replace('<a href="/contact" class="button small">','<a href="/crm" class="workspace-link">Workspace ↗</a><a href="/contact" class="button small">')
    if name=='infrastructure':
        machines=[('Unit 1','40-tonne'),('Unit 1','90-tonne'),('Unit 1','90-tonne servo'),('Unit 2','180-tonne Tokima'),('Unit 2','180-tonne servo'),('Unit 2','500-tonne')]
        register='<section class="section navy" id="machinery"><div class="wrap"><p class="eyebrow">TWO UNITS / CONNECTED CAPACITY</p><h2>The right machine.<br>For the right component.</h2><p>Our current operating register spans six machines across two manufacturing units. Mould dimensions, mounting, material and shot requirements determine compatibility.</p><div class="editorial-grid">'+''.join(f'<article class="editorial-card"><span>{unit}</span><h3>{machine}</h3><p>Technical compatibility is reviewed for each mould and component.</p></article>' for unit,machine in machines)+'</div><p style="margin-top:30px">Machine descriptions follow the latest owner-provided register. Exact models and technical limits remain subject to confirmation.</p></div></section>'
        html=re.sub(r'<section class="section navy" id="machinery">.*?</section>',lambda _:register,html,flags=re.S)
        html=re.sub(r'<section class="section"><div class="wrap"><p class="eyebrow">PRODUCTION PLANNING</p>.*?</section>','',html,flags=re.S)
        html=html.replace('40–530','40–500').replace('530 tonne','500 tonne')
    path.write_text(html,encoding='utf-8')
template=root/'templates'/'index.html'
if template.exists():
    (public/'index.html').write_text(template.read_text(encoding='utf-8'),encoding='utf-8')
print('Applied the shared 3D theme and current machine register.')
