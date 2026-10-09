#!/usr/bin/env python3
"""YASLOGIST AIR — cinematic README hero renderer.

Procedurally renders the animated hero exactly the way the application's own
AIRGL engine describes the world:

  * dot-shell planet on a Fibonacci lattice (13 000 candidates, land kept
    whole, ocean thinned 4/7) classified by the repository's own landmask
    (src/three/airgl/globe/landmask.ts, parsed at render time);
  * great-circle corridor arcs with the repo's apex profile
    (src/three/airgl/geo.ts: slerp + sin(pi*t) lift, arcApexHeight);
  * the five real airport anchors (src/three/airgl/globe/airports.ts),
    CAI rendered with hub eminence;
  * the YASLOGIST monogram geometry from src/components/BrandAir.tsx.

Every animated parameter is a closed-form periodic function of time with an
integer number of cycles per loop, so frame N === frame 0 and the GIF loops
with no visible seam.

Outputs (relative to repo root):
  assets/readme/yaslogist-hero.png   1920x720 static poster
  assets/readme/yaslogist-hero.gif   optimized seamless loop
"""

from __future__ import annotations

import math
import re
import sys
import time
from pathlib import Path

import numpy as np
from PIL import Image, ImageDraw, ImageFilter, ImageFont

REPO = Path(__file__).resolve().parents[3]
OUT = REPO / "assets" / "readme"
FONT_DIR = Path("/usr/share/fonts/truetype/dejavu")

W, H = 1920, 720
FPS = 10
LOOP_S = 8.0
N_FRAMES = int(FPS * LOOP_S)  # 80
POSTER_T = 2.9

# ── palette (repo tokens) ──────────────────────────────────────────────────
BG_TOP = np.array([0.016, 0.030, 0.050])      # #04080D-ish
BG_BOT = np.array([0.024, 0.047, 0.078])
CYAN = np.array([0.0, 0.898, 1.0])            # #00E5FF electric cyan
SKY = np.array([0.220, 0.741, 0.973])         # #38BDF8
HUB = np.array([0.404, 0.910, 0.976])         # #67E8F9 CAI
INK = np.array([0.973, 0.980, 0.988])         # #F8FAFC
DIM = np.array([0.608, 0.690, 0.737])         # #9BB0BC
AMBER = np.array([0.961, 0.620, 0.043])       # #F59E0B (used once, sparingly)

D2R = math.pi / 180.0


# ── repo data ports ────────────────────────────────────────────────────────
def load_landmask():
    src = (REPO / "src/three/airgl/globe/landmask.ts").read_text()

    def grab(name):
        m = re.search(name + r"\s*=\s*`([^`]*)`", src)
        rings = []
        for ring in m.group(1).split(";"):
            pts = [
                [float(v) for v in pair.split(",")]
                for pair in ring.split()
                if "," in pair
            ]
            if pts:
                rings.append(np.array(pts, dtype=np.float64))
        return rings

    return grab("LAND_DATA"), grab("WATER_DATA")


LAND_RINGS, WATER_RINGS = load_landmask()

AIRPORTS = {  # from src/three/airgl/globe/airports.ts
    "CAI": (30.1219, 31.4056, 2.6),
    "FRA": (50.0379, 8.5622, 1.1),
    "DXB": (25.2532, 55.3657, 1.1),
    "AMS": (52.3105, 4.7683, 1.1),
    "PVG": (31.1443, 121.8083, 1.1),
}
CORRIDORS = [("FRA", "CAI"), ("AMS", "CAI"), ("DXB", "CAI"), ("PVG", "CAI")]


def latlon_to_vec3(lat, lon):
    la, lo = lat * D2R, lon * D2R
    c = math.cos(la)
    return np.array([c * math.sin(lo), math.sin(la), c * math.cos(lo)])


def is_land(lat, lon):
    on = False
    for ring in LAND_RINGS:
        if ring[:, 1].min() <= lat <= ring[:, 1].max() and ring[:, 0].min() <= lon <= ring[:, 0].max():
            if _ring_contains(ring, lat, lon):
                on = True
                break
    if not on:
        return False
    return not any(_ring_contains(r, lat, lon) for r in WATER_RINGS)


