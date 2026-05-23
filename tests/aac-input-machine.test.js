import test from "node:test";
import assert from "node:assert/strict";

import {
  AAC_COMMANDS,
  AAC_INPUT_EVENTS,
  AAC_INPUT_MODES,
  AAC_QUALITY_STATES,
  createAacInputMachine,
} from "../src/shared/aac-input-machine.js";

const S = AAC_INPUT_EVENTS.SHORT_BLINK;
const L = AAC_INPUT_EVENTS.LONG_BLINK;

function createMachine(options = {}) {
  return createAacInputMachine({
    nowMs: 100,
    ...options,
  });
}

function run(machine, steps) {
  const commands = [];
  steps.forEach((step) => {
    if (typeof step === "number") {
      commands.push(...machine.advance(step));
      return;
    }
    commands.push(...machine.send({ type: step }));
  });
  return commands;
}

function hasCommand(commands, type, predicate = () => true) {
  return commands.some((item) => item.type === type && predicate(item));
}

function actions(commands) {
  return commands.filter((item) => item.type === AAC_COMMANDS.ACTION);
}

function actionIds(commands) {
  return actions(commands).map((item) => item.gestureId);
}

test("single short blink is ignored after the prefix window", () => {
  const machine = createMachine();
  const commands = run(machine, [S, 1300]);

  assert.equal(machine.snapshot().mode, AAC_INPUT_MODES.WAITING);
  assert.deepEqual(actionIds(commands), []);
  assert.deepEqual(machine.snapshot().blinkBuffer, []);
  assert.ok(hasCommand(commands, AAC_COMMANDS.IGNORED, (item) => item.code === "."));
});

test("two short blinks wait for a possible third blink before help fires", () => {
  const machine = createMachine();
  const early = run(machine, [S, 150, S]);

  assert.deepEqual(actionIds(early), []);
  assert.deepEqual(machine.snapshot().blinkBuffer, [".", "."]);

  const late = machine.advance(1300);

  assert.deepEqual(actionIds(late), ["blink_double_short"]);
  assert.equal(machine.snapshot().mode, AAC_INPUT_MODES.COOLDOWN);
  assert.deepEqual(machine.snapshot().blinkBuffer, []);
});

test("three short blinks trigger emergency and do not trigger help", () => {
  const machine = createMachine();
  const commands = run(machine, [S, 150, S, 150, S, 400]);

  assert.deepEqual(actionIds(commands), ["blink_triple_short"]);
  assert.equal(actions(commands)[0].emergency, true);
  assert.equal(machine.snapshot().mode, AAC_INPUT_MODES.COOLDOWN);
});

test("short blink plus long blink enters scratch secondary menu", () => {
  const machine = createMachine();
  const commands = run(machine, [S, 150, L, 400]);

  assert.ok(hasCommand(commands, AAC_COMMANDS.ENTER_SECONDARY_MENU, (item) => item.groupId === "scratch"));
  assert.equal(machine.snapshot().mode, AAC_INPUT_MODES.SECONDARY_MENU);
});

test("long blink plus short blink enters position secondary menu", () => {
  const machine = createMachine();
  const commands = run(machine, [L, 150, S, 400]);

  assert.ok(hasCommand(commands, AAC_COMMANDS.ENTER_SECONDARY_MENU, (item) => item.groupId === "position"));
  assert.equal(machine.snapshot().menu.groupId, "position");
});

test("double long blink is ignored, but long long short enters input management", () => {
  const ignoredMachine = createMachine();
  const ignored = run(ignoredMachine, [L, 1200, L, 1700]);

  assert.deepEqual(actionIds(ignored), []);
  assert.equal(ignoredMachine.snapshot().mode, AAC_INPUT_MODES.WAITING);

  const machine = createMachine();
  const commands = run(machine, [L, 1200, L, 1200, S, 400]);

  assert.ok(hasCommand(commands, AAC_COMMANDS.ENTER_INPUT_MANAGEMENT));
  assert.equal(machine.snapshot().mode, AAC_INPUT_MODES.INPUT_MANAGEMENT);
});

