import glob
import os
import re
import sys

# 逐个 HTML 文件按其所在目录解析相对链接，避免在 demo 根目录统一切析导致误报
pat = re.compile(r'(?:href|src)\s*=\s*"([^"]+)"')
html_files = sorted(glob.glob("**/*.html", recursive=True))
bad = []
total = 0
for f in html_files:
    base = os.path.dirname(f)
    text = open(f, encoding="utf-8").read()
    for url in pat.findall(text):
        if (
            url.startswith("#")
            or url.startswith("http://")
            or url.startswith("https://")
            or url.startswith("mailto:")
            or url.startswith("tel:")
        ):
            continue
        # 剥离 fragment / query（如 ../index.html#about 指向真实存在的 ../index.html），仅校验文件部分
        file_part = url.split("#")[0].split("?")[0]
        if not file_part:
            continue
        total += 1
        target = os.path.normpath(os.path.join(base, file_part))
        if not os.path.exists(target):
            bad.append((f, url, target))

print("checked %d local refs in %d files" % (total, len(html_files)))
if bad:
    for f, url, t in bad:
        print("MISSING:", f, "->", url, "(resolved:", t + ")")
    sys.exit(1)
print("ALL_LINKS_OK")
