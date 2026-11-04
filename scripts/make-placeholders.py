from PIL import Image, ImageDraw, ImageFilter, ImageChops
import os, math

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PUB = os.path.join(ROOT, 'frontend', 'public')
P = lambda *a: os.path.join(PUB, *a)

def white_to_alpha(src, dst, thresh=244, feather=10):
    img = Image.open(src).convert('RGBA')
    px = img.load()
    w, h = img.size
    for y in range(h):
        for x in range(w):
            r, g, b, a = px[x, y]
            m = (r + g + b) / 3
            if m >= thresh:
                px[x, y] = (r, g, b, 0)
            elif m > thresh - feather:
                px[x, y] = (r, g, b, int(255 * (thresh - m) / feather))
    img.save(dst)

def crop_resize(src, dst, w, h, box=None, quality=88):
    img = Image.open(src).convert('RGB')
    if box:
        img = img.crop(box)
    sw, sh = img.size
    scale = max(w / sw, h / sh)
    img = img.resize((int(sw * scale) + 1, int(sh * scale) + 1), Image.LANCZOS)
    x = (img.width - w) // 2
    y = (img.height - h) // 2
    img = img.crop((x, y, x + w, y + h))
    img.save(dst, quality=quality)

# 1) tire cutout for hero
white_to_alpha(P('images/products/tire-passenger-a.png'), P('images/hero/tire-cutout.png'))

# 2) blog covers from hero stills
crop_resize(P('images/hero/hero-1.jpg'), P('images/blog/blog-1.jpg'), 1200, 750)
crop_resize(P('images/hero/hero-3.jpg'), P('images/blog/blog-2.jpg'), 1200, 750)
crop_resize(P('images/banners/category-passenger.jpg'), P('images/blog/blog-3.jpg'), 1200, 750)

# 3) offer + strip banners
crop_resize(P('images/hero/hero-2.jpg'), P('images/banners/offer-month.jpg'), 1200, 900)
crop_resize(P('images/hero/hero-3.jpg'), P('images/banners/strip-offer.jpg'), 1600, 400)

# 4) fallback product images (replaced by AI art later)
import shutil
for name in ['tire-passenger-b.png', 'tire-truck.png', 'tire-winter.png', 'rim-alloy.png']:
    if not os.path.exists(P('images/products', name)):
        shutil.copy(P('images/products/tire-passenger-a.png'), P('images/products', name))
if not os.path.exists(P('images/products/accessory-tube.png')):
    shutil.copy(P('images/products/tire-passenger-a.png'), P('images/products/accessory-tube.png'))

# tread detail crop on white
if not os.path.exists(P('images/products/tire-detail.png')):
    im = Image.open(P('images/products/tire-passenger-a.png')).convert('RGB')
    w, h = im.size
    im.crop((int(w*0.12), int(h*0.12), int(w*0.62), int(h*0.62))).resize((800, 800), Image.LANCZOS).save(P('images/products/tire-detail.png'))

