from PIL import Image, ImageDraw, ImageFont, ImageFilter
import os, math, random

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PUB = os.path.join(ROOT, 'frontend', 'public')
FONT_BOLD = '/home/user/assets-src/fonts/barlow-condensed-latin-700-normal.ttf'
FONT_SEMI = '/home/user/assets-src/fonts/barlow-condensed-latin-600-normal.ttf'

BRANDS = [
    ('michelin', 'MICHELIN', 'circle'),
    ('bridgestone', 'BRIDGESTONE', 'bars'),
    ('goodyear', 'GOODYEAR', 'wing'),
    ('continental', 'CONTINENTAL', 'hex'),
    ('pirelli', 'PIRELLI', 'diamond'),
    ('hankook', 'HANKOOK', 'arc'),
    ('kumho', 'KUMHO', 'tri'),
    ('yokohama', 'YOKOHAMA', 'ring'),
    ('barz', 'BARZ', 'shield'),
    ('kavir', 'KAVIR', 'sun'),
]

def spaced_text(draw, xy, text, font, fill, tracking=0.0):
    x, y = xy
    for ch in text:
        draw.text((x, y), ch, font=font, fill=fill)
        x += draw.textlength(ch, font=font) + tracking

def measure(text, font, tracking=0.0):
    d = ImageDraw.Draw(Image.new('RGB', (10, 10)))
    return sum(d.textlength(c, font=font) for c in text) + tracking * max(0, len(text) - 1)

