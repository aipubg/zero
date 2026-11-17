// Models & Providers: the original Zero Model Gateway page, mounted as it was.
// It talks to the host through the same RPC connection as the rest of the UI.
import { call } from '../rpc.js';
import { refreshLive } from '../app.js';
import { mountModelsPage } from '../legacy/models-page.js';

function ensureStyles() {
  if (document.getElementById('zero-models-css')) return;
  const link = document.createElement('link');
  link.id = 'zero-models-css';
  link.rel = 'stylesheet';
  link.href = '/ui/models.css';
  document.head.append(link);
}

export async function render(root) {
  ensureStyles();
  const host = {
    async request(method, params = {}) {
      const result = await call(method, params, { timeoutMs: 180000 });
      if (/^zero\.(providers|gateway\.config|screenShare)\./.test(method)) refreshLive();
      return result;
    },
  };
  const dispose = mountModelsPage(root, { host });
  return typeof dispose === 'function' ? dispose : dispose?.dispose;
}
