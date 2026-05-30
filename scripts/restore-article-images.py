from pathlib import Path
from urllib.parse import quote
import re

root = Path("src/blog")
pattern = re.compile(r"!\[([^\]]+)\]\(/assets/cover\.svg\)")
changed = 0

for path in root.glob("*.md"):
    text = path.read_text(encoding="utf-8")

    def repl(match):
        alt = match.group(1)
        return f"![{alt}](https://tse-mm.bing.com/th?q={quote(alt)})"

    new_text, count = pattern.subn(repl, text)
    if count:
        path.write_text(new_text, encoding="utf-8")
        changed += count

print(changed)
