export const AAC_INPUT_MODES = {
  WAITING: "WAITING",
  SECONDARY_MENU: "SECONDARY_MENU",
  INPUT_MANAGEMENT: "INPUT_MANAGEMENT",
  CONFIRM_WINDOW: "CONFIRM_WINDOW",
  QUIET: "QUIET",
  COOLDOWN: "COOLDOWN",
  RECOVERY_COOLDOWN: "RECOVERY_COOLDOWN",
};

export const AAC_INPUT_EVENTS = {
  SHORT_BLINK: "SHORT_BLINK",
  LONG_BLINK: "LONG_BLINK",
  LONG_CLOSE_EXIT: "LONG_CLOSE_EXIT",
  LONG_CLOSE_QUIET: "LONG_CLOSE_QUIET",
  BROW_RAISE: "BROW_RAISE",
  MOUTH_OPEN: "MOUTH_OPEN",
  SMILE: "SMILE",
  HEAD_SHAKE: "HEAD_SHAKE",
  SET_MENU_INDEX: "SET_MENU_INDEX",
  START_CONFIRMATION: "START_CONFIRMATION",
  TICK: "TICK",
};

export const AAC_COMMANDS = {
  ACTION: "ACTION",
  ENTER_SECONDARY_MENU: "ENTER_SECONDARY_MENU",
  ENTER_INPUT_MANAGEMENT: "ENTER_INPUT_MANAGEMENT",
  LOCK_MENU_ITEM: "LOCK_MENU_ITEM",
  SELECT_MENU_ITEM: "SELECT_MENU_ITEM",
  TOGGLE_INPUT_CHANNEL: "TOGGLE_INPUT_CHANNEL",
  CONFIRM: "CONFIRM",
  CANCEL: "CANCEL",
  ENTER_QUIET: "ENTER_QUIET",
  EXIT_QUIET: "EXIT_QUIET",
  EXIT_TO_WAITING: "EXIT_TO_WAITING",
  BLOCKED: "BLOCKED",
  IGNORED: "IGNORED",
  MODE_CHANGED: "MODE_CHANGED",
};

export const AAC_QUALITY_STATES = {
  GOOD: "GOOD",
  USABLE_WARN: "USABLE_WARN",
  UNSTABLE_EYES_OK: "UNSTABLE_EYES_OK",
  UNSTABLE_EYES_BAD: "UNSTABLE_EYES_BAD",
  NO_FACE: "NO_FACE",
};

export const DEFAULT_AAC_TIMING = {
  maxGapAfterShortMs: 1200,
  maxGapAfterLongMs: 1600,
  shortDecodeMs: 1200,
  longDecodeMs: 2200,
  finalDecodeMs: 350,
  inputManagementContinuationMs: 1600,
  ordinaryMaxTotalMs: 6000,
  codeMaxTotalMs: {
    "..": 2500,
    "...": 4000,
    ".-": 5000,
    "-.": 5500,
    "--": 9000,
    "--.": 9000,
  },
  actionCooldownMs: 2000,
  menuActionCooldownMs: 700,
  recoveryCooldownMs: 900,
  quietResumeBlinkCount: 4,
  quietResumeWindowMs: 8000,
  mouthDoubleWindowMs: 2200,
  smileDoubleWindowMs: 1400,
  smileDoubleMinGapMs: 550,
};

export const DEFAULT_AAC_INPUT_CHANNELS = {
  brow: false,
  mouth: false,
  smile: false,
  head: false,
};

const BLINK_CODE_GESTURES = {
  "..": "blink_double_short",
  "...": "blink_triple_short",
  ".-": "blink_short_long",
  "-.": "blink_long_short",
  "--.": "input_management",
};

const SECONDARY_GROUP_FOR_BLINK_CODE = {
  ".-": "scratch",
  "-.": "position",
};

const COMPLETE_BLINK_CODES = new Set([".", "-", "..", "...", ".-", "-.", "--", "--."]);
const BLINK_CODE_PREFIXES = new Set([".", "-", "..", "--"]);
const EMERGENCY_BLINK_CODE = "...";

function command(type, payload = {}) {
  return { type, ...payload };
}

function clone(value) {
  return JSON.parse(JSON.stringify(value));
}

function qualityPolicy(qualityState) {
  if (qualityState === AAC_QUALITY_STATES.UNSTABLE_EYES_OK) {
    return "emergencyOnly";
  }
  if (qualityState === AAC_QUALITY_STATES.UNSTABLE_EYES_BAD || qualityState === AAC_QUALITY_STATES.NO_FACE) {
    return "none";
  }
  return "all";
}

