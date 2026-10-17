"""Render the geometry of public/brand/meus-jogos.svg for installed-app icons.
Requires Pillow. No existing images are used or modified as input.
"""
from pathlib import Path
from PIL import Image, ImageDraw

root = Path(__file__).resolve().parents[1]
folder = root / 'public/brand'
scale = 16
image = Image.new('RGBA', (64 * scale, 64 * scale))
draw = ImageDraw.Draw(image)

def box(values):
    return tuple(v * scale for v in values)

def line(points, width=1.6):
    draw.line([(x * scale, y * scale) for x, y in points], fill='#f4f1e9', width=round(width * scale), joint='curve')

draw.rounded_rectangle(box((0, 0, 64, 64)), radius=15 * scale, fill='#203c30')
draw.rounded_rectangle(box((14, 10, 51, 54)), radius=4 * scale, outline='#f4f1e9', width=2 * scale)
line([(22, 11), (22, 53)])
line([(22, 32), (50, 32)])
line([(32, 11), (32, 17), (42, 17), (42, 11)])
line([(32, 53), (32, 47), (42, 47), (42, 53)])
draw.ellipse(box((29, 25, 43, 39)), outline='#f4f1e9', width=round(1.6 * scale))
draw.polygon([(x * scale, y * scale) for x, y in [(43, 0), (53, 0), (53, 22), (48, 18), (43, 22)]], fill='#d08b58')
for name, size in [('icon-192', 192), ('icon-512', 512), ('apple-touch-icon', 180), ('favicon-32', 32)]:
    image.resize((size, size), Image.Resampling.LANCZOS).save(folder / f'{name}.png')
image.resize((256, 256), Image.Resampling.LANCZOS).save(root / 'public/favicon.ico', sizes=[(16, 16), (32, 32), (48, 48), (64, 64)])