test("stale blink gaps silently reset the sequence", () => {
  const machine = createMachine();
  const commands = run(machine, [L, 3000, L, 3000, S, 1300]);

  assert.equal(machine.snapshot().mode, AAC_INPUT_MODES.WAITING);
  assert.deepEqual(actionIds(commands), []);
  assert.ok(!hasCommand(commands, AAC_COMMANDS.ENTER_INPUT_MANAGEMENT));
});

test("secondary menu selection locks the item highlighted on the second short blink", () => {
  const machine = createMachine();
  run(machine, [S, 150, L, 400]);

  let commands = machine.send({ type: AAC_INPUT_EVENTS.SET_MENU_INDEX, index: 0 });
  commands.push(...run(machine, [S]));
  commands.push(...machine.send({ type: AAC_INPUT_EVENTS.SET_MENU_INDEX, index: 1 }));
  commands.push(...run(machine, [150, S, 1300]));

  assert.ok(
    hasCommand(
      commands,
      AAC_COMMANDS.SELECT_MENU_ITEM,
      (item) => item.groupId === "scratch" && item.index === 1 && item.itemId === "scratch_face",
    ),
  );
  assert.ok(!hasCommand(commands, AAC_COMMANDS.SELECT_MENU_ITEM, (item) => item.index === 0));
  assert.equal(machine.snapshot().mode, AAC_INPUT_MODES.COOLDOWN);
});

test("single short blink in a secondary menu does not lock or pause selection", () => {
  const machine = createMachine({
    initialState: {
      mode: AAC_INPUT_MODES.SECONDARY_MENU,
      menu: {
        groupId: "scratch",
        index: 1,
      },
    },
  });

  const commands = run(machine, [S]);

  assert.ok(!hasCommand(commands, AAC_COMMANDS.LOCK_MENU_ITEM));
  assert.equal(machine.snapshot().menu.lockedIndex, null);
});

test("menu index is clamped before selection", () => {
  const machine = createMachine();
  run(machine, [S, 150, L, 400]);

  const commands = [];
  commands.push(...machine.send({ type: AAC_INPUT_EVENTS.SET_MENU_INDEX, index: 99 }));
  commands.push(...run(machine, [S, 150, S, 1300]));

  assert.ok(
    hasCommand(
      commands,
      AAC_COMMANDS.SELECT_MENU_ITEM,
      (item) => item.groupId === "scratch" && item.index === 2 && item.itemId === "scratch_back",
    ),
  );
});

test("initial state can hydrate a locked menu context for app adapters", () => {
  const machine = createMachine({
    initialState: {
      mode: AAC_INPUT_MODES.SECONDARY_MENU,
      menu: {
        groupId: "scratch",
        index: 1,
        lockedIndex: 0,
      },
    },
  });

  const commands = run(machine, [S, 150, S, 1300]);

  assert.ok(
    hasCommand(
      commands,
      AAC_COMMANDS.SELECT_MENU_ITEM,
      (item) => item.groupId === "scratch" && item.index === 0 && item.itemId === "scratch_head",
    ),
  );
});

test("secondary menu preserves SOS by waiting after the second short blink", () => {
  const machine = createMachine();
  run(machine, [S, 150, L, 400]);

  const commands = run(machine, [S, 150, S, 150, S, 400]);

  assert.deepEqual(actionIds(commands), ["blink_triple_short"]);
  assert.ok(!hasCommand(commands, AAC_COMMANDS.SELECT_MENU_ITEM));
  assert.equal(machine.snapshot().mode, AAC_INPUT_MODES.COOLDOWN);
});

