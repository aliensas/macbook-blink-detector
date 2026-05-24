# Mac Project Boundary

## Repository

This repository is the Mac stable project:

```text
Local path: /Users/songtao/Documents/New project 4
GitHub: aliensas/macbook-blink-detector
Primary runtime: Vite web app + Electron macOS shell
```

Its main goal is to keep the Mac version of the ALS facial micro-movement AAC prototype stable and testable.

## Scope

This repository owns:

```text
Mac local web app
Electron desktop package
Current /ios/ compatibility entry that reuses the Mac app with platform=ios
Shared AAC action rules used by the Mac app
Mac-facing documentation and regression notes
```

This repository does not own the new iPhone lightweight app.

The iPhone lightweight app is now an independent private repository:

```text
Local path: /Users/songtao/Documents/als-aac-iphone-lightweight
GitHub: aliensas/als-aac-iphone-lightweight
```

## Important Paths

Mac app entry:

```text
index.html
src/main.js
src/styles.css
```

iPhone compatibility entry:

```text
ios/index.html
```

That file redirects to:

```text
/?platform=ios
```

It is not the new iPhone lightweight app.

Shared logic:

```text
src/shared/aac-input-machine.js
src/shared/action-core.js
src/shared/gesture-params.js
src/shared/face-quality.js
src/shared/face-roi-preview.js
```

These modules are the Mac repository's shared logic. The independent iPhone repository has its own `src/core/*` copy. The two repositories do not automatically share code. Any synchronization between them must be explicit, reviewed, tested, and documented.

Electron shell:

```text
electron/main.cjs
```

Mac documentation:

```text
README.md
docs/mac-stable-baseline.md
docs/runtime-regression-notes.md
docs/aac-input-machine-cleanup-plan.md
docs/gesture-parameters.md
docs/face-quality-gate.md
docs/face-roi-preview.md
docs/desktop-distribution.md
```

## Current Architecture

The current architecture is:

```text
Camera
→ MediaPipe FaceLandmarker
→ face signals / blink events / optional gesture events
→ AAC input interpretation
→ action config
→ screen text + TTS
```

`src/main.js` is still the main runtime coordinator. It owns camera startup, the detection loop, UI rendering, calibration, TTS, logging, and adaptation between live signals and shared logic.

`src/shared/aac-input-machine.js` is the pure AAC input state machine. It owns rules such as:

```text
..  help
... emergency
.-  scratch menu
-.  position menu
--. input management
3-8s eye close exit
8s quiet mode
cooldown and SOS exceptions
secondary menu selection behavior
optional action gating
```

The migration from `src/main.js` to the shared input machine is not fully complete. Some transition logic still exists in `src/main.js`; do not remove it without tests and real Mac verification.

## Do Not Do In This Repository

Do not develop the new iPhone lightweight app here.

Do not add or restore:

```text
ios/lab/
src/ios/
src/ios-lab.js
src/ios-lab.css
ios/v03/
```

Do not add new iPhone lightweight entries, `/ios/lab/` routes, or independent iPhone app routes to:

```text
vite.config.js
scripts/start-ios-dev.mjs
```

The existing `/ios/` compatibility entry and `npm run dev:ios` script may still be maintained, but only for the Mac web app's iPhone layout compatibility mode.

Do not copy `src/main.js` into any iPhone project.

Do not restore experimental ROI input. The current ROI feature is preview-only and must not feed a hidden canvas into FaceLandmarker.

Do not modify Mac camera startup, FaceLandmarker setup, TTS, or the detection loop as part of unrelated work.

## Allowed Work

Allowed Mac work includes:

```text
Fixing Mac bugs
Improving Mac documentation
Tightening Electron desktop permissions
Improving shared AAC input tests
Carefully migrating small pieces of action interpretation from src/main.js into shared modules
Packaging and distribution work for the macOS app
```

When changing shared modules, remember that the iPhone repository may later port or reuse parts of them. Keep shared modules platform-independent:

```text
No DOM access
No camera APIs
No SpeechSynthesis APIs
No Electron APIs
No platform-specific UI strings unless they are action semantics
```

## Regression Rules

Before committing Mac changes, run:

```bash
npm run test:logic
npm run build
git diff --check
```

For JavaScript runtime-sensitive changes, also run:

```bash
node --check src/main.js
node --check src/shared/aac-input-machine.js
node --check electron/main.cjs
```

For camera, FaceLandmarker, TTS, or detection-loop changes, manual Mac testing is required:

```text
Open /
Start camera
Confirm face detection
Test .. help
Test ... emergency
Test .- scratch menu
Test -. position menu
Test 3s eye-close exit
Test TTS output
Stop and restart camera
```

## Current Priorities

Current Mac priorities are:

```text
Keep the Mac version stable.
Avoid broad rewrites.
Reduce src/main.js complexity in small, tested steps.
Continue migrating AAC interpretation into src/shared/aac-input-machine.js only when the behavior is covered by tests.
Keep the current /ios/ compatibility path working, but do not expand it into the new iPhone lightweight app.
```

## Current Worktree Status

At the time this boundary document was written, the Mac worktree had local changes that should be reviewed as Mac-repository work:

```text
README.md
electron/main.cjs
docs/mac-project-boundary.md
docs/ios/iphone-lightweight-rebuild-plan.md
```

These changes are Mac boundary documentation and desktop permission tightening. They are not part of the independent iPhone lightweight repository.

## One-Sentence Boundary

This repository is the Mac stable AAC app; the iPhone lightweight app now lives in its own repository, and new iPhone development must not be mixed back into this Mac project.
