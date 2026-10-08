/* ──────────────────────────────────────────────────────────────
   SHINE placeholder media renderer (dev tool, not shipped to the browser app).
   Draws studio-style jewellery scenes as SVG. generate.py loads this in
   headless Chromium, renders stills (WebP) and frame sequences (MP4).
   All output is placeholder art — replace through Admin › Media library.
   ────────────────────────────────────────────────────────────── */
let UID = 0;
const uid = (p) => `${p}${++UID}`;
const TAU = Math.PI * 2;

/* ── Palettes ─────────────────────────────────────────────── */
const METALS = {
  Yellow: ["#6e4f17", "#b98a37", "#f6dfa0", "#fff4cf", "#d6a84e", "#8a6322", "#e9c773", "#a87c33"],
  White: ["#5f656c", "#a9afb6", "#eef1f4", "#ffffff", "#c3c8ce", "#7b8188", "#dfe3e7", "#959ba2"],
  Rose: ["#6e3527", "#b9725d", "#f5cbb6", "#fff0e6", "#d4927b", "#8b4a39", "#ecb59f", "#a8644f"],
  "Two-tone": ["#6e4f17", "#b98a37", "#f6dfa0", "#ffffff", "#c3c8ce", "#7b8188", "#e9c773", "#a87c33"],
  Silver: ["#5a6066", "#a2a8ae", "#e9edf1", "#ffffff", "#bcc2c8", "#747a80", "#d8dde1", "#8f959b"],
};

function metalGrad(defs, colour, angle = 35, shift = 0) {
  const id = uid("m");
  const c = METALS[colour] || METALS.Yellow;
  const stops = [0, 0.16, 0.3, 0.37, 0.48, 0.64, 0.8, 1];
  defs.push(`<linearGradient id="${id}" gradientUnits="objectBoundingBox" spreadMethod="reflect" gradientTransform="rotate(${angle} .5 .5) translate(${shift} 0)">${stops.map((s, i) => `<stop offset="${s}" stop-color="${c[i]}"/>`).join("")}</linearGradient>`);
  return `url(#${id})`;
}

function radial(defs, stops, cx = 0.5, cy = 0.45, r = 0.75) {
  const id = uid("r");
  defs.push(`<radialGradient id="${id}" cx="${cx}" cy="${cy}" r="${r}">${stops.map(([o, c, a = 1]) => `<stop offset="${o}" stop-color="${c}" stop-opacity="${a}"/>`).join("")}</radialGradient>`);
  return `url(#${id})`;
}

function linear(defs, stops, x2 = 0, y2 = 1) {
  const id = uid("l");
  defs.push(`<linearGradient id="${id}" x1="0" y1="0" x2="${x2}" y2="${y2}">${stops.map(([o, c, a = 1]) => `<stop offset="${o}" stop-color="${c}" stop-opacity="${a}"/>`).join("")}</linearGradient>`);
  return `url(#${id})`;
}

function blur(defs, sd) {
  const id = uid("b");
  defs.push(`<filter id="${id}" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="${sd}"/></filter>`);
  return `url(#${id})`;
}

function grain(defs, opacity = 0.08, freq = 0.9) {
  const id = uid("g");
  defs.push(`<filter id="${id}" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency="${freq}" numOctaves="2" seed="7" result="n"/><feColorMatrix in="n" type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 ${opacity} 0"/><feComposite in2="SourceGraphic" operator="in"/></filter>`);
  return `url(#${id})`;
}

/* ── Stones ───────────────────────────────────────────────── */
const ICE = ["#ffffff", "#e3ecf5", "#b7c8da", "#f7fbff", "#8ea3ba", "#d4e1ee", "#ffffff", "#a9bdd2"];
const EMERALD = ["#0f5a3c", "#1f8a5c", "#5fd39c", "#0b3f2a", "#2fae74", "#147049", "#8ff0c0", "#0d4d33"];
const RUBY = ["#6e0718", "#b3122f", "#ff6b86", "#4a0410", "#d42445", "#8c0b22", "#ff9fb2", "#5d0614"];

function brilliant(defs, r, t = 0, pal = ICE) {
  const n = 16;
  const pts = (rad, off = 0) => Array.from({ length: n }, (_, i) => [Math.cos((i + off) / n * TAU - Math.PI / 2) * rad, Math.sin((i + off) / n * TAU - Math.PI / 2) * rad]);
  const g = pts(r), tb = pts(r * 0.56, 0.5), mid = pts(r * 0.8, 0);
  const shift = Math.floor(t * 8);
  let s = `<circle r="${r * 1.04}" fill="rgba(60,70,90,.35)"/>`;
  for (let i = 0; i < n; i++) {
    const a = g[i], b = g[(i + 1) % n], c = tb[i];
    s += `<path d="M${a}L${b}L${c}Z" fill="${pal[(i + shift) % pal.length]}" stroke="rgba(90,110,135,.45)" stroke-width="${r * 0.012}"/>`;
    const m = mid[i];
    s += `<path d="M${a}L${m}L${c}Z" fill="${pal[(i + 3 + shift) % pal.length]}" opacity=".85"/>`;
  }
  const table = linear(defs, [[0, "#ffffff"], [0.5, pal === ICE ? "#dfeaf6" : pal[2]], [1, pal === ICE ? "#f9fcff" : pal[0]]], 1, 1);
  s += `<polygon points="${tb.map((p) => p.join(",")).join(" ")}" fill="${table}" stroke="rgba(90,110,135,.5)" stroke-width="${r * 0.012}"/>`;
  // fire
  const fire = ["#ffd3ea", "#c8f1ff", "#fff2a8", "#d9ffd6"];
  for (let i = 0; i < 4; i++) {
    const a = (i / 4) * TAU + t * 2.2;
    s += `<circle cx="${Math.cos(a) * r * 0.55}" cy="${Math.sin(a) * r * 0.55}" r="${r * 0.07}" fill="${fire[i]}" opacity=".75"/>`;
  }
  return s;
}

