import binascii
import math
import struct
import zlib
from pathlib import Path

SIZE = 256


def lerp(a, b, t):
    return int(a + (b - a) * t)


def in_ellipse(x, y, cx, cy, rx, ry):
    return ((x - cx) / rx) ** 2 + ((y - cy) / ry) ** 2 <= 1


def in_poly(x, y, points):
    inside = False
    j = len(points) - 1
    for i in range(len(points)):
        xi, yi = points[i]
        xj, yj = points[j]
        if ((yi > y) != (yj > y)) and (x < (xj - xi) * (y - yi) / ((yj - yi) or 1) + xi):
            inside = not inside
        j = i
    return inside


def chunk(kind, data):
    return struct.pack(">I", len(data)) + kind + data + struct.pack(">I", binascii.crc32(kind + data) & 0xFFFFFFFF)


pixels = bytearray()
left = (255, 110, 175)
right = (117, 109, 255)
mid = (198, 95, 244)

for y in range(SIZE):
    row = bytearray()
    for x in range(SIZE):
        dx = x - 128
        dy = y - 128
        dist = math.sqrt(dx * dx + dy * dy)
        if dist > 128:
            row.extend((0, 0, 0, 0))
            continue

        t = (x + y) / (SIZE * 2)
        if t < 0.5:
            tt = t / 0.5
            r, g, b = (lerp(left[i], mid[i], tt) for i in range(3))
        else:
            tt = (t - 0.5) / 0.5
            r, g, b = (lerp(mid[i], right[i], tt) for i in range(3))

        # Soft highlight similar to the supplied icon.
        shine = max(0, 1 - math.sqrt((x - 92) ** 2 + (y - 52) ** 2) / 210)
        r = min(255, int(r + 22 * shine))
        g = min(255, int(g + 10 * shine))
        b = min(255, int(b + 18 * shine))

        cat = (
            in_ellipse(x, y, 128, 166, 78, 50)
            or in_poly(x, y, [(62, 154), (72, 61), (126, 112), (100, 156)])
            or in_poly(x, y, [(194, 154), (184, 61), (130, 112), (156, 156)])
        )
        if cat:
            r, g, b = 255, 255, 255

        eye = in_ellipse(x, y, 98, 148, 28, 16) or in_ellipse(x, y, 158, 148, 28, 16)
        nose = in_poly(x, y, [(108, 174), (148, 174), (128, 190)])
        if eye or nose:
            r, g, b = 166, 98, 239

        row.extend((r, g, b, 255))
    pixels.extend(b"\x00" + row)

raw = bytes(pixels)
png = b"".join(
    [
        b"\x89PNG\r\n\x1a\n",
        chunk(b"IHDR", struct.pack(">IIBBBBB", SIZE, SIZE, 8, 6, 0, 0, 0)),
        chunk(b"IDAT", zlib.compress(raw, 9)),
        chunk(b"IEND", b""),
    ]
)

ico = bytearray()
ico.extend(struct.pack("<HHH", 0, 1, 1))
ico.extend(struct.pack("<BBBBHHII", 0, 0, 0, 0, 1, 32, len(png), 22))
ico.extend(png)

Path("src/favicon.ico").write_bytes(ico)
