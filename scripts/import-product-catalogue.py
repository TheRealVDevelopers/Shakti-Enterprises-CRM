"""Read the supplied stock workbook into a private, grouped reference catalogue.

No stock balances, production specifications, or agreed order prices are imported.
"""
import argparse, json, re
from pathlib import Path
from zipfile import ZipFile
from xml.etree import ElementTree as ET

ROOT = Path(__file__).resolve().parents[1]
FAMILIES = {
    'side-baffle': ('Side packing baffle', ['PLASTIC SIDE PACKING BAFFAL']),
    'side-shim': ('Side packing shim', ['PLASTIC SIDE PACKING SHIM']),
    'bottom-bench': ('Bottom packing bench', ['PLASTIC BOTTOM PACKING BENCH', 'PLASTIC BOTTOM BENCH']),
    'bottom-bar': ('Packing bottom bar', ['PLASTIC PACKING BOTTOM BAR', 'PLASTIC BOTTOM BAR']),
    'top-bar': ('Packing top bar', ['PLASTIC PACKING TOP BAR', 'PLASTIC TOP BAR']),
    'terminal-cap': ('Terminal protective cap', ['PLASTIC TERMAL CAP', 'PLASTIC AUTOMOTIVE CAP']),
    'pole-bush': ('Automotive pole bush', ['AUTOMOTIVE POLL BUSH', 'AUTOMOTICE POLL BUSH']),
    'protractor': ('Side packing protractor', ['PLASTIC SIDE PACKING PROTRACTOR', 'PLASTIC PACKING PROTRACTOR']),
    'it-tray': ('IT tray', ['PLASTIC IT TRAY']),
    'bottom-shim': ('Bottom packing shim', ['PLASTIC PACKING BOTTOM SHIM', 'PLASTIC BOTTOM SHIM']),
    'square-shim': ('Square packing shim', ['PLASTIC PACKING SHIM SQUARE']),
}

def size_key(size):
    size = size.upper().replace('×', '*')
    size = re.sub(r'\b(BOTTOM BAR|TOP BAR|BENCH|TRAY)\b', '', size)
    return re.sub(r'\s+', '', size)

def read_catalogue(path):
    ns = {'m': 'http://schemas.openxmlformats.org/spreadsheetml/2006/main'}
    groups = {key: {'id': key, 'name': name, 'image': f'/assets/products/{key}.png', 'variants': {}} for key, (name, _) in FAMILIES.items()}
    aliases = {name: key for key, (_, names) in FAMILIES.items() for name in names}
    with ZipFile(path) as archive:
        strings = [''.join(si.itertext()) for si in ET.fromstring(archive.read('xl/sharedStrings.xml'))]
        for sheet, name_col, size_col, price_col, unit in [('Sheet1','D','E',None,'Unit 2'), ('Sheet2','C','D',None,'Unit 1'), ('Sheet3','E','F','G','all')]:
            xml = ET.fromstring(archive.read(f'xl/worksheets/{sheet.lower()}.xml'))
            for row in xml.findall('m:sheetData/m:row', ns):
                cells = {}
                for cell in row:
                    value = cell.find('m:v', ns)
                    if value is not None:
                        cells[re.sub(r'\d', '', cell.attrib['r'])] = strings[int(value.text)] if cell.attrib.get('t') == 's' else value.text
                name, size = cells.get(name_col, '').strip(), cells.get(size_col, '').strip()
                if name not in aliases or not size:
                    continue
                group = groups[aliases[name]]
                variant = group['variants'].setdefault(size_key(size), {'size': size, 'units': [], 'prices': [], 'sources': []})
                if unit not in variant['units']: variant['units'].append(unit)
                variant['sources'].append({'sheet': sheet, 'row': int(row.attrib['r']), 'name': name})
                price = cells.get(price_col, '').strip() if price_col else ''
                if price and price not in [p['value'] for p in variant['prices']]:
                    variant['prices'].append({'value': price, 'list': 'RR Industries', 'sheet': sheet, 'row': int(row.attrib['r'])})
    return {'source': 'NEW STOCK LIST 2026', 'sourceUrl': 'https://docs.google.com/spreadsheets/d/1cK37yTSCsZKL_XOmeIMBYgCVZGKNjGzCoeqvoX-Gvxw/edit', 'families': [{**g, 'variants': list(g['variants'].values())} for g in groups.values() if g['variants']]}

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('workbook', type=Path)
    args = parser.parse_args()
    catalogue = read_catalogue(args.workbook)
    destination = ROOT / 'private/product-catalogue.json'
    destination.parent.mkdir(exist_ok=True)
    destination.write_text(json.dumps(catalogue, ensure_ascii=False, indent=2), encoding='utf-8')
    print(f"Prepared {len(catalogue['families'])} product families and {sum(len(g['variants']) for g in catalogue['families'])} size/colour variants. No business records changed.")
