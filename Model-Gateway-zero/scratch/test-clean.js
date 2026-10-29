function getCleanModelDisplayName(model) {
  if (!model) return '';
  let name = (model.name || model.id).trim();
  // Strip [Local GGUF] prefix
  name = name.replace(/^\[Local GGUF\]\s*/i, '');
  // Strip ⚡ Guide tags
  name = name.replace(/\s*⚡\s*Guide(?:\s*\([^)]*\))?/gi, '');
  // Strip quantization tags like (F16), (Q4_K_M)
  name = name.replace(/\s*\((?:Q[0-9]_[A-Za-z0-9_]+|F16|F32|BF16|FP16|FP32|TYPE_\d+)\)/gi, '');
  // Strip parenthesized org/id like (nvidia/nemotron-3.5-bolt-e4b)
  name = name.replace(/\s*\([^)]*\/[^)]*\)/g, '');
  // Strip raw model id in parentheses
  if (model.id) {
    const escaped = model.id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    name = name.replace(new RegExp('\\s*\\(' + escaped + '\\)', 'gi'), '');
  }
  return name.trim() || model.id;
}

const tests = [
  { id: 'nvidia/nemotron-3.5-bolt-e4b', name: 'nemotron-3.5-bolt-e4b (nvidia/nemotron-3.5-bolt-e4b)' },
  { id: 'moondream2-text-model-f16_ct-vicuna', name: '[Local GGUF] Moondream2 Text Model F16 Ct Vicuna (F16) ⚡ Guide (moondream2-text-model-f16_ct-vicuna)' },
  { id: 'moondream2-text-model-f16_ct-vicuna', name: 'Moondream2 Text Model F16 Ct Vicuna (F16)' }
];

tests.forEach(t => console.log(t.id, '=>', getCleanModelDisplayName(t)));