export class AacInputMachine {
  constructor(options = {}) {
    this.timing = {
      ...DEFAULT_AAC_TIMING,
      ...(options.timing || {}),
      codeMaxTotalMs: {
        ...DEFAULT_AAC_TIMING.codeMaxTotalMs,
        ...(options.timing?.codeMaxTotalMs || {}),
      },
    };
    this.inputChannels = {
      ...DEFAULT_AAC_INPUT_CHANNELS,
      ...(options.inputChannels || {}),
    };
    this.now = Number(options.nowMs || 0);
    this.qualityState = options.qualityState || AAC_QUALITY_STATES.GOOD;
    this.menuOptions = {
      scratch: options.menuOptions?.scratch || ["scratch_head", "scratch_face", "scratch_back"],
      position: options.menuOptions?.position || ["position_left", "position_right", "position_raise"],
      inputChannels: options.menuOptions?.inputChannels || [
        "blink_only",
        "toggle_brow",
        "toggle_mouth",
        "toggle_smile",
        "toggle_head",
        "exit",
      ],
    };
    this.reset();
    this.applyInitialState(options.initialState);
  }

  reset() {
    this.mode = AAC_INPUT_MODES.WAITING;
    this.blinkBuffer = [];
    this.blinkStartedAt = null;
    this.blinkLastAt = null;
    this.blinkDecodeAt = null;
    this.blinkEmergencyOnly = false;
    this.menu = {
      groupId: "",
      index: 0,
      lockedIndex: null,
    };
    this.confirmation = null;
    this.cooldownUntil = 0;
    this.recoveryCooldownUntil = 0;
    this.menuActionCooldownUntil = 0;
    this.quiet = {
      count: 0,
      startedAt: 0,
      lastAt: 0,
      deadlineAt: 0,
    };
    this.mouthTimes = [];
    this.mouthDeadlineAt = 0;
    this.smilePendingAt = null;
    this.smileDeadlineAt = 0;
  }

  snapshot() {
    return clone({
      now: this.now,
      mode: this.mode,
      qualityState: this.qualityState,
      inputChannels: this.inputChannels,
      blinkBuffer: this.blinkBuffer,
      blinkEmergencyOnly: this.blinkEmergencyOnly,
      menu: this.menu,
      confirmation: this.confirmation,
      cooldownUntil: this.cooldownUntil,
      recoveryCooldownUntil: this.recoveryCooldownUntil,
      menuActionCooldownUntil: this.menuActionCooldownUntil,
      quiet: this.quiet,
      mouthTimes: this.mouthTimes,
      smilePendingAt: this.smilePendingAt,
    });
  }

  setQualityState(qualityState) {
    this.qualityState = qualityState;
  }

  applyInitialState(initialState = {}) {
    if (!initialState || typeof initialState !== "object") {
      return;
    }

    if (Object.values(AAC_INPUT_MODES).includes(initialState.mode)) {
      this.mode = initialState.mode;
    }

    if (initialState.menu) {
      const groupId = initialState.menu.groupId || this.menu.groupId;
      this.menu.groupId = groupId;
      this.menu.index = this.clampMenuIndex(initialState.menu.index ?? this.menu.index);
      this.menu.lockedIndex =
        initialState.menu.lockedIndex === null || initialState.menu.lockedIndex === undefined
          ? null
          : this.clampMenuIndex(initialState.menu.lockedIndex);
    }

    if (initialState.confirmation) {
      this.confirmation = { id: initialState.confirmation.id || "confirmation" };
    }

    if (Number.isFinite(initialState.cooldownUntil)) {
      this.cooldownUntil = initialState.cooldownUntil;
    }

    if (Number.isFinite(initialState.recoveryCooldownUntil)) {
      this.recoveryCooldownUntil = initialState.recoveryCooldownUntil;
    }

    if (Number.isFinite(initialState.menuActionCooldownUntil)) {
      this.menuActionCooldownUntil = initialState.menuActionCooldownUntil;
    }
  }

  setInputChannel(channel, enabled) {
    if (channel === "blink") {
      return;
    }
    if (Object.prototype.hasOwnProperty.call(this.inputChannels, channel)) {
      this.inputChannels[channel] = Boolean(enabled);
      if (!this.inputChannels[channel]) {
        this.clearSequenceForInputChannel(channel);
      }
    }
  }

