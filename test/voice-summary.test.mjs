import test from 'node:test';
import assert from 'node:assert/strict';
import { voiceSummary } from '../app/zero-control-ui/src/voice-control.js';

test('voice speaks only the useful lead of a reply', () => {
  const reply = 'Notepad is open and in front. I typed your list with three items. You can save it with Ctrl+S.\n\n- milk\n- eggs\n\n```txt\nmilk\n```\nSee https://example.com for more.';
  const spoken = voiceSummary(reply);
  assert.equal(spoken, 'Notepad is open and in front. I typed your list with three items. The rest is on screen.');
  assert.ok(!/```|https?:|milk/.test(spoken), 'code, links and list items stay on screen');
});

test('short replies are spoken whole, Hindi replies end in Hindi', () => {
  assert.equal(voiceSummary('Done.'), 'Done.');
  const hindi = voiceSummary('नोटपैड खुल गया है और सबसे आगे है। मैंने आपकी सूची लिख दी है। आप चाहें तो इसे सेव कर सकते हैं। इसमें तीन चीज़ें हैं और सब सही से लिखी गई हैं, कोई गलती नहीं है।');
  assert.match(hindi, /^नोटपैड खुल गया है और सबसे आगे है। मैंने आपकी सूची लिख दी है।/);
  assert.match(hindi, /बाकी जानकारी स्क्रीन पर है।$/);
  assert.equal(voiceSummary('```js\nx\n```'), '');
});
