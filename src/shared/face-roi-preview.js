const DEFAULT_ROI = Object.freeze({
  visible: false,
  stable: false,
  raw: null,
  roi: null,
  metrics: {
    widthRatio: 0,
    heightRatio: 0,
    centerOffset: 1,
    edgeMargin: 0,
  },
});

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

function getLandmarkBounds(landmarks) {
  const points = (landmarks || []).filter(
    (point) => Number.isFinite(point?.x) && Number.isFinite(point?.y),
  );

  if (points.length < 50) {
    return null;
  }

  const bounds = points.reduce(
    (acc, point) => ({
      minX: Math.min(acc.minX, point.x),
      minY: Math.min(acc.minY, point.y),
      maxX: Math.max(acc.maxX, point.x),
      maxY: Math.max(acc.maxY, point.y),
    }),
    {
      minX: Infinity,
      minY: Infinity,
      maxX: -Infinity,
      maxY: -Infinity,
    },
  );

  const width = Math.max(bounds.maxX - bounds.minX, 0);
  const height = Math.max(bounds.maxY - bounds.minY, 0);
  return {
    x: bounds.minX,
    y: bounds.minY,
    width,
    height,
    centerX: bounds.minX + width / 2,
    centerY: bounds.minY + height / 2,
  };
}

function boxFromCenter(centerX, centerY, width, height) {
  return {
    x: centerX - width / 2,
    y: centerY - height / 2,
    width,
    height,
    centerX,
    centerY,
  };
}

function clampBox(box) {
  const width = clamp(box.width, 0.01, 1);
  const height = clamp(box.height, 0.01, 1);
  const x = clamp(box.x, 0, 1 - width);
  const y = clamp(box.y, 0, 1 - height);
  return {
    x,
    y,
    width,
    height,
    centerX: x + width / 2,
    centerY: y + height / 2,
  };
}

function expandBounds(bounds, expansion) {
  const left = bounds.width * expansion.left;
  const right = bounds.width * expansion.right;
  const top = bounds.height * expansion.top;
  const bottom = bounds.height * expansion.bottom;
  return clampBox({
    x: bounds.x - left,
    y: bounds.y - top,
    width: bounds.width + left + right,
    height: bounds.height + top + bottom,
    centerX: bounds.centerX + (right - left) / 2,
    centerY: bounds.centerY + (bottom - top) / 2,
  });
}

function smoothBox(previous, target, smoothing) {
  if (!previous) {
    return target;
  }

  const centerX = previous.centerX + (target.centerX - previous.centerX) * smoothing;
  const centerY = previous.centerY + (target.centerY - previous.centerY) * smoothing;
  const width = previous.width + (target.width - previous.width) * smoothing;
  const height = previous.height + (target.height - previous.height) * smoothing;
  return clampBox(boxFromCenter(centerX, centerY, width, height));
}

function measureJump(previous, target) {
  if (!previous) {
    return 0;
  }

  const centerShift = Math.hypot(target.centerX - previous.centerX, target.centerY - previous.centerY);
  const previousScale = Math.max(previous.width, previous.height);
  const targetScale = Math.max(target.width, target.height);
  const scaleShift = previousScale > 0 ? Math.abs(targetScale - previousScale) / previousScale : 0;
  return centerShift + scaleShift * 0.05;
}

function roiMetrics(roi) {
  return {
    widthRatio: roi.width,
    heightRatio: roi.height,
    centerOffset: Math.hypot(roi.centerX - 0.5, roi.centerY - 0.5),
    edgeMargin: Math.min(roi.x, roi.y, 1 - (roi.x + roi.width), 1 - (roi.y + roi.height)),
  };
}

export function createFaceRoiPreviewTracker({
  expansion = { left: 0.45, right: 0.45, top: 0.62, bottom: 0.48 },
  smoothing = 0.24,
  stableFramesRequired = 4,
  jumpThreshold = 0.12,
} = {}) {
  let previousRoi = null;
  let stableFrameCount = 0;

  return {
    reset() {
      previousRoi = null;
      stableFrameCount = 0;
      return DEFAULT_ROI;
    },

    update(landmarks) {
      const raw = getLandmarkBounds(landmarks);
      if (!raw) {
        previousRoi = null;
        stableFrameCount = 0;
        return DEFAULT_ROI;
      }

      const target = expandBounds(raw, expansion);
      const jump = measureJump(previousRoi, target);
      stableFrameCount = jump > jumpThreshold ? 0 : stableFrameCount + 1;
      const roi = smoothBox(previousRoi, target, smoothing);
      previousRoi = roi;

      return {
        visible: true,
        stable: stableFrameCount >= stableFramesRequired,
        raw,
        roi,
        metrics: roiMetrics(roi),
      };
    },
  };
}