  send(event, nowMs = event?.nowMs ?? this.now) {
    const commands = [];
    this.advanceTo(nowMs, commands);

    if (!event || event.type === AAC_INPUT_EVENTS.TICK) {
      return commands;
    }

    if (event.type === AAC_INPUT_EVENTS.SET_MENU_INDEX) {
      if (this.mode === AAC_INPUT_MODES.SECONDARY_MENU || this.mode === AAC_INPUT_MODES.INPUT_MANAGEMENT) {
        this.menu.index = this.clampMenuIndex(event.index);
      }
      return commands;
    }

    if (event.type === AAC_INPUT_EVENTS.START_CONFIRMATION) {
      this.clearBlinkBuffer();
      this.clearMenu();
      this.confirmation = { id: event.id || "confirmation" };
      this.mode = AAC_INPUT_MODES.CONFIRM_WINDOW;
      commands.push(command(AAC_COMMANDS.MODE_CHANGED, { mode: this.mode }));
      return commands;
    }

    if (this.mode === AAC_INPUT_MODES.RECOVERY_COOLDOWN) {
      commands.push(command(AAC_COMMANDS.IGNORED, { reason: "recovery_cooldown" }));
      return commands;
    }

    if (event.type === AAC_INPUT_EVENTS.LONG_CLOSE_QUIET) {
      return this.enterQuietMode(commands, "long_close_quiet");
    }

    if (event.type === AAC_INPUT_EVENTS.LONG_CLOSE_EXIT) {
      return this.handleLongCloseExit(commands);
    }

    if (event.type === AAC_INPUT_EVENTS.SHORT_BLINK) {
      return this.receiveBlinkSymbol(".", commands);
    }

    if (event.type === AAC_INPUT_EVENTS.LONG_BLINK) {
      return this.receiveBlinkSymbol("-", commands);
    }

    if (this.mode === AAC_INPUT_MODES.QUIET) {
      commands.push(command(AAC_COMMANDS.IGNORED, { reason: "quiet_mode_non_blink" }));
      return commands;
    }

    if (this.mode === AAC_INPUT_MODES.COOLDOWN) {
      commands.push(command(AAC_COMMANDS.IGNORED, { reason: "action_cooldown" }));
      return commands;
    }

    if (this.mode === AAC_INPUT_MODES.INPUT_MANAGEMENT && event.type === AAC_INPUT_EVENTS.HEAD_SHAKE) {
      commands.push(command(AAC_COMMANDS.IGNORED, { reason: "head_shake_ignored_in_input_management" }));
      return commands;
    }

    if (this.mode === AAC_INPUT_MODES.SECONDARY_MENU && event.type === AAC_INPUT_EVENTS.HEAD_SHAKE) {
      if (!this.inputChannels.head) {
        commands.push(command(AAC_COMMANDS.IGNORED, { reason: "head_channel_disabled" }));
        return commands;
      }
      return this.exitToWaiting(commands, "head_shake_exit_secondary");
    }

    if (this.mode === AAC_INPUT_MODES.CONFIRM_WINDOW && event.type === AAC_INPUT_EVENTS.HEAD_SHAKE) {
      if (!this.inputChannels.head) {
        commands.push(command(AAC_COMMANDS.IGNORED, { reason: "head_channel_disabled" }));
        return commands;
      }
      return this.cancelConfirmation(commands, "head_shake_cancel");
    }

    if (event.type === AAC_INPUT_EVENTS.BROW_RAISE) {
      return this.handleBrowRaise(commands);
    }

    if (event.type === AAC_INPUT_EVENTS.MOUTH_OPEN) {
      return this.handleMouthOpen(commands);
    }

    if (event.type === AAC_INPUT_EVENTS.SMILE) {
      return this.handleSmile(commands);
    }

    if (event.type === AAC_INPUT_EVENTS.HEAD_SHAKE) {
      return this.handleHeadShake(commands);
    }

    commands.push(command(AAC_COMMANDS.IGNORED, { reason: "unknown_event" }));
    return commands;
  }

  advance(ms) {
    return this.send({ type: AAC_INPUT_EVENTS.TICK }, this.now + ms);
  }

  advanceTo(nowMs, commands = []) {
    this.now = Math.max(this.now, Number(nowMs || 0));
    let progressed = true;
    while (progressed) {
      progressed = false;

      if (this.mode === AAC_INPUT_MODES.RECOVERY_COOLDOWN && this.recoveryCooldownUntil <= this.now) {
        this.recoveryCooldownUntil = 0;
        this.mode = AAC_INPUT_MODES.WAITING;
        commands.push(command(AAC_COMMANDS.MODE_CHANGED, { mode: this.mode, reason: "recovery_cooldown_finished" }));
        progressed = true;
      }

      if (this.mode === AAC_INPUT_MODES.COOLDOWN && this.cooldownUntil <= this.now) {
        this.cooldownUntil = 0;
        this.mode = AAC_INPUT_MODES.WAITING;
        commands.push(command(AAC_COMMANDS.MODE_CHANGED, { mode: this.mode, reason: "cooldown_finished" }));
        progressed = true;
      }

      if (this.blinkDecodeAt && this.blinkDecodeAt <= this.now) {
        this.decodeBlinkBuffer(commands);
        progressed = true;
      }

      if (this.mode === AAC_INPUT_MODES.QUIET && this.quiet.deadlineAt && this.quiet.deadlineAt <= this.now) {
        this.handleQuietDeadline(commands);
        progressed = true;
      }

      if (this.mouthDeadlineAt && this.mouthDeadlineAt <= this.now) {
        this.mouthTimes = [];
        this.mouthDeadlineAt = 0;
        commands.push(command(AAC_COMMANDS.IGNORED, { reason: "mouth_single_timeout" }));
        progressed = true;
      }

      if (this.smileDeadlineAt && this.smileDeadlineAt <= this.now) {
        this.triggerSingleSmile(commands);
        progressed = true;
      }
    }

    return commands;
  }

