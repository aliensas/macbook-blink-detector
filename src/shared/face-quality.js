const DEFAULT_QUALITY = Object.freeze({
  level: "missing",
  reason: "missing",
  score: 0,
  blocking: true,
  eyesUsable: false,
  triggerPolicy: "none",
  metrics: {
    widthRatio: 0,
    heightRatio: 0,
    areaRatio: 0,
    centerOffset: 1,
    edgeMargin: 0,
    jitter: 0,
    eyeSpanRatio: 0,
  },
});

const EYE_ANCHOR_POINTS = [33, 133, 362, 263, 159, 145, 386, 374];

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

function distance(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

function hasLandmarkIndices(landmarks, indices) {
  return indices.every((index) => {
    const point = landmarks?.[index];
    return point && Number.isFinite(point.x) && Number.isFinite(point.y);
  });
}

function computeEyeSpanRatio(landmarks) {
  if (!hasLandmarkIndices(landmarks, EYE_ANCHOR_POINTS)) {
    return 0;
  }

  const leftOuter = landmarks[33];
  const rightOuter = landmarks[263];
  return distance(leftOuter, rightOuter);
}

function computeEyesUsable(landmarks, bounds, jitter) {
  const eyeSpanRatio = computeEyeSpanRatio(landmarks);
  const eyesUsable =
    eyeSpanRatio >= 0.075 &&
    bounds.heightRatio >= 0.16 &&
    bounds.areaRatio >= 0.02 &&
    bounds.edgeMargin >= -0.04 &&
    jitter <= 0.11;

  return { eyesUsable, eyeSpanRatio };
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

function withTriggerPolicy(classification, eyesUsable) {
  if (!eyesUsable) {
    return {
      ...classification,
      level: "poor",
      reason: classification.reason === "good" ? "eyesUnstable" : classification.reason,
      blocking: true,
      eyesUsable,
      triggerPolicy: "none",
    };
  }

  if (classification.blocking) {
    return {
      ...classification,
      eyesUsable,
      triggerPolicy: eyesUsable ? "eyesOnly" : "none",
    };
  }

  return { ...classification, eyesUsable, triggerPolicy: "all" };
}

function classifyQuality(bounds, jitter, eyesUsable) {
  if (bounds.heightRatio < 0.18 || bounds.areaRatio < 0.025) {
    return withTriggerPolicy({ level: "poor", reason: "tooSmall", blocking: true }, eyesUsable);
  }

  if (bounds.centerOffset > 0.42) {
    return withTriggerPolicy({ level: "poor", reason: "offCenter", blocking: true }, eyesUsable);
  }

  if (bounds.edgeMargin < -0.03) {
    return withTriggerPolicy({ level: "poor", reason: "nearEdge", blocking: true }, eyesUsable);
  }

  if (jitter > 0.08) {
    return withTriggerPolicy({ level: "poor", reason: "unstable", blocking: true }, eyesUsable);
  }

  if (bounds.heightRatio < 0.26 || bounds.areaRatio < 0.05) {
    return withTriggerPolicy({ level: "usable", reason: "small", blocking: false }, eyesUsable);
  }

  if (bounds.centerOffset > 0.3) {
    return withTriggerPolicy({ level: "usable", reason: "offCenter", blocking: false }, eyesUsable);
  }

  if (bounds.edgeMargin < 0.045) {
    return withTriggerPolicy({ level: "usable", reason: "nearEdge", blocking: false }, eyesUsable);
  }

  if (jitter > 0.045) {
    return withTriggerPolicy({ level: "usable", reason: "slightlyUnstable", blocking: false }, eyesUsable);
  }

  return withTriggerPolicy({ level: "good", reason: "good", blocking: false }, eyesUsable);
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
      const eyeQuality = computeEyesUsable(landmarks, bounds, jitter);
      const classification = classifyQuality(bounds, jitter, eyeQuality.eyesUsable);

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
          eyeSpanRatio: eyeQuality.eyeSpanRatio,
        },
      };
    },
  };
}
