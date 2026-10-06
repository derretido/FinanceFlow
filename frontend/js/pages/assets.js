// Patrimônio: investimentos e bens que perdem valor

const ASSET_KINDS = {
  investment: "Investimento",
  depreciable: "Bem que perde valor",
};

function renderAssets(el) {
  const state = currentMonth();
  let showArchived = false;

  el.innerHTML = `
    <div class="stack">
      <div class="page-header">
        <h1 class="page-title">Patrimônio</h1>
        <div class="row">
          <label class="check"><input type="checkbox" id="archived" /> Mostrar arquivados</label>
          <button class="btn btn-primary" id="add">${icon("plus", 15)} Novo item</button>
        </div>
      </div>
      <div id="body"></div>
    </div>`;

  const body = el.querySelector("#body");

  async function load() {
    body.innerHTML = spinnerHTML();
    try {
      const [summary, assets] = await Promise.all([
        api.get("/investments/summary", { year: state.year, month: state.month }),
        api.get("/assets", { includeArchived: showArchived }),
      ]);
      if (!el.isConnected) return;
      paint(summary, assets);
    } catch (err) {
      body.innerHTML = "";
      toast.error(errorMessage(err, "Erro ao carregar patrimônio"));
    }
  }

  function assetCardHTML(a) {
    const sub = `Inicial ${fmtBRL(a.initialValue)} + aportes ${fmtBRL(a.contributions)}`;
    let deprec = "";
    if (a.kind === "depreciable" && a.annualDepreciationPercent) {
      const p = a.annualDepreciationPercent;
      deprec = p > 0 ? `Perde ${p}% ao ano` : `Valoriza ${Math.abs(p)}% ao ano`;
    }
    return cardHTML(
      `<div class="card-body" ${a.isArchived ? 'style="opacity:.6"' : ""}>
        <div class="between" style="align-items:flex-start;margin-bottom:12px">
          <div>
            <div style="font-weight:500">${esc(a.name)} ${a.isArchived ? '<span class="tag tag-blue">Arquivado</span>' : ""}</div>
            <div class="muted" style="font-size:12px;margin-top:2px">${esc(a.type)}</div>
          </div>
          <div class="td-actions">
            <button class="icon-btn" data-edit="${a.id}" aria-label="Editar">${icon("pencil", 14)}</button>
            <button class="icon-btn danger" data-del="${a.id}" aria-label="Remover">${icon("trash", 14)}</button>
          </div>
        </div>
        <div class="font-mono" style="font-size:20px;color:#0f766e">${fmtBRL(a.currentValue)}</div>
        <div class="muted" style="font-size:12px;margin-top:4px">${esc(sub)}</div>
        ${deprec ? `<div class="muted" style="font-size:12px;margin-top:2px">${esc(deprec)}</div>` : ""}
      </div>`,
      { accent: a.kind === "investment" ? "#15803d" : "#d97706" }
    );
  }

  function paint(summary, assets) {
    const section = (title, list) =>
      list.length
        ? `<div class="stack" style="gap:12px"><div class="label">${title}</div><div class="grid grid-3">${list.map(assetCardHTML).join("")}</div></div>`
        : "";
    const investments = assets.filter((a) => a.kind === "investment");
    const goods = assets.filter((a) => a.kind === "depreciable");
    const byType = summary.byType || [];

    body.innerHTML = `<div class="stack">
      <div class="grid grid-3">
        ${statCardHTML({ label: "Patrimônio total", value: fmtBRL(summary.totalPatrimony), sub: "investimentos + bens", icon: "🏛️", accent: "#15803d" })}
        ${statCardHTML({ label: "Investido", value: fmtBRL(summary.totalInvested), sub: "valor atual", icon: "💎", accent: "#0f766e" })}
        ${statCardHTML({ label: "Bens", value: fmtBRL(summary.totalDepreciable), sub: "valor atual", icon: "🚗", accent: "#d97706" })}
      </div>
      ${
        byType.length
          ? cardHTML(`<div class="card-body">
              <div class="label card-title">Patrimônio por tipo</div>
              <div class="pie-wrap"><div id="pie-chart"></div><div class="pie-list">${byType
                .map(
                  (t, i) => `<div class="pie-list-row">
                    <span class="name"><span class="dot" style="background:${CATEGORY_COLORS[i % CATEGORY_COLORS.length]}"></span>${esc(t.type)}</span>
                    <span class="val">${fmtBRL(t.total)}</span>
                  </div>`
                )
                .join("")}</div></div>
            </div>`)
          : ""
      }
      ${
        assets.length
          ? section("Investimentos", investments) + section("Bens", goods)
          : emptyHTML("🏛️", "Nenhum item cadastrado. Crie o primeiro em “Novo item”.")
      }
    </div>`;

    if (byType.length)
      donutChart(
        body.querySelector("#pie-chart"),
        byType.map((t, i) => ({ name: t.type, value: t.total, color: CATEGORY_COLORS[i % CATEGORY_COLORS.length] }))
      );

    body.querySelectorAll("[data-edit]").forEach((b) =>
      b.addEventListener("click", () => openForm(assets.find((x) => String(x.id) === b.dataset.edit)))
    );
    body.querySelectorAll("[data-del]").forEach((b) =>
      b.addEventListener("click", async () => {
        if (!confirm("Remover este item?")) return;
        try {
          const res = await api.delete(`/assets/${b.dataset.del}`);
          toast.success(res && res.archived ? "Item arquivado, pois possui aportes." : "Removido!");
          load();
        } catch (err) {
          toast.error(errorMessage(err, "Erro ao remover item"));
        }
      })
    );
  }

  async function openForm(asset) {
    let types;
    try {
      types = await api.get("/assets/types");
    } catch (err) {
      return toast.error(errorMessage(err, "Erro ao carregar tipos"));
    }

    const f = asset || { name: "", kind: "investment", type: "", initialValue: "", acquisitionDate: today(), annualDepreciationPercent: "" };
    const typeOptions = (kind, selected) =>
      (types[kind] || []).map((t) => `<option ${t === selected ? "selected" : ""}>${esc(t)}</option>`).join("");

    const { el: modal, close } = openModal(
      asset ? "Editar item" : "Novo item",
      `<div class="form">
        <div class="field"><label>O que é?</label>
          <select name="kind" ${asset ? "disabled" : ""}>
            ${Object.entries(ASSET_KINDS).map(([k, l]) => `<option value="${k}" ${k === f.kind ? "selected" : ""}>${l}</option>`).join("")}
          </select>
        </div>
        <div class="field"><label>Nome</label><input name="name" value="${esc(f.name)}" maxlength="100" placeholder="Ex: CDB Banco Inter, Honda Civic" /></div>
        <div class="field"><label>Tipo</label><select name="type">${typeOptions(f.kind, f.type)}</select></div>
        <div class="form-2">
          <div class="field"><label>Valor inicial (R$)</label>
            <input name="initialValue" type="number" min="0" step="0.01" value="${esc(f.initialValue)}" placeholder="0,00" />
            <span class="muted" style="font-size:12px">Quanto você já tem nele hoje. Esse valor não sai do seu saldo livre.</span>
          </div>
          <div class="field"><label>Data de aquisição</label><input name="acquisitionDate" type="date" value="${esc(String(f.acquisitionDate).slice(0, 10))}" /></div>
        </div>
        <div class="field" id="deprec-wrap">
          <label>Depreciação ao ano (%) — opcional</label>
          <input name="annualDepreciationPercent" type="number" min="-100" max="100" step="0.01" value="${esc(f.annualDepreciationPercent)}" />
          <span class="muted" style="font-size:12px">Use valor negativo se o bem valoriza.</span>
        </div>
        ${asset ? `<label class="check"><input name="isArchived" type="checkbox" ${f.isArchived ? "checked" : ""} /> Item arquivado</label>` : ""}
        <div class="form-actions">
          <button class="btn btn-primary btn-block" id="save">Salvar</button>
          <button class="btn btn-ghost" data-close>Cancelar</button>
        </div>
      </div>`
    );

    const val = (name) => modal.querySelector(`[name="${name}"]`);
    const sync = () => {
      modal.querySelector("#deprec-wrap").hidden = val("kind").value !== "depreciable";
    };
    val("kind").addEventListener("change", () => {
      val("type").innerHTML = typeOptions(val("kind").value, "");
      sync();
    });
    sync();

    modal.querySelector("#save").addEventListener("click", async () => {
      const btn = modal.querySelector("#save");
      const kind = val("kind").value;
      const payload = {
        name: val("name").value.trim(),
        type: val("type").value,
        initialValue: parseFloat(val("initialValue").value),
        acquisitionDate: val("acquisitionDate").value,
        annualDepreciationPercent:
          kind === "depreciable" && val("annualDepreciationPercent").value !== ""
            ? parseFloat(val("annualDepreciationPercent").value)
            : null,
      };
      if (!payload.name || isNaN(payload.initialValue) || !payload.acquisitionDate)
        return toast.error("Preencha todos os campos");

      btn.disabled = true;
      try {
        if (asset) await api.put(`/assets/${asset.id}`, { ...payload, isArchived: val("isArchived").checked });
        else await api.post("/assets", { ...payload, kind });
        toast.success(asset ? "Item atualizado!" : "Item criado!");
        close();
        load();
      } catch (err) {
        toast.error(errorMessage(err, "Erro ao salvar item"));
        btn.disabled = false;
      }
    });
  }

  el.querySelector("#archived").addEventListener("change", (e) => {
    showArchived = e.target.checked;
    load();
  });
  el.querySelector("#add").addEventListener("click", () => openForm(null));
  load();
}