  triggerPolicy() {
    return qualityPolicy(this.qualityState);
  }

  canTrigger(candidate) {
    const policy = this.triggerPolicy();
    if (policy === "all") {
      return true;
    }
    if (policy === "none") {
      return false;
    }
    return [
      "emergencyBlink",
      "longCloseExit",
      "longCloseQuiet",
      "quietRecovery",
    ].includes(candidate);
  }

  block(commands, candidate) {
    commands.push(command(AAC_COMMANDS.BLOCKED, { candidate, qualityState: this.qualityState }));
  }

  receiveBlinkSymbol(symbol, commands) {
    if (this.mode === AAC_INPUT_MODES.QUIET) {
      if (symbol !== ".") {
        commands.push(command(AAC_COMMANDS.IGNORED, { reason: "quiet_mode_non_short_blink" }));
        return commands;
      }
      return this.handleQuietShortBlink(commands);
    }

    const policy = this.triggerPolicy();
    if (policy === "none") {
      this.clearTransientSequences();
      commands.push(command(AAC_COMMANDS.BLOCKED, { candidate: "blink", qualityState: this.qualityState }));
      return commands;
    }

    const emergencyOnly =
      this.mode === AAC_INPUT_MODES.COOLDOWN ||
      this.mode === AAC_INPUT_MODES.RECOVERY_COOLDOWN ||
      ((this.mode === AAC_INPUT_MODES.SECONDARY_MENU || this.mode === AAC_INPUT_MODES.INPUT_MANAGEMENT) &&
        this.menuActionCooldownUntil > this.now);

    if (emergencyOnly && symbol !== ".") {
      commands.push(command(AAC_COMMANDS.IGNORED, { reason: "emergency_only_non_short_blink" }));
      return commands;
    }

    this.resetBlinkBufferIfStale(symbol);
    if (!this.blinkBuffer.length) {
      this.blinkStartedAt = this.now;
    }
    this.blinkBuffer.push(symbol);
    this.blinkLastAt = this.now;
    this.blinkEmergencyOnly = this.blinkEmergencyOnly || emergencyOnly;

    if (symbol === "." && this.blinkBuffer.length === 1 && !emergencyOnly) {
      this.lockMenuForFirstShortBlink(commands);
    }

    const code = this.blinkBuffer.join("");
    if (!this.isValidBlinkPrefix(code) && !COMPLETE_BLINK_CODES.has(code)) {
      this.clearBlinkBuffer();
      commands.push(command(AAC_COMMANDS.IGNORED, { reason: "invalid_blink_prefix", code }));
      return commands;
    }

    if (this.hasCodeExceededMaxTotal(code)) {
      this.clearBlinkBuffer();
      commands.push(command(AAC_COMMANDS.IGNORED, { reason: "blink_code_total_timeout", code }));
      return commands;
    }

    this.blinkDecodeAt = this.now + this.decodeDelayFor(code);
    return commands;
  }

  resetBlinkBufferIfStale(nextSymbol) {
    if (!this.blinkBuffer.length || this.blinkLastAt === null) {
      return;
    }

    const previousSymbol = this.blinkBuffer[this.blinkBuffer.length - 1];
    const maxGap =
      previousSymbol === "-" ? this.timing.maxGapAfterLongMs : this.timing.maxGapAfterShortMs;
    if (this.now - this.blinkLastAt > maxGap) {
      this.clearBlinkBuffer();
      return;
    }

    const nextCode = `${this.blinkBuffer.join("")}${nextSymbol}`;
    if (this.hasCodeExceededMaxTotal(nextCode)) {
      this.clearBlinkBuffer();
    }
  }

  hasCodeExceededMaxTotal(code) {
    if (this.blinkStartedAt === null) {
      return false;
    }
    const maxTotal = this.timing.codeMaxTotalMs[code] || this.timing.ordinaryMaxTotalMs;
    return this.now - this.blinkStartedAt > maxTotal;
  }

  isValidBlinkPrefix(code) {
    if (BLINK_CODE_PREFIXES.has(code)) {
      return true;
    }
    return Object.keys(BLINK_CODE_GESTURES).some((gestureCode) => gestureCode.startsWith(code));
  }