function sparkle(x, y, size, o = 1) {
  if (size <= 0.5) return "";
  const s = size, w = s * 0.12;
  return `<g transform="translate(${x} ${y})" opacity="${o}"><path d="M0 ${-s}C${w} ${-w} ${w} ${-w} ${s} 0C${w} ${w} ${w} ${w} 0 ${s}C${-w} ${w} ${-w} ${w} ${-s} 0C${-w} ${-w} ${-w} ${-w} 0 ${-s}Z" fill="#fff"/><circle r="${s * 0.18}" fill="#fff"/></g>`;
}

function stepCut(defs, w, h, pal = EMERALD) {
  const lay = [1, 0.78, 0.56, 0.34];
  let s = "";
  lay.forEach((k, i) => {
    const W = w * k, H = h * k, c = Math.min(W, H) * 0.18;
    s += `<path d="M${-W / 2 + c} ${-H / 2}H${W / 2 - c}L${W / 2} ${-H / 2 + c}V${H / 2 - c}L${W / 2 - c} ${H / 2}H${-W / 2 + c}L${-W / 2} ${H / 2 - c}V${-H / 2 + c}Z" fill="${pal[i * 2 % pal.length]}" stroke="rgba(255,255,255,.25)" stroke-width="${w * 0.01}"/>`;
  });
  s += `<path d="M${-w * 0.2} ${-h * 0.35}L${w * 0.05} ${-h * 0.35}L${-w * 0.25} ${h * 0.1}Z" fill="#fff" opacity=".35"/>`;
  return s;
}

function pear(defs, w, h, t = 0) {
  const d = `M0 ${-h / 2}C${w * 0.18} ${-h * 0.2} ${w / 2} ${h * 0.05} ${w / 2} ${h * 0.2}C${w / 2} ${h * 0.42} ${w * 0.26} ${h / 2} 0 ${h / 2}C${-w * 0.26} ${h / 2} ${-w / 2} ${h * 0.42} ${-w / 2} ${h * 0.2}C${-w / 2} ${h * 0.05} ${-w * 0.18} ${-h * 0.2} 0 ${-h / 2}Z`;
  const id = uid("c");
  defs.push(`<clipPath id="${id}"><path d="${d}"/></clipPath>`);
  return `<g><path d="${d}" fill="#c9d7e6"/><g clip-path="url(#${id})" transform="translate(0 ${h * 0.12}) scale(${w / 160} ${h / 190})">${brilliant(defs, 100, t)}</g><path d="${d}" fill="none" stroke="rgba(90,110,135,.6)" stroke-width="${w * 0.015}"/></g>`;
}

/* ── Metal primitives ─────────────────────────────────────── */
function annulus(R, r, dy = 0) {
  return `M${-R} 0A${R} ${R} 0 1 0 ${R} 0A${R} ${R} 0 1 0 ${-R} 0ZM${-r} ${dy}A${r} ${r} 0 1 1 ${r} ${dy}A${r} ${r} 0 1 1 ${-r} ${dy}Z`;
}

/** Upright ring seen slightly from above: outer band + visible inner surface. */
function ringBand(defs, colour, R, thick, shift = 0) {
  const r = R - thick;
  const outer = metalGrad(defs, colour, 30, shift);
  const inner = metalGrad(defs, colour, 210, shift * 0.6);
  return `<path d="${annulus(R, r)}" fill="${outer}" fill-rule="evenodd"/>
    <path d="M${-r} 0A${r} ${r} 0 0 0 ${r} 0A${r} ${r * 0.86} 0 0 1 ${-r} 0Z" transform="translate(0 ${thick * 0.1})" fill="${inner}" opacity=".9"/>
    <path d="M${-R * 0.92} ${-R * 0.25}A${R} ${R} 0 0 1 ${R * 0.2} ${-R * 0.98}" fill="none" stroke="#fff" stroke-opacity=".55" stroke-width="${thick * 0.12}" stroke-linecap="round"/>`;
}

function chainPath(defs, d, colour, w = 7, shift = 0) {
  const g = metalGrad(defs, colour, 0, shift);
  return `<path d="${d}" fill="none" stroke="${g}" stroke-width="${w}" stroke-dasharray="${w * 1.4} ${w * 0.5}" stroke-linecap="round"/>
    <path d="${d}" fill="none" stroke="rgba(255,255,255,.55)" stroke-width="${w * 0.3}" stroke-dasharray="${w * 0.6} ${w * 1.3}" stroke-linecap="round"/>`;
}

function pointsOnPath(fn, n, from = 0, to = 1) {
  return Array.from({ length: n }, (_, i) => fn(from + (to - from) * (n === 1 ? 0.5 : i / (n - 1))));
}

const catenary = (w, h, top = -h) => (u) => {
  const x = (u - 0.5) * w;
  const y = top + h * (1 - Math.pow((2 * u - 1), 2)) * 0.98;
  return [x, y];
};

