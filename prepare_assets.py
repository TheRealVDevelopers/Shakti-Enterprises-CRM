from pathlib import Path
from PIL import Image
from reportlab.graphics.barcode import qrencoder

root = Path(__file__).parent
assets = root / 'public' / 'assets'
downloads = Path(r'C:\Users\pc\Downloads')
for stamp, name in [('12.46.46 PM (8)', 'blessing'), ('12.46.46 PM (2)', 'moulding'), ('12.46.45 PM (4)', 'masterbatch'), ('12.46.45 PM', 'components')]:
    Image.open(downloads / f'WhatsApp Image 2026-10-15 at {stamp}.jpeg').convert('RGB').save(assets / f'{name}.webp', 'WEBP', quality=88)
logo = Image.open(downloads / 'WhatsApp Image 2026-10-15 at 12.46.46 PM (9).jpeg').crop((80, 140, 425, 335))
logo.save(assets / 'logo.webp', 'WEBP', quality=95)
logo.crop((40, 0, 310, 165)).resize((128, 78)).save(assets / 'favicon.png')
url = 'https://shakthi-enterprises-2df21.web.app/catalogue'
qr = qrencoder.QRCode(None, qrencoder.QRErrorCorrectLevel.M)
qr.addData(url)
qr.make()
n, scale = len(qr.modules), 16
image = Image.new('RGB', ((n + 8) * scale, (n + 8) * scale), 'white')
rects = []
for y, row in enumerate(qr.modules):
    for x, dark in enumerate(row):
        if dark:
            image.paste((8, 45, 70), ((x + 4) * scale, (y + 4) * scale, (x + 5) * scale, (y + 5) * scale))
            rects.append(f'<rect x="{x+4}" y="{y+4}" width="1" height="1" fill="#082d46"/>')
image.save(assets / 'catalogue-qr.png')
(assets / 'catalogue-qr.svg').write_text(f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {n+8} {n+8}"><rect width="100%" height="100%" fill="white"/>{"".join(rects)}</svg>')

titles = ['Cover', 'Company profile', 'Tool design & mould development', 'Materials & capabilities', 'Quality & industries', 'Injection moulding machinery', 'Tool room machinery', 'Contact & locations']
slides = '\n'.join(f'<a data-catalogue-page href="/assets/page-{i+1}.jpg" target="_blank" rel="noopener" {"hidden" if i else ""} aria-label="Enlarge page {i+1}: {title}"><img src="/assets/page-{i+1}.jpg" alt="Catalogue page {i+1}: {title}" width="990" height="1400" {"loading=lazy" if i else ""}></a>' for i, title in enumerate(titles))
tabs = '\n'.join(f'<button data-page="{i}" data-title="{title}" aria-current="{str(i==0).lower()}">{i+1:02d} / {title}</button>' for i, title in enumerate(titles))
html = f'''<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Company Catalogue | Shakthi Enterprises</title><meta name="description" content="Read the complete Shakthi Enterprises company catalogue online. Tool design, mould development and plastic injection moulding in Bangalore."><meta name="theme-color" content="#082d46"><link rel="canonical" href="{url}"><link rel="icon" href="/assets/favicon.png"><link rel="stylesheet" href="/styles.css"><script src="/app.js" defer></script></head><body style="background:#f3f7f5">
<a class="skip" href="#reader">Skip to catalogue</a><header class="header"><nav class="wrap nav" aria-label="Catalogue navigation"><a class="brand" href="/" aria-label="Shakthi Enterprises home"><img src="/assets/logo.webp" alt="Shakthi Enterprises" width="154" height="85"></a><a class="text-link" href="/">← Company website</a><a class="text-link" href="/#contact">Enquire ↗</a></nav></header>
<main class="wrap"><section class="reader-intro"><p class="eyebrow">SHAKTHI ENTERPRISES / DIGITAL CATALOGUE</p><h1>Our company catalogue.</h1><p>Explore our capabilities, materials, machinery and quality systems. Browse all eight pages below, or download the original brochure to keep and share.</p><div class="reader-actions"><a class="button" href="/catalogue.pdf" target="_blank" rel="noopener">Open original PDF ↗</a><a class="text-link" href="/catalogue.pdf" download="Shakthi-Enterprises-Catalogue.pdf">Download PDF · 19.5 MB ↓</a></div></section>
<section class="reader" id="reader" aria-label="Company catalogue reader" tabindex="0"><div class="reader-toolbar"><strong id="page-title">Cover</strong><div class="reader-controls"><button id="previous" aria-label="Previous catalogue page" disabled>←</button><span id="page-counter" aria-live="polite">1 / 8</span><button id="next" aria-label="Next catalogue page">→</button></div></div><div class="reader-stage">{slides}</div><p class="reader-help">Tap a page to open the larger image. Use the arrows or choose a section below.</p><div class="reader-tabs" aria-label="Choose catalogue page">{tabs}</div><noscript><p style="padding:20px">To read every page, <a href="/catalogue.pdf">open the original PDF</a>.</p></noscript></section>
<div class="reader-bottom"><div><h3>Let’s build your next component.</h3><p>Share a drawing, sample or requirement with our team.</p><a class="text-link" href="/#contact">Discuss your project ↗</a></div><div class="reader-share"><img src="/assets/catalogue-qr.png" alt="QR code for this catalogue" width="656" height="656"><div>Share the catalogue<br><a href="/assets/catalogue-qr.png" download="Shakthi-Enterprises-QR.png">Download QR · PNG</a><br><a href="/assets/catalogue-qr.svg" download="Shakthi-Enterprises-QR.svg">Print-quality SVG</a></div></div></div></main>
<footer><div class="wrap footer-bottom" style="margin-top:0;border:0"><span>Shakthi Enterprises · Bangalore, India</span><a href="tel:+919902831454">+91 99028 31454</a><a href="mailto:shakthienterprises2736@gmail.com">Email our team ↗</a></div></footer></body></html>'''
(root / 'public' / 'catalogue.html').write_text(html, encoding='utf-8')
print('Catalogue, selected images and QR prepared:', url)
