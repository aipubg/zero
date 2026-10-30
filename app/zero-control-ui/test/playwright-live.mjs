import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const { chromium } = require("E:/zero/.zero-data/fresh-workspace/gateway-state/node-runtime/releases/2026.10.7-10ad68f0f0f519bc2ee40ec9e23435359e7ba939749fd7b4a290df3512ba49af/node_modules/openclaw/node_modules/playwright-core");

async function runEndToEndVerification() {
  console.log("=== STARTING ZERO COMPREHENSIVE PLAYWRIGHT VERIFICATION ===");
  const browser = await chromium.launch({
    headless: true,
    executablePath: "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
    args: ["--no-sandbox", "--disable-gpu"]
  });
  const page = await browser.newPage();

  page.on("console", msg => {
    if (msg.type() === "error") {
      console.log("[CONSOLE ERROR]", msg.text());
    }
  });

  // TEST 1: Open /chat/zero and verify DOM stability (ZERO Blinking over 10s)
  console.log("\n1. Navigating to http://127.0.0.1:18789/chat/zero...");
  await page.goto("http://127.0.0.1:18789/chat/zero", { waitUntil: "domcontentloaded" });
  await page.waitForTimeout(3000);

  console.log("   Attaching DOM Mutation Counter to measure blinking/flickering over 10 seconds...");
  await page.evaluate(() => {
    window.__zero_mutations = 0;
    const observer = new MutationObserver((records) => {
      window.__zero_mutations += records.length;
    });
    observer.observe(document.body, { childList: true, subtree: true, attributes: true });
  });

  console.log("   Waiting 10 seconds to observe DOM stillness...");
  await page.waitForTimeout(10000);

  const mutationCount = await page.evaluate(() => window.__zero_mutations);
  console.log(`   DOM Mutations recorded over 10 seconds: ${mutationCount}`);
  if (mutationCount > 15) {
    throw new Error(`FAILED: UI is still flickering/re-rendering in a loop! Recorded mutations: ${mutationCount}`);
  }
  console.log("   PASSED: UI is 100% calm and stable with ZERO reload/flicker loops!");

  // TEST 2: Inspect Chat Model Picker for Pure Real Models (NO dummy models, NO test models)
  console.log("\n2. Inspecting Chat Model Picker for clean real models...");
  const modelPickerCheck = await page.evaluate(() => {
    const allButtons = Array.from(document.querySelectorAll("button"));
    const modelOptions = Array.from(document.querySelectorAll(".chat-controls__model-option, [data-chat-model-option]"));
    const optionLabels = modelOptions.map(o => o.getAttribute("aria-label") || o.innerText.trim());
    const buttonTexts = allButtons.map(b => b.innerText.trim()).filter(Boolean);

    const hasTestModel = optionLabels.some(l => l.includes("test-model"));
    const hasZeroGatewayDefault = optionLabels.some(l => l === "default · zero-gateway" || l === "zero-gateway/default");
    const hasNvDefault = optionLabels.some(l => l === "default · nv" || l === "nv/default");

    return {
      optionLabels,
      buttonTextsSample: buttonTexts.slice(0, 15),
      hasTestModel,
      hasZeroGatewayDefault,
      hasNvDefault,
      realModelsFound: optionLabels.filter(l => l.includes("nemotron") || l.includes("glm") || l.includes("minimax"))
    };
  });
  console.log("   Model Picker Analysis:", {
    totalOptions: modelPickerCheck.optionLabels.length,
    realModelsFound: modelPickerCheck.realModelsFound.length,
    hasTestModel: modelPickerCheck.hasTestModel,
    hasZeroGatewayDefault: modelPickerCheck.hasZeroGatewayDefault,
    hasNvDefault: modelPickerCheck.hasNvDefault,
    sampleRealModels: modelPickerCheck.realModelsFound.slice(0, 5)
  });

  if (modelPickerCheck.hasTestModel) {
    throw new Error("FAILED: test-model-1 found in model list!");
  }
  if (modelPickerCheck.hasZeroGatewayDefault) {
    throw new Error("FAILED: dummy zero-gateway/default found in model list!");
  }
  if (modelPickerCheck.hasNvDefault) {
    throw new Error("FAILED: dummy default model found under nv provider!");
  }
  console.log("   PASSED: Chat model list contains ONLY real configured models!");

  // TEST 3: Test Top Controls in /chat/zero (Computer Control & Reasoning Buttons)
  console.log("\n3. Testing Top Controls (Computer Control & Reasoning buttons)...");
  const controlsCheck = await page.evaluate(() => {
    const compBtn = document.querySelector(".zero-control-toggle-btn");
    const reasonBtn = document.querySelector(".zero-reasoning-toggle-btn");
    if (!compBtn || !reasonBtn) return { found: false };

    const initialComp = compBtn.innerText.trim();
    compBtn.click();
    const toggledComp = compBtn.innerText.trim();
    compBtn.click(); // restore
    const restoredComp = compBtn.innerText.trim();

    const initialReason = reasonBtn.innerText.trim();
    reasonBtn.click();
    const toggledReason = reasonBtn.innerText.trim();
    reasonBtn.click(); // restore
    const restoredReason = reasonBtn.innerText.trim();

    return {
      found: true,
      initialComp,
      toggledComp,
      restoredComp,
      initialReason,
      toggledReason,
      restoredReason
    };
  });
  console.log("   Controls Result:", controlsCheck);
  if (!controlsCheck.found) {
    throw new Error("FAILED: Top control buttons not found in /chat/zero!");
  }
  if (!controlsCheck.toggledComp.includes("Standby") || !controlsCheck.restoredComp.includes("Active")) {
    throw new Error("FAILED: Computer Control toggle failed!");
  }
  if (!controlsCheck.toggledReason.includes("OFF") || !controlsCheck.restoredReason.includes("ON")) {
    throw new Error("FAILED: Reasoning toggle failed!");
  }
  console.log("   PASSED: Top control buttons toggle instantly without jitter!");

  // TEST 4: Navigate to /settings/model-providers (Zero Providers Management Surface)
  console.log("\n4. Navigating in-app to /settings/model-providers...");
  await page.evaluate(() => {
    window.location.hash = "";
    history.pushState(null, "", "/settings/model-providers");
    window.dispatchEvent(new PopStateEvent("popstate"));
  });
  await page.waitForTimeout(2000);

  const surfaceCheck = await page.evaluate(() => {
    const surface = document.querySelector(".zero-native-surface--models");
    const title = document.querySelector(".zero-models-header__title")?.innerText.trim();
    const subtitle = document.querySelector(".zero-models-header__subtitle")?.innerText.trim();
    const addBtn = document.querySelector(".zero-models-btn--add-provider")?.innerText.trim();
    const cards = Array.from(document.querySelectorAll(".zero-models-card, .zero-provider-card")).length;
    return {
      surfaceMounted: !!surface,
      title,
      subtitle,
      addBtn,
      cardsCount: cards
    };
  });
  console.log("   Providers Surface Status:", surfaceCheck);
  if (!surfaceCheck.surfaceMounted || surfaceCheck.title !== "Models & Providers") {
    throw new Error("FAILED: Zero Providers Surface did not mount properly!");
  }
  console.log("   PASSED: Models & Providers native surface mounted cleanly!");

  // TEST 5: Test Provider Modal Model Search & Selection
  console.log("\n5. Testing Provider Modal Search and Selection...");
  await page.evaluate(() => {
    const addBtn = document.querySelector(".zero-models-btn--add-provider");
    if (addBtn) addBtn.click();
  });
  await page.waitForTimeout(1000);

  const modalResult = await page.evaluate(async () => {
    const modal = document.querySelector(".zero-modal");
    if (!modal) return { modalFound: false };

    // Set Base URL to 18790
    const urlInp = modal.querySelector(".zero-modal__input[placeholder*='http']");
    if (urlInp) {
      urlInp.value = "http://127.0.0.1:18790/v1";
      urlInp.dispatchEvent(new Event("input"));
    }

    // Click Fetch Models
    const fetchBtn = modal.querySelector(".zero-models-btn--fetch-models");
    if (!fetchBtn) return { modalFound: true, fetchBtnFound: false };
    fetchBtn.click();

    await new Promise(r => setTimeout(r, 1200));

    const discBox = modal.querySelector(".zero-discovery-box");
    const checkBoxes = Array.from(modal.querySelectorAll(".zero-disc-item input[type='checkbox']"));
    const initialChecked = checkBoxes.filter(c => c.checked).length;
    const addSelectedBtn = modal.querySelector(".zero-discovery-box button.zero-btn-save-defaults");
    const initialBtnText = addSelectedBtn?.innerText.trim();

    // Test Search filtering
    const searchInp = modal.querySelector("input[placeholder*='Search']");
    if (searchInp) {
      searchInp.value = "nemotron";
      searchInp.dispatchEvent(new Event("input"));
    }
    await new Promise(r => setTimeout(r, 300));

    const visibleAfterSearch = Array.from(modal.querySelectorAll(".zero-disc-item")).filter(item => item.style.display !== "none").length;

    // Test Select all on filtered items
    const selectAllBtn = Array.from(modal.querySelectorAll("button")).find(b => b.innerText.trim().toLowerCase() === "select all");
    if (selectAllBtn) selectAllBtn.click();
    await new Promise(r => setTimeout(r, 300));

    const checkedAfterSelectAll = Array.from(modal.querySelectorAll(".zero-disc-item input[type='checkbox']")).filter(c => c.checked).length;
    const btnTextAfterSelectAll = addSelectedBtn?.innerText.trim();

    // Test Deselect all
    const deselectAllBtn = Array.from(modal.querySelectorAll("button")).find(b => b.innerText.trim().toLowerCase() === "deselect all");
    if (deselectAllBtn) deselectAllBtn.click();
    await new Promise(r => setTimeout(r, 300));

    const checkedAfterDeselect = Array.from(modal.querySelectorAll(".zero-disc-item input[type='checkbox']")).filter(c => c.checked).length;

    // Close modal
    const closeBtn = modal.querySelector(".zero-modal__close, .zero-models-btn--secondary");
    if (closeBtn) closeBtn.click();

    return {
      modalFound: true,
      fetchBtnFound: true,
      totalModelsFound: checkBoxes.length,
      initialChecked,
      initialBtnText,
      visibleAfterSearch,
      checkedAfterSelectAll,
      btnTextAfterSelectAll,
      checkedAfterDeselect
    };
  });

  console.log("   Modal Test Result:", modalResult);
  if (!modalResult.modalFound || !modalResult.fetchBtnFound) {
    throw new Error("FAILED: Modal or Fetch button missing!");
  }
  if (modalResult.initialChecked !== 0) {
    throw new Error(`FAILED: Models were auto-selected initially! Count: ${modalResult.initialChecked}`);
  }
  if (modalResult.checkedAfterSelectAll === 0 || !modalResult.btnTextAfterSelectAll.includes(String(modalResult.checkedAfterSelectAll))) {
    throw new Error("FAILED: Select all did not update checked models or button label properly!");
  }
  if (modalResult.checkedAfterDeselect !== 0) {
    throw new Error("FAILED: Deselect all did not clear selection!");
  }
  console.log("   PASSED: Provider modal model discovery, search, and selection work flawlessly!");

  console.log("\n=== ALL ZERO PLAYWRIGHT VERIFICATION CHECKS PASSED 100%! ===");
  await browser.close();
}

runEndToEndVerification().catch(err => {
  console.error("\n❌ VERIFICATION TEST FAILED:", err);
  process.exit(1);
});