/* ── Jewellery pieces (local space ≈ 1000 × 1000, centred) ── */
function piece(defs, kind, colour, t = 0) {
  const sh = Math.sin(t * TAU) * 0.35;
  const tw = (k) => 0.45 + 0.55 * Math.abs(Math.sin(t * TAU + k));
  const C = colour;
  switch (kind) {
    case "solitaire": {
      const g = metalGrad(defs, C, 70, sh);
      return `${ringBand(defs, C, 230, 34, sh)}
        <g transform="translate(0 -250)"><path d="M-46 30L-30 -40M46 30L30 -40M-18 34L-10 -46M18 34L10 -46" stroke="${g}" stroke-width="12" stroke-linecap="round"/>
        <path d="M-60 40Q0 70 60 40L40 10H-40Z" fill="${g}"/><g transform="translate(0 -40) scale(1 .62)">${brilliant(defs, 82, t)}</g></g>
        ${sparkle(-40, -330, 70 * tw(0))}${sparkle(60, -260, 36 * tw(2))}`;
    }
    case "halo": {
      const g = metalGrad(defs, C, 70, sh);
      let halo = "";
      for (let i = 0; i < 18; i++) {
        const a = (i / 18) * TAU;
        halo += `<g transform="translate(${Math.cos(a) * 98} ${Math.sin(a) * 120 * 0.62})">${brilliant(defs, 15, t + i)}</g>`;
      }
      return `${ringBand(defs, C, 225, 30, sh)}<g transform="translate(0 -275)"><ellipse rx="125" ry="90" fill="${g}"/>${halo}<g transform="scale(.82 .62)">${brilliant(defs, 88, t)}</g></g>${sparkle(30, -340, 80 * tw(1))}${sparkle(-90, -250, 30 * tw(3))}`;
    }
    case "eternity": {
      let s = ringBand(defs, C, 240, 44, sh);
      for (let i = 0; i < 22; i++) {
        const a = (i / 22) * TAU;
        const x = Math.cos(a) * 218, y = Math.sin(a) * 218;
        const front = Math.sin(a) > -0.2;
        s += `<g transform="translate(${x} ${y}) scale(${front ? 1 : 0.8})" opacity="${front ? 1 : 0.85}">${brilliant(defs, 19, t + i)}</g>`;
      }
      return s + sparkle(-150, -170, 60 * tw(0)) + sparkle(170, 120, 40 * tw(2));
    }
    case "pave": {
      let s = ringBand(defs, C, 230, 46, sh);
      const g = metalGrad(defs, "White", 40, sh);
      s += `<path d="M-200 -110C-60 -260 60 40 205 -100" stroke="${g}" stroke-width="40" fill="none" stroke-linecap="round"/>`;
      pointsOnPath((u) => [-195 + 400 * u, -110 + Math.sin(u * Math.PI) * -60 + (u - 0.5) * 30], 11).forEach(([x, y], i) => (s += `<g transform="translate(${x} ${y + Math.sin(i) * 6})">${brilliant(defs, 13, t + i)}</g>`));
      return s + sparkle(120, -200, 50 * tw(1));
    }
    case "band":
      return ringBand(defs, C, 240, 64, sh) + sparkle(-170, -150, 46 * tw(0));
    case "signet": {
      const g = metalGrad(defs, C, 120, sh);
      return `${ringBand(defs, C, 230, 52, sh)}<g transform="translate(0 -235)"><ellipse rx="125" ry="88" fill="${g}" stroke="rgba(80,55,20,.35)" stroke-width="6"/><ellipse rx="96" ry="64" fill="none" stroke="rgba(90,60,20,.35)" stroke-width="4"/><text x="0" y="30" text-anchor="middle" font-family="GFS Baskerville, Caladea, serif" font-size="96" fill="rgba(90,60,20,.55)">S</text></g>${sparkle(90, -300, 44 * tw(1))}`;
    }
    case "couple": {
      return `<g transform="translate(-120 40) rotate(-12)">${ringBand(defs, "White", 200, 54, sh)}</g><g transform="translate(140 -20) rotate(14)">${ringBand(defs, "White", 165, 36, -sh)}${pointsOnPath((u) => [Math.cos(Math.PI * (1.1 + 0.8 * u)) * 148, Math.sin(Math.PI * (1.1 + 0.8 * u)) * 148], 5).map(([x, y], i) => `<g transform="translate(${x} ${y})">${brilliant(defs, 12, t + i)}</g>`).join("")}</g>${sparkle(-220, -150, 50 * tw(0))}`;
    }
    case "studs": {
      const g = metalGrad(defs, C, 50, sh);
      const one = (x, y, s) => `<g transform="translate(${x} ${y}) scale(${s})"><circle r="98" fill="${g}"/><path d="M-70 -70l-14 -14M70 -70l14 -14M-70 70l-14 14M70 70l14 14" stroke="${g}" stroke-width="16" stroke-linecap="round"/>${brilliant(defs, 86, t)}</g>`;
      return one(-150, -20, 1) + one(170, 40, 0.86) + sparkle(-190, -110, 70 * tw(0)) + sparkle(210, -20, 40 * tw(2));
    }
    case "drops": {
      const g = metalGrad(defs, C, 60, sh);
      const one = (x, s, k) => {
        let halo = "";
        for (let i = 0; i < 16; i++) {
          const a = (i / 16) * TAU;
          halo += `<g transform="translate(${Math.cos(a) * 72} ${Math.sin(a) * 96 + 160})">${brilliant(defs, 11, t + i)}</g>`;
        }
        return `<g transform="translate(${x} -150) scale(${s})"><circle r="40" fill="${g}"/>${brilliant(defs, 32, t)}<path d="M0 40V70" stroke="${g}" stroke-width="10"/><ellipse cy="160" rx="84" ry="110" fill="${g}"/>${halo}<g transform="translate(0 160)">${pear(defs, 120, 170, t + k)}</g></g>`;
      };
      return one(-150, 1, 0) + one(160, 0.9, 1) + sparkle(-120, 40, 70 * tw(0)) + sparkle(200, -60, 40 * tw(2));
    }
    case "hoops": {
      const g1 = metalGrad(defs, C, 20, sh), g2 = metalGrad(defs, C, 200, -sh);
      return `<g transform="translate(-110 0) rotate(-14)"><ellipse rx="170" ry="210" fill="none" stroke="${g1}" stroke-width="40"/><ellipse rx="170" ry="210" fill="none" stroke="#fff" stroke-opacity=".4" stroke-width="6" stroke-dasharray="180 900"/></g><g transform="translate(140 30) rotate(10)"><ellipse rx="150" ry="190" fill="none" stroke="${g2}" stroke-width="36"/></g>${sparkle(-230, -120, 50 * tw(0))}`;
    }
    case "jhumka": {
      const g = metalGrad(defs, C, 60, sh);
      const one = (x, s) => {
        let beads = "";
        for (let i = 0; i < 9; i++) beads += `<circle cx="${-112 + i * 28}" cy="${155 + Math.sin(i * 1.3 + t * TAU) * 4}" r="11" fill="${g}"/>`;
        let gran = "";
        for (let i = 0; i < 12; i++) gran += `<circle cx="${Math.cos((i / 12) * TAU) * 52}" cy="${-150 + Math.sin((i / 12) * TAU) * 52}" r="7" fill="${g}"/>`;
        return `<g transform="translate(${x} 0) scale(${s})"><circle cy="-150" r="64" fill="${g}"/>${gran}<g transform="translate(0 -150) scale(.32)">${stepCut(defs, 120, 120, RUBY)}</g><path d="M0 -84V-50" stroke="${g}" stroke-width="12"/><path d="M-120 140Q-110 -40 0 -50Q110 -40 120 140Z" fill="${g}"/><path d="M-90 110Q0 70 90 110M-100 60Q0 20 100 60M-70 10Q0 -20 70 10" stroke="rgba(110,70,20,.45)" stroke-width="6" fill="none"/>${beads}</g>`;
      };
      return one(-170, 0.95) + one(170, 0.85) + sparkle(-170, -230, 50 * tw(0));
    }
    case "tennis": {
      const f = catenary(820, 520, -300);
      let s = "";
      pointsOnPath(f, 29, 0.02, 0.98).forEach(([x, y], i, arr) => {
        const k = 1 - Math.abs(i / (arr.length - 1) - 0.5) * 0.9;
        s += `<g transform="translate(${x} ${y})">${brilliant(defs, 15 + 12 * k, t + i * 0.13)}</g>`;
      });
      return s + sparkle(0, 200, 80 * tw(0)) + sparkle(-250, 40, 40 * tw(2)) + sparkle(260, 60, 34 * tw(4));
    }
    case "chain": {
      let s = "";
      [[-320, 380, 7], [-300, 480, 6], [-280, 580, 8]].forEach(([top, h, w], i) => {
        const f = catenary(760 - i * 40, h, top);
        const pts = pointsOnPath(f, 40).map((p) => p.join(" "));
        s += chainPath(defs, `M${pts.join("L")}`, C, w, sh + i * 0.2);
        if (i === 1) {
          const [x, y] = f(0.5);
          s += `<g transform="translate(${x} ${y + 26})"><circle r="26" fill="${metalGrad(defs, C, 40, sh)}"/>${brilliant(defs, 14, t)}</g>`;
        }
      });
      return s + sparkle(0, 280, 50 * tw(1));
    }
    case "bridal": {
      const g = metalGrad(defs, C, 30, sh);
      let s = "";
      for (let row = 0; row < 3; row++) {
        const f = catenary(760 - row * 90, 380 - row * 40, -300 + row * 50);
        pointsOnPath(f, 34 - row * 5, 0.04, 0.96).forEach(([x, y], i) => {
          s += `<circle cx="${x}" cy="${y}" r="${15 - row * 2}" fill="${g}"/>`;
          if (row === 0 && i % 3 === 1) s += `<g transform="translate(${x} ${y + 40}) scale(.3)">${stepCut(defs, 110, 150, i % 2 ? RUBY : EMERALD)}</g><path d="M${x} ${y + 12}V${y + 20}" stroke="${g}" stroke-width="6"/>`;
        });
      }
      s += `<g transform="translate(0 150)"><path d="M-70 -40Q0 -90 70 -40L40 60Q0 90 -40 60Z" fill="${g}"/><g transform="scale(.5)">${stepCut(defs, 120, 150, RUBY)}</g><g transform="translate(0 95)">${pear(defs, 60, 90, t)}</g></g>`;
      return s + sparkle(-80, 120, 60 * tw(0)) + sparkle(220, -60, 36 * tw(2));
    }
    case "emeraldPendant": {
      const f = (u) => [(u - 0.5) * 600, -330 + Math.abs(u - 0.5) * -260 + 260];
      const pts = pointsOnPath(f, 40).map((p) => p.join(" "));
      let halo = "";
      for (let i = 0; i < 16; i++) {
        const a = (i / 16) * TAU;
        halo += `<g transform="translate(${Math.cos(a) * 92} ${Math.sin(a) * 118})">${brilliant(defs, 12, t + i)}</g>`;
      }
      return chainPath(defs, `M${pts.join("L")}`, C, 6, sh) + `<g transform="translate(0 130)"><ellipse rx="108" ry="136" fill="${metalGrad(defs, C, 50, sh)}"/>${halo}${stepCut(defs, 120, 160)}</g>` + sparkle(70, 40, 60 * tw(0));
    }
    case "initial": {
      const f = (u) => [(u - 0.5) * 600, -330 + Math.abs(u - 0.5) * -260 + 260];
      const pts = pointsOnPath(f, 40).map((p) => p.join(" "));
      const g = metalGrad(defs, C, 45, sh);
      return chainPath(defs, `M${pts.join("L")}`, C, 6, sh) + `<g transform="translate(0 110)"><circle cy="-80" r="16" fill="none" stroke="${g}" stroke-width="8"/><text y="120" text-anchor="middle" font-family="GFS Baskerville, Caladea, serif" font-weight="700" font-size="300" fill="${g}" stroke="rgba(90,60,20,.4)" stroke-width="3">S</text><g transform="translate(58 -10)">${brilliant(defs, 15, t)}</g></g>` + sparkle(-60, 60, 50 * tw(1));
    }
    case "name": {
      const f = (u) => [(u - 0.5) * 760, -260 + Math.pow(2 * u - 1, 2) * -40 + 120];
      const pts = pointsOnPath(f, 40).map((p) => p.join(" "));
      const g = metalGrad(defs, C, 30, sh);
      return chainPath(defs, `M${pts.join("L")}`, C, 6, sh) + `<text y="-90" text-anchor="middle" font-family="GFS Baskerville, Caladea, serif" font-style="italic" font-size="230" fill="${g}" stroke="rgba(110,60,45,.35)" stroke-width="3">Noor</text>` + sparkle(160, -200, 46 * tw(0));
    }
    case "lineBracelet": {
      let s = `<ellipse rx="330" ry="130" fill="none" stroke="${metalGrad(defs, C, 10, sh)}" stroke-width="30" opacity=".75"/>`;
      for (let i = 0; i < 36; i++) {
        const a = (i / 36) * TAU;
        const x = Math.cos(a) * 330, y = Math.sin(a) * 130;
        const front = Math.sin(a) > 0;
        s += `<g transform="translate(${x} ${y}) scale(${front ? 1 : 0.72})" opacity="${front ? 1 : 0.7}">${brilliant(defs, 22, t + i * 0.2)}</g>`;
      }
      return s + sparkle(-100, 150, 70 * tw(0)) + sparkle(220, 90, 40 * tw(2));
    }
    case "chainBracelet": {
      let s = "";
      const g = metalGrad(defs, C, 30, sh);
      for (let i = 0; i < 28; i++) {
        const a = (i / 28) * TAU;
        const x = Math.cos(a) * 320, y = Math.sin(a) * 140, ang = (Math.atan2(Math.cos(a) * 140, -Math.sin(a) * 320) * 180) / Math.PI;
        s += `<ellipse cx="${x}" cy="${y}" rx="34" ry="22" transform="rotate(${ang + 90} ${x} ${y})" fill="none" stroke="${g}" stroke-width="13" opacity="${Math.sin(a) > -0.1 ? 1 : 0.7}"/>`;
      }
      return s + sparkle(-260, 40, 44 * tw(1));
    }
    case "bangle": {
      const g = metalGrad(defs, C, 20, sh), g2 = metalGrad(defs, C, 200, -sh);
      const pattern = Array.from({ length: 24 }, (_, i) => {
        const a = Math.PI * (0.05 + (i / 23) * 0.9);
        return `<circle cx="${Math.cos(a) * 300}" cy="${Math.sin(a) * 118 + 4}" r="9" fill="none" stroke="rgba(100,65,20,.5)" stroke-width="4"/>`;
      }).join("");
      return `<g transform="translate(0 -70)"><ellipse rx="300" ry="118" fill="none" stroke="${g2}" stroke-width="60"/></g><g transform="translate(0 60)"><ellipse rx="300" ry="118" fill="none" stroke="${g}" stroke-width="64"/>${pattern}</g>${sparkle(-220, 80, 54 * tw(0))}`;
    }
    case "slimBangle": {
      let s = `<ellipse rx="320" ry="128" fill="none" stroke="${metalGrad(defs, C, 25, sh)}" stroke-width="22"/>`;
      for (let i = 0; i < 15; i++) {
        const a = Math.PI * (0.18 + (i / 14) * 0.64);
        s += `<g transform="translate(${Math.cos(a) * 320} ${Math.sin(a) * 128})">${brilliant(defs, 15, t + i)}</g>`;
      }
      return s + sparkle(10, 160, 60 * tw(0));
    }
    case "cuff": {
      const g = metalGrad(defs, "Silver", 25, sh);
      return `<path d="M-280 -60A300 140 0 1 0 280 -60" fill="none" stroke="${g}" stroke-width="96" stroke-linecap="round"/><path d="M-240 40A280 120 0 0 0 240 40" fill="none" stroke="rgba(255,255,255,.55)" stroke-width="8" stroke-linecap="round"/>${sparkle(-160, 110, 50 * tw(0))}`;
    }
    case "goldBar":
    case "silverBar": {
      const colour = kind === "goldBar" ? "Yellow" : "Silver";
      const g = metalGrad(defs, colour, 25, sh), g2 = metalGrad(defs, colour, 200, sh);
      const label = kind === "goldBar" ? ["FINE GOLD", "999.9", "10 g"] : ["FINE SILVER", "999", "100 g"];
      return `<g transform="skewX(-8)"><path d="M-230 -320H230L270 340H-270Z" fill="${g2}"/><path d="M-200 -290H200L230 310H-230Z" fill="${g}"/>
        <image href="../../public/media/brand/shine-emblem-gold.png" x="-70" y="-250" width="140" height="140" opacity=".75"/>
        <text y="-40" text-anchor="middle" font-family="GFS Baskerville, Caladea, serif" font-size="78" letter-spacing="10" fill="rgba(70,48,15,.55)">SHINE</text>
        ${label.map((l, i) => `<text y="${60 + i * 80}" text-anchor="middle" font-family="DejaVu Sans, sans-serif" font-size="${i === 0 ? 40 : 56}" letter-spacing="6" fill="rgba(70,48,15,.5)">${l}</text>`).join("")}</g>${sparkle(-200, -300, 60 * tw(0))}`;
    }
    case "goldCoin":
    case "silverCoin": {
      const colour = kind === "goldCoin" ? "Yellow" : "Silver";
      const g = metalGrad(defs, colour, 30, sh), g2 = metalGrad(defs, colour, 210, sh);
      const ticks = Array.from({ length: 90 }, (_, i) => {
        const a = (i / 90) * TAU;
        return `<line x1="${Math.cos(a) * 300}" y1="${Math.sin(a) * 300}" x2="${Math.cos(a) * 316}" y2="${Math.sin(a) * 316}" stroke="rgba(70,48,15,.35)" stroke-width="4"/>`;
      }).join("");
      return `<circle r="330" fill="${g2}"/><circle r="300" fill="${g}"/>${ticks}<circle r="250" fill="none" stroke="rgba(70,48,15,.3)" stroke-width="6"/>
        <image href="../../public/media/brand/shine-emblem-gold.png" x="-120" y="-190" width="240" height="240" opacity=".8"/>
        <text y="120" text-anchor="middle" font-family="GFS Baskerville, Caladea, serif" font-size="64" letter-spacing="12" fill="rgba(70,48,15,.55)">SHINE</text>
        <text y="190" text-anchor="middle" font-family="DejaVu Sans, sans-serif" font-size="40" letter-spacing="6" fill="rgba(70,48,15,.5)">${kind === "goldCoin" ? "8 g · 22K" : "1 oz · 999"}</text>${sparkle(-200, -220, 70 * tw(0))}`;
    }
    default:
      return ringBand(defs, C, 240, 50, sh);
  }
}

