#!/usr/bin/env python3
"""
Generate PWA placeholder icons.
Run once to create icons/icon-192.png and icons/icon-512.png

Usage:
    python generate_icons.py
    # requires: pip install Pillow
"""

import os
import sys

try:
    from PIL import Image, ImageDraw, ImageFont
except ImportError:
    print("Install Pillow: pip install Pillow")
    sys.exit(1)

os.makedirs("icons", exist_ok=True)

def make_icon(size: int, filename: str):
    img  = Image.new("RGB", (size, size), color=(26, 35, 126))  # navy
    draw = ImageDraw.Draw(img)

    # Orange circle
    margin = size // 8
    draw.ellipse(
        [margin, margin, size - margin, size - margin],
        fill=(255, 107, 0),  # saffron
    )

    # Book emoji-style text
    font_size = size // 3
    try:
        font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", font_size)
    except Exception:
        font = ImageFont.load_default()

    text = "E"
    bbox = draw.textbbox((0, 0), text, font=font)
    tw, th = bbox[2] - bbox[0], bbox[3] - bbox[1]
    draw.text(
        ((size - tw) // 2, (size - th) // 2),
        text,
        fill="white",
        font=font,
    )

    img.save(filename, "PNG")
    print(f"  Created: {filename} ({size}x{size})")


make_icon(192, "icons/icon-192.png")
make_icon(512, "icons/icon-512.png")
print("Done! Icons saved to icons/")
