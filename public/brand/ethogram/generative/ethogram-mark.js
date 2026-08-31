// ethogram — generative mark.
// Six behavioral axes at 60°, radius 8–24 on a 64 grid. Returns an SVG path.
export const AXES = ['sequence','tools','policy','grounding','tone','cost'];
export const ANGLES = [-90,-30,30,90,150,210].map(d => d * Math.PI / 180);
export const MASTER = [22,20,9,19,16,21]; // institutional profile — policy axis collapsed

export function point(r, i) {
  return [
    Math.round((32 + r * Math.cos(ANGLES[i])) * 10) / 10,
    Math.round((32 + r * Math.sin(ANGLES[i])) * 10) / 10
  ];
}

/** radii: six numbers, 8–24. -> SVG path string on a 0 0 64 64 viewBox. */
export function markPath(radii = MASTER) {
  return radii.map((r, i) => {
    const [x, y] = point(Math.max(8, Math.min(24, r)), i);
    return (i ? 'L' : 'M') + x + ' ' + y;
  }).join('') + 'Z';
}

/** Same shape as a CSS clip-path polygon(), for framing images. */
export function markClip(radii = MASTER) {
  return 'polygon(' + radii.map((r, i) => {
    const [x, y] = point(Math.max(8, Math.min(24, r)), i);
    return (x / 64 * 100).toFixed(2) + '% ' + (y / 64 * 100).toFixed(2) + '%';
  }).join(', ') + ')';
}

/** scores: {sequence:0..1, ...} -> radii. A failing axis collapses to 8. */
export function profileFromScores(scores) {
  return AXES.map(k => {
    const v = typeof scores[k] === 'number' ? scores[k] : 1;
    return v < 0.5 ? 8 : 8 + Math.round(v * 16);
  });
}

/** Optical stroke width for a given rendered size, in the 64-unit space. */
export function strokeFor(px) {
  if (px <= 16) return 5.5;
  if (px <= 24) return 4.8;
  if (px <= 48) return 4;
  return 3;
}
