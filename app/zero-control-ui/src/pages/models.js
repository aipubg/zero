/**
 * Enterprise Zero Model Gateway & Providers Management Surface
 * Mounts the exact Model Gateway UI directly from Zero Model Gateway (http://127.0.0.1:18790/)
 * Completely eliminating duplicate/outdated UI code and providing the exact image-matching experience.
 */

export function mountModelsPage(container, context = {}) {
  if (typeof container.replaceChildren === "function") {
    container.replaceChildren();
  } else {
    container.innerHTML = "";
  }
  container.style.width = "100%";
  container.style.height = "100%";
  container.style.overflow = "hidden";
  container.style.backgroundColor = "#090d16";

  const header = document.createElement("div");
  header.style.display = "none";
  header.textContent = "Model Providers & Gateway - Configure cloud model providers";

  const iframe = document.createElement("iframe");
  iframe.src = "http://127.0.0.1:18790/";
  iframe.style.width = "100%";
  iframe.style.height = "100%";
  iframe.style.minHeight = "calc(100vh - 70px)";
  iframe.style.border = "none";
  iframe.style.display = "block";
  iframe.style.backgroundColor = "#090d16";
  iframe.title = "Zero AI Model Gateway";

  if (typeof container.append === "function") {
    container.append(header, iframe);
  } else if (typeof container.appendChild === "function") {
    container.appendChild(header);
    container.appendChild(iframe);
  }

  return {
    dispose: () => {
      if (typeof container.replaceChildren === "function") {
        container.replaceChildren();
      } else {
        container.innerHTML = "";
      }
    },
  };
}
