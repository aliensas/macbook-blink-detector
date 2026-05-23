export const SUPPORTED_LANGUAGES = ["zh", "en"];

export const DEFAULT_ACTION_CONFIG = [
  {
    id: "blink_double_short_help",
    gestureId: "blink_double_short",
    label: "短眨2次",
    displayText: "我需要帮助，请过来一下",
    speechText: "我需要帮助，请过来一下",
    instruction: "连续短眨两次；每次轻闭眼约 0.08-0.5 秒，并明显睁开。",
    category: "help",
    input: "blink",
    enabled: true,
    requiresConfirmation: false,
    locked: false,
  },
  {
    id: "blink_triple_short_emergency",
    gestureId: "blink_triple_short",
    label: "短眨3次",
    displayText: "紧急求助，请马上查看",
    speechText: "紧急求助，请马上查看",
    instruction: "连续短眨三次；每次轻闭眼后都要明显睁开。",
    category: "emergency",
    input: "blink",
    enabled: true,
    requiresConfirmation: false,
    locked: true,
    flash: true,
  },
  {
    id: "blink_short_long_scratch",
    gestureId: "blink_short_long",
    label: "短眨+长闭眼",
    displayText: "我想挠痒痒",
    speechText: "我想挠痒痒",
    instruction: "先短眨并睁开；1.2 秒内开始长闭眼约 1 秒，触发后进入挠痒痒二级选择。",
    category: "care",
    input: "blink",
    enabled: true,
    requiresConfirmation: false,
    locked: false,
  },
  {
    id: "blink_long_short_position",
    gestureId: "blink_long_short",
    label: "长闭眼+短眨",
    displayText: "我想调整体位",
    speechText: "我想调整体位",
    instruction: "先长闭眼约 1 秒并睁开；再短眨一次，触发后进入调整体位二级选择。",
    category: "care",
    input: "blink",
    enabled: true,
    requiresConfirmation: false,
    locked: false,
  },
  {
    id: "brow_raise_yes",
    gestureId: "brow_raise",
    label: "抬眉",
    displayText: "是，确认",
    speechText: "是，确认",
    instruction: "头部尽量稳定，轻抬眉约 0.25 秒后放松；上下点头会暂停抬眉判断。",
    category: "control",
    input: "brow",
    enabled: true,
    requiresConfirmation: false,
    locked: false,
  },
  {
    id: "mouth_double_open_suction",
    gestureId: "mouth_double_open",
    label: "张嘴2次",
    displayText: "我需要吸痰，请马上查看",
    speechText: "我需要吸痰，请马上查看",
    instruction: "微张嘴约 0.2 秒后闭合，约 2 秒内重复两次；单次张嘴会静默清空。",
    category: "care",
    input: "mouth",
    enabled: true,
    requiresConfirmation: false,
    locked: false,
  },
  {
    id: "smile_status",
    gestureId: "smile",
    label: "微笑",
    displayText: "谢谢，可以，我还好",
    speechText: "谢谢，可以，我还好",
    instruction: "轻微闭嘴微笑约 0.25 秒后放松；明显张嘴或左右方向切换的摇头会短暂暂停微笑判断。",
    category: "emotion",
    input: "smile",
    enabled: true,
    requiresConfirmation: false,
    locked: false,
  },
  {
    id: "smile_double_love",
    gestureId: "smile_double",
    label: "微笑2次",
    displayText: "我爱你",
    speechText: "我爱你",
    instruction: "先闭嘴微笑并完全放松约 0.5 秒，再第二次闭嘴微笑。",
    category: "emotion",
    input: "smile",
    enabled: true,
    requiresConfirmation: false,
    locked: false,
  },
  {
    id: "head_shake_no",
    gestureId: "head_shake",
    label: "摇头",
    displayText: "否，不是，取消",
    speechText: "否，不是，取消",
    instruction: "极轻微左-右-左或右-左-右摇头；4 秒内完成，不需要大幅度。",
    category: "control",
    input: "head",
    enabled: true,
    requiresConfirmation: false,
    locked: false,
  },
];