def mark(draw, kind, cx, cy, r, color):
    if kind == 'circle':
        draw.ellipse([cx - r, cy - r, cx + r, cy + r], outline=color, width=max(2, r // 6))
        draw.ellipse([cx - r * .45, cy - r * .45, cx + r * .45, cy + r * .45], fill=color)
    elif kind == 'bars':
        for i in (-1, 0, 1):
            draw.rounded_rectangle([cx - r + i * r * .55, cy - r * .8, cx - r + i * r * .55 + r * .3, cy + r * .8], radius=r * .12, fill=color)
    elif kind == 'wing':
        draw.polygon([(cx - r, cy + r * .5), (cx, cy - r * .8), (cx + r, cy + r * .5), (cx, cy + r * .1)], fill=color)
    elif kind == 'hex':
        pts = [(cx + r * math.cos(math.pi / 3 * i - math.pi / 2), cy + r * math.sin(math.pi / 3 * i - math.pi / 2)) for i in range(6)]
        draw.polygon(pts, outline=color, width=max(2, r // 5))
        draw.polygon([(cx + r * .5 * math.cos(math.pi / 3 * i - math.pi / 2), cy + r * .5 * math.sin(math.pi / 3 * i - math.pi / 2)) for i in range(6)], fill=color)
    elif kind == 'diamond':
        draw.polygon([(cx, cy - r), (cx + r * .7, cy), (cx, cy + r), (cx - r * .7, cy)], outline=color, width=max(2, r // 5))
    elif kind == 'arc':
        draw.arc([cx - r, cy - r, cx + r, cy + r], 200, 340, fill=color, width=max(3, r // 4))
        draw.arc([cx - r * .55, cy - r * .55, cx + r * .55, cy + r * .55], 20, 160, fill=color, width=max(3, r // 4))
    elif kind == 'tri':
        draw.polygon([(cx, cy - r), (cx + r, cy + r * .7), (cx - r, cy + r * .7)], fill=color)
    elif kind == 'ring':
        draw.ellipse([cx - r, cy - r, cx + r, cy + r], outline=color, width=max(3, r // 4))
        draw.ellipse([cx - r * .4, cy - r * .4, cx + r * .4, cy + r * .4], outline=color, width=max(2, r // 6))
    elif kind == 'shield':
        draw.polygon([(cx - r * .8, cy - r), (cx + r * .8, cy - r), (cx + r * .8, cy + r * .3), (cx, cy + r), (cx - r * .8, cy + r * .3)], fill=color)
    elif kind == 'sun':
        draw.ellipse([cx - r * .55, cy - r * .55, cx + r * .55, cy + r * .55], fill=color)
        for i in range(8):
            a = math.pi / 4 * i
            draw.line([(cx + math.cos(a) * r * .7, cy + math.sin(a) * r * .7), (cx + math.cos(a) * r, cy + math.sin(a) * r)], fill=color, width=max(2, r // 7))

def make_logo(name, text, kind, color, path, W=520, H=160):
    img = Image.new('RGBA', (W, H), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    font = ImageFont.truetype(FONT_BOLD, 62)
    tracking = 4
    tw = measure(text, font, tracking)
    mark_r = 30
    gap = 18
    total = mark_r * 2 + gap + tw
    x = (W - total) / 2
    mark(d, kind, x + mark_r, H / 2, mark_r, color)
    spaced_text(d, (x + mark_r * 2 + gap, H / 2 - 32), text, font, color, tracking)
    img.save(path, 'PNG')


def make_brands():
    out = os.path.join(PUB, 'images/brands')
    os.makedirs(out, exist_ok=True)
    for slug, text, kind in BRANDS:
        make_logo(slug, text, kind, (34, 38, 43, 255), os.path.join(out, f'{slug}.png'))
        make_logo(slug, text, kind, (255, 255, 255, 255), os.path.join(out, f'{slug}-light.png'))
    print('brands ok')

def rim_mark(size=512, bg=None, accent=(255, 106, 19, 255)):
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    c = size / 2
    r = size * 0.47
    if bg:
        d.ellipse([c - r, c - r, c + r, c + r], fill=bg)
    d.ellipse([c - r, c - r, c + r, c + r], outline=(58, 65, 72, 255), width=int(size * 0.095))
    for i in range(16):
        a = math.pi * 2 * i / 16
        col = accent if i % 4 == 0 else (42, 48, 54, 255)
        w = int(size * 0.048) if i % 4 == 0 else int(size * 0.032)
        d.line([(c + math.cos(a) * r * 0.68, c + math.sin(a) * r * 0.68),
                (c + math.cos(a) * r * 0.88, c + math.sin(a) * r * 0.88)], fill=col, width=w)
    ir = r * 0.52
    d.ellipse([c - ir, c - ir, c + ir, c + ir], fill=(36, 42, 47, 255) if bg else (17, 20, 23, 255))
    # arrow mark
    d.polygon([(c, c - ir * 0.62), (c + ir * 0.52, c + ir * 0.1), (c + ir * 0.2, c + ir * 0.1),
               (c + ir * 0.2, c + ir * 0.55), (c - ir * 0.2, c + ir * 0.55), (c - ir * 0.2, c + ir * 0.1),
               (c - ir * 0.52, c + ir * 0.1)], fill=accent)
    return img

def make_icons():
    icon = rim_mark(512, bg=(17, 20, 23, 255))
    icon.save(os.path.join(PUB, 'favicon-64.png'))
    Image.open(os.path.join(PUB, 'favicon-64.png')).resize((64, 64), Image.LANCZOS).save(os.path.join(PUB, 'favicon-64.png'))
    apple = Image.new('RGBA', (180, 180), (17, 20, 23, 255))
    m = rim_mark(180, bg=None)
    apple.alpha_composite(m, (0, 0))
    apple.convert('RGB').save(os.path.join(PUB, 'apple-touch-icon.png'))
    rim_mark(512, bg=(17, 20, 23, 255)).save(os.path.join(PUB, 'icon-512.png'))
    print('icons ok')

def make_wordmarks():
    W, H = 900, 260
    for variant, txt_col, sub_col in (('light', (255, 255, 255, 255), (255, 255, 255, 140)), ('dark', (20, 24, 28, 255), (107, 114, 128, 255))):
        img = Image.new('RGBA', (W, H), (0, 0, 0, 0))
        m = rim_mark(220, bg=(17, 20, 23, 255) if variant == 'light' else (245, 246, 247, 255))
        img.alpha_composite(m, (20, 20))
        d = ImageDraw.Draw(img)
        f_big = ImageFont.truetype(FONT_BOLD, 92)
        f_small = ImageFont.truetype(FONT_SEMI, 30)
        spaced_text(d, (275, 52), 'LIFT', f_big, txt_col, 6)
        spaced_text(d, (275, 138), 'TIRE', f_big, (255, 106, 19, 255), 6)
        spaced_text(d, (470, 118), 'GRIP THE ROAD', f_small, sub_col, 6)
        img.save(os.path.join(PUB, f'logo-{variant}.png'))
    print('wordmarks ok')

make_brands()
make_icons()
make_wordmarks()
