from pathlib import Path
import re

root = Path("src")
pattern = re.compile(r"https://tse-mm\.bing\.com/th\?q=[^\)\"']+")
changed = 0

for path in list(root.rglob("*.njk")) + list(root.rglob("*.md")):
    text = path.read_text(encoding="utf-8")
    new_text, count = pattern.subn("/assets/cover.svg", text)
    if count:
        path.write_text(new_text, encoding="utf-8")
        changed += count

print(changed)