/* ── Backdrops ────────────────────────────────────────────── */
function backdrop(defs, name, W, H, t = 0) {
  const bokeh = (cols, n, seed = 1) =>
    Array.from({ length: n }, (_, i) => {
      const r = ((i * 97 + seed * 31) % 100) / 100;
      const x = (((i * 211 + seed * 17) % 1000) / 1000) * W + Math.sin(t * TAU + i) * 20;
      const y = (((i * 137 + seed * 53) % 1000) / 1000) * H + Math.cos(t * TAU + i * 0.7) * 12;
      return `<circle cx="${x}" cy="${y}" r="${18 + r * 70}" fill="${cols[i % cols.length]}" opacity="${0.08 + r * 0.22}"/>`;
    }).join("");
  switch (name) {
    case "ivory":
      return `<rect width="${W}" height="${H}" fill="${radial(defs, [[0, "#fffdf9"], [0.6, "#f6efe5"], [1, "#e7dccd"]], 0.5, 0.42, 0.8)}"/><rect width="${W}" height="${H}" filter="${grain(defs, 0.05)}" fill="#000"/>`;
    case "pearl":
      return `<rect width="${W}" height="${H}" fill="${radial(defs, [[0, "#ffffff"], [0.55, "#f3eee8"], [1, "#ddd3c9"]], 0.5, 0.4, 0.85)}"/>`;
    case "velvet":
      return `<rect width="${W}" height="${H}" fill="${radial(defs, [[0, "#8e3448"], [0.55, "#5a1a2a"], [1, "#250810"]], 0.5, 0.42, 0.85)}"/><rect width="${W}" height="${H}" filter="${grain(defs, 0.18, 1.4)}" fill="#000"/>`;
    case "obsidian":
      return `<rect width="${W}" height="${H}" fill="${radial(defs, [[0, "#3a332a"], [0.5, "#17140f"], [1, "#070605"]], 0.55, 0.4, 0.9)}"/><g filter="${blur(defs, 18)}">${bokeh(["#d9b26a", "#fff1cf", "#b8873e"], 18, 3)}</g>`;
    case "burgundyLux":
      return `<rect width="${W}" height="${H}" fill="${radial(defs, [[0, "#6d2236"], [0.6, "#3a0f1b"], [1, "#16050a"]], 0.62, 0.42, 0.9)}"/><g filter="${blur(defs, 22)}">${bokeh(["#e6c27a", "#fff3d6", "#c08a40"], 22, 5)}</g><rect width="${W}" height="${H}" filter="${grain(defs, 0.1, 1.2)}" fill="#000"/>`;
    case "silk": {
      const folds = Array.from({ length: 7 }, (_, i) => `<path d="M${-W * 0.2} ${H * (0.1 + i * 0.15)}C${W * 0.3} ${H * (i * 0.15 - 0.1)} ${W * 0.6} ${H * (0.3 + i * 0.12)} ${W * 1.2} ${H * (0.05 + i * 0.15)}" stroke="${i % 2 ? "#fff8ee" : "#d9c3a3"}" stroke-width="${H * 0.08}" fill="none" opacity=".55"/>`).join("");
      return `<rect width="${W}" height="${H}" fill="${linear(defs, [[0, "#f3e4cf"], [1, "#e2cdb0"]], 1, 1)}"/><g filter="${blur(defs, H * 0.04)}">${folds}</g>`;
    }
    case "marble": {
      const veins = Array.from({ length: 9 }, (_, i) => `<path d="M${-50} ${H * (i / 9)}C${W * 0.25} ${H * (i / 9) + 80} ${W * 0.5} ${H * (i / 9) - 120} ${W + 50} ${H * (i / 9) + 60}" stroke="#b9b2aa" stroke-width="${1 + (i % 3)}" fill="none" opacity=".45"/>`).join("");
      return `<rect width="${W}" height="${H}" fill="${radial(defs, [[0, "#ffffff"], [1, "#e9e6e1"]], 0.5, 0.4, 0.9)}"/><g filter="${blur(defs, 1.5)}">${veins}</g>`;
    }
    case "wood":
      return `<rect width="${W}" height="${H}" fill="${linear(defs, [[0, "#3b2618"], [1, "#1c110a"]], 1, 1)}"/>${Array.from({ length: 40 }, (_, i) => `<path d="M0 ${(i / 40) * H}Q${W / 2} ${(i / 40) * H + 20 * Math.sin(i)} ${W} ${(i / 40) * H}" stroke="#5a3a24" stroke-opacity=".35" stroke-width="2" fill="none"/>`).join("")}`;
    default:
      return `<rect width="${W}" height="${H}" fill="#f6efe5"/>`;
  }
}

