// Gastos: lista do mês, filtro por categoria e cadastro/edição

function renderExpenses(el) {
  const state = currentMonth();
  let categories = [];
  let catFilter = "";
  let paidFilter = "all";
  let expenses = [];

  el.innerHTML = `
    <div class="stack">
      <div class="page-header">
        <div id="month"></div>
        <div class="row">
          <select id="paid-filter" style="width:130px">
            <option value="all">Todos</option><option value="paid">Pagos</option><option value="pending">Pendentes</option>
          </select>
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
      const [list, cats] = await Promise.all([
        api.get("/expenses", { year: state.year, month: state.month, categoryId: catFilter || undefined }),
        api.get("/categories"),
      ]);
      if (!el.isConnected) return;
      categories = cats;
      filter.innerHTML = `<option value="">Todas categorias</option>${categoryOptions(catFilter)}`;
      expenses = list;
      paintTable();
    } catch (err) {
      table.innerHTML = "";
      toast.error(errorMessage(err, "Erro ao carregar gastos"));
    }
  }

  function paintTable() {
    const visible = expenses.filter((e) =>
      paidFilter === "paid" ? e.isPaid : paidFilter === "pending" ? !e.isPaid : true
    );
    const total = visible.reduce((s, e) => s + e.amount, 0);
    el.querySelector("#total").textContent = fmtBRL(total);
    el.querySelector("#count").textContent = visible.length;

    if (!visible.length) {
      table.innerHTML = emptyHTML("📭", "Nenhum gasto lançado ainda");
      return;
    }

    table.innerHTML = `<div class="table-wrap"><table>
      <thead><tr>
        <th>Pago</th><th>Descrição</th><th>Categoria</th><th>Valor</th><th>Data</th><th>Recorrente</th><th></th>
      </tr></thead>
      <tbody>
        ${visible
          .map(
            (e) => `<tr>
              <td>${paidCellHTML(e)}</td>
              <td style="font-weight:500">${e.creditCardId ? icon("creditCard", 13) + " " : ""}${esc(e.description)}${installmentLabel(e)}</td>
              <td>${badgeHTML(`${e.category.icon} ${e.category.name}`, e.category.color)}</td>
              <td class="font-mono" style="color:#dc2626">${fmtBRL(e.amount)}</td>
              <td class="font-mono muted" style="font-size:12px">${fmtDate(e.date)}</td>
              <td>${e.isRecurring ? '<span class="tag tag-blue">Fixo</span>' : ""}</td>
              <td><div class="td-actions">
                <button class="icon-btn" data-edit="${e.id}" aria-label="Editar">${icon("pencil", 13)}</button>
                <button class="icon-btn danger" data-del="${e.id}" aria-label="Remover">${icon("trash", 13)}</button>
              </div></td>
            </tr>`
          )
          .join("")}
      </tbody>
    </table></div>`;

    table.querySelectorAll("[data-edit]").forEach((b) =>
      b.addEventListener("click", () => openForm(expenses.find((x) => String(x.id) === b.dataset.edit)))
    );
    table.querySelectorAll("[data-pay]").forEach((c) =>
      c.addEventListener("change", async () => {
        const e = expenses.find((x) => String(x.id) === c.dataset.pay);
        // Gasto fixo: o pagamento é do mês exibido
        const params = e.isRecurring ? `?year=${state.year}&month=${state.month}` : "";
        try {
          if (c.checked) await api.post(`/expenses/${e.id}/pay${params}`);
          else await api.delete(`/expenses/${e.id}/pay${params}`);
          load();
        } catch (err) {
          c.checked = !c.checked;
          toast.error(errorMessage(err, "Erro ao atualizar pagamento"));
        }
      })
    );
    table.querySelectorAll("[data-del]").forEach((b) =>
      b.addEventListener("click", async () => {
        if (!confirm("Remover este gasto?")) return;
        try {
          await api.delete(`/expenses/${b.dataset.del}`);
          toast.success("Removido!");
          load();
        } catch (err) {
          toast.error(errorMessage(err, "Erro ao remover gasto"));
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
        ${expense ? "" : '<label class="check" id="paid-wrap"><input name="isPaid" type="checkbox" /> Já está pago</label>'}
        <div class="form-actions">
          <button class="btn btn-primary btn-block" id="save">Salvar</button>
          <button class="btn btn-ghost" data-close>Cancelar</button>
        </div>
      </div>`
    );

    const val = (name) => modal.querySelector(`[name="${name}"]`);
    const paidWrap = modal.querySelector("#paid-wrap");
    const syncPaid = () => {
      if (paidWrap) paidWrap.hidden = val("isRecurring").checked;
    };
    val("isRecurring").addEventListener("change", syncPaid);
    syncPaid();
    modal.querySelector("#save").addEventListener("click", async () => {
      const payload = {
        description: val("description").value,
        amount: val("amount").value,
        date: val("date").value,
        categoryId: val("categoryId").value,
        isRecurring: val("isRecurring").checked,
      };
      if (!expense) payload.isPaid = !payload.isRecurring && val("isPaid").checked;
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
      } catch (err) {
        toast.error(errorMessage(err, "Erro ao salvar gasto"));
      }
    });
  }

  el.querySelector("#paid-filter").addEventListener("change", (ev) => {
    paidFilter = ev.target.value;
    paintTable();
  });
  filter.addEventListener("change", () => {
    catFilter = filter.value;
    load();
  });
  el.querySelector("#add").addEventListener("click", () => openForm(null));
  mountMonthNav(el.querySelector("#month"), state, load);
  load();
}

// Indicador de pago/pendente; compras no cartão só mostram o estado da fatura
function paidCellHTML(e) {
  const when = e.isPaid && e.paidAt ? `<div class="muted" style="font-size:11px">Pago em ${fmtDate(e.paidAt).slice(0, 5)}</div>` : "";
  if (e.creditCardId)
    return `<input type="checkbox" disabled ${e.isPaid ? "checked" : ""} title="Pago pela fatura do cartão" aria-label="Pago pela fatura do cartão" />
      <div class="muted" style="font-size:11px">Pago pela fatura do cartão</div>`;
  return `<input type="checkbox" data-pay="${e.id}" ${e.isPaid ? "checked" : ""} aria-label="Marcar como pago" />${when}`;
}