export const ACTION_LOCALIZATION = {
  en: {
    blink_double_short_help: {
      label: "2 short blinks",
      displayText: "Please help me, come here.",
      speechText: "Please help me, come here.",
      instruction: "Blink twice in a row. Each blink should lightly close the eyes for about 0.08-0.5 seconds, with a clear reopening.",
      category: "help",
    },
    blink_triple_short_emergency: {
      label: "3 short blinks",
      displayText: "Emergency, please check now.",
      speechText: "Emergency, please check now.",
      instruction: "Blink three times in a row. Reopen the eyes clearly after each blink.",
      category: "emergency",
    },
    blink_short_long_scratch: {
      label: "Short blink + long closure",
      displayText: "I feel itchy.",
      speechText: "I feel itchy.",
      instruction: "Short blink and reopen; within 1.2 seconds, start a long eye closure of about 1 second. Then choose the itchy area.",
      category: "care",
    },
    blink_long_short_position: {
      label: "Long closure + short blink",
      displayText: "I want to adjust my position.",
      speechText: "I want to adjust my position.",
      instruction: "Close the eyes for about 1 second and reopen; then do one short blink. Then choose the adjustment.",
      category: "care",
    },
    brow_raise_yes: {
      label: "Eyebrow raise",
      displayText: "Yes, confirm.",
      speechText: "Yes, confirm.",
      instruction: "Keep the head as stable as possible. Raise the eyebrows lightly for about 0.25 seconds, then relax. Nodding temporarily pauses eyebrow detection.",
      category: "control",
    },
    mouth_double_open_suction: {
      label: "Open mouth twice",
      displayText: "I need suctioning, please check now.",
      speechText: "I need suctioning, please check now.",
      instruction: "Open the mouth slightly for about 0.2 seconds, then close. Repeat twice within about 2 seconds; a single mouth-open is cleared silently.",
      category: "care",
    },
    smile_status: {
      label: "Smile",
      displayText: "Thank you. OK. I am alright.",
      speechText: "Thank you. OK. I am alright.",
      instruction: "Smile gently with the mouth closed for about 0.25 seconds, then relax. Clear mouth opening or side-to-side head motion temporarily pauses smile detection.",
      category: "emotion",
    },
    smile_double_love: {
      label: "Double smile",
      displayText: "I love you.",
      speechText: "I love you.",
      instruction: "Smile with the mouth closed, fully relax for about 0.5 seconds, then smile again.",
      category: "emotion",
    },
    head_shake_no: {
      label: "Head shake",
      displayText: "No. Not that. Cancel.",
      speechText: "No. Not that. Cancel.",
      instruction: "Use a very small left-right-left or right-left-right head shake within 4 seconds. No large movement is needed.",
      category: "control",
    },
  },
};

export const BLINK_CODE_GESTURE_IDS = {
  "..": "blink_double_short",
  "...": "blink_triple_short",
  ".-": "blink_short_long",
  "-.": "blink_long_short",
  "--.": "input_management",
};

export const EVENT_GESTURE_IDS = {
  BROW_RAISE: "brow_raise",
  MOUTH_OPEN: "mouth_open",
  MOUTH_DOUBLE_OPEN: "mouth_double_open",
  SMILE: "smile",
  SMILE_DOUBLE: "smile_double",
  HEAD_SHAKE: "head_shake",
};

export const SECONDARY_SELECTION_SCAN_MS = 3220;
export const SECONDARY_SELECTION_TIMEOUT_MS = 90 * 1000;
export const CONSUMED_BLINK_CODE_SUPPRESS_MS = 1800;

export const SECONDARY_SELECTION_GROUP_DEFINITIONS = {
  scratch: {
    id: "scratch",
    triggerGestureId: "blink_short_long",
    label: "挠痒痒",
    title: "我想挠痒痒：请选择位置",
    promptSuffix: "请继续选择位置",
    hint: "自动轮流高亮；两次短眨或轻抬眉后放松选择，闭眼 3 秒以上或摇头退出。",
    options: [
      { id: "scratch_head", label: "头部", text: "请帮我挠头部" },
      { id: "scratch_face", label: "脸部/耳边", text: "请帮我挠脸部或耳边" },
      { id: "scratch_back", label: "背部", text: "请帮我挠背部" },
      { id: "scratch_arm", label: "手臂", text: "请帮我挠手臂" },
      { id: "scratch_leg", label: "腿部", text: "请帮我挠腿部" },
      { id: "scratch_check", label: "请查看", text: "请帮我查看哪里痒" },
    ],
  },
  position: {
    id: "position",
    triggerGestureId: "blink_long_short",
    label: "调整体位",
    title: "我想调整体位：请选择方式",
    promptSuffix: "请继续选择调整方式",
    hint: "自动轮流高亮；两次短眨或轻抬眉后放松选择，闭眼 3 秒以上或摇头退出。",
    options: [
      { id: "position_left", label: "向左侧翻身", text: "请帮我向左侧翻身" },
      { id: "position_right", label: "向右侧翻身", text: "请帮我向右侧翻身" },
      { id: "position_raise", label: "抬高上身", text: "请帮我把头和上半身垫高一点" },
      { id: "position_lower", label: "放低上身", text: "请帮我把头和上半身放低一点" },
      { id: "position_pillow", label: "调整枕头", text: "请帮我调整枕头" },
      { id: "position_legs", label: "调整腿脚", text: "请帮我调整腿部或脚的位置" },
    ],
  },
  inputChannels: {
    id: "inputChannels",
    label: "输入管理",
    title: "输入管理：选择识别通道",
    hint: "自动轮流高亮；两次短眨或抬眉选择，闭眼 3 秒以上退出。眨眼始终开启。",
    options: [
      { id: "blink_only", type: "blinkOnly" },
      { id: "toggle_brow", type: "toggleInput", channel: "brow", label: "抬眉", onText: "抬眉识别已开启", offText: "抬眉识别已关闭" },
      { id: "toggle_mouth", type: "toggleInput", channel: "mouth", label: "张嘴", onText: "张嘴识别已开启", offText: "张嘴识别已关闭" },
      { id: "toggle_smile", type: "toggleInput", channel: "smile", label: "微笑", onText: "微笑识别已开启", offText: "微笑识别已关闭" },
      { id: "toggle_head", type: "toggleInput", channel: "head", label: "摇头", onText: "摇头识别已开启", offText: "摇头识别已关闭" },
      { id: "exit", type: "exit", label: "退出" },
    ],
  },
};

