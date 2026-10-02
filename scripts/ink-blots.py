"""
Watercolour ink blots, as WebP images whose alpha is the ink.

Used as CSS masks (splashes, ink drops, the theme-change wash) and drawn
into the hero painting. Ink on xuan paper bleeds along the fibres, so the
edge is built from noise that is fine around the rim and long along the
radius: the blot ends in a feathered, hairy fringe rather than a line.

    python3 scripts/ink-blots.py
"""

import os

import numpy as np
from PIL import Image, ImageDraw, ImageFilter

SIZE = 512
OUT = "static/ink"


def value_noise(shape, cells, rng):
    """Smooth noise in [0, 1]: a random grid of `cells` upsampled bicubically."""
    grid = rng.random((cells[0], cells[1])).astype(np.float32)
    img = Image.fromarray((grid * 255).astype(np.uint8)).resize((shape[1], shape[0]), Image.BICUBIC)
    return np.asarray(img, dtype=np.float32) / 255.0


def fbm(shape, base, octaves, rng, aspect=(1, 1)):
    total = np.zeros(shape, np.float32)
    amp, norm = 1.0, 0.0
    for o in range(octaves):
        cells = (max(2, int(base * aspect[0] * 2**o)), max(2, int(base * aspect[1] * 2**o)))
        total += value_noise(shape, cells, rng) * amp
        norm += amp
        amp *= 0.5
    return total / norm


def smoothstep(e0, e1, x):
    t = np.clip((x - e0) / (e1 - e0), 0, 1)
    return t * t * (3 - 2 * t)


def polar(cx=0.5, cy=0.5):
    ys, xs = np.mgrid[0:SIZE, 0:SIZE].astype(np.float32) / SIZE
    dx, dy = xs - cx, ys - cy
    return np.hypot(dx, dy), np.arctan2(dy, dx), xs, ys


def fibre_field(rng, theta, r, rim_detail=900, radial_detail=6):
    """Noise sampled in polar space: busy around the rim, stretched radially."""
    p = fbm((1024, 256), 1, 4, rng, aspect=(rim_detail / 4, radial_detail / 4))
    ti = ((theta + np.pi) / (2 * np.pi) * 1023).astype(int) % 1024
    ri = np.clip(r / 0.71 * 255, 0, 255).astype(int)
    return p[ti, ri]


def blot(seed, radius=0.31, ragged=0.22, feather=0.035, hole=None, rim_dark=0.25, density=0.92):
    rng = np.random.default_rng(seed)
    r, theta, xs, ys = polar()
    # Outline: broad lobes around the circle, then lumpier "cauliflower"
    # blooms where the wet edge pushed out unevenly.
    # (2D noise, so the outline has no seam where the angle wraps around.)
    lobes = fbm((SIZE, SIZE), 2, 3, rng)
    R = radius * (1 + (lobes - 0.5) * 2 * ragged)
    lumps = fbm((SIZE, SIZE), 10, 4, rng)
    edge = R + (lumps - 0.5) * radius * 0.35
    # Fuzzy fringe: within a narrow band past the edge, fine paper fibres
    # carry ink out further in some places than others.
    fuzz = fbm((SIZE, SIZE), 90, 2, rng)
    reach = (r - edge) / feather  # 0 at the edge, 1 at the outer fringe
    alpha = 1 - smoothstep(-0.35, 0.15, reach)
    fringe = (fuzz > 0.42 + 0.5 * np.clip(reach, 0, 1)) * (reach < 1) * (1 - np.clip(reach, 0, 1)) * 0.8
    alpha = np.maximum(alpha, fringe)

    # Body: uneven pigment, darker where the wet edge dried.
    body = density * (0.78 + 0.22 * fbm((SIZE, SIZE), 3, 4, rng))
    body += rim_dark * np.exp(-((reach * feather / (radius * 0.12)) ** 2))
    if hole is not None:
        hx, hy, hr = hole
        warp = (fbm((SIZE, SIZE), 5, 3, rng) - 0.5) * hr * 1.2
        d = (np.hypot(xs - hx, ys - hy) + warp) / hr
        body *= 1 - 0.95 * np.exp(-(d**2) * 1.6)
    grain = 0.88 + 0.12 * fbm((SIZE, SIZE), 70, 2, rng)
    return np.clip(alpha * body * grain, 0, 1)


