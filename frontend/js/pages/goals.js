// Metas de economia

const GOAL_ICONS = ["🎯", "🏠", "🚗", "✈️", "💍", "📱", "💻", "🎓", "🏖️", "💰", "🏋️", "🎮"];

const GOAL_STATUS = {
  completed: { label: "Concluída ✓", tag: "tag-green" },
  on_track: { label: "No ritmo", tag: "tag-green" },
  behind: { label: "Atrasada", tag: "tag-yellow" },
  overdue: { label: "Prazo vencido", tag: "tag-red" },
};

// "2027-08-01" → "08/2027"
const fmtMonthYear = (iso) => String(iso || "").slice(0, 7).split("-").reverse().join("/");

// Bloco de planejamento da meta: tudo calculado pelo backend
function goalPlanHTML(g) {
  if (g.isCompleted) return "";
  const parts = [];

  if (g.deadline) {
    parts.push(
      `<div>Guarde <strong>${fmtBRL(g.requiredMonthly)}</strong> por mês <span class="muted">· faltam ${g.monthsLeft} ${g.monthsLeft === 1 ? "mês" : "meses"}</span></div>`
    );
    if (g.plannedMonthly && g.plannedMeetsDeadline === false && g.projectedDate)
      parts.push(
        `<div class="alert-banner alert-warning" style="margin-top:8px">Com ${fmtBRL(g.plannedMonthly)} por mês você chega só em ${fmtMonthYear(g.projectedDate)}, depois do prazo.</div>`
      );
  } else if (g.plannedMonthly && g.projectedDate) {
    parts.push(
      `<div>Guardando ${fmtBRL(g.plannedMonthly)} por mês, você bate a meta em <strong>${fmtMonthYear(g.projectedDate)}</strong>.</div>`
    );
  } else {
    parts.push(`<div class="muted">Quanto você consegue guardar por mês? Informe em editar para ver a previsão.</div>`);
  }

  if (g.scenarios && g.scenarios.length)
    parts.push(
      `<div class="muted" style="margin-top:8px;font-size:12px">${g.scenarios
        .map((s) => `<div>Em ${s.months} meses: ${fmtBRL(s.monthly)} por mês (conclui em ${fmtMonthYear(s.date)})</div>`)
        .join("")}</div>`
    );

  return `<div style="font-size:13px;margin-bottom:16px">${parts.join("")}</div>`;
}

