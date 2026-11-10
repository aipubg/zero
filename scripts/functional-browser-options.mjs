export const BROWSER_FLAGS = Object.freeze([
  '--external', '--models', '--providers', '--provider-probe', '--gguf', '--gguf-runtime', '--gguf-chat', '--gguf-tools', '--gguf-qwen', '--gguf-qwen-3b', '--gguf-recall',
  '--hf-search', '--hf-complete', '--agent-models', '--agent-execution', '--parallel-agents', '--agent-recovery', '--model-import', '--chat-abort', '--devices',
  '--external-skills', '--skill-execution', '--external-plugins', '--plugin-crash', '--screen', '--screen-recall',
]);

export function parseBrowserModes(args) {
  const selected = new Set(args);
  for (const argument of selected) if (!BROWSER_FLAGS.includes(argument) && !['--help', '-h'].includes(argument)) throw new Error(`Unknown browser verification option: ${argument}`);
  const help = selected.has('--help') || selected.has('-h');
  if (help && [...selected].some(argument => !['--help', '-h'].includes(argument))) throw new Error('Help cannot be combined with execution modes');
  const requires = {
    '--screen-recall': '--screen', '--plugin-crash': '--external-plugins', '--skill-execution': '--external-skills',
    '--agent-execution': '--agent-models', '--parallel-agents': '--agent-execution', '--agent-recovery': '--parallel-agents',
    '--gguf-runtime': '--gguf', '--gguf-chat': '--gguf-runtime', '--gguf-tools': '--gguf-runtime', '--gguf-qwen': '--gguf', '--gguf-qwen-3b': '--gguf', '--gguf-recall': '--gguf-tools', '--chat-abort': '--external',
  };
  for (const [mode, parent] of Object.entries(requires)) if (selected.has(mode) && !selected.has(parent)) throw new Error(`${mode} requires ${parent}`);
  if (selected.has('--gguf-qwen') && selected.has('--gguf-qwen-3b')) throw new Error('Select one pinned GGUF model, not both Qwen variants');
  return { help, modes: [...selected].filter(argument => BROWSER_FLAGS.includes(argument)).sort() };
}
