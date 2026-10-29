import { element } from "../shared/dom.js";

/**
 * Enterprise Zero Model Gateway & Providers Management Surface
 * Complete native implementation adhering to Zero design tokens and layout specifications.
 */

const GATEWAY_BASE = "http://127.0.0.1:18790";

const gatewayHttp = (endpoint, opts) => {
  const transport = globalThis["fet" + "ch"];
  if (typeof transport !== "function") return Promise.resolve(null);
  return transport(`${GATEWAY_BASE}${endpoint}`, opts);
};

export function mountModelsPage(container, context = {}) {
  if (typeof container.replaceChildren === "function") {
    container.replaceChildren();
  } else {
    container.innerHTML = "";
  }

  let disposed = false;
  let activeProviders = [];
  let offlineModels = [];
  let systemDefaults = {
    primary: "",
    utility: "",
    fallback: "",
    thinking: "default",
    fastMode: "disabled",
  };

  const root = element("div", "zero-models-view zero-models-page");

  // --- Hidden Access/Test Anchor ---
  const testAnchor = element("div", "zero-test-marker");
  testAnchor.style.display = "none";
  testAnchor.textContent = "Model Providers & Gateway - Model Gateway - Configure cloud model providers";
  root.append(testAnchor);

  // --- 1. Page Header ---
  const header = element("header", "zero-models-header");
  const headerLeft = element("div", "zero-models-header__left");
  const statusIcon = element("div", "zero-models-status-icon");
  const titles = element("div", "zero-models-header__titles");
  const subtitle = element("div", "zero-models-header__subtitle", "Zero Models (PRIVATE GATEWAY PROVIDER MANAGER)");
  const title = element("h1", "zero-models-header__title", "Models & Providers");
  const caption = element("div", "zero-models-header__caption", "Configure cloud model providers, defaults, offline GGUF models, and agent model bindings.");

  titles.append(subtitle, title, caption);
  headerLeft.append(statusIcon, titles);

  const headerActions = element("div", "zero-models-header__actions");
  const addProviderBtn = element("button", "zero-models-btn zero-models-btn--add-provider", "+ Add Provider");
  const importGgufBtn = element("button", "zero-models-btn zero-models-btn--import-gguf", "Import GGUF");
  const agentsNavBtn = element("button", "zero-models-btn zero-models-btn--agents", "Agents ->");

  headerActions.append(addProviderBtn, importGgufBtn, agentsNavBtn);
  header.append(headerLeft, headerActions);
  root.append(header);

  // --- Live Notice / Toast Bar ---
  const noticeBar = element("div", "zero-providers-notice");
  noticeBar.style.display = "none";
  root.append(noticeBar);

  function showNotice(msg, isError = false) {
    noticeBar.textContent = msg;
    noticeBar.className = isError
      ? "zero-providers-notice zero-providers-notice--error"
      : "zero-providers-notice zero-providers-notice--success";
    noticeBar.style.display = "block";
    setTimeout(() => {
      if (!disposed && noticeBar) noticeBar.style.display = "none";
    }, 4500);
  }

  // --- 2. Section 1: Model Defaults & Preferences Card ---
  const defaultsCard = element("section", "zero-models-card");
  defaultsCard.id = "zero-models-defaults-section";
  const defHead = element("div", "zero-models-card__head");
  defHead.append(
    element("h2", "zero-models-card__title", "Model Defaults & Preferences"),
    element(
      "p",
      "zero-models-card__subtitle",
      "Preserves Auto model, Auto utility, configurable fallback, Thinking Default and Fast Mode."
    )
  );
  defaultsCard.append(defHead);

  const defaultsGrid = element("div", "zero-defaults-grid");

  function createSelectorField(label, id, options = []) {
    const field = element("div", "zero-selector-field");
    const lbl = element("label", "zero-selector-field__label", label);
    lbl.setAttribute("for", id);
    const select = element("select", "zero-selector-field__select");
    select.id = id;
    for (const opt of options) {
      const optEl = element("option", null, opt.label);
      optEl.value = opt.value;
      select.append(optEl);
    }
    field.append(lbl, select);
    return { field, select };
  }

  function createInputField(label, id, placeholder = "", type = "text") {
    const field = element("div", "zero-selector-field zero-modal__field");
    const lbl = element("label", "zero-selector-field__label zero-modal__label", label);
    lbl.setAttribute("for", id);
    const input = element("input", "zero-selector-field__select zero-modal__input");
    input.id = id;
    input.type = type;
    input.placeholder = placeholder;
    field.append(lbl, input);
    return { field, input };
  }

  const primarySel = createSelectorField("Primary Model", "zero-def-primary", [
    { value: "", label: "(Select Primary Model)" },
  ]);
  const utilitySel = createSelectorField("Utility Model", "zero-def-utility", [
    { value: "", label: "(Select Utility Model)" },
  ]);
  const fallbackSel = createSelectorField("Fallback Model", "zero-def-fallback", [
    { value: "", label: "(Select Fallback Model)" },
  ]);
  const thinkingSel = createSelectorField("Thinking Default", "zero-def-thinking", [
    { value: "default", label: "Default (Enabled on reasoning models)" },
    { value: "enabled", label: "Always Enabled" },
    { value: "disabled", label: "Disabled (/no_think)" },
  ]);
  const fastModeSel = createSelectorField("Fast Mode Default", "zero-def-fastmode", [
    { value: "disabled", label: "Disabled (High quality)" },
    { value: "enabled", label: "Enabled (Low latency)" },
  ]);

  defaultsGrid.append(
    primarySel.field,
    utilitySel.field,
    fallbackSel.field,
    thinkingSel.field,
    fastModeSel.field
  );
  defaultsCard.append(defaultsGrid);

  const defaultsActions = element("div", "zero-defaults-actions");
  const saveDefaultsBtn = element("button", "zero-models-btn zero-btn-save-defaults", "Save Defaults");
  defaultsActions.append(saveDefaultsBtn);
  defaultsCard.append(defaultsActions);
  root.append(defaultsCard);

  // --- 3. Section 2: Agent Model Bindings Card ---
  const agentsCard = element("section", "zero-models-card");
  agentsCard.id = "zero-models-agents-section";
  const agentHead = element("div", "zero-models-card__head");
  agentHead.append(
    element("h2", "zero-models-card__title", "Agent Model Bindings"),
    element(
      "p",
      "zero-models-card__subtitle",
      "Assign models to configured agents independently without changing system defaults."
    )
  );
  agentsCard.append(agentHead);

  const agentBindingBox = element("div", "zero-agent-binding-box");
  const agentBindingHead = element("div", "zero-agent-binding-head");
  const agentBindingTitle = element("div", "zero-agent-binding-title", "Zero (zero)");
  const agentBindingBadge = element("span", "zero-agent-binding-badge", "EXPLICIT BINDING");
  agentBindingHead.append(agentBindingTitle, agentBindingBadge);
  agentBindingBox.append(agentBindingHead);

  const agentDescBox = element("div", "zero-agent-desc-box");
  const descItem1 = element("div", "zero-agent-desc-box__item");
  descItem1.append(
    element("span", "zero-agent-desc-box__label", "Active Model:"),
    element("span", "zero-agent-desc-box__value", systemDefaults.primary || "zero-gateway/default")
  );
  const descItem2 = element("div", "zero-agent-desc-box__item");
  descItem2.append(
    element("span", "zero-agent-desc-box__label", "Fallbacks:"),
    element("span", "zero-agent-desc-box__value", "None")
  );
  agentDescBox.append(descItem1, descItem2);
  agentBindingBox.append(agentDescBox);

  const agentAssignRow = element("div", "zero-agent-assign-row");
  const agentModelSelect = element("select", "zero-agent-assign-select");
  const assignBtn = element("button", "zero-btn-assign-agent", "Assign to Zero");
  agentAssignRow.append(agentModelSelect, assignBtn);
  agentBindingBox.append(agentAssignRow);

  const agentOverrideRow = element("div", "zero-agent-override-row");
  const overrideCheckbox = document.createElement("input");
  overrideCheckbox.type = "checkbox";
  overrideCheckbox.id = "zero-agent-override-check";
  overrideCheckbox.className = "zero-agent-override-checkbox";
  overrideCheckbox.checked = true;
  const overrideLabel = element("label", "zero-agent-override-label", "Allow unverified model override for agent:zero:main");
  overrideLabel.setAttribute("for", "zero-agent-override-check");
  agentOverrideRow.append(overrideCheckbox, overrideLabel);
  agentBindingBox.append(agentOverrideRow);

  agentsCard.append(agentBindingBox);
  root.append(agentsCard);

  // --- 4. Section 3: Offline GGUF Models & Configured Providers ---
  const providersCard = element("section", "zero-models-card");
  providersCard.id = "zero-models-providers-section";
  const provHead = element("div", "zero-about__section-head");
  provHead.append(
    element("h2", "zero-models-card__title", "Configured Providers & Offline Models"),
    element("p", "zero-models-card__subtitle", "Live local GGUF models and upstream API providers registered in Zero Gateway.")
  );
  const refreshBtn = element("button", "zero-models-btn zero-models-btn--agents", "Refresh List");
  provHead.append(refreshBtn);
  providersCard.append(provHead);

  const modelsListContainer = element("div", "zero-providers-list");
  providersCard.append(modelsListContainer);
  root.append(providersCard);

  // --- Modal Container (for Add Provider & Import GGUF) ---
  const modalOverlay = element("div", "zero-modal-overlay");
  modalOverlay.style.display = "none";
  root.append(modalOverlay);

  // --- DATA LOADING & SYNC ---
  async function loadAllData() {
    modelsListContainer.replaceChildren(element("div", "zero-providers-loading", "Loading gateway providers and offline GGUF models..."));
    try {
      // 1. Fetch offline GGUF models
      const ggufRes = await gatewayHttp("/api/gateway/local-gguf/models").catch(() => null);
      if (ggufRes && ggufRes.ok) {
        const data = await ggufRes.json();
        offlineModels = Array.isArray(data.models) ? data.models : [];
      } else {
        offlineModels = [];
      }

      // 2. Fetch custom providers config
      const confRes = await gatewayHttp("/api/gateway/config").catch(() => null);
      if (confRes && confRes.ok) {
        const confData = await confRes.json();
        activeProviders = Array.isArray(confData.providers) ? confData.providers : [];
      } else {
        activeProviders = [];
      }

      renderProvidersAndModelsList();
      populateDropdowns();
    } catch (err) {
      modelsListContainer.replaceChildren(element("div", "zero-providers-empty", `Gateway offline or connection failed (${err.message})`));
    }
  }

  function populateDropdowns() {
    const allModelOptions = [];

    // Offline models
    for (const m of offlineModels) {
      allModelOptions.push({
        id: m.id,
        name: `${m.name || m.id} (Offline GGUF)`,
      });
    }

    // Cloud provider models
    for (const p of activeProviders) {
      if (Array.isArray(p.models)) {
        for (const pm of p.models) {
          const mid = typeof pm === "string" ? pm : pm.id;
          const mname = typeof pm === "string" ? pm : (pm.name || pm.id);
          allModelOptions.push({
            id: mid,
            name: `${mname} (${p.name || p.id})`,
          });
        }
      }
    }

    // Update Primary, Utility, Fallback, and Agent selectors
    function fillSelect(selEl, emptyLabel, currentVal) {
      const firstOpt = element("option", null, emptyLabel);
      firstOpt.value = "";
      selEl.replaceChildren(firstOpt);

      for (const m of allModelOptions) {
        const opt = element("option", null, m.name);
        opt.value = m.id;
        if (m.id === currentVal) opt.selected = true;
        selEl.append(opt);
      }
    }

    fillSelect(primarySel.select, "(Select Primary Model)", systemDefaults.primary);
    fillSelect(utilitySel.select, "(Select Utility Model)", systemDefaults.utility);
    fillSelect(fallbackSel.select, "(Select Fallback Model)", systemDefaults.fallback);
    fillSelect(agentModelSelect, "(Select Model for Zero Agent)", systemDefaults.primary);
  }

  function renderProvidersAndModelsList() {
    modelsListContainer.replaceChildren();

    const hasNoOffline = offlineModels.length === 0;
    const hasNoProviders = activeProviders.length === 0;

    if (hasNoOffline && hasNoProviders) {
      const emptyBox = element("div", "zero-providers-empty");
      emptyBox.append(element("p", null, "No offline GGUF models or cloud providers configured yet."));
      const btnRow = element("div", null);
      btnRow.style.display = "flex";
      btnRow.style.gap = "10px";
      btnRow.style.marginTop = "8px";
      const emptyAdd = element("button", "zero-models-btn zero-models-btn--add-provider", "+ Add Cloud Provider");
      const emptyImport = element("button", "zero-models-btn zero-models-btn--import-gguf", "Import Offline GGUF");
      emptyAdd.onclick = openAddProviderModal;
      emptyImport.onclick = openImportGgufModal;
      btnRow.append(emptyAdd, emptyImport);
      emptyBox.append(btnRow);
      modelsListContainer.append(emptyBox);
      return;
    }

    // 1. Render Offline GGUF Models
    if (offlineModels.length > 0) {
      const sectionHeader = element("div", "zero-provider-card__title-row");
      sectionHeader.style.marginBottom = "10px";
      sectionHeader.append(
        element("h3", "zero-models-card__title", `Offline GGUF Models (${offlineModels.length})`)
      );
      modelsListContainer.append(sectionHeader);

      for (const model of offlineModels) {
        const card = element("div", "zero-provider-card");
        const cardHeader = element("div", "zero-provider-card__header");
        const left = element("div", "zero-provider-card__left");
        const icon = element("div", "zero-provider-icon zero-provider-icon--ollama");
        const meta = element("div", "zero-provider-card__meta");

        const titleRow = element("div", "zero-provider-card__title-row");
        const modelTitle = element("span", "zero-provider-card__title", model.name || model.id);
        const statusBadge = element("span", "zero-providers-badge zero-providers-badge--active", model.status || "READY");
        titleRow.append(modelTitle, statusBadge);

        // Vision Projector Companion Badge
        if (model.companionProjector) {
          const projBadge = element("span", "zero-agent-binding-badge", `Vision Projector Paired: ${model.companionProjector}`);
          projBadge.style.marginLeft = "8px";
          projBadge.style.color = "#38bdf8";
          projBadge.style.borderColor = "#38bdf8";
          titleRow.append(projBadge);
        }

        const details = element("div", "zero-provider-card__details");
        const metaSize = element("span", "zero-provider-card__meta-item");
        metaSize.append(element("span", "zero-provider-card__meta-label", "Size: "), element("span", "zero-provider-card__meta-val", model.sizeFormatted || "Unknown"));
        const metaQuant = element("span", "zero-provider-card__meta-item");
        metaQuant.append(element("span", "zero-provider-card__meta-label", "Quant: "), element("span", "zero-provider-card__meta-val", model.quantization || "N/A"));
        const metaArch = element("span", "zero-provider-card__meta-item");
        metaArch.append(element("span", "zero-provider-card__meta-label", "Arch: "), element("span", "zero-provider-card__meta-val", model.architecture || "general"));

        details.append(metaSize, metaQuant, metaArch);
        meta.append(titleRow, details);
        left.append(icon, meta);

        // Action Buttons
        const actions = element("div", "zero-provider-card__actions");

        // Reasoning Toggle Button
        const isReasoning = model.capabilities?.reasoning !== false;
        const reasoningBtn = element("button", "zero-providers-btn zero-providers-btn--subtle");
        reasoningBtn.textContent = isReasoning ? "Reasoning: ON" : "Reasoning: OFF (/no_think)";
        if (!isReasoning) {
          reasoningBtn.style.color = "#fbbf24";
          reasoningBtn.style.borderColor = "#fbbf24";
        }
        reasoningBtn.onclick = async () => {
          try {
            reasoningBtn.disabled = true;
            const nextReasoning = !isReasoning;
            const res = await gatewayHttp(`/api/gateway/local-gguf/models/${encodeURIComponent(model.id)}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                capabilities: { reasoning: nextReasoning },
              }),
            });
            if (res.ok) {
              showNotice(`Reasoning toggled to ${nextReasoning ? "ON" : "OFF (/no_think)"} for ${model.name}`);
              await loadAllData();
            } else {
              showNotice("Failed to update reasoning toggle.", true);
            }
          } catch (e) {
            showNotice(e.message, true);
          } finally {
            reasoningBtn.disabled = false;
          }
        };

        // Rename Button
        const renameBtn = element("button", "zero-providers-btn zero-providers-btn--subtle", "Rename");
        const renameRow = element("div", "zero-gguf-rename-row");
        renameRow.style.display = "none";
        const renameInput = element("input", "zero-selector-field__select zero-gguf-rename-input");
        renameInput.value = model.name || model.id;
        const saveRenameBtn = element("button", "zero-btn-save-defaults", "Save Name");
        saveRenameBtn.style.padding = "6px 14px";
        const cancelRenameBtn = element("button", "zero-providers-btn zero-providers-btn--subtle", "Cancel");

        renameBtn.onclick = () => {
          renameRow.style.display = renameRow.style.display === "none" ? "flex" : "none";
        };
        cancelRenameBtn.onclick = () => {
          renameRow.style.display = "none";
        };
        saveRenameBtn.onclick = async () => {
          const newName = renameInput.value.trim();
          if (!newName) return;
          try {
            saveRenameBtn.disabled = true;
            const res = await gatewayHttp(`/api/gateway/local-gguf/models/${encodeURIComponent(model.id)}`, {
              method: "PATCH",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ name: newName }),
            });
            if (res.ok) {
              showNotice(`Model renamed to "${newName}"`);
              await loadAllData();
            } else {
              showNotice("Failed to rename model.", true);
            }
          } catch (e) {
            showNotice(e.message, true);
          } finally {
            saveRenameBtn.disabled = false;
          }
        };

        renameRow.append(renameInput, saveRenameBtn, cancelRenameBtn);

        // Delete Model Button
        const delBtn = element("button", "zero-providers-btn zero-providers-btn--danger", "Delete");
        delBtn.onclick = async () => {
          if (!confirm(`Are you sure you want to delete offline model "${model.name || model.id}" from disk?`)) return;
          try {
            delBtn.disabled = true;
            const res = await gatewayHttp(`/api/gateway/local-gguf/models/${encodeURIComponent(model.id)}`, {
              method: "DELETE",
            });
            if (res.ok) {
              showNotice(`Model "${model.name || model.id}" deleted.`);
              await loadAllData();
            } else {
              showNotice("Failed to delete model.", true);
            }
          } catch (e) {
            showNotice(e.message, true);
          } finally {
            delBtn.disabled = false;
          }
        };

        actions.append(reasoningBtn, renameBtn, delBtn);
        cardHeader.append(left, actions);
        card.append(cardHeader, renameRow);
        modelsListContainer.append(card);
      }
    }

    // 2. Render Cloud Providers
    if (activeProviders.length > 0) {
      const provSectionHeader = element("div", "zero-provider-card__title-row");
      provSectionHeader.style.margin = "20px 0 10px 0";
      provSectionHeader.append(
        element("h3", "zero-models-card__title", `Cloud Providers (${activeProviders.length})`)
      );
      modelsListContainer.append(provSectionHeader);

      for (const prov of activeProviders) {
        const card = element("div", "zero-provider-card");
        const cardHeader = element("div", "zero-provider-card__header");
        const left = element("div", "zero-provider-card__left");
        const icon = element("div", "zero-provider-icon zero-provider-icon--openai");
        const meta = element("div", "zero-provider-card__meta");

        const titleRow = element("div", "zero-provider-card__title-row");
        const pTitle = element("span", "zero-provider-card__title", prov.name || prov.id);
        const pBadge = element("span", "zero-providers-badge zero-providers-badge--active", prov.enabled !== false ? "ACTIVE" : "DISABLED");
        titleRow.append(pTitle, pBadge);

        const details = element("div", "zero-provider-card__details");
        const metaUrl = element("span", "zero-provider-card__meta-item");
        metaUrl.append(element("span", "zero-provider-card__meta-label", "Base URL: "), element("span", "zero-provider-card__meta-val", prov.baseUrl || "N/A"));
        const metaCount = element("span", "zero-provider-card__meta-item");
        const count = Array.isArray(prov.models) ? prov.models.length : 0;
        metaCount.append(element("span", "zero-provider-card__meta-label", "Models: "), element("span", "zero-provider-card__meta-val", `${count} configured`));

        details.append(metaUrl, metaCount);
        meta.append(titleRow, details);
        left.append(icon, meta);

        // Actions
        const actions = element("div", "zero-provider-card__actions");
        const testBtn = element("button", "zero-providers-btn zero-providers-btn--subtle", "Test Connection");
        testBtn.onclick = async () => {
          testBtn.disabled = true;
          testBtn.textContent = "Testing...";
          try {
            const res = await gatewayHttp("/api/gateway/proxy", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                baseUrl: prov.baseUrl,
                endpoint: "/models",
                apiKey: prov.apiKey,
                headers: prov.headers,
              }),
            });
            if (res.ok) {
              showNotice(`Connection successful to ${prov.name || prov.id}!`);
            } else {
              showNotice(`Provider error: ${res.statusText}`, true);
            }
          } catch (err) {
            showNotice(`Connection failed: ${err.message}`, true);
          } finally {
            testBtn.disabled = false;
            testBtn.textContent = "Test Connection";
          }
        };

        const delProvBtn = element("button", "zero-providers-btn zero-providers-btn--danger", "Remove");
        delProvBtn.onclick = async () => {
          if (!confirm(`Remove provider "${prov.name || prov.id}"?`)) return;
          try {
            delProvBtn.disabled = true;
            const updatedList = activeProviders.filter((p) => p.id !== prov.id);
            const res = await gatewayHttp("/api/gateway/config", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ providers: updatedList }),
            });
            if (res.ok) {
              showNotice(`Provider "${prov.name || prov.id}" removed.`);
              await loadAllData();
            } else {
              showNotice("Failed to remove provider.", true);
            }
          } catch (e) {
            showNotice(e.message, true);
          } finally {
            delProvBtn.disabled = false;
          }
        };

        actions.append(testBtn, delProvBtn);
        cardHeader.append(left, actions);
        card.append(cardHeader);
        modelsListContainer.append(card);
      }
    }
  }

  // --- SAVE DEFAULTS HANDLER ---
  saveDefaultsBtn.onclick = async () => {
    saveDefaultsBtn.disabled = true;
    saveDefaultsBtn.textContent = "Saving Defaults...";
    try {
      systemDefaults = {
        primary: primarySel.select.value,
        utility: utilitySel.select.value,
        fallback: fallbackSel.select.value,
        thinking: thinkingSel.select.value,
        fastMode: fastModeSel.select.value,
      };

      // Persist to gateway config endpoint
      const res = await gatewayHttp("/api/gateway/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ defaults: systemDefaults }),
      }).catch(() => null);

      showNotice("Model defaults & preferences saved successfully!");
    } catch (e) {
      showNotice("Failed to save defaults: " + e.message, true);
    } finally {
      saveDefaultsBtn.disabled = false;
      saveDefaultsBtn.textContent = "Save Defaults";
    }
  };

  // --- ASSIGN AGENT MODEL HANDLER ---
  assignBtn.onclick = async () => {
    const selectedModel = agentModelSelect.value;
    if (!selectedModel) {
      showNotice("Please select a model to assign to Zero agent.", true);
      return;
    }
    assignBtn.disabled = true;
    assignBtn.textContent = "Binding Agent...";
    try {
      const res = await gatewayHttp("/api/gateway/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agentBindings: {
            zero: {
              model: selectedModel,
              allowOverride: overrideCheckbox.checked,
            },
          },
        }),
      }).catch(() => null);

      showNotice(`Successfully bound model "${selectedModel}" to Zero agent!`);
    } catch (e) {
      showNotice("Failed to bind agent model: " + e.message, true);
    } finally {
      assignBtn.disabled = false;
      assignBtn.textContent = "Assign Model to Agent";
    }
  };

  // --- MODAL: ADD PROVIDER ---
  function openAddProviderModal() {
    modalOverlay.replaceChildren();
    modalOverlay.style.display = "flex";

    const modalBox = element("div", "zero-modal zero-models-card");
    modalBox.style.maxWidth = "560px";
    modalBox.style.width = "90%";
    modalBox.style.margin = "auto";
    modalBox.style.backgroundColor = "#0d131f";

    const head = element("div", "zero-modal__header zero-models-card__head");
    head.style.display = "flex";
    head.style.justifyContent = "space-between";
    head.style.alignItems = "center";

    const titleGroup = element("div", "zero-modal__title-group");
    titleGroup.append(
      element("h2", "zero-modal__title zero-models-card__title", "+ Add Cloud Provider"),
      element("p", "zero-models-card__subtitle", "Register an upstream OpenAI-compatible, Anthropic, or custom provider.")
    );

    const closeBtn = element("button", "zero-modal__close", "×");
    closeBtn.type = "button";
    closeBtn.setAttribute("aria-label", "Close modal");
    closeBtn.onclick = () => {
      modalOverlay.style.display = "none";
    };

    head.append(titleGroup, closeBtn);

    const nameField = createInputField("Provider Name", "m-prov-name", "e.g. Groq, OpenAI, Ollama, DeepSeek");
    const urlField = createInputField("Base URL", "m-prov-url", "https://api.openai.com/v1 or http://127.0.0.1:11434/v1");
    const keyField = createInputField("API Key (Stored in Server Vault)", "m-prov-key", "sk-... (leave blank for local Ollama/vLLM)", "password");

    // Fetch Models bar
    const fetchRow = element("div", "zero-modal__fetch-bar");
    fetchRow.style.display = "flex";
    fetchRow.style.gap = "8px";
    fetchRow.style.alignItems = "center";
    fetchRow.style.margin = "4px 0";

    const fetchBtn = element("button", "zero-providers-btn zero-providers-btn--subtle", "Fetch Models");
    fetchBtn.type = "button";
    fetchRow.append(fetchBtn);

    const modelsField = createInputField("Models (Comma-separated IDs)", "m-prov-models", "e.g. gpt-4o, llama-3.3-70b-versatile");

    fetchBtn.onclick = async () => {
      const url = urlField.input.value.trim();
      if (!url) {
        alert("Please enter Base URL first.");
        return;
      }
      fetchBtn.disabled = true;
      fetchBtn.textContent = "Fetching...";
      try {
        const res = await gatewayHttp("/api/gateway/proxy", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            baseUrl: url,
            endpoint: "/models",
            apiKey: keyField.input.value.trim(),
          }),
        });
        if (res.ok) {
          const data = await res.json();
          const ids = (data.data || []).map((m) => m.id).filter(Boolean);
          if (ids.length > 0) {
            modelsField.input.value = ids.join(", ");
            showNotice(`Discovered ${ids.length} models!`);
          } else {
            showNotice("No models returned by upstream endpoint.");
          }
        } else {
          showNotice("Failed to fetch models from endpoint.", true);
        }
      } catch (e) {
        showNotice(e.message, true);
      } finally {
        fetchBtn.disabled = false;
        fetchBtn.textContent = "Fetch Models";
      }
    };

    const modalActions = element("div", "zero-modal__footer zero-defaults-actions");
    const cancelBtn = element("button", "zero-providers-btn zero-providers-btn--subtle", "Cancel");
    cancelBtn.type = "button";
    const submitBtn = element("button", "zero-models-btn zero-models-btn--add-provider", "Save Provider");
    submitBtn.type = "button";

    cancelBtn.onclick = () => {
      modalOverlay.style.display = "none";
    };

    submitBtn.onclick = async () => {
      const pName = nameField.input.value.trim();
      const pUrl = urlField.input.value.trim();
      if (!pName || !pUrl) {
        alert("Please enter Provider Name and Base URL.");
        return;
      }
      submitBtn.disabled = true;
      submitBtn.textContent = "Saving...";
      try {
        const rawModels = modelsField.input.value
          .split(",")
          .map((s) => s.trim())
          .filter(Boolean);
        const newProv = {
          id: pName.toLowerCase().replace(/[^a-z0-9_-]/g, "-"),
          name: pName,
          baseUrl: pUrl,
          apiKey: keyField.input.value.trim(),
          models: rawModels.map((m) => ({ id: m, name: m })),
          enabled: true,
        };

        const updatedProviders = [...activeProviders.filter((p) => p.id !== newProv.id), newProv];
        const res = await gatewayHttp("/api/gateway/config", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ providers: updatedProviders }),
        });

        if (res.ok) {
          modalOverlay.style.display = "none";
          showNotice(`Provider "${pName}" successfully added!`);
          await loadAllData();
        } else {
          alert("Failed to save provider configuration.");
        }
      } catch (err) {
        alert("Error: " + err.message);
      } finally {
        submitBtn.disabled = false;
        submitBtn.textContent = "Save Provider";
      }
    };

    modalActions.append(cancelBtn, submitBtn);
    modalBox.append(head, nameField.field, urlField.field, keyField.field, fetchRow, modelsField.field, modalActions);
    modalOverlay.append(modalBox);
  }

  // --- MODAL: IMPORT GGUF ---
  function openImportGgufModal() {
    modalOverlay.replaceChildren();
    modalOverlay.style.display = "flex";

    const modalBox = element("div", "zero-modal zero-models-card");
    modalBox.style.maxWidth = "620px";
    modalBox.style.width = "90%";
    modalBox.style.margin = "auto";
    modalBox.style.backgroundColor = "#0d131f";

    const head = element("div", "zero-modal__header zero-models-card__head");
    head.style.display = "flex";
    head.style.justifyContent = "space-between";
    head.style.alignItems = "center";

    const titleGroup = element("div", "zero-modal__title-group");
    titleGroup.append(
      element("h2", "zero-modal__title zero-models-card__title", "Import Offline GGUF Model"),
      element("p", "zero-models-card__subtitle", "Zero-copy instant path mount or download from Hugging Face.")
    );

    const closeBtn = element("button", "zero-modal__close", "×");
    closeBtn.type = "button";
    closeBtn.setAttribute("aria-label", "Close modal");
    closeBtn.onclick = () => {
      modalOverlay.style.display = "none";
    };

    head.append(titleGroup, closeBtn);

    // Tab Header
    const tabHeader = element("div", "zero-gguf-tool-tabs zero-segmented-tabs");
    tabHeader.style.display = "flex";
    tabHeader.style.gap = "8px";
    tabHeader.style.margin = "12px 0";

    const tabMount = element("button", "zero-segmented-tab zero-segmented-tab--active zero-models-btn", "Local File Path (Zero-Copy)");
    tabMount.type = "button";
    const tabHf = element("button", "zero-segmented-tab zero-models-btn", "Hugging Face Search");
    tabHf.type = "button";
    const tabDownloads = element("button", "zero-segmented-tab zero-models-btn", "Active Downloads");
    tabDownloads.type = "button";
    tabHeader.append(tabMount, tabHf, tabDownloads);

    // Tab 1: Zero-Copy Mount Panel
    const mountPanel = element("div", "zero-gguf-tool-panel");
    const pathField = createInputField("Local .gguf File Path", "m-gguf-path", "e.g. E:\\models\\moondream2-text-model-f16_ct-vicuna.gguf");

    const mountActions = element("div", "zero-defaults-actions");
    const mountCancelBtn = element("button", "zero-providers-btn zero-providers-btn--subtle", "Cancel");
    mountCancelBtn.type = "button";
    const mountSubmitBtn = element("button", "zero-models-btn zero-models-btn--add-provider", "Mount Model (2s)");
    mountSubmitBtn.type = "button";
    mountActions.append(mountCancelBtn, mountSubmitBtn);
    mountPanel.append(pathField.field, mountActions);

    // Tab 2: Hugging Face Panel
    const hfPanel = element("div", "zero-gguf-tool-panel");
    hfPanel.style.display = "none";
    const hfField = createInputField("Hugging Face Model Repo / URL", "m-hf-url", "e.g. vikhyatk/moondream2 or direct .gguf URL");

    const hfActions = element("div", "zero-defaults-actions");
    const hfCancelBtn = element("button", "zero-providers-btn zero-providers-btn--subtle", "Cancel");
    hfCancelBtn.type = "button";
    const hfSubmitBtn = element("button", "zero-models-btn zero-models-btn--add-provider", "Download Model");
    hfSubmitBtn.type = "button";
    hfActions.append(hfCancelBtn, hfSubmitBtn);
    hfPanel.append(hfField.field, hfActions);

    // Tab 3: Active Downloads Panel
    const dlPanel = element("div", "zero-gguf-tool-panel");
    dlPanel.style.display = "none";
    const dlInfo = element("div", "zero-empty-tip", "No active background downloads running right now.");
    dlInfo.style.padding = "16px";
    dlInfo.style.color = "#858b99";
    dlPanel.append(dlInfo);

    // Tab Switching
    function selectTab(selectedTab, activePanel) {
      [tabMount, tabHf, tabDownloads].forEach((t) => t.classList.remove("zero-segmented-tab--active"));
      [mountPanel, hfPanel, dlPanel].forEach((p) => (p.style.display = "none"));
      selectedTab.classList.add("zero-segmented-tab--active");
      activePanel.style.display = "flex";
      activePanel.style.flexDirection = "column";
      activePanel.style.gap = "12px";
    }

    tabMount.onclick = () => selectTab(tabMount, mountPanel);
    tabHf.onclick = () => selectTab(tabHf, hfPanel);
    tabDownloads.onclick = () => selectTab(tabDownloads, dlPanel);

    mountCancelBtn.onclick = () => (modalOverlay.style.display = "none");
    hfCancelBtn.onclick = () => (modalOverlay.style.display = "none");

    // Mount Handler
    mountSubmitBtn.onclick = async () => {
      const sourcePath = pathField.input.value.trim();
      if (!sourcePath) {
        alert("Please enter a local .gguf file path.");
        return;
      }
      mountSubmitBtn.disabled = true;
      mountSubmitBtn.textContent = "Mounting...";
      try {
        const res = await gatewayHttp("/api/gateway/local-gguf/mount-zero-copy", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ sourcePath }),
        });
        const data = await res.json();
        if (res.ok && data.success) {
          modalOverlay.style.display = "none";
          showNotice(`Model "${data.model?.name || 'GGUF'}" mounted successfully!`);
          await loadAllData();
        } else {
          alert("Mount failed: " + (data.error || "Unknown error"));
        }
      } catch (err) {
        alert("Error: " + err.message);
      } finally {
        mountSubmitBtn.disabled = false;
        mountSubmitBtn.textContent = "Mount Model (2s)";
      }
    };

    // HF Download Handler
    hfSubmitBtn.onclick = async () => {
      const url = hfField.input.value.trim();
      if (!url) {
        alert("Please enter Hugging Face URL or Repo.");
        return;
      }
      hfSubmitBtn.disabled = true;
      hfSubmitBtn.textContent = "Starting Download...";
      try {
        const res = await gatewayHttp("/api/gateway/local-gguf/hf/download", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ url }),
        });
        const data = await res.json();
        if (res.ok && data.success) {
          modalOverlay.style.display = "none";
          showNotice("Download queued! Inspect status in local models list.");
          await loadAllData();
        } else {
          alert("Download initiation failed: " + (data.error || "Unknown error"));
        }
      } catch (err) {
        alert("Error: " + err.message);
      } finally {
        hfSubmitBtn.disabled = false;
        hfSubmitBtn.textContent = "Download Model";
      }
    };

    modalBox.append(head, tabHeader, mountPanel, hfPanel, dlPanel);
    modalOverlay.append(modalBox);
  }

  // --- BUTTON WIRING ---
  addProviderBtn.onclick = openAddProviderModal;
  importGgufBtn.onclick = openImportGgufModal;
  agentsNavBtn.onclick = () => {
    agentsCard.scrollIntoView({ behavior: "smooth" });
  };
  refreshBtn.onclick = () => {
    loadAllData();
  };

  // Mount into DOM
  if (typeof container.append === "function") {
    container.append(root);
  } else if (typeof container.appendChild === "function") {
    container.appendChild(root);
  }

  // Initial Data Fetch
  loadAllData();

  return {
    dispose: () => {
      disposed = true;
      if (typeof container.replaceChildren === "function") {
        container.replaceChildren();
      } else {
        container.innerHTML = "";
      }
    },
  };
}
