import glob
from html.parser import HTMLParser


class Checker(HTMLParser):
    def __init__(self):
        super().__init__()
        self.stack = []
        self.void = {"meta", "link", "br", "img", "input", "hr"}
        self.errors = []

    def handle_starttag(self, tag, attrs):
        if tag not in self.void:
            self.stack.append(tag)

    def handle_endtag(self, tag):
        if tag in self.void:
            return
        if not self.stack:
            self.errors.append("unexpected closing tag: " + tag)
            return
        if self.stack[-1] == tag:
            self.stack.pop()
        else:
            self.errors.append(
                "mismatch: expected </%s> got </%s>" % (self.stack[-1], tag)
            )


files = sorted(glob.glob("**/*.html", recursive=True))
if not files:
    raise SystemExit("no html files found")

ok = True
for f in files:
    c = Checker()
    c.feed(open(f, encoding="utf-8").read())
    if c.errors or c.stack:
        ok = False
        print("FAIL:", f, "errors:", c.errors, "unclosed:", c.stack)
    else:
        print("parsed OK:", f)

if ok:
    print("ALL_HTML_OK")
