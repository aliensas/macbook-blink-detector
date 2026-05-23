export const GESTURE_DETECTOR_PARAMS = {
  brow: {
    threshold: 0.12,
    peakThreshold: 0.17,
    minHoldMs: 300,
    cooldownMs: 1500,
    releaseMinMs: 110,
  },
  secondaryBrow: {
    threshold: 0.075,
    peakThreshold: 0.1,
    minHoldMs: 180,
    cooldownMs: 1100,
    releaseMinMs: 70,
  },
  mouth: {
    threshold: 0.055,
    peakThreshold: 0.075,
    minHoldMs: 180,
    cooldownMs: 300,
    releaseMinMs: 50,
  },
  smile: {
    threshold: 0.09,
    peakThreshold: 0.12,
    minHoldMs: 800,
    cooldownMs: 450,
    releaseMinMs: 250,
  },
};

export const MOUTH_SEQUENCE_PARAMS = {
  doubleWindowMs: 2200,
  browSuppressThreshold: 0.045,
  smileSuppressThreshold: 0.16,
};

export const SMILE_SEQUENCE_PARAMS = {
  mouthSuppressThreshold: 0.14,
  doubleWindowMs: 1400,
  doubleMinGapMs: 550,
  widthDeltaScale: 0.055,
};

export const HEAD_SHAKE_PARAMS = {
  yawThreshold: 0.022,
  idleResetMs: 3200,
  requiredDirectionChanges: 2,
  windowMs: 4000,
  cooldownMs: 1000,
};

export const SMILE_HEAD_MOTION_GUARD = {
  settleMs: 500,
};

export const BROW_HEAD_MOTION_GUARD = {
  pitchDelta: 0.03,
  pitchJump: 0.012,
  centerJump: 0.015,
  settleMs: 650,
};

export const FACE_SCALE_STABILITY = {
  relativeJump: 0.1,
  absoluteJump: 0.02,
  settleMs: 700,
};