test("input management toggles locked option and menu cooldown prevents immediate next lock", () => {
  const machine = createMachine();
  run(machine, [L, 1200, L, 1200, S, 400]);
  machine.send({ type: AAC_INPUT_EVENTS.SET_MENU_INDEX, index: 1 });

  let commands = run(machine, [S, 150, S, 1300]);

  assert.ok(
    hasCommand(
      commands,
      AAC_COMMANDS.TOGGLE_INPUT_CHANNEL,
      (item) => item.channel === "brow" && item.enabled === true,
    ),
  );
  assert.equal(machine.snapshot().mode, AAC_INPUT_MODES.INPUT_MANAGEMENT);

  commands = run(machine, [S]);

  assert.ok(!hasCommand(commands, AAC_COMMANDS.LOCK_MENU_ITEM));
  assert.deepEqual(machine.snapshot().blinkBuffer, ["."]);
});

test("input management does not let SOS become a toggle", () => {
  const machine = createMachine();
  run(machine, [L, 1200, L, 1200, S, 400]);
  machine.send({ type: AAC_INPUT_EVENTS.SET_MENU_INDEX, index: 2 });

  const commands = run(machine, [S, 150, S, 150, S, 400]);

  assert.deepEqual(actionIds(commands), ["blink_triple_short"]);
  assert.ok(!hasCommand(commands, AAC_COMMANDS.TOGGLE_INPUT_CHANNEL));
  assert.equal(machine.snapshot().mode, AAC_INPUT_MODES.COOLDOWN);
});

test("confirmation waits after two short blinks and SOS overrides confirmation", () => {
  const confirmMachine = createMachine();
  confirmMachine.send({ type: AAC_INPUT_EVENTS.START_CONFIRMATION, id: "mouth_care" });
  const confirmCommands = run(confirmMachine, [S, 150, S, 1300]);

  assert.ok(hasCommand(confirmCommands, AAC_COMMANDS.CONFIRM, (item) => item.id === "mouth_care"));
  assert.equal(confirmMachine.snapshot().mode, AAC_INPUT_MODES.COOLDOWN);

  const emergencyMachine = createMachine();
  emergencyMachine.send({ type: AAC_INPUT_EVENTS.START_CONFIRMATION, id: "mouth_care" });
  const emergencyCommands = run(emergencyMachine, [S, 150, S, 150, S, 400]);

  assert.deepEqual(actionIds(emergencyCommands), ["blink_triple_short"]);
  assert.ok(!hasCommand(emergencyCommands, AAC_COMMANDS.CONFIRM));
});

test("long-close exit returns modal states to waiting", () => {
  const machine = createMachine();
  run(machine, [S, 150, L, 400]);

  const commands = machine.send({ type: AAC_INPUT_EVENTS.LONG_CLOSE_EXIT });

  assert.ok(hasCommand(commands, AAC_COMMANDS.EXIT_TO_WAITING, (item) => item.reason === "long_close_exit"));
  assert.equal(machine.snapshot().mode, AAC_INPUT_MODES.WAITING);
});

test("long-close quiet enters quiet mode and four short blinks recover with recovery cooldown", () => {
  const machine = createMachine();
  const enterCommands = machine.send({ type: AAC_INPUT_EVENTS.LONG_CLOSE_QUIET });

  assert.ok(hasCommand(enterCommands, AAC_COMMANDS.ENTER_QUIET));
  assert.equal(machine.snapshot().mode, AAC_INPUT_MODES.QUIET);

  const recoverCommands = run(machine, [S, 150, S, 150, S, 150, S]);

  assert.ok(hasCommand(recoverCommands, AAC_COMMANDS.EXIT_QUIET));
  assert.equal(machine.snapshot().mode, AAC_INPUT_MODES.RECOVERY_COOLDOWN);

  const fifthCommands = run(machine, [S]);

  assert.ok(hasCommand(fifthCommands, AAC_COMMANDS.IGNORED, (item) => item.reason === "recovery_cooldown"));
  assert.deepEqual(machine.snapshot().blinkBuffer, []);

  machine.advance(1000);
  assert.equal(machine.snapshot().mode, AAC_INPUT_MODES.WAITING);
});

