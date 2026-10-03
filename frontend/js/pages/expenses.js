// Gastos: lista do mês, filtro por categoria e cadastro/edição

function renderExpenses(el) {
  const state = currentMonth();
  let categories = [];
  let catFilter = "";

  el.innerHTML = `
    <div class="stack">
      <div class="page-header">
        <div id="month"></div>
        <div class="row">
          <select id="cat-filter" style="width:176px"><option value="">Todas categorias</option></select>
          <button class="btn btn-primary" id="add">${icon("plus", 15)} Adicionar</button>
        </div>
      </div>
      <div class="row" style="gap:16px">
        <div class="pill"><span class="muted">Total: </span><span class="value" id="total" style="color:#dc2626">${fmtBRL(0)}</span></div>
        <div class="pill"><span class="muted">Lançamentos: </span><span class="value" id="count">0</span></div>
      </div>
      <div class="card" id="table"></div>
    </div>`;

  const table = el.querySelector("#table");
  const filter = el.querySelector("#cat-filter");

  const categoryOptions = (selected) =>
    categories
      .map((c) => `<option value="${c.id}" ${String(c.id) === String(selected) ? "selected" : ""}>${esc(c.icon)} ${esc(c.name)}</option>`)
      .join("");

  async function load() {
    table.innerHTML = spinnerHTML();
    try {
      const [expenses, cats] = await Promise.all([
        api.get("/expenses", { year: state.year, month: state.month, categoryId: catFilter || undefined }),
        api.get("/categories"),
      ]);
      if (!el.isConnected) return;
      categories = cats;
      filter.innerHTML = `<option value="">Todas categorias</option>${categoryOptions(catFilter)}`;
      paintTable(expenses);
    } catch {
      table.innerHTML = "";
      toast.error("Erro ao carregar gastos");
    }
  }

  function paintTable(expenses) {
    const total = expenses.reduce((s, e) => s + e.amount, 0);
    el.querySelector("#total").textContent = fmtBRL(total);
    el.querySelector("#count").textContent = expenses.length;

    if (!expenses.length) {
      table.innerHTML = emptyHTML("📭", "Nenhum gasto lançado ainda");
      return;
    }

    table.innerHTML = `<div class="table-wrap"><table>
      <thead><tr>
        <th>Descrição</th><th>Categoria</th><th>Valor</th><th>Data</th><th>Recorrente</th><th></th>
      </tr></thead>
      <tbody>
        ${expenses
          .map(
            (e, i) => `<tr>
              <td style="font-weight:500">${esc(e.description)}</td>
              <td>${badgeHTML(`${e.category.icon} ${e.category.name}`, e.category.color)}</td>
              <td class="font-mono" style="color:#dc2626">${fmtBRL(e.amount)}</td>
              <td class="font-mono muted" style="font-size:12px">${fmtDate(e.date)}</td>
              <td>${e.isRecurring ? '<span class="tag tag-blue">Fixo</span>' : ""}</td>
              <td><div class="td-actions">
                <button class="icon-btn" data-edit="${i}" aria-label="Editar">${icon("pencil", 13)}</button>
                <button class="icon-btn danger" data-del="${e.id}" aria-label="Remover">${icon("trash", 13)}</button>
              </div></td>
            </tr>`
          )
          .join("")}
      </tbody>
    </table></div>`;

    table.querySelectorAll("[data-edit]").forEach((b) =>
      b.addEventListener("click", () => openForm(expenses[b.dataset.edit]))
    );
    table.querySelectorAll("[data-del]").forEach((b) =>
      b.addEventListener("click", async () => {
        if (!confirm("Remover este gasto?")) return;
        try {
          await api.delete(`/expenses/${b.dataset.del}`);
          toast.success("Removido!");
          load();
        } catch {
          toast.error("Erro ao remover gasto");
        }
      })
    );
  }

  function openForm(expense) {
    const f = expense || { description: "", amount: "", date: today(), category: {}, isRecurring: false };
    const { el: modal, close } = openModal(
      expense ? "Editar gasto" : "Novo gasto",
      `<div class="form">
        <div class="field"><label>Descrição</label><input name="description" value="${esc(f.description)}" placeholder="Ex: Aluguel, Mercado..." /></div>
        <div class="form-2">
          <div class="field"><label>Valor (R$)</label><input name="amount" type="number" value="${esc(f.amount)}" placeholder="0,00" min="0" step="0.01" /></div>
          <div class="field"><label>Data</label><input name="date" type="date" value="${esc(String(f.date).slice(0, 10))}" /></div>
        </div>
        <div class="field"><label>Categoria</label>
          <select name="categoryId"><option value="">Selecione...</option>${categoryOptions(f.category.id)}</select>
        </div>
        <label class="check"><input name="isRecurring" type="checkbox" ${f.isRecurring ? "checked" : ""} /> Gasto recorrente (mensal)</label>
        <div class="form-actions">
          <button class="btn btn-primary btn-block" id="save">Salvar</button>
          <button class="btn btn-ghost" data-close>Cancelar</button>
        </div>
      </div>`
    );

    const val = (name) => modal.querySelector(`[name="${name}"]`);
    modal.querySelector("#save").addEventListener("click", async () => {
      const payload = {
        description: val("description").value,
        amount: val("amount").value,
        date: val("date").value,
        categoryId: val("categoryId").value,
        isRecurring: val("isRecurring").checked,
      };
      if (!payload.description || !payload.amount || !payload.date || !payload.categoryId)
        return toast.error("Preencha todos os campos");

      payload.amount = parseFloat(payload.amount);
      payload.categoryId = parseInt(payload.categoryId);
      try {
        if (expense) await api.put(`/expenses/${expense.id}`, payload);
        else await api.post("/expenses", payload);
        toast.success(expense ? "Gasto atualizado!" : "Gasto adicionado!");
        close();
        load();
      } catch {
        toast.error("Erro ao salvar gasto");
      }
    });
  }

  filter.addEventListener("change", () => {
    catFilter = filter.value;
    load();
  });
  el.querySelector("#add").addEventListener("click", () => openForm(null));
  mountMonthNav(el.querySelector("#month"), state, load);
  load();
}
