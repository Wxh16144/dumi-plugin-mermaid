import { describe, expect, it } from 'vitest';
import {
  IDENTITY_TRANSFORM,
  MAX_SCALE,
  MIN_SCALE,
  PAN_STEP,
  ZOOM_FACTOR,
  canZoomIn,
  canZoomOut,
  clampScale,
  isIdentity,
  panBy,
  toCssTransform,
  zoomAt,
} from '../src/component/transform';

/** 把内容坐标 q 映射到视口坐标 p，用来验证「不动点」是否真的不动 */
const project = (transform: { scale: number; x: number; y: number }, q: number) =>
  transform.x + transform.scale * q;

describe('clampScale', () => {
  it('should clamp into the allowed range', () => {
    expect(clampScale(0.01)).toBe(MIN_SCALE);
    expect(clampScale(100)).toBe(MAX_SCALE);
    expect(clampScale(1.5)).toBe(1.5);
  });
});

describe('zoomAt', () => {
  it('should scale around the container center by default', () => {
    expect(zoomAt(IDENTITY_TRANSFORM, 2)).toEqual({ scale: 2, x: 0, y: 0 });
  });

  it('should keep the given origin fixed', () => {
    const origin = 100;
    const before = IDENTITY_TRANSFORM;
    const point = project(before, 100); // 内容坐标 100 落在视口坐标 100

    const after = zoomAt(before, 2, origin, origin);

    expect(project(after, 100)).toBeCloseTo(point, 6);
    expect(after.scale).toBe(2);
  });

  it('should keep a nonzero offset proportional to the zoom ratio', () => {
    const after = zoomAt({ scale: 1, x: 50, y: -20 }, 2);

    expect(after).toEqual({ scale: 2, x: 100, y: -40 });
  });

  it('should stop at the scale bounds without drifting the offset', () => {
    const atMax = { scale: MAX_SCALE, x: 30, y: 30 };
    expect(zoomAt(atMax, ZOOM_FACTOR)).toEqual(atMax);

    const atMin = { scale: MIN_SCALE, x: 30, y: 30 };
    expect(zoomAt(atMin, 1 / ZOOM_FACTOR)).toEqual(atMin);
  });

  it('should not mutate the input transform', () => {
    const input = { ...IDENTITY_TRANSFORM };
    zoomAt(input, ZOOM_FACTOR);
    expect(input).toEqual(IDENTITY_TRANSFORM);
  });
});

describe('panBy', () => {
  it('should translate relative to the current offset', () => {
    expect(panBy(IDENTITY_TRANSFORM, PAN_STEP, -PAN_STEP)).toEqual({
      scale: 1,
      x: PAN_STEP,
      y: -PAN_STEP,
    });
  });

  it('should keep the scale untouched', () => {
    expect(panBy({ scale: 2, x: 0, y: 0 }, 10, 10).scale).toBe(2);
  });
});

describe('canZoomIn / canZoomOut', () => {
  it('should be exclusive at both bounds', () => {
    expect(canZoomIn(MAX_SCALE)).toBe(false);
    expect(canZoomOut(MIN_SCALE)).toBe(false);
    expect(canZoomIn(1)).toBe(true);
    expect(canZoomOut(1)).toBe(true);
  });
});

describe('isIdentity', () => {
  it('should detect the neutral transform', () => {
    expect(isIdentity(IDENTITY_TRANSFORM)).toBe(true);
    expect(isIdentity({ scale: 1, x: 1, y: 0 })).toBe(false);
    expect(isIdentity({ scale: 2, x: 0, y: 0 })).toBe(false);
  });
});

describe('toCssTransform', () => {
  it('should emit a translate + scale pair', () => {
    expect(toCssTransform({ scale: 1, x: 0, y: 0 })).toBe('translate3d(0px, 0px, 0) scale(1)');
  });

  it('should round to two decimals to keep the style string short', () => {
    expect(toCssTransform({ scale: 1.6666666, x: 12.3456, y: -0.004 })).toBe(
      'translate3d(12.35px, 0px, 0) scale(1.67)',
    );
  });
});