def _ring_contains(ring, lat, lon):
    inside = False
    n = len(ring)
    j = n - 1
    for i in range(n):
        li, la = ring[i]
        lj, lb = ring[j]
        if (la > lat) != (lb > lat):
            cross = li + (lat - la) * (lj - li) / (lb - la)
            if lon < cross:
                inside = not inside
        j = i
    return inside


def great_circle_point(a, b, t, apex):
    """slerp + sin(pi t) lift — mirrors geo.ts greatCirclePoint."""
    omega = math.acos(max(-1.0, min(1.0, float(a @ b))))
    if omega < 1e-4:
        v = a * (1 - t) + b * t
    else:
        s = math.sin(omega)
        v = a * (math.sin((1 - t) * omega) / s) + b * (math.sin(t * omega) / s)
    v = v / np.linalg.norm(v)
    return v * (1.0 + apex * math.sin(math.pi * t))


def arc_apex(a, b):
    omega = math.acos(max(-1.0, min(1.0, float(a @ b))))
    return min(0.42, max(0.06, omega * 0.24))


# ── small raster toolkit ───────────────────────────────────────────────────
def splat(buf, xs, ys, vals, rgb):
    """Bilinear additive splat of scalar vals (0..1) with color rgb."""
    x0 = np.floor(xs).astype(np.int64)
    y0 = np.floor(ys).astype(np.int64)
    fx = (xs - x0)[:, None]
    fy = (ys - y0)[:, None]
    ok = (x0 >= 0) & (x0 < W - 1) & (y0 >= 0) & (y0 < H - 1)
    for dx, wx in ((0, 1 - fx), (1, fx)):
        for dy, wy in ((0, 1 - fy), (1, fy)):
            w = (wx * wy)[:, 0] * vals * ok
            nz = w > 1e-4
            if not nz.any():
                continue
            idx = (y0[nz] + dy, x0[nz] + dx)
            np.add.at(buf, idx, (w[nz][:, None] * rgb[None, :]))


def glow(buf, cx, cy, radius, sigma, strength, rgb):
    x = np.arange(max(0, int(cx - radius)), min(W, int(cx + radius)))
    y = np.arange(max(0, int(cy - radius)), min(H, int(cy + radius)))
    if len(x) == 0 or len(y) == 0:
        return
    xx, yy = np.meshgrid(x, y)
    d2 = (xx - cx) ** 2 + (yy - cy) ** 2
    a = strength * np.exp(-d2 / (2 * sigma * sigma))
    buf[y[0]:y[-1] + 1, x[0]:x[-1] + 1] += a[:, :, None] * rgb[None, None, :]


def seg_aa(buf, p0, p1, width, alpha, rgb):
    """Antialiased segment via distance field over its bbox."""
    x0, y0 = p0
    x1, y1 = p1
    hw = width * 0.5 + 1.5
    bx0, by0 = int(min(x0, x1) - hw), int(min(y0, y1) - hw)
    bx1, by1 = int(max(x0, x1) + hw), int(max(y0, y1) + hw)
    bx0, by0 = max(0, bx0), max(0, by0)
    bx1, by1 = min(W - 1, bx1), min(H - 1, by1)
    if bx1 <= bx0 or by1 <= by0:
        return
    xx, yy = np.meshgrid(np.arange(bx0, bx1 + 1), np.arange(by0, by1 + 1))
    dx, dy = x1 - x0, y1 - y0
    L2 = dx * dx + dy * dy
    t = np.clip(((xx - x0) * dx + (yy - y0) * dy) / L2, 0, 1) if L2 > 0 else np.zeros_like(xx)
    d = np.sqrt((xx - (x0 + t * dx)) ** 2 + (yy - (y0 + t * dy)) ** 2)
    cov = np.clip(width * 0.5 + 0.7 - d, 0, 1)
    a = (cov * alpha)[:, :, None] * rgb[None, None, :]
    region = buf[by0:by1 + 1, bx0:bx1 + 1]
    if region.shape[2] == 4:
        np.maximum(region[:, :, :3], a, out=region[:, :, :3])
        np.maximum(region[:, :, 3], (cov * alpha), out=region[:, :, 3])
    else:
        np.maximum(region, a, out=region)  # screen-ish: keep the brighter stroke


def polyline(buf, pts, width, alpha, rgb, per_alpha=None):
    for i in range(len(pts) - 1):
        a = alpha if per_alpha is None else per_alpha[i]
        if a <= 0.004:
            continue
        seg_aa(buf, pts[i], pts[i + 1], width, a, rgb)