test("quiet mode three short blinks wait for a fourth, then trigger emergency if none arrives", () => {
  const machine = createMachine();
  machine.send({ type: AAC_INPUT_EVENTS.LONG_CLOSE_QUIET });

  const pending = run(machine, [S, 150, S, 150, S]);

  assert.deepEqual(actionIds(pending), []);
  assert.equal(machine.snapshot().mode, AAC_INPUT_MODES.QUIET);

  const commands = machine.advance(1300);

  assert.deepEqual(actionIds(commands), ["blink_triple_short"]);
  assert.equal(machine.snapshot().mode, AAC_INPUT_MODES.COOLDOWN);
});

test("cooldown ignores ordinary actions but allows a new strict SOS buffer", () => {
  const machine = createMachine();
  run(machine, [S, 150, S, 1300]);

  assert.equal(machine.snapshot().mode, AAC_INPUT_MODES.COOLDOWN);

  const ignored = run(machine, [AAC_INPUT_EVENTS.BROW_RAISE]);
  assert.ok(hasCommand(ignored, AAC_COMMANDS.IGNORED, (item) => item.reason === "action_cooldown"));

  const emergency = run(machine, [S, 150, S, 150, S, 400]);

  assert.deepEqual(actionIds(emergency), ["blink_triple_short"]);
});

test("mouth double-open requires the enabled channel and a short window", () => {
  const disabledMachine = createMachine();
  const disabled = run(disabledMachine, [AAC_INPUT_EVENTS.MOUTH_OPEN, 1000, AAC_INPUT_EVENTS.MOUTH_OPEN]);

  assert.deepEqual(actionIds(disabled), []);

  const machine = createMachine({ inputChannels: { mouth: true } });
  const commands = run(machine, [AAC_INPUT_EVENTS.MOUTH_OPEN, 1000, AAC_INPUT_EVENTS.MOUTH_OPEN]);

  assert.deepEqual(actionIds(commands), ["mouth_double_open"]);

  const lateMachine = createMachine({ inputChannels: { mouth: true } });
  const late = run(lateMachine, [AAC_INPUT_EVENTS.MOUTH_OPEN, 3000, AAC_INPUT_EVENTS.MOUTH_OPEN, 2300]);

  assert.deepEqual(actionIds(late), []);
});

test("disabling optional channels clears pending mouth and smile sequences", () => {
  const mouthMachine = createMachine({ inputChannels: { mouth: true } });
  run(mouthMachine, [AAC_INPUT_EVENTS.MOUTH_OPEN]);
  mouthMachine.setInputChannel("mouth", false);
  mouthMachine.setInputChannel("mouth", true);
  const mouthCommands = run(mouthMachine, [1000, AAC_INPUT_EVENTS.MOUTH_OPEN]);

  assert.deepEqual(actionIds(mouthCommands), []);
  assert.equal(mouthMachine.snapshot().mouthTimes.length, 1);

  const smileMachine = createMachine({ inputChannels: { smile: true } });
  run(smileMachine, [AAC_INPUT_EVENTS.SMILE]);
  smileMachine.setInputChannel("smile", false);
  smileMachine.setInputChannel("smile", true);
  const smileCommands = run(smileMachine, [1500]);

  assert.deepEqual(actionIds(smileCommands), []);
  assert.equal(smileMachine.snapshot().smilePendingAt, null);
});

test("smile waits for double-smile before falling back to single-smile", () => {
  const singleMachine = createMachine({ inputChannels: { smile: true } });
  const single = run(singleMachine, [AAC_INPUT_EVENTS.SMILE, 1500]);

  assert.deepEqual(actionIds(single), ["smile"]);

  const doubleMachine = createMachine({ inputChannels: { smile: true } });
  const double = run(doubleMachine, [AAC_INPUT_EVENTS.SMILE, 700, AAC_INPUT_EVENTS.SMILE]);

  assert.deepEqual(actionIds(double), ["smile_double"]);
});