  decodeDelayFor(code) {
    if (code.length >= 3) {
      return this.timing.finalDecodeMs;
    }
    if (code.length === 1) {
      return code === "-" ? this.timing.maxGapAfterLongMs : this.timing.maxGapAfterShortMs;
    }
    if (code === "--") {
      return this.timing.inputManagementContinuationMs;
    }
    if (BLINK_CODE_GESTURES[code]) {
      return code === ".." ? this.timing.shortDecodeMs : this.timing.finalDecodeMs;
    }
    return code.includes("-") ? this.timing.longDecodeMs : this.timing.shortDecodeMs;
  }

  decodeBlinkBuffer(commands) {
    const code = this.blinkBuffer.join("");
    const emergencyOnly = this.blinkEmergencyOnly;
    this.clearBlinkBuffer({ preserveMenuLock: true });

    if (!code) {
      return;
    }

    if (emergencyOnly && code !== EMERGENCY_BLINK_CODE) {
      this.clearMenuLock();
      commands.push(command(AAC_COMMANDS.IGNORED, { reason: "emergency_only_code_ignored", code }));
      return;
    }

    if (code === EMERGENCY_BLINK_CODE) {
      this.executeEmergency(commands, emergencyOnly ? "emergency_only" : "blink_code");
      return;
    }

    if (this.mode === AAC_INPUT_MODES.SECONDARY_MENU || this.mode === AAC_INPUT_MODES.INPUT_MANAGEMENT) {
      this.decodeMenuBlinkCode(code, commands);
      return;
    }

    if (this.mode === AAC_INPUT_MODES.CONFIRM_WINDOW) {
      this.decodeConfirmationBlinkCode(code, commands);
      return;
    }

    if (code === "." || code === "-" || code === "--") {
      commands.push(command(AAC_COMMANDS.IGNORED, { reason: "blink_code_no_action", code }));
      return;
    }

    if (this.triggerPolicy() === "emergencyOnly") {
      this.block(commands, "ordinaryBlinkCode");
      return;
    }

    if (code === "--.") {
      this.enterInputManagement(commands);
      return;
    }

    if (SECONDARY_GROUP_FOR_BLINK_CODE[code]) {
      this.enterSecondaryMenu(SECONDARY_GROUP_FOR_BLINK_CODE[code], commands);
      return;
    }

    const gestureId = BLINK_CODE_GESTURES[code];
    if (gestureId) {
      this.executeAction(commands, gestureId, "blink_code");
      return;
    }

    commands.push(command(AAC_COMMANDS.IGNORED, { reason: "unrecognized_blink_code", code }));
  }

  decodeMenuBlinkCode(code, commands) {
    if (code === "..") {
      if (!this.canTrigger("secondarySelect")) {
        this.clearMenuLock();
        this.block(commands, "secondarySelect");
        return;
      }
      this.selectLockedOrCurrentMenuItem(commands, "two_short_blinks");
      return;
    }

    this.clearMenuLock();
    commands.push(command(AAC_COMMANDS.IGNORED, { reason: "menu_blink_code_ignored", code }));
  }

  decodeConfirmationBlinkCode(code, commands) {
    if (code === "..") {
      if (!this.canTrigger("confirmation")) {
        this.block(commands, "confirmation");
        return;
      }
      this.confirm(commands, "two_short_blinks");
      return;
    }

    commands.push(command(AAC_COMMANDS.IGNORED, { reason: "confirmation_blink_code_ignored", code }));
  }

  clearBlinkBuffer({ preserveMenuLock = false } = {}) {
    this.blinkBuffer = [];
    this.blinkStartedAt = null;
    this.blinkLastAt = null;
    this.blinkDecodeAt = null;
    this.blinkEmergencyOnly = false;
    if (!preserveMenuLock) {
      this.clearMenuLock();
    }
  }

  lockMenuForFirstShortBlink(commands) {
    if (this.mode !== AAC_INPUT_MODES.SECONDARY_MENU && this.mode !== AAC_INPUT_MODES.INPUT_MANAGEMENT) {
      return;
    }
    if (this.menu.lockedIndex !== null) {
      return;
    }
    this.menu.lockedIndex = this.menu.index;
    commands.push(
      command(AAC_COMMANDS.LOCK_MENU_ITEM, {
        groupId: this.menu.groupId,
        index: this.menu.lockedIndex,
        itemId: this.currentMenuItemId(this.menu.lockedIndex),
      }),
    );
  }

  clearMenuLock() {
    this.menu.lockedIndex = null;
  }

  currentMenuItemId(index = this.menu.index) {
    return this.menuOptions[this.menu.groupId]?.[index] || "";
  }

  clampMenuIndex(index) {
    const options = this.menuOptions[this.menu.groupId] || [];
    if (!options.length) {
      return 0;
    }
    const numericIndex = Number.isFinite(Number(index)) ? Math.trunc(Number(index)) : 0;
    return Math.min(Math.max(0, numericIndex), options.length - 1);
  }

