export class HUD {
  constructor() {
    this.keysEl = document.getElementById("keys");
    this.statusEl = document.getElementById("status");
    this.promptEl = document.getElementById("prompt");
    this.overlay = document.getElementById("overlay");
    this.overlayTitle = document.getElementById("overlay-title");
    this.overlayBody = document.getElementById("overlay-body");
    this.vignette = document.getElementById("vignette");
  }

  setKeys(count, total = 3) {
    this.keysEl.textContent = `印: ${count} / ${total}`;
  }

  setGuardianState(state) {
    const labels = {
      patrol: "",
      alert: "…何かが近づいている",
      chase: "!! 追われている !!",
      search: "…気配が遠のいた",
    };
    this.statusEl.textContent = labels[state] || "";
    this.statusEl.className = state === "chase" ? "danger" : state === "alert" ? "warn" : "";
  }

  setPrompt(text) {
    this.promptEl.textContent = text || "";
  }

  setChaseVignette(active) {
    this.vignette.classList.toggle("active", active);
  }

  showOverlay(title, body, clickable = true) {
    this.overlayTitle.textContent = title;
    this.overlayBody.innerHTML = body;
    this.overlay.style.display = "flex";
    this.overlay.style.pointerEvents = clickable ? "auto" : "none";
    this.overlay.style.cursor = clickable ? "pointer" : "default";
  }

  hideOverlay() {
    this.overlay.style.display = "none";
  }
}
