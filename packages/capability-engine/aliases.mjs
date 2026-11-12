/**
 * Zero AI — Canonical Capability Alias Registry
 *
 * Every tool name the model may emit resolves to exactly one first-party Zero
 * capability. Aliases exist only at the edge: the engine, audit log and result
 * contract always speak the canonical capability name.
 *
 * `action` is injected only when the model omitted it, so an explicit action
 * always wins. `set` supplies defaults that are merged under the model's args.
 */

export const CAPABILITY_ALIASES = Object.freeze({
  // Browser — Zero Browser Control
  open_browser: { name: 'browser', action: 'open_url' },
  navigate: { name: 'browser', action: 'open_url' },
  open_url: { name: 'browser', action: 'open_url' },
  web_search: { name: 'browser', action: 'search' },
  search: { name: 'browser', action: 'search' },
  google: { name: 'browser', action: 'search' },
  scrape: { name: 'browser', action: 'scrape' },
  read_page: { name: 'browser', action: 'read_page' },
  get_content: { name: 'browser', action: 'get_content' },
  browser_control: { name: 'browser', action: 'open_url' },

  // Desktop — Zero Computer Control
  computer: { name: 'zero_computer_action' },
  computer_control: { name: 'zero_computer_action' },
  zero_computer: { name: 'zero_computer_action' },
  desktop_control: { name: 'desktop_control' },
  launch_app: { name: 'open_app', action: 'open_app' },
  kill_app: { name: 'close_app', action: 'close_app' },
  click: { name: 'zero_computer_action', action: 'left_click' },
  left_click: { name: 'zero_computer_action', action: 'left_click' },
  right_click: { name: 'zero_computer_action', action: 'right_click' },
  double_click: { name: 'zero_computer_action', action: 'double_click' },
  mouse_move: { name: 'zero_computer_action', action: 'mouse_move' },
  move_mouse: { name: 'zero_computer_action', action: 'mouse_move' },
  move: { name: 'zero_computer_action', action: 'mouse_move' },
  type_text: { name: 'zero_computer_action', action: 'type_text' },
  type: { name: 'zero_computer_action', action: 'type_text' },
  press_key: { name: 'zero_computer_action', action: 'press_key' },
  press: { name: 'zero_computer_action', action: 'press_key' },
  hotkey: { name: 'zero_computer_action', action: 'hotkey' },
  scroll: { name: 'zero_computer_action', action: 'scroll' },
  screenshot: { name: 'zero_computer_action', action: 'screenshot' },
  see_screen: { name: 'see_screen' },
  screen_vision: { name: 'see_screen' },
  fill: { name: 'zero_computer_action', action: 'fill_form' },
  fill_form: { name: 'zero_computer_action', action: 'fill_form' },
  submit_form: { name: 'zero_computer_action', action: 'submit_form' },

  // Terminal & Security Ops — Zero Terminal
  terminal: { name: 'run_process', set: { shell: true } },
  execute_command: { name: 'run_process', set: { shell: true } },
  run_command: { name: 'run_process', set: { shell: true } },
  shell: { name: 'run_process', set: { shell: true } },
  powershell: { name: 'run_process', set: { shell: true, shellExecutable: 'powershell.exe' } },
  bash: { name: 'run_process', set: { shell: true, shellExecutable: 'bash.exe' } },
  cli: { name: 'run_process', set: { shell: true } },

  // Memory & learning
  memory_store: { name: 'memory_remember' },
  memory_save: { name: 'memory_remember' },
  remember: { name: 'memory_remember' },
  memory_recall: { name: 'memory_recall' },
  recall_memory: { name: 'memory_recall' },
  recall: { name: 'memory_recall' },
  procedure_learn: { name: 'procedure_learn' },
  learn_procedure: { name: 'procedure_learn' },
  procedure_recall: { name: 'procedure_recall' },
  skills_list: { name: 'skills_list' },
  list_skills: { name: 'skills_list' },
  skill_execute: { name: 'skill_execute' },
  run_skill: { name: 'skill_execute' },
  zero_skill_learn: { name: 'zero_skill_learn' },

  // Autonomy
  schedule_task: { name: 'schedule_task' },
  schedule: { name: 'schedule_task' },
  cron: { name: 'schedule_task' },
  goal_plan: { name: 'goal_plan' },
  plan_goal: { name: 'goal_plan' },
  long_horizon_plan: { name: 'goal_plan' },
  goal_status: { name: 'goal_status' },
  plan_status: { name: 'goal_status' },
  delegate_agent: { name: 'delegate_agent' },
  spawn_agent: { name: 'delegate_agent' },
  delegate: { name: 'delegate_agent' },

  // Research & files
  research_search: { name: 'research_search' },
  web_research: { name: 'research_search' },
  deep_search: { name: 'research_search' },
  screen_context: { name: 'screen_context' },
  watch_workflow: { name: 'watch_workflow' },
  read_file: { name: 'read_file' },
  write_file: { name: 'write_file' },
  run_process: { name: 'run_process' },
});

/**
 * Resolve a model-supplied name to its canonical capability descriptor.
 * Unknown names return null and remain available for custom plugin tools.
 */
export function resolveCapabilityAlias(rawName) {
  const clean = String(rawName || '').trim();
  if (!clean) return null;
  return CAPABILITY_ALIASES[clean] || CAPABILITY_ALIASES[clean.toLowerCase()] || null;
}

/** Every name the unified registry can dispatch. */
export function listCapabilityAliases() {
  return Object.keys(CAPABILITY_ALIASES);
}
