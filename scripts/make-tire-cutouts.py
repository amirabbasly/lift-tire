#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
برش لاستیک از روی پس‌زمینهٔ مشکی (keying) + بهینه‌سازی برای وب.

ورودی : frontend/public/images/hero/<name>.png   (لاستیک روی بک‌گراند مشکی —
         همین فایل‌ها با هوش مصنوعی ساخته شده‌اند)
خروجی : frontend/public/images/hero/<name>.webp  (شفاف، کوچک‌شده، آمادهٔ وب)

پس‌زمینهٔ صحنه‌ها (hero-N-bg.jpg) جداگانه و بدون لاستیک ساخته می‌شوند تا
در هیرو فقط لاستیک انیمیت شود. اجرای دوبارهٔ این اسکریپت بی‌خطر است.

لاستیک‌های هیرو روی پس‌زمینهٔ مشکی تولید می‌شوند؛ این اسکریپت با
flood-fill از لبه‌ها پیکسل‌های مشکی را شفاف می‌کند تا لاستیک به‌تنهایی
بماند و در هیرو روی صحنهٔ تیره چسبیده به نظر برسد.
"""
import os
import numpy as np
from PIL import Image, ImageFilter
from scipy import ndimage

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
HERO = os.path.join(ROOT, 'frontend', 'public', 'images', 'hero')

NAMES = ['hero-1-tire', 'hero-2-tire', 'hero-3-tire', 'tire-glow']
DARK = 8        # آستانهٔ «مشکی محض»
FEATHER = 1.2   # نرمی لبه
PAD = 12        # حاشیهٔ ایمن اطراف برش
MAX_W = 820     # بیشینهٔ عرض خروجی (ریتینای دسکتاپ)
QUALITY = 90


def key_black(im):
    """ماسک شفاف‌سازی پس‌زمینهٔ مشکیِ متصل به لبه‌ها."""
    a = np.asarray(im.convert('RGBA')).astype(np.float32)
    lum = a[..., :3].mean(axis=2)
    dark = lum < DARK

    seed = np.zeros_like(dark)
    seed[0, :] = dark[0, :]
    seed[-1, :] = dark[-1, :]
    seed[:, 0] = dark[:, 0]
    seed[:, -1] = dark[:, -1]
    bg = ndimage.binary_propagation(seed, mask=dark)
    bg = ndimage.binary_dilation(bg, iterations=2)  # پاک کردن حلقهٔ تیرهٔ دور لاستیک

    alpha = np.where(bg, 0.0, 1.0)
    alpha = np.asarray(Image.fromarray((alpha * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(FEATHER)), dtype=np.float32) / 255.0
    # اگر تصویر از قبل آلفا دارد، حداقلِ هر دو را نگه دار (اجرای دوباره بی‌خطر است)
    alpha = np.minimum(alpha, a[..., 3] / 255.0)

    out = np.dstack([a[..., :3].astype(np.uint8), (alpha * 255).astype(np.uint8)])
    return Image.fromarray(out, 'RGBA')


def preview(im, cols=46, rows=16):
    a = np.asarray(im)[..., 3]
    small = np.asarray(Image.fromarray(a).resize((cols, rows), Image.BOX)) / 255.0
    for y in range(rows):
        print('   ' + ''.join('#' if small[y, x] > 0.6 else ('+' if small[y, x] > 0.15 else '.') for x in range(cols)))


if __name__ == '__main__':
    for n in NAMES:
        p = os.path.join(HERO, n + '.png')
        if not os.path.exists(p):
            print('-- skip', n); continue
        im = key_black(Image.open(p))
        im = im.crop(im.getbbox()) if im.getbbox() else im
        if im.width > MAX_W:
            im = im.resize((MAX_W, round(im.height * MAX_W / im.width)), Image.LANCZOS)
        out = os.path.join(HERO, n + '.webp')
        im.save(out, 'WEBP', quality=QUALITY, method=6)
        os.remove(p)
        print(f'-- {n}.webp: {im.width}x{im.height}  ({os.path.getsize(out)//1024} KB)')
        preview(im)
    print('done')