function floorShadow(defs, cx, cy, w, dark) {
  return `<ellipse cx="${cx}" cy="${cy}" rx="${w}" ry="${w * 0.14}" fill="${dark ? "#000" : "#5a4a3a"}" opacity="${dark ? 0.45 : 0.22}" filter="${blur(defs, w * 0.08)}"/>`;
}

function giftBox(defs, x, y, s) {
  const g = metalGrad(defs, "Yellow", 0, 0);
  return `<g transform="translate(${x} ${y}) scale(${s})"><rect x="-160" y="-120" width="320" height="240" rx="14" fill="#5b1626"/><rect x="-160" y="-120" width="320" height="70" rx="14" fill="#6e1c30"/><rect x="-14" y="-120" width="28" height="240" fill="${g}"/><rect x="-160" y="-14" width="320" height="28" fill="${g}" opacity=".9"/><image href="../../public/media/brand/shine-emblem-gold.png" x="-46" y="-104" width="92" height="92" opacity=".9"/></g>`;
}

/* ── Scenes ───────────────────────────────────────────────── */
function svg(W, H, body, defs) {
  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}"><defs>${defs.join("")}</defs>${body}</svg>`;
}

/** Per-piece framing so rings, earrings, necklaces and bars fill the frame similarly. */
const KSCALE = { solitaire: 1.35, halo: 1.3, eternity: 1.3, pave: 1.35, band: 1.35, signet: 1.3, couple: 1.25, studs: 1.4, drops: 1.3, hoops: 1.25, jhumka: 1.3, tennis: 1.05, chain: 1.05, bridal: 1.05, emeraldPendant: 1.2, initial: 1.25, name: 1.1, lineBracelet: 1.1, chainBracelet: 1.15, bangle: 1.15, slimBangle: 1.1, cuff: 1.15, goldBar: 1.05, silverBar: 1.05, goldCoin: 1.05, silverCoin: 1.05 };

