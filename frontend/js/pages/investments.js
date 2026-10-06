// Investimentos: aportes do mês, sempre vinculados a um item do patrimônio

function renderInvestments(el) {
  const state = currentMonth();
  let assets = [];

  el.innerHTML = `
    <div class="stack">
      <div class="page-header">
        <div id="month"></div>
        <button class="btn btn-primary" id="add">${icon("plus", 15)} Adicionar</button>
      </div>
      <div class="pill row" style="display:inline-flex;align-self:flex-start;gap:24px">
        <div><span class="muted">Total aportado: </span><span class="value" id="total" style="color:#0f766e">${fmtBRL(0)}</span></div>
        <div><span class="muted">Aportes: </span><span class="value" id="count">0</span></div>
      </div>
      <div id="notice"></div>
      <div id="list"></div>
    </div>`;

  const listEl = el.querySelector("#list");

  async function load() {
    listEl.innerHTML = spinnerHTML();
    try {
      const [list, items] = await Promise.all([
        api.get("/investments", { year: state.year, month: state.month }),
        api.get("/assets"),
      ]);
      if (!el.isConnected) return;
      assets = items;
      paintNotice(list);
      paintList(list);
    } catch (err) {
      listEl.innerHTML = "";
      toast.error(errorMessage(err, "Erro ao carregar"));
    }
  }

  // Aviso único para quem tem aportes antigos sem item
  function paintNotice(list) {
    const box = el.querySelector("#notice");
    let seen = false;
    try {
      seen = localStorage.getItem("assetLinkNoticeSeen") === "1";
    } catch {
      // sem storage: mostra o aviso
    }
    if (seen || !list.some((i) => !i.assetId)) {
      box.innerHTML = "";
      return;
    }
    box.innerHTML = `<div class="alert-banner alert-info">
      <span class="msg">Vincule seus investimentos antigos a um item do patrimônio (edite o aporte). Se for um valor que você já tinha, marque “já era patrimônio” para ele não descontar do saldo livre.</span>
      <button class="btn btn-ghost btn-sm" id="dismiss-notice">Entendi</button>
    </div>`;
    box.querySelector("#dismiss-notice").addEventListener("click", () => {
      try {
        localStorage.setItem("assetLinkNoticeSeen", "1");
      } catch {
        // ignora
      }
      box.innerHTML = "";
    });
  }

  function paintList(list) {
    el.querySelector("#total").textContent = fmtBRL(list.filter((i) => !i.isExistingBalance).reduce((s, i) => s + i.amount, 0));
    el.querySelector("#count").textContent = list.length;

    if (!list.length) {
      listEl.innerHTML = emptyHTML("📈", "Nenhum investimento cadastrado");
      return;
    }

    listEl.innerHTML = `<div class="grid grid-3">${list
      .map((i) => {
        const color = "#0f766e";
        return cardHTML(
          `<div class="card-body">
            <div class="between" style="align-items:flex-start;margin-bottom:12px">
              <div>
                <div style="font-weight:500">${esc(i.name)}</div>
                <div class="muted" style="font-size:12px;margin-top:2px">${esc(i.type)}${i.assetName ? ` · ${esc(i.assetName)}` : ""}</div>
                ${i.isExistingBalance ? '<span class="tag tag-blue">Patrimônio existente</span>' : ""}
              </div>
              <div class="td-actions">
                <button class="icon-btn" data-edit="${i.id}" aria-label="Editar">${icon("pencil", 14)}</button>
                <button class="icon-btn danger" data-del="${i.id}" aria-label="Remover">${icon("trash", 14)}</button>
              </div>
            </div>
            <div class="font-mono" style="font-size:20px;color:${color}">${fmtBRL(i.amount)}</div>
            <div style="font-size:12px;color:var(--gray-600);margin-top:4px">${fmtDate(i.date)}</div>
          </div>`,
          { accent: color }
        );
      })
      .join("")}</div>`;

    listEl.querySelectorAll("[data-edit]").forEach((b) =>
      b.addEventListener("click", () => openForm(list.find((x) => String(x.id) === b.dataset.edit)))
    );
    listEl.querySelectorAll("[data-del]").forEach((b) =>
      b.addEventListener("click", async () => {
        if (!confirm("Remover?")) return;
        try {
          await api.delete(`/investments/${b.dataset.del}`);
          toast.success("Removido!");
          load();
        } catch (err) {
          toast.error(errorMessage(err, "Erro ao remover"));
        }
      })
    );
  }

  function openForm(inv) {
    const active = assets.filter((a) => !a.isArchived);
    if (!active.length) {
      const { el: m, close } = openModal(
        "Novo investimento",
        `<div class="form">
          <p class="muted" style="margin:0">Para investir, primeiro crie um item na aba Patrimônio (por exemplo, “CDB Nubank”).</p>
          <div class="form-actions">
            <button class="btn btn-primary btn-block" id="go">Ir para Patrimônio</button>
            <button class="btn btn-ghost" data-close>Cancelar</button>
          </div>
        </div>`
      );
      m.querySelector("#go").addEventListener("click", () => {
        close();
        navigate("/patrimonio");
      });
      return;
    }

    const f = inv || { name: "", amount: "", date: today(), assetId: "", isExistingBalance: false };
    const { el: modal, close } = openModal(
      inv ? "Editar investimento" : "Novo investimento",
      `<div class="form">
        <div class="field"><label>Para qual item do patrimônio?</label>
          <select name="assetId"><option value="">Selecione...</option>${active
            .map((a) => `<option value="${a.id}" ${a.id === f.assetId ? "selected" : ""}>${esc(a.name)} (${esc(a.type)})</option>`)
            .join("")}</select>
        </div>
        <div class="field"><label>Descrição</label><input name="name" value="${esc(f.name)}" placeholder="Ex: Aporte mensal" /></div>
        <div class="form-2">
          <div class="field"><label>Valor (R$)</label><input name="amount" type="number" min="0" step="0.01" value="${esc(f.amount)}" /></div>
          <div class="field"><label>Data</label><input name="date" type="date" value="${esc(String(f.date).slice(0, 10))}" /></div>
        </div>
        <label class="check"><input name="isExistingBalance" type="checkbox" ${f.isExistingBalance ? "checked" : ""} /> Já era patrimônio existente (não desconta do saldo livre)</label>
        <div class="form-actions">
          <button class="btn btn-primary btn-block" id="save">Salvar</button>
          <button class="btn btn-ghost" data-close>Cancelar</button>
        </div>
      </div>`
    );

    const val = (name) => modal.querySelector(`[name="${name}"]`);
    modal.querySelector("#save").addEventListener("click", async () => {
      const btn = modal.querySelector("#save");
      const asset = active.find((a) => String(a.id) === val("assetId").value);
      if (!asset || !val("name").value.trim() || !val("amount").value || !val("date").value)
        return toast.error("Preencha todos os campos");

      const payload = {
        name: val("name").value.trim(),
        type: asset.type, // o backend usa o tipo do item
        amount: parseFloat(val("amount").value),
        date: val("date").value,
        assetId: asset.id,
        isExistingBalance: val("isExistingBalance").checked,
      };
      btn.disabled = true;
      try {
        if (inv) await api.put(`/investments/${inv.id}`, payload);
        else await api.post("/investments", payload);
        toast.success(inv ? "Investimento atualizado!" : "Investimento adicionado!");
        close();
        load();
      } catch (err) {
        toast.error(errorMessage(err, "Erro ao salvar"));
        btn.disabled = false;
      }
    });
  }

  el.querySelector("#add").addEventListener("click", () => openForm(null));
  mountMonthNav(el.querySelector("#month"), state, load);
  load();
}