# 5) clay-ish placeholder icons (temporary – replaced with AI art)
def clay_icon(dst, glyph, color=(255, 106, 19), size=256):
    img = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    pad = 18
    # soft shadow
    sh = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    ImageDraw.Draw(sh).rounded_rectangle([pad, pad + 10, size - pad, size - pad + 10], radius=52, fill=(17, 20, 23, 90))
    sh = sh.filter(ImageFilter.GaussianBlur(12))
    img.alpha_composite(sh)
    # base with vertical gradient
    grad = Image.new('RGBA', (size, size), (0, 0, 0, 0))
    gd = ImageDraw.Draw(grad)
    for i in range(size):
        t = i / size
        c = tuple(int(a + (b - a) * t) for a, b in zip((252, 253, 254), (226, 231, 236)))
        gd.line([(0, i), (size, i)], fill=c + (255,))
    mask = Image.new('L', (size, size), 0)
    ImageDraw.Draw(mask).rounded_rectangle([pad, pad, size - pad, size - pad], radius=54, fill=255)
    img.paste(grad, (0, 0), mask)
    d.rounded_rectangle([pad, pad, size - pad, size - pad], radius=54, outline=(255, 255, 255, 200), width=3)
    # glyph
    cx = cy = size / 2
    r = size * 0.2
    if glyph == 'truck':
        d.rounded_rectangle([cx - r*1.6, cy - r*0.7, cx + r*0.4, cy + r*0.75], radius=10, fill=color)
        d.rounded_rectangle([cx + r*0.4, cy - r*0.25, cx + r*1.55, cy + r*0.75], radius=10, fill=color)
        d.ellipse([cx - r*1.1, cy + r*0.55, cx - r*0.4, cy + r*1.25], fill=(40, 44, 48))
        d.ellipse([cx + r*0.8, cy + r*0.55, cx + r*1.5, cy + r*1.25], fill=(40, 44, 48))
    elif glyph == 'shield':
        d.polygon([(cx - r*1.3, cy - r*1.2), (cx + r*1.3, cy - r*1.2), (cx + r*1.3, cy + r*0.1),
                   (cx, cy + r*1.4), (cx - r*1.3, cy + r*0.1)], fill=color)
        d.line([(cx - r*0.55, cy - r*0.1), (cx - r*0.1, cy + r*0.4), (cx + r*0.7, cy - r*0.5)], fill=(255, 255, 255), width=14, joint='curve')
    elif glyph == 'card':
        d.rounded_rectangle([cx - r*1.5, cy - r*0.9, cx + r*1.5, cy + r*0.9], radius=14, fill=color)
        d.rectangle([cx - r*1.5, cy - r*0.35, cx + r*1.5, cy + r*0.05], fill=(255, 255, 255, 210))
        d.ellipse([cx + r*0.45, cy + r*0.35, cx + r*0.95, cy + r*0.8], fill=(255, 255, 255))
    elif glyph == 'headset':
        d.arc([cx - r*1.25, cy - r*1.25, cx + r*1.25, cy + r*1.25], 180, 360, fill=color, width=18)
        d.rounded_rectangle([cx - r*1.45, cy - r*0.15, cx - r*0.85, cy + r*0.8], radius=10, fill=color)
        d.rounded_rectangle([cx + r*0.85, cy - r*0.15, cx + r*1.45, cy + r*0.8], radius=10, fill=color)
    elif glyph == 'return':
        d.arc([cx - r*1.25, cy - r*1.25, cx + r*1.25, cy + r*1.25], 40, 320, fill=color, width=20)
        d.polygon([(cx + r*0.55, cy - r*1.45), (cx + r*1.15, cy - r*0.65), (cx + r*0.1, cy - r*0.7)], fill=color)
    elif glyph == 'home':
        d.polygon([(cx, cy - r*1.25), (cx + r*1.3, cy - r*0.1), (cx - r*1.3, cy - r*0.1)], fill=color)
        d.rounded_rectangle([cx - r*1.0, cy - r*0.15, cx + r*1.0, cy + r*1.15], radius=8, fill=color)
    elif glyph == 'shop':
        d.rounded_rectangle([cx - r*1.3, cy - r*0.5, cx + r*1.3, cy + r*1.2], radius=10, fill=color)
        d.polygon([(cx - r*1.45, cy - r*0.5), (cx + r*1.45, cy - r*0.5), (cx + r*1.15, cy - r*1.3), (cx - r*1.15, cy - r*1.3)], fill=color)
    elif glyph == 'cart':
        d.line([(cx - r*1.4, cy - r*1.05), (cx - r*0.9, cy - r*1.05), (cx - r*0.4, cy + r*0.55), (cx + r*1.2, cy + r*0.55)], fill=color, width=16, joint='curve')
        d.line([(cx - r*0.75, cy - r*0.5), (cx + r*1.35, cy - r*0.5), (cx + r*1.1, cy + r*0.15), (cx - r*0.55, cy + r*0.15)], fill=color, width=16, joint='curve')
        d.ellipse([cx - r*0.55, cy + r*0.85, cx + r*0.05, cy + r*1.35], fill=(40, 44, 48))
        d.ellipse([cx + r*0.65, cy + r*0.85, cx + r*1.25, cy + r*1.35], fill=(40, 44, 48))
    elif glyph == 'user':
        d.ellipse([cx - r*0.6, cy - r*1.2, cx + r*0.6, cy], fill=color)
        d.pieslice([cx - r*1.25, cy + r*0.05, cx + r*1.25, cy + r*2.4], 180, 360, fill=color)
    img.save(dst)

icons = [
    ('service-shipping', 'truck'), ('service-authentic', 'shield'), ('service-payment', 'card'),
    ('service-consult', 'headset'), ('service-return', 'return'),
    ('nav-home', 'home'), ('nav-shop', 'shop'), ('nav-cart', 'cart'), ('nav-user', 'user'),
]
for name, glyph in icons:
    path = P('images/icons', f'{name}.png')
    if not os.path.exists(path):
        clay_icon(path, glyph)
print('placeholders ok')
