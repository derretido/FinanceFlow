// Alertas

function renderAlerts(el) {
  el.innerHTML = `
    <div class="stack">
      <div class="page-header">
        <h1 class="page-title">Alertas</h1>
        <button class="btn btn-ghost btn-sm" id="mark-all" hidden>Marcar todos como lidos</button>
      </div>
      <div id="list"></div>
    </div>`;

  const listEl = el.querySelector("#list");
  const markAllBtn = el.querySelector("#mark-all");

  async function load(showSpinner = true) {
    if (showSpinner) listEl.innerHTML = spinnerHTML();
    try {
      const list = await api.get("/alerts");
      if (!el.isConnected) return;
      paintList(list);
    } catch {
      listEl.innerHTML = "";
      toast.error("Erro ao carregar alertas");
    }
    refreshUnread();
  }

  function paintList(list) {
    markAllBtn.hidden = !list.some((a) => !a.isRead);

    if (!list.length) {
      listEl.innerHTML = emptyHTML("🔔", "Nenhum alerta por enquanto");
      return;
    }

    listEl.innerHTML = `<div class="stack" style="gap:12px">${list
      .map((a) => {
        const type = a.type === "danger" || a.type === "warning" ? a.type : "info";
        return `<div class="alert-item alert-${type} ${a.isRead ? "read" : ""}">
          <div class="alert-dot"></div>
          <div class="alert-body">
            <div class="alert-title">${esc(a.title)}</div>
            <div class="alert-msg">${esc(a.message)}</div>
            <div class="alert-date">${new Date(a.createdAt).toLocaleString("pt-BR")}</div>
          </div>
          ${a.isRead ? "" : `<button class="link-btn" data-read="${a.id}">Marcar lido</button>`}
        </div>`;
      })
      .join("")}</div>`;

    listEl.querySelectorAll("[data-read]").forEach((b) =>
      b.addEventListener("click", async () => {
        try {
          await api.patch(`/alerts/${b.dataset.read}/read`);
          load(false);
        } catch {
          toast.error("Erro ao marcar alerta");
        }
      })
    );
  }

  markAllBtn.addEventListener("click", async () => {
    try {
      await api.patch("/alerts/read-all");
      toast.success("Todos lidos!");
      load(false);
    } catch {
      toast.error("Erro ao marcar alertas");
    }
  });

  load();
}