function renderGoals(el) {
  let goals = [];

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
      goals = list;
      paintList(list);
    } catch (err) {
      listEl.innerHTML = "";
      toast.error(errorMessage(err, "Erro ao carregar metas"));
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
        const color = pct >= 100 ? "#15803d" : "#0f766e";
        return cardHTML(`<div class="card-body">
          <div class="goal-head">
            <div class="row">
              <span class="goal-icon">${esc(g.icon)}</span>
              <div>
                <div style="font-weight:600">${esc(g.name)}</div>
                ${g.deadline ? `<div class="muted" style="font-size:12px;margin-top:2px">até ${fmtDate(g.deadline)}</div>` : ""}
                ${GOAL_STATUS[g.status] ? `<span class="tag ${GOAL_STATUS[g.status].tag}">${GOAL_STATUS[g.status].label}</span>` : ""}
              </div>
            </div>
            <div class="td-actions">
              <button class="icon-btn" data-edit="${g.id}" aria-label="Editar">${icon("pencil", 14)}</button>
              <button class="icon-btn danger" data-del="${g.id}" aria-label="Remover">${icon("trash", 14)}</button>
            </div>
          </div>
          <div style="margin-bottom:12px">${progressHTML(pct, color)}</div>
          <div class="between muted font-mono" style="font-size:12px;margin-bottom:16px">
            <span>${fmtBRL(g.currentAmount)}</span>
            <span style="font-weight:700;color:${color}">${pct}%</span>
            <span>${fmtBRL(g.targetAmount)}</span>
          </div>
          ${goalPlanHTML(g)}
          ${g.status === "overdue" ? `<button class="btn btn-primary btn-full btn-sm" data-renew="${g.id}" style="margin-bottom:8px">Renovar prazo</button>` : ""}
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
        } catch (err) {
          toast.error(errorMessage(err, "Erro ao remover meta"));
        }
      })
    );
    const byId = (id) => goals.find((x) => String(x.id) === String(id));
    listEl.querySelectorAll("[data-edit]").forEach((b) =>
      b.addEventListener("click", () => openForm(byId(b.dataset.edit)))
    );
    listEl.querySelectorAll("[data-renew]").forEach((b) =>
      b.addEventListener("click", () => openForm(byId(b.dataset.renew), true))
    );
    listEl.querySelectorAll("[data-deposit]").forEach((b) =>
      b.addEventListener("click", () => openDeposit(b.dataset.deposit))
    );
  }

  function openForm(goal, focusDeadline = false) {
    const f = goal || { name: "", icon: GOAL_ICONS[0], targetAmount: "", deadline: null, plannedMonthly: null };
    let selectedIcon = f.icon;
    const icons = GOAL_ICONS.includes(f.icon) ? GOAL_ICONS : [f.icon, ...GOAL_ICONS];
    const { el: modal, close } = openModal(
      goal ? "Editar meta" : "Nova meta",
      `<div class="form">
        <div class="field"><label>Ícone</label>
          <div class="icon-picker">
            ${icons.map((ic) => `<button type="button" class="icon-option ${ic === f.icon ? "selected" : ""}" data-icon="${esc(ic)}">${esc(ic)}</button>`).join("")}
          </div>
        </div>
        <div class="field"><label>Nome</label><input name="name" value="${esc(f.name)}" placeholder="Ex: Viagem, Carro..." /></div>
        <div class="form-2">
          <div class="field"><label>Meta (R$)</label><input name="targetAmount" type="number" value="${esc(f.targetAmount)}" min="0" step="0.01" /></div>
          <div class="field"><label>Prazo (opcional)</label><input name="deadline" type="date" min="${today()}" value="${esc(f.deadline ? String(f.deadline).slice(0, 10) : "")}" /></div>
        </div>
        <div class="field"><label>Quanto pretende guardar por mês (opcional)</label>
          <input name="plannedMonthly" type="number" value="${esc(f.plannedMonthly)}" min="0" step="0.01" placeholder="0,00" />
        </div>
        <div class="form-actions">
          <button class="btn btn-primary btn-block" id="save">${goal ? "Salvar" : "Criar meta"}</button>
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

    if (focusDeadline) {
      const d = modal.querySelector('[name="deadline"]');
      d.value = "";
      d.focus();
    }

    const val = (name) => modal.querySelector(`[name="${name}"]`).value;
    modal.querySelector("#save").addEventListener("click", async () => {
      if (!val("name") || !val("targetAmount")) return toast.error("Preencha nome e valor");
      if (focusDeadline && !val("deadline")) return toast.error("Informe o novo prazo");
      const payload = {
        name: val("name"),
        icon: selectedIcon,
        targetAmount: parseFloat(val("targetAmount")),
        deadline: val("deadline") || null,
        plannedMonthly: val("plannedMonthly") ? parseFloat(val("plannedMonthly")) : null,
      };
      try {
        if (goal) await api.put(`/goals/${goal.id}`, payload);
        else await api.post("/goals", payload);
        toast.success(goal ? "Meta atualizada!" : "Meta criada!");
        close();
        load();
      } catch (err) {
        toast.error(errorMessage(err, "Erro ao salvar"));
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
      } catch (err) {
        toast.error(errorMessage(err, "Erro ao depositar"));
      }
    });
  }

  el.querySelector("#add").addEventListener("click", () => openForm(null));
  load();
}