/** Single product: variant 1 studio, 2 macro on velvet, 3 flat-lay on silk with gift box. */
function productScene(W, H, kind, colour, variant = 1, t = 0) {
  UID = 0;
  const defs = [];
  const base = Math.min(W, H) / 1000;
  const wobble = Math.sin(t * TAU) * 5;
  let bg, body;
  if (variant === 2) {
    bg = backdrop(defs, "velvet", W, H, t);
    body = `<g transform="translate(${W * 0.54} ${H * 0.56}) scale(${base * 1.5}) rotate(${-14 + wobble})">${piece(defs, kind, colour, t)}</g>`;
  } else if (variant === 3) {
    bg = backdrop(defs, "silk", W, H, t);
    body = `${giftBox(defs, W * 0.26, H * 0.24, base * 0.75)}${floorShadow(defs, W * 0.56, H * 0.83, W * 0.3, false)}<g transform="translate(${W * 0.56} ${H * 0.6}) scale(${base * 0.82 * (KSCALE[kind] || 1)}) rotate(${12 + wobble})">${piece(defs, kind, colour, t)}</g>`;
  } else {
    const dark = variant === 4;
    bg = backdrop(defs, dark ? "obsidian" : "ivory", W, H, t);
    const sc = base * (0.86 + Math.sin(t * TAU) * 0.02) * (KSCALE[kind] || 1);
    body = `${floorShadow(defs, W / 2, H * 0.84, W * 0.36, dark)}<g transform="translate(${W / 2} ${H * 0.5}) scale(${sc}) rotate(${wobble * 0.6})">${piece(defs, kind, colour, t)}</g>`;
  }
  return svg(W, H, bg + body, defs);
}