  enterSecondaryMenu(groupId, commands) {
    this.clearTransientSequences();
    this.mode = AAC_INPUT_MODES.SECONDARY_MENU;
    this.menu = { groupId, index: 0, lockedIndex: null };
    this.cooldownUntil = 0;
    commands.push(command(AAC_COMMANDS.ENTER_SECONDARY_MENU, { groupId }));
  }

  enterInputManagement(commands) {
    this.clearTransientSequences();
    this.mode = AAC_INPUT_MODES.INPUT_MANAGEMENT;
    this.menu = { groupId: "inputChannels", index: 0, lockedIndex: null };
    this.cooldownUntil = 0;
    commands.push(command(AAC_COMMANDS.ENTER_INPUT_MANAGEMENT, { groupId: "inputChannels" }));
  }

  selectLockedOrCurrentMenuItem(commands, source) {
    if (this.mode !== AAC_INPUT_MODES.SECONDARY_MENU && this.mode !== AAC_INPUT_MODES.INPUT_MANAGEMENT) {
      return;
    }

    const index = this.clampMenuIndex(this.menu.lockedIndex ?? this.menu.index);
    const groupId = this.menu.groupId;
    const itemId = this.currentMenuItemId(index);
    this.clearMenuLock();

    if (!itemId) {
      commands.push(command(AAC_COMMANDS.IGNORED, { reason: "menu_item_missing", groupId, index }));
      return;
    }

    if (this.mode === AAC_INPUT_MODES.INPUT_MANAGEMENT) {
      this.selectInputManagementOption(itemId, index, commands, source);
      return;
    }

    commands.push(command(AAC_COMMANDS.SELECT_MENU_ITEM, { groupId, index, itemId, source }));
    this.finishTerminalAction(commands, this.timing.actionCooldownMs);
  }

  selectInputManagementOption(itemId, index, commands, source) {
    if (itemId === "exit") {
      this.exitToWaiting(commands, "input_management_exit", { groupId: this.menu.groupId, index, itemId, source });
      return;
    }

    if (itemId === "blink_only") {
      Object.keys(this.inputChannels).forEach((channel) => {
        this.setInputChannel(channel, false);
      });
      commands.push(
        command(AAC_COMMANDS.TOGGLE_INPUT_CHANNEL, { itemId, channel: "blink", enabled: true, index, source }),
      );
    } else if (itemId.startsWith("toggle_")) {
      const channel = itemId.slice("toggle_".length);
      if (Object.prototype.hasOwnProperty.call(this.inputChannels, channel)) {
        this.setInputChannel(channel, !this.inputChannels[channel]);
        commands.push(
          command(AAC_COMMANDS.TOGGLE_INPUT_CHANNEL, {
            itemId,
            channel,
            enabled: this.inputChannels[channel],
            index,
            source,
          }),
        );
      } else {
        commands.push(command(AAC_COMMANDS.IGNORED, { reason: "unknown_input_channel", itemId, index }));
        return;
      }
    } else {
      commands.push(command(AAC_COMMANDS.IGNORED, { reason: "unknown_input_management_item", itemId, index }));
      return;
    }

    this.menuActionCooldownUntil = this.now + this.timing.menuActionCooldownMs;
  }

  handleBrowRaise(commands) {
    if (!this.inputChannels.brow) {
      commands.push(command(AAC_COMMANDS.IGNORED, { reason: "brow_channel_disabled" }));
      return commands;
    }
    if (!this.canTrigger("optionalGesture")) {
      this.block(commands, "optionalGesture");
      return commands;
    }

    if (this.mode === AAC_INPUT_MODES.SECONDARY_MENU || this.mode === AAC_INPUT_MODES.INPUT_MANAGEMENT) {
      this.selectLockedOrCurrentMenuItem(commands, "brow_raise");
      return commands;
    }
    if (this.mode === AAC_INPUT_MODES.CONFIRM_WINDOW) {
      this.confirm(commands, "brow_raise");
      return commands;
    }
    if (this.mode === AAC_INPUT_MODES.WAITING) {
      this.executeAction(commands, "brow_raise", "brow_raise");
      return commands;
    }

    commands.push(command(AAC_COMMANDS.IGNORED, { reason: "brow_ignored_in_mode", mode: this.mode }));
    return commands;
  }

