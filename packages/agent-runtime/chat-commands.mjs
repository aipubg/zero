// Chat Commands: messages starting with "/" that Zero answers directly,
// without a model call. One table drives the parser and /help.
//
// Each command: { name, aliases, usage, description, run({ host, sessionKey, args }) -> text }

const fmtTokens = n => (n >= 1000 ? `${Math.round(n / 100) / 10}k` : String(n));

export const CHAT_COMMANDS = [
  {
    name: 'help', aliases: ['commands', '?'], usage: '/help',
    description: 'List these commands.',
    run: () => ['**Chat commands**', ...CHAT_COMMANDS.map(c => `- \`${c.usage}\` — ${c.description}`), '- `/status` — run the core system diagnostic.'].join('\n'),
  },
  {
    name: 'fold', aliases: ['compact', 'compress'], usage: '/fold',
    description: 'Fold this chat now: summarise the older part so the chat stays fast.',
    run: async ({ host, sessionKey }) => {
      const result = await host._foldContext(sessionKey, { modelId: host._resolveUsableModel(host.sessions.getSession(sessionKey)?.metadata?.model, sessionKey), force: true });
      return result.folded ? `Folded ${result.archived} older message(s) into a summary. The full history is still in this chat.` : `Nothing to fold yet: ${result.reason}.`;
    },
  },
  {
    name: 'notebook', aliases: ['memory', 'nb'], usage: '/notebook [owner|zero]',
    description: 'Show what Zero has written down about you and this computer.',
    run: ({ host, args }) => {
      const book = /^(owner|zero)$/i.test(args) ? args.toLowerCase() : null;
      const data = host.notebook.read(book || undefined).books;
      return Object.entries(data).map(([name, b]) => `**${name === 'owner' ? 'About you' : 'About this computer'}** (${b.used}/${b.limit} characters)\n${b.entries.length ? b.entries.map(e => `- ${e}`).join('\n') : '_empty_'}`).join('\n\n');
    },
  },
  {
    name: 'skills', aliases: [], usage: '/skills',
    description: 'List the skills Zero can load.',
    run: ({ host }) => {
      const skills = host.skillLoader.listSkills();
      if (!skills.length) return 'No skills installed.';
      return ['**Skills**', ...skills.map(s => `- **${s.name}**${s.enabled === false ? ' (off)' : ''} — ${s.description || ''}`)].join('\n');
    },
  },
  {
    name: 'budget', aliases: ['usage', 'context'], usage: '/budget',
    description: 'Show the step budget and how full this chat\'s context is.',
    run: ({ host, sessionKey }) => {
      const context = host.sessions.getModelContext(sessionKey);
      const used = Math.ceil(context.reduce((n, m) => n + String(m.content || '').length, 0) / 3.8);
      const window = host._contextWindowFor(host.sessions.getSession(sessionKey)?.metadata?.model);
      const fold = host.sessions.getSession(sessionKey)?.metadata?.contextFold;
      return [
        `- Steps per request: ${host.maxActions} tool actions, ${host.maxAssistantTurns} model turns`,
        `- This chat's context: about ${fmtTokens(used)} of ${fmtTokens(window)} tokens (folds at ${Math.round(host.foldAt * 100)}%)`,
        `- Folded so far: ${fold?.folds ? `${fold.folds} time(s), ${fold.archived} message(s)` : 'never'}`,
      ].join('\n');
    },
  },
];

/** The command a message calls, or null. "/status" stays with the diagnostic. */
export function matchChatCommand(text) {
  const match = String(text || '').trim().match(/^\/([a-z?]+)(?:\s+([\s\S]*))?$/i);
  if (!match) return null;
  const word = match[1].toLowerCase();
  const command = CHAT_COMMANDS.find(c => c.name === word || c.aliases.includes(word));
  return command ? { command, args: (match[2] || '').trim() } : null;
}
