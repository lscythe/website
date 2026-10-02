"""
Cut the brush font (Ma Shan Zheng) down to the characters the site uses.

The full font covers thousands of hanzi (5.8 MB); the site writes a few
dozen in it. This scans src/ for every CJK character (and CJK punctuation)
and writes just those glyphs as one small WOFF2.

Run it again after adding new characters anywhere in src/:

    python3 scripts/subset-brush-font.py path/to/MaShanZheng-Regular.ttf

(pip install fonttools brotli; the TTF is at
https://fonts.google.com/specimen/Ma+Shan+Zheng, OFL licensed.)
"""

import pathlib
import re
import sys

from fontTools import subset

SRC = pathlib.Path("src")
OUT = pathlib.Path("static/fonts/ma-shan-zheng-subset.woff2")
CJK = re.compile(r"[　-〿㐀-䶿一-鿿豈-﫿＀-￯]")

chars = set()
for path in SRC.rglob("*"):
    if path.suffix in {".svelte", ".ts", ".css", ".md", ".json", ".html"}:
        chars.update(CJK.findall(path.read_text(encoding="utf-8")))

text = "".join(sorted(chars))
options = subset.Options()
options.flavor = "woff2"
options.layout_features = ["*"]
options.name_IDs = ["*"]
font = subset.load_font(sys.argv[1], options)
subsetter = subset.Subsetter(options)
subsetter.populate(text=text)
subsetter.subset(font)
missing = [c for c in text if ord(c) not in font.getBestCmap()]
subset.save_font(font, OUT, options)
print(f"{len(text)} characters -> {OUT} ({OUT.stat().st_size // 1024} KB)")
print("characters:", text)
if missing:
    print("not in the font (will use a fallback):", "".join(missing))