def scribbles(seed, count, radius, width):
    """Dry-brush loops dragged across the blot, streaked where bristles ran dry."""
    rng = np.random.default_rng(seed)
    img = Image.new("L", (SIZE, SIZE), 0)
    draw = ImageDraw.Draw(img)
    for _ in range(count):
        a = rng.uniform(0, 2 * np.pi)
        rr = rng.uniform(0.08, radius * 0.8)
        da = rng.uniform(0.04, 0.09) * rng.choice([-1, 1])
        w = rng.uniform(width * 0.4, width)
        steps = int(rng.integers(40, 90))
        pts = []
        for i in range(steps):
            a += da + rng.normal(0, 0.02)
            rr = np.clip(rr + rng.normal(0, 0.006), 0.04, radius)
            pts.append((SIZE * (0.5 + np.cos(a) * rr), SIZE * (0.5 + np.sin(a) * rr)))
        # Draw the stroke as many bristles side by side, offset across the
        # direction of travel.
        p = np.array(pts)
        tangent = np.gradient(p, axis=0)
        normal = np.stack([-tangent[:, 1], tangent[:, 0]], 1)
        normal /= np.linalg.norm(normal, axis=1, keepdims=True) + 1e-6
        for b in range(int(w)):
            off = (b - w / 2) * 0.85
            if rng.random() < 0.22:
                continue
            line = [tuple(v) for v in p + normal * off]
            start = int(rng.integers(0, steps // 4))
            end = steps - int(rng.integers(0, steps // 3))
            draw.line(line[start:end], fill=int(rng.uniform(140, 255)), width=1)
    return np.asarray(img.filter(ImageFilter.GaussianBlur(0.8)), np.float32) / 255


def save(name, alpha):
    # A whisper of blur so the fringe reads as soaked fibre, not pixel noise.
    soft = Image.fromarray((np.clip(alpha, 0, 1) * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(0.7))
    a = np.asarray(soft)
    rgba = np.zeros((SIZE, SIZE, 4), np.uint8)
    rgba[..., 3] = a
    Image.fromarray(rgba, "RGBA").save(f"{OUT}/{name}.webp", quality=82, method=6)
    print(name, os.path.getsize(f"{OUT}/{name}.webp") // 1024, "KB")


os.makedirs(OUT, exist_ok=True)

# 1. A ring: the pigment ran outward and left a pale, off-centre heart.
save("blot-1", blot(11, radius=0.34, ragged=0.14, feather=0.04, hole=(0.47, 0.41, 0.13), rim_dark=0.15))

# 2. A dense blot with a pale wet halo around it.
halo = blot(23, radius=0.4, ragged=0.22, feather=0.05, density=0.3, rim_dark=0.12)
save("blot-2", np.maximum(halo, blot(24, radius=0.27, ragged=0.22, feather=0.03, density=0.97)))

# 3. Dry brush: a grey wash with loaded strokes scrubbed across it.
wash = blot(37, radius=0.37, ragged=0.28, feather=0.05, density=0.38, rim_dark=0.18)
core = blot(38, radius=0.22, ragged=0.35, feather=0.03, density=0.8)
save("blot-3", np.clip(np.maximum(wash, core) + scribbles(39, 7, 0.36, 22) * 0.9, 0, 1))

# 4. The theme-change wash: soft, solid at heart, feathered at the rim.
save("wash", blot(51, radius=0.36, ragged=0.12, feather=0.06, density=1.0, rim_dark=0.0))