export const SECONDARY_SELECTION_LOCALIZATION = {
  en: {
    scratch: {
      label: "Scratch",
      title: "I feel itchy: choose the area",
      promptSuffix: "please choose the area",
      hint: "The highlight moves automatically. Use two short blinks or a light eyebrow raise to select; close eyes for 3 seconds or shake head to exit.",
      options: {
        scratch_head: { label: "Head", text: "Please scratch my head." },
        scratch_face: { label: "Face / ear", text: "Please scratch my face or near my ear." },
        scratch_back: { label: "Back", text: "Please scratch my back." },
        scratch_arm: { label: "Arm", text: "Please scratch my arm." },
        scratch_leg: { label: "Leg", text: "Please scratch my leg." },
        scratch_check: { label: "Please check", text: "Please check where I feel itchy." },
      },
    },
    position: {
      label: "Position",
      title: "I want to adjust my position: choose the adjustment",
      promptSuffix: "please choose the adjustment",
      hint: "The highlight moves automatically. Use two short blinks or a light eyebrow raise to select; close eyes for 3 seconds or shake head to exit.",
      options: {
        position_left: { label: "Turn left", text: "Please help me turn to my left side." },
        position_right: { label: "Turn right", text: "Please help me turn to my right side." },
        position_raise: { label: "Raise upper body", text: "Please raise my head and upper body a little." },
        position_lower: { label: "Lower upper body", text: "Please lower my head and upper body a little." },
        position_pillow: { label: "Adjust pillow", text: "Please adjust my pillow." },
        position_legs: { label: "Adjust legs", text: "Please adjust my legs or feet." },
      },
    },
    inputChannels: {
      label: "Input management",
      title: "Input management: choose recognition channels",
      hint: "The highlight moves automatically. Use two short blinks or eyebrow raise to select; close eyes for 3 seconds to exit. Blink code is always on.",
      options: {
        blink_only: { label: "Blink only" },
        toggle_brow: { label: "Eyebrow", onText: "Eyebrow raise detection enabled", offText: "Eyebrow raise detection disabled" },
        toggle_mouth: { label: "Mouth", onText: "Mouth-open detection enabled", offText: "Mouth-open detection disabled" },
        toggle_smile: { label: "Smile", onText: "Smile detection enabled", offText: "Smile detection disabled" },
        toggle_head: { label: "Head shake", onText: "Head-shake detection enabled", offText: "Head-shake detection disabled" },
        exit: { label: "Exit" },
      },
    },
  },
};

export const OPTIONAL_INPUT_CHANNEL_DEFINITIONS = {
  brow: { label: "抬眉" },
  mouth: { label: "张嘴" },
  smile: { label: "微笑" },
  head: { label: "摇头" },
};

export function normalizeLanguage(value) {
  return SUPPORTED_LANGUAGES.includes(value) ? value : "zh";
}

export function localizedActionDefault(action, lang = "zh") {
  return {
    ...action,
    ...(ACTION_LOCALIZATION[lang]?.[action.id] || {}),
  };
}

export function createActionConfig(lang = "zh") {
  return DEFAULT_ACTION_CONFIG.map((action) => ({ ...localizedActionDefault(action, lang) }));
}

export function normalizeActionText(value) {
  return String(value ?? "").replace(/\s+/g, " ").trim();
}

export function getActionText(action) {
  return normalizeActionText(action?.displayText || action?.speechText || "");
}

export function setActionText(action, text) {
  const normalized = normalizeActionText(text);
  action.displayText = normalized;
  action.speechText = normalized;
}

export function createSecondarySelectionGroups(lang = "zh") {
  const groups = structuredClone(SECONDARY_SELECTION_GROUP_DEFINITIONS);
  applySecondarySelectionGroupLanguage(groups, lang);
  return groups;
}

export function applySecondarySelectionGroupLanguage(groups, lang = "zh") {
  Object.entries(SECONDARY_SELECTION_GROUP_DEFINITIONS).forEach(([groupId, baseGroup]) => {
    const localized = SECONDARY_SELECTION_LOCALIZATION[lang]?.[groupId] || {};
    const group = groups[groupId];
    if (!group) {
      return;
    }

    Object.assign(group, {
      label: localized.label || baseGroup.label,
      title: localized.title || baseGroup.title,
      promptSuffix: localized.promptSuffix || baseGroup.promptSuffix,
      hint: localized.hint || baseGroup.hint,
    });

    group.options.forEach((option, index) => {
      const baseOption = baseGroup.options[index];
      const localizedOption = localized.options?.[baseOption.id] || {};
      ["label", "text", "onText", "offText"].forEach((field) => {
        if (baseOption[field] || localizedOption[field]) {
          option[field] = localizedOption[field] || baseOption[field];
        }
      });
    });
  });
}
