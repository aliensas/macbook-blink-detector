# iPhone Lightweight Boundary

## Status

The iPhone lightweight app has moved to an independent repository.

```text
Local path: /Users/songtao/Documents/als-aac-iphone-lightweight
GitHub: aliensas/als-aac-iphone-lightweight
Visibility: PRIVATE
Default branch: main
```

This Mac repository remains the Mac stable app:

```text
Local path: /Users/songtao/Documents/New project 4
GitHub: aliensas/macbook-blink-detector
```

## Current Boundary

Do not continue iPhone lightweight development in this Mac repository.

The current `/ios/` entry in this repository is only the existing iPhone layout mode for the Mac web app:

```text
/ios/ -> /?platform=ios
```

It is not the new iPhone lightweight app.

## Retired Experiment

The previous in-repo iPhone v0.3 lightweight experiment was removed because real iPhone testing showed poor usability. It tried to build a clean iPhone-only runtime, but model startup, camera/model coordination, and detection loop behavior were not stable enough for patient-facing testing.

The useful lesson was not lost:

```text
Keep Mac stable.
Keep /ios/ usable as the current compatibility path.
Do not copy src/main.js into the iPhone project.
Reuse small shared action logic when needed.
Do not restore ROI input.
Advance the iPhone app in small real-device stages.
```

## Do Not Mix Repositories

Do not write new iPhone lightweight code into:

```text
src/main.js
src/styles.css
```

Do not add new iPhone lightweight entries, `/ios/lab/` routes, or independent iPhone app routes to:

```text
ios/
vite.config.js
scripts/start-ios-dev.mjs
```

The existing `/ios/` compatibility entry and `npm run dev:ios` script may still be maintained, but only for the Mac web app's iPhone layout compatibility mode.

Do not copy the Mac runtime into the iPhone repository.

Mac `src/shared/*` and iPhone `src/core/*` are not automatically synchronized. If the iPhone project needs updated action rules from the Mac project, move only small, reviewed core modules or manually port the relevant logic with tests and a written note.

## Current Recommendation

Mac work should continue in this repository.

iPhone lightweight work should continue in:

```text
/Users/songtao/Documents/als-aac-iphone-lightweight
```

This document exists only to prevent future confusion between the Mac stable repository and the separate iPhone lightweight repository.