  handleMouthOpen(commands) {
    if (this.mode !== AAC_INPUT_MODES.WAITING) {
      commands.push(command(AAC_COMMANDS.IGNORED, { reason: "mouth_ignored_in_mode", mode: this.mode }));
      return commands;
    }
    if (!this.inputChannels.mouth) {
      this.clearSequenceForInputChannel("mouth");
      commands.push(command(AAC_COMMANDS.IGNORED, { reason: "mouth_channel_disabled" }));
      return commands;
    }
    if (!this.canTrigger("optionalGesture")) {
      this.clearSequenceForInputChannel("mouth");
      this.block(commands, "optionalGesture");
      return commands;
    }

    this.mouthTimes = this.mouthTimes.filter((time) => this.now - time <= this.timing.mouthDoubleWindowMs);
    this.mouthTimes.push(this.now);
    if (this.mouthTimes.length >= 2) {
      this.mouthTimes = [];
      this.mouthDeadlineAt = 0;
      this.executeAction(commands, "mouth_double_open", "mouth_double_open");
      return commands;
    }

    this.mouthDeadlineAt = this.now + this.timing.mouthDoubleWindowMs;
    commands.push(command(AAC_COMMANDS.IGNORED, { reason: "mouth_first_pending" }));
    return commands;
  }

  handleSmile(commands) {
    if (this.mode !== AAC_INPUT_MODES.WAITING) {
      commands.push(command(AAC_COMMANDS.IGNORED, { reason: "smile_ignored_in_mode", mode: this.mode }));
      return commands;
    }
    if (!this.inputChannels.smile) {
      this.clearSequenceForInputChannel("smile");
      commands.push(command(AAC_COMMANDS.IGNORED, { reason: "smile_channel_disabled" }));
      return commands;
    }
    if (!this.canTrigger("optionalGesture")) {
      this.clearSequenceForInputChannel("smile");
      this.block(commands, "optionalGesture");
      return commands;
    }

    if (this.smilePendingAt !== null) {
      const gap = this.now - this.smilePendingAt;
      if (gap < this.timing.smileDoubleMinGapMs) {
        commands.push(command(AAC_COMMANDS.IGNORED, { reason: "smile_gap_too_short" }));
        return commands;
      }
      this.smilePendingAt = null;
      this.smileDeadlineAt = 0;
      this.executeAction(commands, "smile_double", "smile_double");
      return commands;
    }

    this.smilePendingAt = this.now;
    this.smileDeadlineAt = this.now + this.timing.smileDoubleWindowMs;
    commands.push(command(AAC_COMMANDS.IGNORED, { reason: "smile_first_pending" }));
    return commands;
  }

  triggerSingleSmile(commands) {
    if (this.smilePendingAt === null) {
      this.smileDeadlineAt = 0;
      return;
    }
    this.smilePendingAt = null;
    this.smileDeadlineAt = 0;
    if (this.mode !== AAC_INPUT_MODES.WAITING || !this.inputChannels.smile || !this.canTrigger("optionalGesture")) {
      commands.push(command(AAC_COMMANDS.IGNORED, { reason: "smile_single_expired_without_trigger" }));
      return;
    }
    this.executeAction(commands, "smile", "smile");
  }

  handleHeadShake(commands) {
    if (this.mode !== AAC_INPUT_MODES.WAITING) {
      commands.push(command(AAC_COMMANDS.IGNORED, { reason: "head_shake_ignored_in_mode", mode: this.mode }));
      return commands;
    }
    if (!this.inputChannels.head) {
      commands.push(command(AAC_COMMANDS.IGNORED, { reason: "head_channel_disabled" }));
      return commands;
    }
    if (!this.canTrigger("optionalGesture")) {
      this.block(commands, "optionalGesture");
      return commands;
    }
    this.executeAction(commands, "head_shake", "head_shake");
    return commands;
  }

  executeAction(commands, gestureId, source) {
    const candidate = gestureId === "blink_triple_short" ? "emergencyBlink" : "ordinaryBlinkCode";
    if (!this.canTrigger(candidate)) {
      this.block(commands, candidate);
      return;
    }
    commands.push(command(AAC_COMMANDS.ACTION, { gestureId, source }));
    this.finishTerminalAction(commands, this.timing.actionCooldownMs);
  }

  executeEmergency(commands, source) {
    if (!this.canTrigger("emergencyBlink")) {
      this.block(commands, "emergencyBlink");
      return;
    }
    commands.push(command(AAC_COMMANDS.ACTION, { gestureId: "blink_triple_short", source, emergency: true }));
    this.clearMenu();
    this.confirmation = null;
    this.finishTerminalAction(commands, this.timing.actionCooldownMs);
  }

  confirm(commands, source) {
    if (!this.confirmation) {
      commands.push(command(AAC_COMMANDS.IGNORED, { reason: "no_confirmation" }));
      return;
    }
    commands.push(command(AAC_COMMANDS.CONFIRM, { id: this.confirmation.id, source }));
    this.confirmation = null;
    this.finishTerminalAction(commands, this.timing.actionCooldownMs);
  }

  cancelConfirmation(commands, source) {
    if (!this.confirmation) {
      commands.push(command(AAC_COMMANDS.IGNORED, { reason: "no_confirmation" }));
      return commands;
    }
    commands.push(command(AAC_COMMANDS.CANCEL, { id: this.confirmation.id, source }));
    this.confirmation = null;
    this.finishTerminalAction(commands, this.timing.actionCooldownMs);
    return commands;
  }

