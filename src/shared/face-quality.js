const DEFAULT_QUALITY = Object.freeze({
  level: "missing",
  reason: "missing",
  score: 0,
  blocking: true,
  metrics: {
    widthRatio: 0,
    heightRatio: 0,
    areaRatio: 0,
    centerOffset: 1,
    edgeMargin: 0,
    jitter: 0,
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

  const widthRatio = Math.max(bounds.maxX - bounds.minX, 0);
  const heightRatio = Math.max(bounds.maxY - bounds.minY, 0);
  const centerX = bounds.minX + widthRatio / 2;
  const centerY = bounds.minY + heightRatio / 2;

  return {
    ...bounds,
    widthRatio,
    heightRatio,
    areaRatio: widthRatio * heightRatio,
    centerX,
    centerY,
    centerOffset: Math.hypot(centerX - 0.5, centerY - 0.5),
    edgeMargin: Math.min(bounds.minX, bounds.minY, 1 - bounds.maxX, 1 - bounds.maxY),
  };
}

function computeFrameJitter(previousFrame, bounds) {
  if (!previousFrame || !bounds) {
    return 0;
  }

  const centerShift = Math.hypot(bounds.centerX - previousFrame.centerX, bounds.centerY - previousFrame.centerY);
  const scale = Math.max(bounds.widthRatio, bounds.heightRatio);
  const previousScale = Math.max(previousFrame.widthRatio, previousFrame.heightRatio);
  const scaleShift = previousScale > 0 ? Math.abs(scale - previousScale) / previousScale : 0;
  return centerShift + scaleShift * 0.04;
}

function scoreFaceQuality(bounds, jitter) {
  let score = 1;
  score -= clamp((0.26 - bounds.heightRatio) / 0.16, 0, 1) * 0.34;
  score -= clamp((0.05 - bounds.areaRatio) / 0.04, 0, 1) * 0.18;
  score -= clamp((bounds.centerOffset - 0.24) / 0.24, 0, 1) * 0.24;
  score -= clamp((0.05 - bounds.edgeMargin) / 0.08, 0, 1) * 0.14;
  score -= clamp((jitter - 0.025) / 0.075, 0, 1) * 0.1;
  return clamp(score, 0, 1);
}

function classifyQuality(bounds, jitter) {
  if (bounds.heightRatio < 0.18 || bounds.areaRatio < 0.025) {
    return { level: "poor", reason: "tooSmall", blocking: true };
  }

  if (bounds.centerOffset > 0.42) {
    return { level: "poor", reason: "offCenter", blocking: true };
  }

  if (bounds.edgeMargin < -0.03) {
    return { level: "poor", reason: "nearEdge", blocking: true };
  }

  if (jitter > 0.08) {
    return { level: "poor", reason: "unstable", blocking: true };
  }

  if (bounds.heightRatio < 0.26 || bounds.areaRatio < 0.05) {
    return { level: "usable", reason: "small", blocking: false };
  }

  if (bounds.centerOffset > 0.3) {
    return { level: "usable", reason: "offCenter", blocking: false };
  }

  if (bounds.edgeMargin < 0.045) {
    return { level: "usable", reason: "nearEdge", blocking: false };
  }

  if (jitter > 0.045) {
    return { level: "usable", reason: "slightlyUnstable", blocking: false };
  }

  return { level: "good", reason: "good", blocking: false };
}

export function createFaceQualityTracker({ jitterWindow = 8 } = {}) {
  let previousFrame = null;
  let jitterSamples = [];

  return {
    reset() {
      previousFrame = null;
      jitterSamples = [];
      return DEFAULT_QUALITY;
    },

    update(landmarks) {
      const bounds = getLandmarkBounds(landmarks);
      if (!bounds) {
        previousFrame = null;
        jitterSamples = [];
        return DEFAULT_QUALITY;
      }

      const frameJitter = computeFrameJitter(previousFrame, bounds);
      previousFrame = bounds;
      jitterSamples.push(frameJitter);
      if (jitterSamples.length > jitterWindow) {
        jitterSamples.shift();
      }

      const jitter =
        jitterSamples.length > 1 ? jitterSamples.reduce((sum, value) => sum + value, 0) / jitterSamples.length : 0;
      const classification = classifyQuality(bounds, jitter);

      return {
        ...classification,
        score: scoreFaceQuality(bounds, jitter),
        metrics: {
          widthRatio: bounds.widthRatio,
          heightRatio: bounds.heightRatio,
          areaRatio: bounds.areaRatio,
          centerOffset: bounds.centerOffset,
          edgeMargin: bounds.edgeMargin,
          jitter,
        },
      };
    },
  };
}