# ── typography ─────────────────────────────────────────────────────────────
_FONT_CACHE = {}


def font(size, bold=False, mono=False):
    key = (size, bold, mono)
    if key not in _FONT_CACHE:
        name = "DejaVuSansMono.ttf" if mono else ("DejaVuSans-Bold.ttf" if bold else "DejaVuSans.ttf")
        _FONT_CACHE[key] = ImageFont.truetype(str(FONT_DIR / name), size * 3)
    return _FONT_CACHE[key]


def text_sprite(text, size, rgb, bold=False, mono=False, tracking=0.0,
                glow_sigma=None, glow_rgb=None, alpha=1.0):
    """Render text 3x and downscale; returns RGBA float array."""
    f = font(size, bold, mono)
    sp = int(size * 3 * tracking)
    widths = []
    for ch in text:
        w = f.getlength(ch)
        widths.append(w)
    total = sum(widths) + sp * (len(text) - 1)
    ascent, descent = f.getmetrics()
    th = ascent + descent
    pad = int(size * 3 * 0.3)
    img = Image.new("RGBA", (int(total) + pad * 2, int(th) + pad * 2), (0, 0, 0, 0))
    d = ImageDraw.Draw(img)
    x = pad
    for ch, w in zip(text, widths):
        d.text((x, pad), ch, font=f, fill=(255, 255, 255, int(255 * alpha)))
        x += w + sp
    img = img.resize((img.width // 3, img.height // 3), Image.LANCZOS)
    arr = np.asarray(img).astype(np.float64) / 255.0
    if glow_sigma:
        m = int(glow_sigma * 4)
        arr = np.pad(arr, ((m, m), (m, m), (0, 0)))
    a = arr[:, :, 3:4]
    rgbf = np.concatenate([np.ones((arr.shape[0], arr.shape[1], 3)), a], axis=2)
    rgbf[:, :, 0] *= rgb[0]
    rgbf[:, :, 1] *= rgb[1]
    rgbf[:, :, 2] *= rgb[2]
    if glow_sigma:
        ga = Image.fromarray((a[:, :, 0] * 255).astype(np.uint8))
        ga = ga.filter(ImageFilter.GaussianBlur(glow_sigma))
        g = np.asarray(ga).astype(np.float64) / 255.0
        grgb = (rgb if glow_rgb is None else glow_rgb)
        glow_layer = np.concatenate([(g * 0.9)[:, :, None] * grgb[None, None, :], (g * 0.8)[:, :, None]], axis=2)
        rgbf = np.maximum(rgbf, glow_layer)
        rgbf[:, :, 3] = np.maximum(rgbf[:, :, 3], g * 0.8)
    return rgbf


def blit(buf, sprite, x, y, mode="over"):
    h, w = sprite.shape[:2]
    x, y = int(x), int(y)
    cx0, cy0 = max(0, x), max(0, y)
    cx1, cy1 = min(W, x + w), min(H, y + h)
    if cx1 <= cx0 or cy1 <= cy0:
        return
    s = sprite[cy0 - y:cy1 - y, cx0 - x:cx1 - x]
    a = s[:, :, 3:4]
    dst = buf[cy0:cy1, cx0:cx1]
    if mode == "over":
        if dst.shape[2] == 4:
            da = dst[:, :, 3:4]
            rgb = dst[:, :, :3] * (1 - a) + s[:, :, :3] * a
            buf[cy0:cy1, cx0:cx1, :3] = rgb
            buf[cy0:cy1, cx0:cx1, 3:4] = da * (1 - a) + a
        else:
            buf[cy0:cy1, cx0:cx1] = dst * (1 - a) + s[:, :, :3] * a
    else:
        buf[cy0:cy1, cx0:cx1] = dst + s[:, :, :3] * a


# ── static background ──────────────────────────────────────────────────────
def make_background():
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float64)
    t = yy / H
    buf = BG_TOP[None, None, :] * (1 - t)[:, :, None] + BG_BOT[None, None, :] * t[:, :, None]
    # cool column of light behind the globe + faint counter-glow on the left
    g = np.exp(-(((xx - 1352) ** 2) / (2 * 560**2) + ((yy - 360) ** 2) / (2 * 420**2)))
    buf += g[:, :, None] * (np.array([0.010, 0.055, 0.085])[None, None, :])
    g2 = np.exp(-(((xx - 260) ** 2) / (2 * 520**2) + ((yy - 240) ** 2) / (2 * 300**2)))
    buf += g2[:, :, None] * (np.array([0.006, 0.020, 0.040])[None, None, :])
    # deterministic starfield dust
    rng = np.random.default_rng(41)
    n = 170
    sx = rng.uniform(0, W, n)
    sy = rng.uniform(0, H, n)
    sv = rng.uniform(0.02, 0.10, n)
    splat(buf, sx, sy, sv, np.array([0.62, 0.80, 0.90]))
    # hairline frame + corner brackets
    edge = np.array([0.10, 0.30, 0.38])
    for (p0, p1) in [
        ((28, 28), (W - 28, 28)), ((28, H - 28), (W - 28, H - 28)),
        ((28, 28), (28, H - 28)), ((W - 28, 28), (W - 28, H - 28)),
    ]:
        seg_aa(buf, p0, p1, 1.0, 0.35, edge)
    bc = np.array([0.0, 0.898, 1.0])
    L = 26
    for (cx, cy, sx_, sy_) in [(28, 28, 1, 1), (W - 28, 28, -1, 1), (28, H - 28, 1, -1), (W - 28, H - 28, -1, -1)]:
        seg_aa(buf, (cx, cy), (cx + sx_ * L, cy), 2.0, 0.9, bc)
        seg_aa(buf, (cx, cy), (cx, cy + sy_ * L), 2.0, 0.9, bc)
    # bottom hairline the ticker dashes ride on
    seg_aa(buf, (64, H - 72), (W - 64, H - 72), 1.0, 0.5, np.array([0.05, 0.22, 0.30]))
    return buf


# ── static text overlay ────────────────────────────────────────────────────
def make_static_overlay():
    ov = np.zeros((H, W, 4))
    # top-left brand lockup
    lock = text_sprite("YASLOGIST", 15, DIM, bold=True, tracking=0.42)
    blit(ov, lock, 108, 56)
    sep = text_sprite("·", 15, CYAN, bold=True)
    blit(ov, sep, 108 + lock.shape[1] + 14, 56)
    airw = text_sprite("AIR CARGO SYSTEMS", 15, DIM, tracking=0.30)
    blit(ov, airw, 108 + lock.shape[1] + 34, 56)

    # big identity
    title = text_sprite("YASLOGIST AIR", 76, INK, bold=True, tracking=0.14,
                        glow_sigma=8, glow_rgb=CYAN)
    blit(ov, title, 96, 176)
    rule_y = 176 + title.shape[0] + 4
    seg_aa(ov, (100, rule_y), (100 + 460, rule_y), 1.5, 0.55, CYAN)
    stmt = text_sprite("SIMULATION-GRADE AIR FREIGHT COCKPIT", 18, CYAN,
                       bold=True, tracking=0.30)
    blit(ov, stmt, 100, rule_y + 16)

    # spec readout block
    lines = [
        ("IATA 1:6000 VOLUMETRIC", DIM),
        ("AWB MOD-7 CHECK DIGIT", DIM),
        ("GLEC CO2e 0.502 KG/T-KM", DIM),
        ("FRA DXB AMS PVG  ⇄  CAI", HUB),
        ("ULD FIT AKE PMC RKN RAP", DIM),
        ("EN + AR · RTL FIRST-CLASS", DIM),
    ]
    y = rule_y + 58
    for txt, col in lines:
        seg_aa(ov, (102, y + 5), (102, y + 15), 2.0, 0.9, CYAN)
        line = text_sprite(txt, 13.5, col, mono=True, tracking=0.08)
        blit(ov, line, 118, y)
        y += 29

    # top-right telemetry chips
    chip1 = text_sprite("AIRGL · WEBGL2 CORRIDOR GLOBE", 12.5, DIM, mono=True, tracking=0.10)
    blit(ov, chip1, W - 64 - chip1.shape[1], 58)
    chip2 = text_sprite("SIMULATION MODE · NO LIVE FEEDS", 12.5, DIM, mono=True, tracking=0.10)
    blit(ov, chip2, W - 64 - chip2.shape[1], 84)
    global DOT_POS
    DOT_POS = (W - 64 - chip2.shape[1] - 16, 96)

    # bottom-right permanent signature: monogram + wordmark + url
    word = text_sprite("YASLOGIST", 15, INK, bold=True, tracking=0.30)
    blit(ov, word, W - 64 - word.shape[1], H - 62)
    sub = text_sprite("yaslogist.com", 10, DIM, mono=True, tracking=0.16)
    blit(ov, sub, W - 64 - sub.shape[1], H - 44)
    mono_sp = draw_monogram(30)
    blit(ov, mono_sp, W - 64 - word.shape[1] - 16 - mono_sp.shape[1], H - 76)
    return ov


def draw_monogram(size_px):
    """BrandMonogram geometry from src/components/BrandAir.tsx, scaled."""
    s = size_px / 64.0
    sp = np.zeros((size_px + 16, size_px + 16, 4))
    col = HUB

    def P(x, y):
        return (8 + x * s, 8 + y * s)

    def stroke(pts, w, alpha):
        for i in range(len(pts) - 1):
            p0 = P(*pts[i])
            p1 = P(*pts[i + 1])
            seg_aa(sp, p0, p1, w * s, alpha, col)

    # outer circle r29 @ (32,32)
    cx, cy, r = P(32, 32)[0], P(32, 32)[1], 29 * s
    th = np.linspace(0, 2 * math.pi, 220)
    pts = [(cx + r * math.cos(a), cy + r * math.sin(a)) for a in th]
    stroke(pts, 2.2, 1.0)
    # inner meridian ellipse + latitude lines (opacity .55 in the source)
    ex, ey = 12.5 * s, 29 * s
    pts = [(cx + ex * math.cos(a), cy + ey * math.sin(a)) for a in th]
    stroke(pts, 1.6, 0.5)
    for (ya, xb) in [(32, 29), (17.5, 24), (46.5, 24)]:
        stroke([P(32 - xb, ya), P(32 + xb, ya)], 1.6, 0.5)
    # Y·L ligature strokes (width 5, square caps in the source)
    stroke([P(16, 16), P(27.5, 31.5), P(27.5, 49)], 5.0, 1.0)
    stroke([P(39, 16), P(30, 28)], 5.0, 1.0)
    stroke([P(40.5, 20), P(40.5, 48), P(53, 48)], 5.0, 1.0)
    sp[:, :, 3] = sp[:, :, :3].max(axis=2)
    return sp


# ── globe projection ───────────────────────────────────────────────────────
CX, CY, R = 1352, 356, 280
LON0, LAT0 = 58.0, 24.0          # resting view center
SHELL_N = 13000
OCEAN_KEEP = 4 / 7

_SHELL = None
DOT_POS = (0, 0)
LABEL_OFF = {
    "CAI": (-104, 26),
    "FRA": (-70, 6),
    "AMS": (-20, -32),
    "DXB": (14, 20),
    "PVG": (14, 4),
}


def build_shell():
    global _SHELL
    if _SHELL is not None:
        return _SHELL
    golden = math.pi * (3 - math.sqrt(5))
    idx = np.arange(SHELL_N)
    y = 1 - (idx / (SHELL_N - 1)) * 2
    r = np.sqrt(np.clip(1 - y * y, 0, None))
    th = golden * idx
    V = np.stack([r * np.cos(th), y, r * np.sin(th)], axis=1)  # note: cos/sin swap vs geo.ts is a yaw offset only
    lat = np.degrees(np.arcsin(np.clip(V[:, 1], -1, 1)))
    lon = np.degrees(np.arctan2(V[:, 0], V[:, 2]))
    land = np.array([is_land(la, lo) for la, lo in zip(lat, lon)])
    keep = land | ((idx % 7) < 4)
    # solar terminator for a fixed instant (2026-10-09 12:00Z) — subsolar from geo.ts
    day = 282
    decl = -23.44 * math.cos((2 * math.pi / 365.24) * (day + 10))
    b = (2 * math.pi / 364) * (day - 81)
    eot = 9.87 * math.sin(2 * b) - 7.53 * math.cos(b) - 1.5 * math.sin(b)
    lon_s = -15 * (12 + eot / 60 - 12)
    sun = latlon_to_vec3(decl, lon_s)
    _SHELL = (V[keep], lat[keep], lon[keep], land[keep], sun)
    return _SHELL


def rotate(V, yaw, tilt):
    a = (-LON0 + yaw) * D2R
    ca, sa = math.cos(a), math.sin(a)
    x = V[:, 0] * ca + V[:, 2] * sa
    z = -V[:, 0] * sa + V[:, 2] * ca
    t = tilt * D2R
    ct, st = math.cos(t), math.sin(t)
    y2 = V[:, 1] * ct - z * st
    z2 = V[:, 1] * st + z * ct
    return np.stack([x, y2, z2], axis=1)


def project(P3):
    return (CX + R * P3[:, 0], CY - R * P3[:, 1], P3[:, 2])


# ── per-frame render ───────────────────────────────────────────────────────
def render_frame(t, background, overlay, sprites):
    buf = background.copy()
    phase = t / LOOP_S
    yaw = 5.5 * math.sin(2 * math.pi * phase)
    tilt = LAT0 + 1.6 * math.sin(2 * math.pi * phase + math.pi / 3)

    # atmosphere rim
    yy, xx = np.mgrid[0:H, 0:W].astype(np.float64)
    d = np.sqrt((xx - CX) ** 2 + (yy - CY) ** 2)
    rim = np.exp(-((d - R) ** 2) / (2 * 26**2)) * (d > R - 40)
    inner = np.exp(-((d - R + 6) ** 2) / (2 * 10**2))
    buf += (rim * 0.30 + inner * 0.12)[:, :, None] * CYAN[None, None, :] * 0.55

    # dot shell
    V, lat, lon, land, sun = build_shell()
    P3 = rotate(V, yaw, tilt)
    sx, sy, sz = project(P3)
    front = sz > 0.02
    day = (V @ sun) > 0
    base = np.where(land, 1.0, 0.11)
    base = np.where(day, base, base * np.where(land, 0.45, 0.55))
    base = base * np.clip(sz * 2.2, 0.15, 1.0)
    m = front
    # vectorized per-point color: land vs ocean; land gets a soft halo pass
    lm = m & land
    om = m & ~land
    splat(buf, sx[om], sy[om], base[om], SKY * 0.9)
    splat(buf, sx[lm], sy[lm], base[lm], HUB * 0.85 + SKY * 0.15)
    splat(buf, sx[lm] + 0.7, sy[lm], base[lm] * 0.45, HUB * 0.6)
    splat(buf, sx[lm] - 0.7, sy[lm] + 0.7, base[lm] * 0.45, HUB * 0.6)

    # graticule (very dim)
    for la in range(-60, 90, 30):
        pts = []
        for lo in range(-180, 181, 6):
            p = rotate(latlon_to_vec3(la, lo)[None, :], yaw, tilt)[0]
            pts.append(p)
        pts = np.array(pts)
        sxx, syy, szz = project(pts)
        for i in range(len(pts) - 1):
            if szz[i] > 0 and szz[i + 1] > 0:
                seg_aa(buf, (sxx[i], syy[i]), (sxx[i + 1], syy[i + 1]), 1.0,
                       0.05 * min(1, (szz[i] + szz[i + 1])), np.array([0.35, 0.7, 0.85]))
    for lo in range(-180, 180, 30):
        pts = np.array([rotate(latlon_to_vec3(la, lo)[None, :], yaw, tilt)[0] for la in range(-80, 81, 6)])
        sxx, syy, szz = project(pts)
        for i in range(len(pts) - 1):
            if szz[i] > 0 and szz[i + 1] > 0:
                seg_aa(buf, (sxx[i], syy[i]), (sxx[i + 1], syy[i + 1]), 1.0,
                       0.05 * min(1, (szz[i] + szz[i + 1])), np.array([0.35, 0.7, 0.85]))

    # corridor arcs + traveling pulses
    for ci, (a_iata, b_iata) in enumerate(CORRIDORS):
        a = latlon_to_vec3(*AIRPORTS[a_iata][:2])
        b = latlon_to_vec3(*AIRPORTS[b_iata][:2])
        apex = arc_apex(a, b)
        ts = np.linspace(0, 1, 96)
        pts = np.array([great_circle_point(a, b, tt, apex) for tt in ts])
        P3 = rotate(pts, yaw, tilt)
        sxx, syy, szz = project(P3)
        for i in range(len(ts) - 1):
            zmid = (szz[i] + szz[i + 1]) / 2
            al = 0.14 + 0.40 * max(0.0, zmid)
            seg_aa(buf, (sxx[i], syy[i]), (sxx[i + 1], syy[i + 1]), 1.4, al, SKY)
        # two pulses per corridor, integer cycles per loop
        for k in range(2):
            head = (phase * (1 + (ci % 2)) + k * 0.5 + ci * 0.13) % 1.0
            trail_n = 14
            t0 = max(0.0, head - 0.16)
            tt = np.linspace(t0, head, trail_n)
            ppts = np.array([great_circle_point(a, b, q, apex) for q in tt])
            P3p = rotate(ppts, yaw, tilt)
            px, py, pz = project(P3p)
            for i in range(trail_n - 1):
                f = (i + 1) / trail_n
                al = (f ** 2.2) * (0.25 + 0.75 * max(0.0, pz[i]))
                seg_aa(buf, (px[i], py[i]), (px[i + 1], py[i + 1]), 2.2, al, CYAN)
            if pz[-1] > 0:
                glow(buf, px[-1], py[-1], 26, 7.0, 0.55, CYAN)
                splat(buf, np.array([px[-1]]), np.array([py[-1]]), np.array([1.0]), INK)

    # hubs + expanding rings (2 cycles per loop)
    labels = sprites["iata"]
    for iata, (la, lo, em) in AIRPORTS.items():
        p = rotate(latlon_to_vec3(la, lo)[None, :], yaw, tilt)[0]
        hx, hy, hz = CX + R * p[0], CY - R * p[1], p[2]
        if hz <= 0.05:
            continue
        base_r = 3.2 * em
        glow(buf, hx, hy, 30 * em, 9 * em, 0.5 * min(1, hz * 1.6), HUB if em > 2 else SKY)
        splat(buf, np.array([hx]), np.array([hy]), np.array([1.0]), INK if em > 2 else HUB)
        for k in range(2):
            f = (phase * 2 + k * 0.5 + (0.25 if em > 2 else 0.0)) % 1.0
            rr = base_r + f * 26 * em
            al = (1 - f) ** 2 * 0.5 * min(1, hz * 1.8)
            th = np.linspace(0, 2 * math.pi, 64)
            colr = AMBER if em > 2 else HUB
            for i in range(len(th) - 1):
                seg_aa(buf, (hx + rr * math.cos(th[i]), hy + rr * math.sin(th[i])),
                       (hx + rr * math.cos(th[i + 1]), hy + rr * math.sin(th[i + 1])),
                       1.3, al, colr)
        # label sprite, hand-tuned per hub to avoid arc/label collisions
        ox, oy = LABEL_OFF[iata]
        lx = hx + ox - (labels[iata].shape[1] if ox < 0 else 0)
        ly = hy + oy
        a_mask = labels[iata][:, :, 3:4] * min(1.0, hz * 2.2)
        spr = np.concatenate([labels[iata][:, :, :3], a_mask], axis=2)
        blit(buf, spr, lx, ly)
        if iata == "CAI":
            cc = sprites["cai_coord"]
            ca = cc[:, :, 3:4] * min(0.8, hz * 2.0)
            blit(buf, np.concatenate([cc[:, :, :3], ca], axis=2), lx - 2, ly + 26)

    # orbital ring: tilted ellipse with a traveler (2 cycles per loop)
    rot = -0.32
    erx, ery = R * 1.32, R * 0.44
    th = np.linspace(0, 2 * math.pi, 200)
    ex = CX + erx * np.cos(th) * math.cos(rot) - ery * np.sin(th) * math.sin(rot)
    ey = CY + erx * np.cos(th) * math.sin(rot) + ery * np.sin(th) * math.cos(rot)
    for i in range(len(th) - 1):
        seg_aa(buf, (ex[i], ey[i]), (ex[i + 1], ey[i + 1]), 1.0, 0.30, SKY)
    oa = 2 * math.pi * (phase * 2 % 1.0)
    ox = CX + erx * math.cos(oa) * math.cos(rot) - ery * math.sin(oa) * math.sin(rot)
    oy = CY + erx * math.cos(oa) * math.sin(rot) + ery * math.sin(oa) * math.cos(rot)
    glow(buf, ox, oy, 20, 5.5, 0.5, CYAN)
    splat(buf, np.array([ox]), np.array([oy]), np.array([1.0]), INK)

    # rotating radar sweep across the globe (1 rev per loop)
    ang = 2 * math.pi * phase
    for trail in range(10):
        a2 = ang - trail * 0.035
        al = 0.22 * (1 - trail / 10)
        seg_aa(buf, (CX, CY), (CX + R * 0.98 * math.cos(a2), CY + R * 0.98 * math.sin(a2)), 1.2, al, CYAN)

    # static overlay + dynamic title light sweep
    a = overlay[:, :, 3:4]
    buf = buf * (1 - a) + overlay[:, :, :3] * a

    # title sweep: a soft light streak crosses the frame once per loop,
    # entering and exiting fully off-canvas so the loop seam is identical
    ty0, ty1 = 200, 430
    bx = -220 + phase * (W + 440)
    win = np.sin(np.clip((yy - ty0) / (ty1 - ty0), 0, 1) * np.pi) ** 1.5
    band = np.exp(-((xx - bx) ** 2) / (2 * 38**2)) * win
    buf += band[:, :, None] * CYAN[None, None, :] * 0.05

    # bottom ticker dashes (2 cycles per loop)
    period = 46
    off = (phase * 2 % 1.0) * period
    x = 300 + off
    while x < W - 70:
        seg_aa(buf, (x, H - 72), (x + 18, H - 72), 2.0, 0.55, CYAN)
        x += period

    # blinking status dot on chip2 (2 cycles, square)
    on = (phase * 2) % 1.0 < 0.6
    dx, dy = DOT_POS
    glow(buf, dx, dy, 9, 2.8, 0.7 if on else 0.12, AMBER)
    splat(buf, np.array([dx]), np.array([dy]), np.array([0.9 if on else 0.25]), AMBER)

    # vignette + grade
    vg = 1.0 - 0.34 * np.clip(((xx - W / 2) / (W / 2)) ** 2 + ((yy - H / 2) / (H / 2)) ** 2, 0, 1)
    buf *= vg[:, :, None] ** 0.9
    return np.clip(buf, 0, 1)


def bloom(img):
    arr = np.asarray(img).astype(np.float64) / 255.0
    bright = np.clip((arr[:, :, :3].max(axis=2) - 0.52) * 2.2, 0, 1)
    b = Image.fromarray((bright * 255).astype(np.uint8)).resize((W // 4, H // 4))
    b = b.filter(ImageFilter.GaussianBlur(9))
    b = b.resize((W, H), Image.LANCZOS)
    ba = np.asarray(b).astype(np.float64) / 255.0
    out = arr[:, :, :3] + ba[:, :, None] * np.array([0.16, 0.55, 0.70])[None, None, :]
    out = np.clip(out, 0, 1)
    return (out * 255).astype(np.uint8)


def main():
    t0 = time.time()
    OUT.mkdir(parents=True, exist_ok=True)
    background = make_background()
    overlay = make_static_overlay()
    sprites = {
        "iata": {k: text_sprite(k, 13, HUB if k == "CAI" else DIM, mono=True,
                                bold=True, tracking=0.18,
                                glow_sigma=3 if k == "CAI" else None)
                 for k in AIRPORTS},
        "cai_coord": text_sprite("30.12N 31.41E", 9.5, DIM, mono=True, tracking=0.10),
    }

    mode = sys.argv[1] if len(sys.argv) > 1 else "all"
    frames_dir = Path("/tmp/hero_frames")
    frames_dir.mkdir(parents=True, exist_ok=True)

    if mode in ("all", "poster"):
        buf = render_frame(POSTER_T, background, overlay, sprites)
        img = Image.fromarray(bloom(Image.fromarray((buf * 255).astype(np.uint8))))
        img.save(OUT / "yaslogist-hero.png")
        print("poster saved", time.time() - t0)

    if mode in ("all", "frames"):
        for i in range(N_FRAMES):
            t = i / FPS
            buf = render_frame(t, background, overlay, sprites)
            img = Image.fromarray(bloom(Image.fromarray((buf * 255).astype(np.uint8))))
            img.save(frames_dir / f"f_{i:03d}.png")
            if i % 10 == 0:
                print(f"frame {i}/{N_FRAMES} {time.time() - t0:.1f}s", flush=True)
    print("done", time.time() - t0)


if __name__ == "__main__":
    main()