  handleLongCloseExit(commands) {
    if (!this.canTrigger("longCloseExit")) {
      this.block(commands, "longCloseExit");
      return commands;
    }
    if (this.mode === AAC_INPUT_MODES.QUIET) {
      commands.push(command(AAC_COMMANDS.IGNORED, { reason: "quiet_mode_long_close_exit_ignored" }));
      return commands;
    }
    return this.exitToWaiting(commands, "long_close_exit");
  }

  enterQuietMode(commands, source) {
    if (!this.canTrigger("longCloseQuiet")) {
      this.block(commands, "longCloseQuiet");
      return commands;
    }
    this.clearTransientSequences();
    this.clearMenu();
    this.confirmation = null;
    this.mode = AAC_INPUT_MODES.QUIET;
    this.cooldownUntil = 0;
    this.recoveryCooldownUntil = 0;
    this.quiet = { count: 0, startedAt: 0, lastAt: 0, deadlineAt: 0 };
    commands.push(command(AAC_COMMANDS.ENTER_QUIET, { source }));
    return commands;
  }

  handleQuietShortBlink(commands) {
    if (!this.canTrigger("quietRecovery")) {
      this.block(commands, "quietRecovery");
      return commands;
    }

    const gap = this.quiet.lastAt ? this.now - this.quiet.lastAt : 0;
    if (
      !this.quiet.startedAt ||
      this.now - this.quiet.startedAt > this.timing.quietResumeWindowMs ||
      gap > this.timing.maxGapAfterShortMs
    ) {
      this.quiet = { count: 0, startedAt: this.now, lastAt: 0, deadlineAt: 0 };
    }

    this.quiet.count += 1;
    this.quiet.lastAt = this.now;

    if (this.quiet.count >= this.timing.quietResumeBlinkCount) {
      this.exitQuiet(commands);
      return commands;
    }

    this.quiet.deadlineAt = this.now + this.timing.maxGapAfterShortMs;
    commands.push(command(AAC_COMMANDS.IGNORED, { reason: "quiet_short_pending", count: this.quiet.count }));
    return commands;
  }

  handleQuietDeadline(commands) {
    const count = this.quiet.count;
    this.quiet.deadlineAt = 0;
    if (this.mode !== AAC_INPUT_MODES.QUIET) {
      return;
    }
    if (count === 3) {
      this.quiet = { count: 0, startedAt: 0, lastAt: 0, deadlineAt: 0 };
      this.mode = AAC_INPUT_MODES.WAITING;
      this.executeEmergency(commands, "quiet_mode_three_short_timeout");
      return;
    }
    this.quiet = { count: 0, startedAt: 0, lastAt: 0, deadlineAt: 0 };
    commands.push(command(AAC_COMMANDS.IGNORED, { reason: "quiet_recovery_timeout", count }));
  }

  exitQuiet(commands) {
    this.quiet = { count: 0, startedAt: 0, lastAt: 0, deadlineAt: 0 };
    this.mode = AAC_INPUT_MODES.RECOVERY_COOLDOWN;
    this.recoveryCooldownUntil = this.now + this.timing.recoveryCooldownMs;
    commands.push(command(AAC_COMMANDS.EXIT_QUIET, { mode: this.mode }));
  }

  exitToWaiting(commands, reason, payload = {}) {
    this.clearTransientSequences();
    this.clearMenu();
    this.confirmation = null;
    this.mode = AAC_INPUT_MODES.WAITING;
    this.cooldownUntil = 0;
    this.recoveryCooldownUntil = 0;
    commands.push(command(AAC_COMMANDS.EXIT_TO_WAITING, { reason, ...payload }));
    return commands;
  }

  finishTerminalAction(commands, cooldownMs) {
    this.clearTransientSequences();
    this.clearMenu();
    this.confirmation = null;
    this.mode = AAC_INPUT_MODES.COOLDOWN;
    this.cooldownUntil = this.now + cooldownMs;
  }

  clearMenu() {
    this.menu = { groupId: "", index: 0, lockedIndex: null };
  }

  clearTransientSequences() {
    this.clearBlinkBuffer();
    this.mouthTimes = [];
    this.mouthDeadlineAt = 0;
    this.smilePendingAt = null;
    this.smileDeadlineAt = 0;
    this.menuActionCooldownUntil = 0;
  }

  clearSequenceForInputChannel(channel) {
    if (channel === "mouth") {
      this.mouthTimes = [];
      this.mouthDeadlineAt = 0;
    }
    if (channel === "smile") {
      this.smilePendingAt = null;
      this.smileDeadlineAt = 0;
    }
  }
}

export function createAacInputMachine(options = {}) {
  return new AacInputMachine(options);
}
