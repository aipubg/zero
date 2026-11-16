/**
 * Zero desktop actions — looking at the screen, driving the browser, and
 * typing into a window.
 *
 * These are the multi-step actions the assistant uses most. They live in the
 * capability engine so every caller (chat, RPC, automations, skills) gets the
 * same behaviour.
 */

import { defaultScreenVision, defaultUiaRootTree, defaultOsController } from './computer-control.mjs';
import { defaultBrowserAutomation } from './browser-control.mjs';

const done = fields => ({ ok: true, executed: true, verified: true, completed: true, outcome: 'COMPLETED', observed: true, ...fields });
const failed = (action, error) => ({ ok: false, executed: true, verified: false, completed: false, outcome: 'FAILED', action, error: error.message, message: error.message });
const emptyPage = { heading: '', firstParagraph: '', leadSummary: '' };
const readPage = () => defaultBrowserAutomation.extractPageContent().catch(() => emptyPage);

/**
 * One fresh look at the desktop: the frame itself (for vision models), the
 * text on it, the active window and the controls that can be clicked.
 */
export async function seeScreen({ signal = null } = {}) {
  try {
    const frame = await defaultScreenVision.captureFrame({ forceFresh: true, extractOcr: true, signal });
    if (!frame || !frame.base64 || !frame.width || !frame.height) {
      throw new Error('Screen capture frame buffer empty or invalid geometry');
    }
    const [uia, win] = await Promise.all([
      defaultUiaRootTree.extractRootTree({ maxElements: 120, signal }).catch(() => null),
      defaultOsController.getActiveWindow(signal).catch(() => null),
    ]);
    return done({
      action: 'see_screen',
      activeWindow: win?.title || win?.window?.title || uia?.activeWindow?.title || 'Desktop',
      foregroundProcess: win?.process || win?.app || win?.window?.processName || uia?.app || 'unknown',
      resolution: `${frame.width}x${frame.height}`,
      width: frame.width,
      height: frame.height,
      dpi: frame.dpi || 96,
      scaleFactor: frame.scaleFactor || 1.0,
      frameBytes: frame.bytes,
      frameHash: frame.hash,
      ocrSummary: (frame.ocrText || '').slice(0, 2000),
      image_url: { url: `data:${frame.mimeType || 'image/png'};base64,${frame.base64}` },
      interactiveElements: (uia?.elements || []).slice(0, 40).map(e => ({
        id: e.uia_id,
        type: e.controlType,
        name: e.name,
        value: e.value || undefined,
        center: e.center,
        isInteractive: e.isInteractive,
      })),
    });
  } catch (error) {
    return { ...failed('see_screen', error), message: `Failed to capture live screen: ${error.message}` };
  }
}

/**
 * Browser work in Zero's own visible browser session. Returns null for an
 * action this module does not cover, so the caller can use another path.
 */