test("quality gate blocks ordinary actions in unstable-eye mode but allows strict SOS", () => {
  const ordinaryMachine = createMachine({ qualityState: AAC_QUALITY_STATES.UNSTABLE_EYES_OK });
  const ordinary = run(ordinaryMachine, [S, 150, S, 1300]);

  assert.deepEqual(actionIds(ordinary), []);
  assert.ok(hasCommand(ordinary, AAC_COMMANDS.BLOCKED, (item) => item.candidate === "ordinaryBlinkCode"));

  const emergencyMachine = createMachine({ qualityState: AAC_QUALITY_STATES.UNSTABLE_EYES_OK });
  const emergency = run(emergencyMachine, [S, 150, S, 150, S, 400]);

  assert.deepEqual(actionIds(emergency), ["blink_triple_short"]);

  const browMachine = createMachine({
    qualityState: AAC_QUALITY_STATES.UNSTABLE_EYES_OK,
    inputChannels: { brow: true },
  });
  const brow = run(browMachine, [AAC_INPUT_EVENTS.BROW_RAISE]);

  assert.ok(hasCommand(brow, AAC_COMMANDS.BLOCKED, (item) => item.candidate === "optionalGesture"));
});

test("quality blocks clear stale partial blink and optional action buffers", () => {
  const blinkMachine = createMachine();
  run(blinkMachine, [S]);
  blinkMachine.setQualityState(AAC_QUALITY_STATES.NO_FACE);
  run(blinkMachine, [150, S]);
  blinkMachine.setQualityState(AAC_QUALITY_STATES.GOOD);
  const blinkCommands = run(blinkMachine, [150, S, 1300]);

  assert.deepEqual(actionIds(blinkCommands), []);
  assert.deepEqual(blinkMachine.snapshot().blinkBuffer, []);

  const mouthMachine = createMachine({ inputChannels: { mouth: true } });
  run(mouthMachine, [AAC_INPUT_EVENTS.MOUTH_OPEN]);
  mouthMachine.setQualityState(AAC_QUALITY_STATES.UNSTABLE_EYES_OK);
  run(mouthMachine, [500, AAC_INPUT_EVENTS.MOUTH_OPEN]);
  mouthMachine.setQualityState(AAC_QUALITY_STATES.GOOD);
  const mouthCommands = run(mouthMachine, [500, AAC_INPUT_EVENTS.MOUTH_OPEN]);

  assert.deepEqual(actionIds(mouthCommands), []);
  assert.deepEqual(mouthMachine.snapshot().mouthTimes.length, 1);

  const smileMachine = createMachine({ inputChannels: { smile: true } });
  run(smileMachine, [AAC_INPUT_EVENTS.SMILE]);
  smileMachine.setQualityState(AAC_QUALITY_STATES.UNSTABLE_EYES_OK);
  run(smileMachine, [700, AAC_INPUT_EVENTS.SMILE]);
  smileMachine.setQualityState(AAC_QUALITY_STATES.GOOD);
  const smileCommands = run(smileMachine, [800]);

  assert.deepEqual(actionIds(smileCommands), []);
  assert.equal(smileMachine.snapshot().smilePendingAt, null);
});

test("no-face quality blocks all patient action events", () => {
  const machine = createMachine({ qualityState: AAC_QUALITY_STATES.NO_FACE, inputChannels: { brow: true } });
  const blink = run(machine, [S, 150, S, 150, S, 400]);
  const brow = run(machine, [AAC_INPUT_EVENTS.BROW_RAISE]);

  assert.deepEqual(actionIds([...blink, ...brow]), []);
  assert.ok(hasCommand(blink, AAC_COMMANDS.BLOCKED, (item) => item.candidate === "blink"));
  assert.ok(hasCommand(brow, AAC_COMMANDS.BLOCKED, (item) => item.candidate === "optionalGesture"));
});
