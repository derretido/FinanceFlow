// Receitas: lista do mês, filtro por categoria e cadastro/edição

function renderIncomes(el) {
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
        <div class="pill"><span class="muted">Total: </span><span class="value" id="total" style="color:#15803d">${fmtBRL(0)}</span></div>
        <div class="pill"><span class="muted">Lançamentos: </span><span class="value" id="count">0</span></div>
      </div>
      <div class="card" id="table"></div>
    </div>`;

  const table = el.querySelector("#table");
  const filter = el.querySelector("#cat-filter");

  const categoryOptions = (selected) =>
    categories.map((c) => `<option value="${esc(c)}" ${c === selected ? "selected" : ""}>${esc(c)}</option>`).join("");

  async function load() {
    table.innerHTML = spinnerHTML();
    try {
      const [incomes, cats] = await Promise.all([
        api.get("/incomes", { year: state.year, month: state.month, category: catFilter || undefined }),
        api.get("/incomes/categories"),
      ]);
      if (!el.isConnected) return;
      categories = cats;
      filter.innerHTML = `<option value="">Todas categorias</option>${categoryOptions(catFilter)}`;
      paintTable(incomes);
    } catch (err) {
      table.innerHTML = "";
      toast.error(errorMessage(err, "Erro ao carregar receitas"));
    }
  }

  function paintTable(incomes) {
    const total = incomes.reduce((s, e) => s + e.amount, 0);
    el.querySelector("#total").textContent = fmtBRL(total);
    el.querySelector("#count").textContent = incomes.length;

    if (!incomes.length) {
      table.innerHTML = emptyHTML("📭", "Nenhuma receita lançada ainda");
      return;
    }

    table.innerHTML = `<div class="table-wrap"><table>
      <thead><tr>
        <th>Descrição</th><th>Categoria</th><th>Valor</th><th>Data</th><th></th>
      </tr></thead>
      <tbody>
        ${incomes
          .map(
            (e, i) => `<tr>
              <td style="font-weight:500">${esc(e.description)}</td>
              <td><span class="tag tag-blue">${esc(e.category)}</span></td>
              <td class="font-mono" style="color:#15803d">${fmtBRL(e.amount)}</td>
              <td class="font-mono muted" style="font-size:12px">${fmtDate(e.date)}</td>
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
      b.addEventListener("click", () => openForm(incomes[b.dataset.edit]))
    );
    table.querySelectorAll("[data-del]").forEach((b) =>
      b.addEventListener("click", async () => {
        if (!confirm("Remover esta receita?")) return;
        try {
          await api.delete(`/incomes/${b.dataset.del}`);
          toast.success("Removida!");
          load();
        } catch (err) {
          toast.error(errorMessage(err, "Erro ao remover receita"));
        }
      })
    );
  }

  function openForm(income) {
    const f = income || { description: "", amount: "", date: today(), category: "" };
    const { el: modal, close } = openModal(
      income ? "Editar receita" : "Nova receita",
      `<div class="form">
        <div class="field"><label>Descrição</label><input name="description" value="${esc(f.description)}" placeholder="Ex: Projeto freela, 13º..." /></div>
        <div class="form-2">
          <div class="field"><label>Valor (R$)</label><input name="amount" type="number" value="${esc(f.amount)}" placeholder="0,00" min="0" step="0.01" /></div>
          <div class="field"><label>Data</label><input name="date" type="date" value="${esc(String(f.date).slice(0, 10))}" /></div>
        </div>
        <div class="field"><label>Categoria</label>
          <select name="category"><option value="">Selecione...</option>${categoryOptions(f.category)}</select>
        </div>
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
        category: val("category").value,
      };
      if (!payload.description || !payload.amount || !payload.date || !payload.category)
        return toast.error("Preencha todos os campos");

      payload.amount = parseFloat(payload.amount);
      try {
        if (income) await api.put(`/incomes/${income.id}`, payload);
        else await api.post("/incomes", payload);
        toast.success(income ? "Receita atualizada!" : "Receita adicionada!");
        close();
        load();
      } catch (err) {
        toast.error(errorMessage(err, "Erro ao salvar receita"));
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