/** Multi-piece arrangement for heroes, collections and campaigns. */
function arrangeScene(W, H, bgName, items, t = 0, extra = "") {
  UID = 0;
  const defs = [];
  const base = Math.min(W, H) / 1000;
  const dark = ["velvet", "obsidian", "burgundyLux", "wood"].includes(bgName);
  let body = backdrop(defs, bgName, W, H, t);
  items.forEach(([kind, colour, x, y, s, rot = 0]) => {
    body += floorShadow(defs, W * x, H * y + base * s * 330, base * s * 300, dark);
    body += `<g transform="translate(${W * x + Math.sin(t * TAU) * W * 0.004} ${H * y}) scale(${base * s}) rotate(${rot + Math.sin(t * TAU + x * 6) * 3})">${piece(defs, kind, colour, t + x)}</g>`;
  });
  return svg(W, H, body + extra, defs);
}

/** Showroom interior with Qatari arch niches and lit display cases. */
function showroomScene(W, H, tone = 0, t = 0) {
  UID = 0;
  const defs = [];
  const wall = [["#f4ebdf", "#e2d2bd"], ["#3a1220", "#1d0910"], ["#ece6dd", "#cfc3b3"]][tone];
  const accent = ["#b08a4a", "#d2a85c", "#8a7a64"][tone];
  let s = `<rect width="${W}" height="${H}" fill="${linear(defs, [[0, wall[0]], [1, wall[1]]])}"/>`;
  const n = 5, aw = W / (n + 1.2);
  for (let i = 0; i < n; i++) {
    const x = aw * 0.6 + i * aw * 1.04, top = H * 0.16, bottom = H * 0.62;
    s += `<path d="M${x} ${bottom}V${top + aw * 0.5}A${aw * 0.45} ${aw * 0.5} 0 0 1 ${x + aw * 0.9} ${top + aw * 0.5}V${bottom}Z" fill="${tone === 1 ? "#24070f" : "#efe2cf"}" stroke="${accent}" stroke-width="3"/>`;
    s += `<rect x="${x + aw * 0.1}" y="${bottom - H * 0.12}" width="${aw * 0.7}" height="${H * 0.1}" fill="${radial(defs, [[0, "#fff6dc", 0.9], [1, "#fff6dc", 0]])}"/>`;
    s += `<g transform="translate(${x + aw * 0.45} ${bottom - H * 0.07}) scale(${aw / 2600})">${piece(defs, ["solitaire", "tennis", "studs", "bangle", "halo"][i], ["Yellow", "White", "White", "Yellow", "Rose"][i], t)}</g>`;
  }
  s += `<rect y="${H * 0.66}" width="${W}" height="${H * 0.34}" fill="${tone === 1 ? "#14050a" : "#d9c7ae"}"/><rect x="${W * 0.08}" y="${H * 0.7}" width="${W * 0.84}" height="${H * 0.14}" rx="8" fill="${linear(defs, [[0, "#ffffff", 0.55], [1, "#ffffff", 0.15]])}" stroke="${accent}" stroke-width="3"/>`;
  s += `<rect x="${W * 0.08}" y="${H * 0.84}" width="${W * 0.84}" height="${H * 0.12}" fill="${tone === 1 ? "#2a0d16" : "#5a1626"}"/>`;
  for (let i = 0; i < 9; i++) s += `<circle cx="${W * (0.12 + i * 0.095)}" cy="${H * 0.77}" r="${W * 0.008}" fill="${accent}"/>${sparkle(W * (0.12 + i * 0.095), H * 0.76, W * 0.012 * (0.4 + 0.6 * Math.abs(Math.sin(t * TAU + i))))}`;
  s += `<g filter="${blur(defs, 30)}">${Array.from({ length: 6 }, (_, i) => `<ellipse cx="${W * (0.1 + i * 0.17)}" cy="${H * 0.05}" rx="${W * 0.05}" ry="${H * 0.04}" fill="#fff4d6" opacity=".5"/>`).join("")}</g>`;
  return svg(W, H, s, defs);
}