export async function browserAction(action, args = {}, { signal = null, userText = '' } = {}) {
  const browser = defaultBrowserAutomation;

  if (action === 'open_url' || action === 'navigate') {
    const targetUrl = args.url || 'https://www.google.com';
    await browser.navigate(targetUrl);
    const snap = await browser.snapshot({ interactiveOnly: true });
    const page = await readPage();
    return done({
      action: 'open_url',
      url: targetUrl,
      title: snap.title,
      heading: page.heading,
      firstParagraph: page.firstParagraph,
      contentSummary: page.leadSummary,
      interactiveCount: snap.totalCount,
      interactiveElements: (snap.nodes || []).slice(0, 15).map(n => ({ ref: n.ref, role: n.role, name: n.name })),
    });
  }

  if (action === 'fill_form') {
    const fields = args.fields || {};
    let searchValue = '';
    for (const [key, value] of Object.entries(fields)) {
      if (/search|query|q/i.test(key) || Object.keys(fields).length === 1) { searchValue = String(value); break; }
    }
    if (!searchValue && (args.text || args.value)) searchValue = String(args.text || args.value);

    if (searchValue) {
      const result = await browser.search(searchValue);
      const page = await readPage();
      return done({ action: 'fill_form', query: searchValue, pageTitle: result.title, url: result.url, heading: page.heading, firstParagraph: page.firstParagraph, contentSummary: page.leadSummary });
    }
    const snap = await browser.snapshot({ interactiveOnly: false });
    let filled = 0;
    for (const [key, value] of Object.entries(fields)) {
      const node = snap.nodes.find(n => (n.name || '').toLowerCase().includes(key.toLowerCase()));
      if (node) { await browser.act({ kind: 'fill', ref: node.ref, value: String(value) }); filled++; }
    }
    if (args.submit) await browser.act({ kind: 'press', key: 'Enter' });
    const page = await readPage();
    const wanted = Object.keys(fields).length;
    return {
      ...done({ action: 'fill_form', fieldsProcessed: filled, fieldsRequested: wanted, heading: page.heading, firstParagraph: page.firstParagraph, contentSummary: page.leadSummary }),
      // Filling fewer fields than asked is not a completed form.
      ...(filled < wanted ? { verified: false, completed: false, outcome: 'UNVERIFIED', observed: false, message: `Only ${filled} of ${wanted} fields were found on the page.` } : {}),
    };
  }

  if (action === 'search' || action === 'web_search') {
    const query = args.query || args.text || '';
    if (/youtube/i.test(query) || /youtube/i.test(String(userText || ''))) {
      const ytQuery = query.replace(/youtube/gi, '').trim() || query;
      const yt = await browser.searchYouTube(ytQuery);
      return done({ action: 'search', platform: 'YouTube', query: ytQuery, videos: yt.videos, results: yt.videos.map(v => ({ title: `${v.title} (${v.channel || 'Channel'} • ${v.meta || ''})`, href: v.href })) });
    }
    const result = await browser.search(query);
    const page = await readPage();
    return done({ action: 'search', query, results: result.results, pageTitle: result.title, url: result.url, heading: page.heading, firstParagraph: page.firstParagraph, contentSummary: page.leadSummary });
  }

  if (action === 'get_content' || action === 'scrape' || action === 'read_page') {
    const page = await browser.extractPageContent();
    return done({ action: 'get_content', url: page.url, title: page.title, heading: page.heading, firstParagraph: page.firstParagraph, content: page.leadSummary });
  }

  if (action === 'play') {
    const query = args.query || args.text || '';
    const yt = await browser.searchYouTube(query);
    return done({ action: 'play', platform: 'YouTube', query, videos: yt.videos, results: yt.videos.map(v => ({ title: `${v.title} (${v.channel || 'Channel'})`, href: v.href })) });
  }

  if (['type', 'fill', 'click', 'press'].includes(action)) {
    try {
      const acted = await browser.act({
        kind: action,
        ref: args.ref || args.target,
        target: args.target || args.selector,
        value: args.text || args.value,
        key: args.key || 'Enter',
        submit: args.submit === true,
      });
      let page = emptyPage;
      if (args.submit || action === 'press' || (args.key && /enter/i.test(args.key))) {
        await new Promise(resolve => setTimeout(resolve, 1800));
        page = await readPage();
      }
      return done({ ...acted, action, heading: page.heading, firstParagraph: page.firstParagraph, contentSummary: page.leadSummary });
    } catch (pageError) {
      // The page did not accept it; finish with the physical mouse/keyboard
      // on the browser window that is in front.
      const activeWindow = await defaultOsController.getActiveWindow(signal).catch(() => null);
      if (action === 'click') {
        if (args.x === undefined || args.y === undefined) throw pageError;
        await defaultOsController.click({ x: args.x, y: args.y }, signal);
      } else if (action === 'press') {
        await defaultOsController.pressKey(args.key || 'Enter', signal);
      } else {
        await defaultOsController.typeText(String(args.text || args.value || ''), {}, signal);
      }
      return {
        ok: true, executed: true, verified: false, completed: false, outcome: 'UNVERIFIED', action,
        fallback: 'physical-input',
        window: activeWindow?.title || null,
        primaryFailure: pageError.message,
        message: `The page did not accept ${action} directly (${pageError.message}); it was sent with the physical ${action === 'click' ? 'mouse' : 'keyboard'} instead. Check the page to confirm.`,
      };
    }
  }

  return null;
}

