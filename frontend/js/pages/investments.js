// Investimentos: aportes do mês

const INVESTMENT_TYPES = {
  "Renda Fixa": "#4ade80",
  "Renda Variável": "#60a5fa",
  Criptomoeda: "#fbbf24",
  "Fundo Imobiliário": "#a78bfa",
  Poupança: "#34d399",
  Outros: "#94a3b8",
};

function renderInvestments(el) {
  const state = currentMonth();

  el.innerHTML = `
    <div class="stack">
      <div class="page-header">
        <div id="month"></div>
        <button class="btn btn-primary" id="add">${icon("plus", 15)} Adicionar</button>
      </div>
      <div class="pill row" style="display:inline-flex;align-self:flex-start;gap:24px">
        <div><span class="muted">Total aportado: </span><span class="value" id="total" style="color:#c084fc">${fmtBRL(0)}</span></div>
        <div><span class="muted">Aportes: </span><span class="value" id="count">0</span></div>
      </div>
      <div id="list"></div>
    </div>`;

  const listEl = el.querySelector("#list");

  async function load() {
    listEl.innerHTML = spinnerHTML();
    try {
      const list = await api.get("/investments", { year: state.year, month: state.month });
      if (!el.isConnected) return;
      paintList(list);
    } catch {
      listEl.innerHTML = "";
      toast.error("Erro ao carregar");
    }
  }

  function paintList(list) {
    el.querySelector("#total").textContent = fmtBRL(list.reduce((s, i) => s + i.amount, 0));
    el.querySelector("#count").textContent = list.length;

    if (!list.length) {
      listEl.innerHTML = emptyHTML("📈", "Nenhum investimento cadastrado");
      return;
    }

    listEl.innerHTML = `<div class="grid grid-3">${list
      .map((i) => {
        const color = INVESTMENT_TYPES[i.type] || "#888";
        return cardHTML(
          `<div class="card-body">
            <div class="between" style="align-items:flex-start;margin-bottom:12px">
              <div>
                <div style="font-weight:500">${esc(i.name)}</div>
                <div class="muted" style="font-size:12px;margin-top:2px">${esc(i.type)}</div>
              </div>
              <button class="icon-btn danger" data-del="${i.id}" aria-label="Remover">${icon("trash", 14)}</button>
            </div>
            <div class="font-mono" style="font-size:20px;color:${color}">${fmtBRL(i.amount)}</div>
            <div style="font-size:12px;color:var(--gray-600);margin-top:4px">${fmtDate(i.date)}</div>
          </div>`,
          { accent: color }
        );
      })
      .join("")}</div>`;

    listEl.querySelectorAll("[data-del]").forEach((b) =>
      b.addEventListener("click", async () => {
        if (!confirm("Remover?")) return;
        try {
          await api.delete(`/investments/${b.dataset.del}`);
          toast.success("Removido!");
          load();
        } catch {
          toast.error("Erro ao remover");
        }
      })
    );
  }

  function openForm() {
    const { el: modal, close } = openModal(
      "Novo investimento",
      `<div class="form">
        <div class="field"><label>Nome</label><input name="name" placeholder="Tesouro Direto, CDB..." /></div>
        <div class="field"><label>Tipo</label>
          <select name="type">${Object.keys(INVESTMENT_TYPES).map((t) => `<option>${t}</option>`).join("")}</select>
        </div>
        <div class="form-2">
          <div class="field"><label>Valor (R$)</label><input name="amount" type="number" /></div>
          <div class="field"><label>Data</label><input name="date" type="date" value="${today()}" /></div>
        </div>
        <div class="form-actions">
          <button class="btn btn-primary btn-block" id="save">Salvar</button>
          <button class="btn btn-ghost" data-close>Cancelar</button>
        </div>
      </div>`
    );

    const val = (name) => modal.querySelector(`[name="${name}"]`).value;
    modal.querySelector("#save").addEventListener("click", async () => {
      if (!val("name") || !val("amount")) return toast.error("Preencha todos os campos");
      try {
        await api.post("/investments", {
          name: val("name"),
          type: val("type"),
          amount: parseFloat(val("amount")),
          date: val("date"),
        });
        toast.success("Investimento adicionado!");
        close();
        load();
      } catch {
        toast.error("Erro ao salvar");
      }
    });
  }

  el.querySelector("#add").addEventListener("click", openForm);
  mountMonthNav(el.querySelector("#month"), state, load);
  load();
}
