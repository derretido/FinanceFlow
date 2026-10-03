// Metas de economia

const GOAL_ICONS = ["🎯", "🏠", "🚗", "✈️", "💍", "📱", "💻", "🎓", "🏖️", "💰", "🏋️", "🎮"];

function renderGoals(el) {
  el.innerHTML = `
    <div class="stack">
      <div class="page-header">
        <h1 class="page-title">Metas de Economia</h1>
        <button class="btn btn-primary" id="add">${icon("plus", 15)} Nova meta</button>
      </div>
      <div id="list"></div>
    </div>`;

  const listEl = el.querySelector("#list");

  async function load() {
    listEl.innerHTML = spinnerHTML();
    try {
      const list = await api.get("/goals");
      if (!el.isConnected) return;
      paintList(list);
    } catch {
      listEl.innerHTML = "";
      toast.error("Erro ao carregar metas");
    }
  }

  function paintList(list) {
    if (!list.length) {
      listEl.innerHTML = emptyHTML("🎯", "Nenhuma meta cadastrada");
      return;
    }

    listEl.innerHTML = `<div class="grid grid-2" style="gap:20px">${list
      .map((g) => {
        const pct = Math.min(100, g.progressPercent);
        const color = pct >= 100 ? "#4ade80" : "#a78bfa";
        return cardHTML(`<div class="card-body">
          <div class="goal-head">
            <div class="row">
              <span class="goal-icon">${esc(g.icon)}</span>
              <div>
                <div style="font-weight:600">${esc(g.name)}</div>
                ${g.deadline ? `<div class="muted" style="font-size:12px;margin-top:2px">até ${fmtDate(g.deadline)}</div>` : ""}
                ${g.isCompleted ? '<span class="tag tag-green">Concluída ✓</span>' : ""}
              </div>
            </div>
            <button class="icon-btn danger" data-del="${g.id}" aria-label="Remover">${icon("trash", 14)}</button>
          </div>
          <div style="margin-bottom:12px">${progressHTML(pct, color)}</div>
          <div class="between muted font-mono" style="font-size:12px;margin-bottom:16px">
            <span>${fmtBRL(g.currentAmount)}</span>
            <span style="font-weight:700;color:${color}">${pct}%</span>
            <span>${fmtBRL(g.targetAmount)}</span>
          </div>
          ${g.isCompleted ? "" : `<button class="btn btn-ghost btn-full btn-sm" data-deposit="${g.id}">+ Depositar</button>`}
        </div>`);
      })
      .join("")}</div>`;

    listEl.querySelectorAll("[data-del]").forEach((b) =>
      b.addEventListener("click", async () => {
        if (!confirm("Remover meta?")) return;
        try {
          await api.delete(`/goals/${b.dataset.del}`);
          toast.success("Removida!");
          load();
        } catch {
          toast.error("Erro ao remover meta");
        }
      })
    );
    listEl.querySelectorAll("[data-deposit]").forEach((b) =>
      b.addEventListener("click", () => openDeposit(b.dataset.deposit))
    );
  }

  function openForm() {
    let selectedIcon = GOAL_ICONS[0];
    const { el: modal, close } = openModal(
      "Nova meta",
      `<div class="form">
        <div class="field"><label>Ícone</label>
          <div class="icon-picker">
            ${GOAL_ICONS.map((ic, i) => `<button type="button" class="icon-option ${i === 0 ? "selected" : ""}" data-icon="${ic}">${ic}</button>`).join("")}
          </div>
        </div>
        <div class="field"><label>Nome</label><input name="name" placeholder="Ex: Viagem, Carro..." /></div>
        <div class="form-2">
          <div class="field"><label>Meta (R$)</label><input name="targetAmount" type="number" /></div>
          <div class="field"><label>Prazo (opcional)</label><input name="deadline" type="date" /></div>
        </div>
        <div class="form-actions">
          <button class="btn btn-primary btn-block" id="save">Criar meta</button>
          <button class="btn btn-ghost" data-close>Cancelar</button>
        </div>
      </div>`
    );

    modal.querySelectorAll(".icon-option").forEach((b) =>
      b.addEventListener("click", () => {
        selectedIcon = b.dataset.icon;
        modal.querySelectorAll(".icon-option").forEach((o) => o.classList.toggle("selected", o === b));
      })
    );

    const val = (name) => modal.querySelector(`[name="${name}"]`).value;
    modal.querySelector("#save").addEventListener("click", async () => {
      if (!val("name") || !val("targetAmount")) return toast.error("Preencha nome e valor");
      try {
        await api.post("/goals", {
          name: val("name"),
          icon: selectedIcon,
          targetAmount: parseFloat(val("targetAmount")),
          deadline: val("deadline") || null,
        });
        toast.success("Meta criada!");
        close();
        load();
      } catch {
        toast.error("Erro ao salvar");
      }
    });
  }

  function openDeposit(goalId) {
    const { el: modal, close } = openModal(
      "Depositar na meta",
      `<div class="form">
        <div class="field"><label>Valor (R$)</label><input name="amount" type="number" placeholder="0,00" autofocus /></div>
        <div class="form-actions" style="padding-top:0">
          <button class="btn btn-success btn-block" id="save">Depositar</button>
          <button class="btn btn-ghost" data-close>Cancelar</button>
        </div>
      </div>`
    );

    modal.querySelector("#save").addEventListener("click", async () => {
      const amount = modal.querySelector('[name="amount"]').value;
      if (!amount || isNaN(amount)) return toast.error("Valor inválido");
      try {
        await api.post(`/goals/${goalId}/deposit`, { amount: parseFloat(amount) });
        toast.success("Depósito realizado!");
        close();
        load();
      } catch {
        toast.error("Erro ao depositar");
      }
    });
  }

  el.querySelector("#add").addEventListener("click", openForm);
  load();
}
