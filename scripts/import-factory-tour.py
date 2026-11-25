"""Import the supplied walkthrough without changing the existing company pages."""
from pathlib import Path
import shutil
import re

root = Path(__file__).resolve().parents[1]
source = root / 'tmp/factory-tour-reference'
target = root / 'public/factory-tour'
target.mkdir(exist_ok=True)
for item in source.iterdir():
    if item.is_dir():
        for asset in item.iterdir():
            if asset.suffix == '.mp4':
                continue  # Encoded separately; never overwrite the optimized masters.
            destination = target / item.name / asset.name
            destination.parent.mkdir(exist_ok=True)
            shutil.copy2(asset, destination)
    else:
        shutil.copy2(item, target / item.name)

page = (target / 'index.html').read_text(encoding='utf-8')
page = page.replace('<head>', '<head><base href="/factory-tour/">', 1)
page = page.replace('</head>', '<link rel="stylesheet" href="embed.css"></head>')
page = page.replace('<script src="tour.js?v=bench-route">', '<script src="tour-motion.js"></script><script src="tour.js?v=web-smooth-v2">')
page = page.replace('</body>', '<script src="embed.js"></script></body>')
page = page.replace('Room index <', 'Room index <')
page = page.replace('</header>', '<a class="company-return" href="/crm" target="_top">CRM workspace</a></header>', 1)
(target / 'index.html').write_text(page, encoding='utf-8')

for name in ['public/index.html', 'templates/index.html']:
    path = root / name
    html = path.read_text(encoding='utf-8')
    if 'factory-tour-shell' in html:
        continue
    start = html.index('<section class="product-journey"')
    end = html.index('<section class="mission"', start)
    replacement = '<section id="journey" class="factory-tour-shell" aria-label="Interactive factory walkthrough"><div class="factory-tour-sticky"><iframe id="factory-tour" title="Shakthi factory tour — scroll to explore" src="/factory-tour/index.html?v=smooth-2" allow="autoplay" loading="eager"></iframe></div></section>'
    html = html[:start] + replacement + html[end:]
    html = html.replace('id="capabilities"', 'id="capabilities"')
    html = html.replace('href="#discovery"', 'href="#capabilities"')
    html = html.replace('</head>', '<link rel="stylesheet" href="/factory-tour-home.css"><script type="module" src="/factory-tour-home.js"></script></head>')
    path.write_text(html, encoding='utf-8')

# Keep the established operating register rather than importing the design ZIP's
# different example tonnages/shot weights. Photographs and camera paths stay intact.
for path in target.glob('*'):
    if path.suffix not in ['.html', '.js']:
        continue
    text = path.read_text(encoding='utf-8')
    for old, new in [('Unit 2', 'Tooling operations'), ('Unit 1', 'Production operations'),
                     ('530-tonne', '500-tonne'), ('530 tonnes', '500 tonnes'),
                     ('530 t', '500 t'), ('100-tonne', '90-tonne servo'),
                     ('100 tonnes', '90 tonnes servo'), ('100 t', '90 t servo'),
                     ('170 tonnes', '180 tonnes'), ('160 tonnes', '180 tonnes'),
                     ('Sallsen press', '180-tonne servo press'), ('Haitian press', '500-tonne press')]:
        text = text.replace(old, new)
    text = text.replace("[40,'60 g'], [90,'130 g'], [100,'150 g'], [160,'380 g'], [170,'320 g'], [530,'2.2 kg']",
                        "[40,'confirm for job'], [90,'confirm for job'], [90,'confirm for job'], [180,'confirm for job'], [180,'confirm for job'], [500,'confirm for job']")
    # The third bay still uses the third supplied image, even though its register label is 90 t servo.
    text = text.replace("still:'assets/unit-2-'+p.tonnes+'.webp'", "still:'assets/unit-2-'+[40,90,100][unitPresses.indexOf(p)]+'.webp'")
    path.write_text(text, encoding='utf-8')

for path in target.glob('*'):
    if path.suffix not in ['.html', '.js']:
        continue
    text = path.read_text(encoding='utf-8')
    text = text.replace('90 t servoonne', '90 tonne servo')
    text = text.replace('160 tonne', '180 tonne').replace('170 tonne', '180 tonne')
    text = re.sub(r'up to (?:2\.2 kg|320 g|380 g|confirm for job)(?: per shot)?', 'shot capacity verified per job', text, flags=re.I)
    text = text.replace("' t clamp  ·  up to '+s.shot+' per shot'", "' t clamp · shot capacity verified per job'")
    text = text.replace("' t clamp · up to '+p.shot+' per shot'", "' t clamp · shot capacity verified per job'")
    if path.name == 'index.html':
        table = '<table><caption>Operating machine register</caption><thead><tr><th>Operations</th><th>Machine</th></tr></thead><tbody>'
        for unit, machine in [('Tooling operations', '40 tonnes'), ('Tooling operations', '90 tonnes'), ('Tooling operations', '90 tonnes servo'), ('Production operations', '180 tonnes Tokima'), ('Production operations', '180 tonnes servo'), ('Production operations', '500 tonnes')]:
            table += f'<tr><td>{unit}</td><td>{machine}</td></tr>'
        table += '</tbody></table><p>Machine selection and shot capability are confirmed against the approved tool and material.</p>'
        text = re.sub(r'<table\b[^>]*>.*?</table>', lambda match: table if 'Clamp' in match[0] or 'clamp' in match[0] else match[0], text, flags=re.S)
    if path.name == 'tour.js':
        start = text.index('    if(displayed.stop.unit) {')
        end = text.index('      body.append(credit);', start) + len('      body.append(credit);')
        text = text[:start] + "    if(displayed.stop.unit) {\n      const credit=document.createElement('p');credit.textContent='Illustrated factory walkthrough. The current machine register is preserved on the company machinery page.';body.append(credit);" + text[end:]
        text = text.replace('The catalogue groups six presses by clamp force. Maximum shot weights are approximate and depend on resin, geometry and mould design.', 'The operating register is unchanged. Confirm mould fit, shot capability and material before scheduling a job.')
    path.write_text(text, encoding='utf-8')

# Preserve the web seek and optical easing improvements when reimporting the ZIP.
p = target / 'tour.js'
s = p.read_text(encoding='utf-8')
s = s.replace("let forceStill=false;", "let forceStill=false;\nlet renderedStory=null,lastRender=performance.now();")
s = s.replace("+'.mp4?edition=tool-bench-route'", "+'-web.mp4'")
s = s.replace("  const story=Math.max(0,Math.min(1,(scrollY-tour.offsetTop)/Math.max(1,tour.offsetHeight-stage.offsetHeight)))*storyDuration;", "  const targetStory=Math.max(0,Math.min(1,(scrollY-tour.offsetTop)/Math.max(1,tour.offsetHeight-stage.offsetHeight)))*storyDuration;\n  const now=performance.now();\n  const story=smoothTourStory(renderedStory,targetStory,now-lastRender,reduced.matches);\n  renderedStory=story;lastRender=now;\n  if(story!==targetStory)schedule();")
p.write_text(s, encoding='utf-8')
