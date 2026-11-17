import { h, icon, toast, button } from '../ui.js';
import { look, saveLook, PRESETS, DEFAULTS, paletteFromPhoto } from '../theme.js';

export async function render(root) {
  const body = h('div.grid', { style: { gridTemplateColumns: 'minmax(0, 1.4fr) minmax(0, 1fr)', alignItems: 'start' } });

  const seg = (key, options) => h('div.seg', options.map(([value, label]) => h('button' + (look[key] === value ? '.active' : ''), { type: 'button', onclick: () => { saveLook({ [key]: value }); paint(); } }, label)));
  const sw = key => h('button.switch', { type: 'button', role: 'switch', 'aria-checked': String(Boolean(look[key])), onclick: () => { saveLook({ [key]: !look[key] }); paint(); } });
  const setting = (title, sub, control) => h('div.setting', h('div.label', h('strong', title), sub ? h('small', sub) : null), h('div.control', control));

  function paint() {
    const photoInput = h('input', { type: 'file', accept: 'image/*', style: { display: 'none' } });
    photoInput.addEventListener('change', async () => {
      const file = photoInput.files[0];
      if (!file) return;
      try {
        const result = await paletteFromPhoto(file);
        saveLook({ a: result.a, b: result.b, photo: result.photo, background: 'photo', preset: 'Custom' });
        toast('Colours and wallpaper taken from your photo', 'ok');
        paint();
      } catch (e) { toast(e.message, 'error'); }
    });

    const left = h('div.stack',
      h('div.card',
        h('h2', icon('palette'), 'Theme'),
        h('div.swatches', Object.entries(PRESETS).map(([name, p]) => h('button.swatch' + (look.preset === name ? '.active' : ''), { type: 'button', onclick: () => { saveLook({ preset: name, a: p.a, b: p.b, background: look.background === 'photo' ? 'aurora' : look.background }); paint(); } },
          h('div.chip', { style: { background: `linear-gradient(120deg, ${p.a}, ${p.b})` } }), h('strong', name)))),
        setting('Custom colours', 'Pick your own two accent colours', h('div.row',
          h('input', { type: 'color', value: look.a, oninput: e => saveLook({ a: e.target.value, preset: 'Custom' }) }),
          h('input', { type: 'color', value: look.b, oninput: e => saveLook({ b: e.target.value, preset: 'Custom' }) }))),
        setting('Theme from a photo', 'Zero takes the colours from a picture and can use it as wallpaper', h('div.row', photoInput, button('Choose photo', () => photoInput.click(), { iconName: 'palette' }))),
        setting('Mode', null, seg('mode', [['dark', 'Dark'], ['light', 'Light'], ['auto', 'Auto']])),
      ),
      h('div.card',
        h('h2', icon('screen'), 'Layout'),
        setting('Background', null, seg('background', [['aurora', 'Aurora'], ['grid', 'Grid'], ['plain', 'Plain'], ...(look.photo ? [['photo', 'Photo']] : [])])),
        setting('Glass panels', 'Frosted, see-through cards', sw('glass')),
        setting('Density', null, seg('density', [['comfortable', 'Comfortable'], ['compact', 'Compact']])),
        setting('Sidebar', null, seg('sidebar', [['full', 'With names'], ['icons', 'Icons only']])),
        setting('Corner roundness', `${look.radius}px`, h('input', { type: 'range', min: 4, max: 24, value: look.radius, style: { width: '160px' }, oninput: e => { saveLook({ radius: Number(e.target.value) }); e.target.closest('.setting').querySelector('small').textContent = e.target.value + 'px'; } })),
        setting('Text size', `${look.fontScale}%`, h('input', { type: 'range', min: 85, max: 125, step: 5, value: look.fontScale, style: { width: '160px' }, oninput: e => { saveLook({ fontScale: Number(e.target.value) }); e.target.closest('.setting').querySelector('small').textContent = e.target.value + '%'; } })),
        setting('Font', null, seg('font', [['Inter', 'Modern'], ['System', 'System'], ['Mono', 'Code']])),
        setting('Animations', 'Moving background and transitions', sw('motion')),
        setting('Orb on Home', 'The animated Zero orb', sw('orb')),
      ),
      h('div.card',
        h('h2', icon('chat'), 'Chat'),
        setting('Your name', 'Shown in greetings', h('input', { value: look.name, style: { width: '200px' }, onchange: e => saveLook({ name: e.target.value.trim() || 'Owner' }) })),
        setting('Enter sends the message', 'Otherwise use the send button', sw('sendOnEnter')),
        setting('Read replies aloud', 'Can also be switched in the chat header', sw('speakReplies')),
      ),
      h('div.row', h('span.spacer'), button('Reset to defaults', () => { const { name } = look; saveLook({ ...DEFAULTS, name }); paint(); toast('Appearance reset', 'ok'); }, { kind: 'ghost', iconName: 'refresh' })),
    );

    const preview = h('div.card', { style: { position: 'sticky', top: '0' } },
      h('h2', icon('spark'), 'Preview'),
      h('div.preview',
        h('div.row', h('div.logo', h('span')), h('div', h('strong', 'Zero'), h('div.faint', 'Personal commander'))),
        h('div.msg.assistant', h('div.avatar', 'Z'), h('div.bubble', 'Notepad is open and in front. Shall I write the list?')),
        h('div.msg.user', h('div.avatar', (look.name || 'Y')[0].toUpperCase()), h('div.bubble', 'Yes, add milk and eggs')),
        h('div.row', button('Primary', null, { kind: 'primary' }), button('Normal'), h('span.badge.ok', 'online'), h('span.badge.warn', 'paused')),
        h('div.callout', 'Every change applies instantly and is remembered on this computer.'),
      ),
    );
    body.replaceChildren(left, preview);
    if (matchMedia('(max-width: 1100px)').matches) body.style.gridTemplateColumns = '1fr';
  }

  root.append(h('div.head', h('div', h('div.eyebrow', 'Setup'), h('h1', 'Appearance'), h('p', 'Make Zero look the way you like — colours, wallpaper, layout and text.'))), body);
  paint();
}