/** Craft scene: sketch lines drawing in over dark wood, then the ring appears. */
function craftScene(W, H, t = 1) {
  UID = 0;
  const defs = [];
  const base = Math.min(W, H) / 1000;
  const draw = Math.min(1, t * 1.6), show = Math.max(0, (t - 0.45) / 0.55);
  let s = backdrop(defs, "wood", W, H, t);
  s += `<rect x="${W * 0.08}" y="${H * 0.1}" width="${W * 0.46}" height="${H * 0.8}" fill="#f3ede2" transform="rotate(-3 ${W * 0.3} ${H * 0.5})"/>`;
  const L = 3000;
  s += `<g transform="translate(${W * 0.31} ${H * 0.52}) scale(${base * 0.7})" fill="none" stroke="#2b2b2b" stroke-width="3" stroke-dasharray="${L}" stroke-dashoffset="${L * (1 - draw)}"><circle r="240"/><circle r="206"/><path d="M-60 -250L0 -330L60 -250M-90 -240H90"/><path d="M-300 0H300M0 -360V300" stroke-dasharray="12 10" stroke="#9b8f80"/></g>`;
  s += `<g opacity="${show}" transform="translate(${W * 0.73} ${H * 0.55}) scale(${base * 0.8 * (0.9 + show * 0.1)})">${floorShadow(defs, 0, 300, 300, true)}${piece(defs, "solitaire", "Yellow", t)}</g>`;
  s += `<rect x="${W * 0.5}" y="${H * 0.8}" width="${W * 0.22}" height="${H * 0.025}" rx="6" fill="#8a8f96" transform="rotate(-18 ${W * 0.6} ${H * 0.8})"/>`;
  return svg(W, H, s, defs);
}

/** Close-up of a single rotating brilliant on black (video story). */
function diamondFilm(W, H, t = 0) {
  UID = 0;
  const defs = [];
  const r = Math.min(W, H) * 0.32;
  let s = backdrop(defs, "obsidian", W, H, t);
  s += `<g transform="translate(${W / 2} ${H / 2}) rotate(${t * 45}) scale(1 ${0.9 + 0.1 * Math.cos(t * TAU)})">${brilliant(defs, r, t * 3)}</g>`;
  for (let i = 0; i < 7; i++) s += sparkle(W / 2 + Math.cos(i * 0.9 + t * 3) * r * 1.2, H / 2 + Math.sin(i * 1.3 + t * 2) * r * 0.9, r * 0.12 * Math.abs(Math.sin(t * TAU * 2 + i)));
  return svg(W, H, s, defs);
}

window.SHINE_RENDER = { productScene, arrangeScene, showroomScene, craftScene, diamondFilm };
