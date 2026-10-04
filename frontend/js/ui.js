

// ─── Texto / formatação ──────────────────────────────────────────────────────
function esc(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

const fmtBRL = (v = 0) =>
  "R$ " +
  Number(v || 0).toLocaleString("pt-BR", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

// "2024-05-10" → "10/05/2024"
const fmtDate = (iso) => String(iso || "").slice(0, 10).split("-").reverse().join("/");

function today() {
  const d = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

// ─── Ícones (SVG do Lucide) ──────────────────────────────────────────────────
const ICON_PATHS = {
  dashboard:
    '<rect x="3" y="3" width="7" height="9" rx="1"/><rect x="14" y="3" width="7" height="5" rx="1"/><rect x="14" y="12" width="7" height="9" rx="1"/><rect x="3" y="16" width="7" height="5" rx="1"/>',
  receipt:
    '<path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z"/><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"/><path d="M12 17.5v-11"/>',
  wallet:
    '<path d="M19 7V4a1 1 0 0 0-1-1H5a2 2 0 0 0 0 4h15a1 1 0 0 1 1 1v4h-3a2 2 0 0 0 0 4h3a1 1 0 0 0 1-1v-2a1 1 0 0 0-1-1"/><path d="M3 5v14a2 2 0 0 0 2 2h15a1 1 0 0 0 1-1v-4"/>',
  creditCard:
    '<rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/>',
  trendingUp: '<polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/>',
  target: '<circle cx="12" cy="12" r="10"/><circle cx="12" cy="12" r="6"/><circle cx="12" cy="12" r="2"/>',
  bell: '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>',
  logOut:
    '<path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/>',
  chevronLeft: '<path d="m15 18-6-6 6-6"/>',
  chevronRight: '<path d="m9 18 6-6-6-6"/>',
  plus: '<path d="M5 12h14"/><path d="M12 5v14"/>',
  trash:
    '<path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/>',
  pencil: '<path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/><path d="m15 5 4 4"/>',
};

function icon(name, size = 16) {
  return `<svg class="svg-icon" width="${size}" height="${size}" style="width:${size}px;height:${size}px" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${ICON_PATHS[name]}</svg>`;
}

// ─── Toasts ──────────────────────────────────────────────────────────────────
function showToast(message, type) {
  const el = document.createElement("div");
  el.className = `toast toast-${type}`;
  el.innerHTML = `<span class="toast-dot">${type === "success" ? "✓" : "!"}</span><span>${esc(message)}</span>`;
  document.getElementById("toasts").appendChild(el);
  setTimeout(() => {
    el.classList.add("leaving");
    setTimeout(() => el.remove(), 200);
  }, type === "success" ? 2500 : 4000);
}

const toast = {
  success: (msg) => showToast(msg, "success"),
  error: (msg) => showToast(msg, "error"),
};

// ─── Componentes em HTML ─────────────────────────────────────────────────────
function cardHTML(inner, { accent, className = "" } = {}) {
  return `<div class="card ${className}">
    ${accent ? `<div class="card-accent" style="background:${accent}"></div>` : ""}
    ${inner}
  </div>`;
}

function statCardHTML({ label, value, sub, icon: emoji, accent }) {
  return cardHTML(
    `<div class="card-body">
      <div class="stat-icon">${emoji}</div>
      <div class="label">${esc(label)}</div>
      <div class="stat-value" style="color:${accent}">${esc(value)}</div>
      ${sub ? `<div class="stat-sub">${esc(sub)}</div>` : ""}
    </div>`,
    { accent }
  );
}

function badgeHTML(text, color) {
  return `<span class="badge" style="border-left-color:${esc(color)}">${esc(text)}</span>`;
}

function progressHTML(value, color = "#15803d") {
  const pct = Math.min(100, Math.max(0, Number(value) || 0));
  return `<div class="progress-track"><div class="progress-fill" style="width:${pct}%;background:${color}"></div></div>`;
}

function emptyHTML(emoji, message) {
  return `<div class="empty"><div class="empty-icon">${emoji}</div><p>${esc(message)}</p></div>`;
}

const spinnerHTML = () => '<div class="spinner-wrap"><div class="spinner"></div></div>';

// ─── Modal ───────────────────────────────────────────────────────────────────
// Abre um modal e devolve { el, close }. O conteúdo é HTML; eventos são ligados por quem chamou.
function openModal(title, bodyHTML) {
  const el = document.createElement("div");
  el.className = "modal";
  el.innerHTML = `
    <div class="modal-backdrop"></div>
    <div class="modal-box">
      <div class="modal-head">
        <h2>${esc(title)}</h2>
        <button class="modal-close" aria-label="Fechar">✕</button>
      </div>
      ${bodyHTML}
    </div>`;

  const onKey = (e) => e.key === "Escape" && close();
  function close() {
    document.removeEventListener("keydown", onKey);
    el.remove();
  }

  el.querySelector(".modal-backdrop").addEventListener("click", close);
  el.querySelector(".modal-close").addEventListener("click", close);
  el.querySelectorAll("[data-close]").forEach((b) => b.addEventListener("click", close));
  document.addEventListener("keydown", onKey);
  document.body.appendChild(el);

  const first = el.querySelector("[autofocus], input, select");
  if (first) first.focus();

  return { el, close };
}

// ─── Navegação por mês ───────────────────────────────────────────────────────
const MONTHS = [
  "Janeiro", "Fevereiro", "Março", "Abril", "Maio", "Junho",
  "Julho", "Agosto", "Setembro", "Outubro", "Novembro", "Dezembro",
];

// Monta o seletor de mês dentro de `container`; chama onChange(year, month) a cada troca.
function mountMonthNav(container, state, onChange) {
  container.innerHTML = `
    <div class="month-nav">
      <button class="month-btn" data-dir="-1" aria-label="Mês anterior">${icon("chevronLeft")}</button>
      <span class="month-label"></span>
      <button class="month-btn" data-dir="1" aria-label="Próximo mês">${icon("chevronRight")}</button>
    </div>`;
  const label = container.querySelector(".month-label");
  const paint = () => (label.textContent = `${MONTHS[state.month - 1]} ${state.year}`);
  paint();

  container.querySelectorAll(".month-btn").forEach((btn) =>
    btn.addEventListener("click", () => {
      const dir = Number(btn.dataset.dir);
      state.month += dir;
      if (state.month < 1) {
        state.month = 12;
        state.year--;
      } else if (state.month > 12) {
        state.month = 1;
        state.year++;
      }
      paint();
      onChange(state.year, state.month);
    })
  );
}

function currentMonth() {
  const now = new Date();
  return { year: now.getFullYear(), month: now.getMonth() + 1 };
}