/**
 * Type text into a window: bring it forward when named, put the caret in an
 * editable control, send the keystrokes, and report what the control holds.
 * Text is inserted at the caret; existing content is never replaced.
 */
export async function typeIntoWindow({ text, target = null, x, y } = {}, signal = null) {
  const textToType = String(text ?? '');
  if (!textToType) {
    return { ok: false, executed: false, verified: false, completed: false, outcome: 'FAILED', action: 'type_text', error: 'missing-text', message: 'type_text needs `text`.' };
  }
  let focusWarning = null;
  if (target) {
    const focus = await defaultOsController.focusWindow(String(target), 'restore', signal).catch(error => ({ ok: false, error: error.message }));
    if (focus?.ok === false) {
      // Never type when the named window could not be brought forward: the
      // keystrokes would land somewhere else.
      return { ok: false, executed: false, verified: false, completed: false, outcome: 'FAILED', action: 'type_text', error: 'focus-failed', message: `Nothing was typed: '${target}' could not be brought to the front (${focus.error || 'unknown reason'}).` };
    }
    await new Promise(resolve => setTimeout(resolve, 300));
  }

  const tree = await defaultUiaRootTree.extractRootTree({ maxElements: 150, signal }).catch(() => null);
  const editors = tree ? [...tree.filterByType('edit'), ...tree.filterByType('document')] : [];
  const focusedEditor = editors.find(e => e.hasKeyboardFocus);
  const editor = focusedEditor || editors[0] || null;
  if (x !== undefined && y !== undefined) {
    await defaultOsController.click({ x, y }, signal);
    await new Promise(resolve => setTimeout(resolve, 150));
  } else if (editor && !focusedEditor) {
    await defaultOsController.click({ x: editor.cx, y: editor.cy }, signal);
    await new Promise(resolve => setTimeout(resolve, 150));
  }

  const typed = await defaultOsController.typeText(textToType, {}, signal);
  if (typed?.error === 'computer-hold:human-bailout') {
    return { ok: false, executed: false, verified: false, completed: false, outcome: 'BLOCKED', action: 'type_text', error: typed.error, message: typed.message };
  }
  const sent = typed?.ok !== false;
  const confirmed = sent && typed?.verified === true;
  const windowTitle = tree?.activeWindow?.title || 'the active window';
  return {
    ok: sent,
    executed: sent,
    verified: confirmed,
    // Sending the keystrokes is the action; reading them back is a bonus
    // that only text controls offer (a calculator does not).
    completed: sent,
    outcome: sent ? 'COMPLETED' : 'FAILED',
    action: 'type_text',
    text: textToType,
    length: textToType.length,
    typedChars: typed?.typedChars,
    target: target || windowTitle,
    receivedByWindow: tree?.activeWindow?.title || null,
    ...(confirmed
      ? { verifiedText: textToType, message: `Typed and confirmed in "${windowTitle}".` }
      : (sent
        ? { message: `All ${typed?.typedChars ?? textToType.length} characters were sent to "${windowTitle}". This control does not show its text to Zero, which is normal for apps like Calculator. Do not retype. Call get_elements once to read the result.` }
        : { error: typed?.error || 'typing-failed', message: typed?.error || 'Windows did not accept the keystrokes.' })),
    ...(focusWarning ? { focusWarning } : {}),
  };
}
