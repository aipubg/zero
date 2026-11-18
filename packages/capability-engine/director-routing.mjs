const APP_MARKERS = [
  { app: 'YouTube', pattern: /\byoutube\b/i },
  { app: 'Spotify', pattern: /\bspotify\b/i },
  { app: 'WhatsApp', pattern: /\bwhatsapp\b/i },
  { app: 'Telegram', pattern: /\btelegram\b/i },
  { app: 'Slack', pattern: /\bslack\b/i },
  { app: 'Gmail', pattern: /\bgmail\b/i },
];

export function routeSimpleRequest(text) {
  const prompt = String(text || '').trim();
  if (!prompt) return null;
  if (/^(?:please\s+)?(?:run|execute)\s+(?:the\s+)?hostname(?:\s+command)?(?:\s+and\s+(?:tell|report|show)\b.*)?[.!?]*$/i.test(prompt)) {
    return { toolName: 'run_process', args: { command: 'hostname', args: [] } };
  }
  if (/^(?:what(?:'s| is)\s+(?:my\s+)?(?:pc|computer|machine)\s+name|(?:show|tell)\s+me\s+(?:my\s+)?(?:pc|computer|machine)\s+name)[.!?]*$/i.test(prompt)) {
    return { toolName: 'system_info', args: {} };
  }
  return null;
}

export function decomposeMultiAppRequest(text) {
  const prompt = String(text || '').trim();
  if (!prompt) return [];
  const clauses = prompt
    .replace(/\b(?:open\s+(?:the\s+)?)?(?:browser|chrome|edge)\b[^,;]*,\s*/ig, '')
    .split(/\s+\b(?:then|after that|afterwards|next)\b\s+|[;\n]+/i)
    .map(clause => clause.trim())
    .filter(Boolean);
  const missions = [];
  let leadingContext = '';

  for (const clause of clauses) {
    const marker = APP_MARKERS.find(candidate => candidate.pattern.test(clause));
    if (!marker) {
      if (missions.length) missions[missions.length - 1].goal += ` ${clause}`;
      else leadingContext = `${leadingContext} ${clause}`.trim();
      continue;
    }

    const previous = missions[missions.length - 1];
    if (previous?.app === marker.app) {
      previous.goal += ` ${clause}`;
      continue;
    }
    missions.push({
      app: marker.app,
      goal: `${leadingContext ? `${leadingContext} ` : ''}${clause}`.trim(),
      order: missions.length + 1,
    });
    leadingContext = '';
  }

  return new Set(missions.map(mission => mission.app)).size > 1 ? missions : [];
}
