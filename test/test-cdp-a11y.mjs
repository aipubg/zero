import { chromium } from '../backend/node_modules/.pnpm/playwright-core@1.63.0/node_modules/playwright-core/index.mjs';

async function test() {
  const browser = await chromium.launch({
    headless: false,
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    args: ['--remote-debugging-port=9222', '--no-first-run', '--no-default-browser-check']
  });
  const page = await browser.newPage();
  await page.goto('https://www.google.com');
  const client = await page.context().newCDPSession(page);
  await client.send('DOM.enable');
  await client.send('Accessibility.enable');
  const axTree = await client.send('Accessibility.getFullAXTree');
  console.log('Nodes found:', axTree.nodes.length);
  
  const search = axTree.nodes.find(n => n.role?.value === 'combobox' || n.name?.value === 'Search' || n.role?.value === 'searchbox');
  console.log('Search element backendDOMNodeId:', search?.backendDOMNodeId, 'name:', search?.name?.value, 'role:', search?.role?.value);
  
  if (search?.backendDOMNodeId) {
    const { object } = await client.send('DOM.resolveNode', { backendNodeId: search.backendDOMNodeId });
    console.log('Resolved object:', object.objectId);
    await client.send('Runtime.callFunctionOn', {
      objectId: object.objectId,
      functionDeclaration: 'function(val) { this.value = val; this.dispatchEvent(new Event("input", { bubbles: true })); }',
      arguments: [{ value: 'Zero AI Autonomous Agent' }]
    });
    console.log('Filled text via CDP!');
    const check = await client.send('Runtime.callFunctionOn', {
      objectId: object.objectId,
      functionDeclaration: 'function() { return this.value; }',
      returnByValue: true
    });
    console.log('Verified value in DOM:', check.result?.value);
  }
  await browser.close();
}

test().catch(e => console.error('ERR:', e));
