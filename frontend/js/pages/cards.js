// Cartões de crédito: lista, formulário, fatura por mês e compras (com parcelamento)

const INVOICE_STATUS = {
  open: { label: "Aberta", tag: "tag-blue" },
  closed: { label: "Fechada", tag: "tag-blue" },
  paid: { label: "Paga", tag: "tag-green" },
};

function renderCards(el) {
  let showArchived = false;

  el.innerHTML = `
    <div class="stack">
      <div class="page-header">
        <h1 class="page-title">Cartões</h1>
        <div class="row">
          <label class="check"><input type="checkbox" id="archived" /> Mostrar arquivados</label>
          <button class="btn btn-primary" id="add">${icon("plus", 15)} Adicionar</button>
        </div>
      </div>
      <div id="body"></div>
    </div>`;

  const body = el.querySelector("#body");

  async function loadList() {
    body.innerHTML = spinnerHTML();
    try {
      const cards = await api.get("/cards", { includeArchived: showArchived });
      if (!el.isConnected) return;
      paintList(cards);
    } catch (err) {
      body.innerHTML = "";
      toast.error(errorMessage(err, "Erro ao carregar cartões"));
    }
    refreshUnread();
  }

  function paintList(cards) {
    if (!cards.length) {
      body.innerHTML = emptyHTML("💳", "Nenhum cartão cadastrado ainda");
      return;
    }
    body.innerHTML = `<div class="grid grid-3">${cards.map(creditCardHTML).join("")}</div>`;
    body.querySelectorAll("[data-open]").forEach((c) =>
      c.addEventListener("click", () => openDetail(cards.find((x) => x.id == c.dataset.open)))
    );
  }

  function openDetail(card) {
    renderCardDetail(el, card, () => {
      renderCards(el);
    });
  }

  el.querySelector("#archived").addEventListener("change", (e) => {
    showArchived = e.target.checked;
    loadList();
  });
  el.querySelector("#add").addEventListener("click", () => openCardForm(null, loadList));
  loadList();
}

function creditCardHTML(c) {
  const pct = c.limit > 0 ? (c.usedLimit / c.limit) * 100 : 0;
  const barColor = pct >= 100 ? "#dc2626" : pct >= 80 ? "#d97706" : "#15803d";
  return `<div class="card" data-open="${c.id}" style="cursor:pointer;${c.isArchived ? "opacity:.6;" : ""}">
    <div class="card-accent" style="background:${esc(c.bankColor)}"></div>
    <div class="card-body">
      <div class="between" style="margin-bottom:12px">
        <span style="font-weight:600">${esc(c.bankIcon)} ${esc(c.nickname)}</span>
        ${c.isArchived ? '<span class="tag tag-blue">Arquivado</span>' : ""}
      </div>
      <div class="muted font-mono" style="font-size:12px;margin-bottom:12px">
        ${esc(c.bankName)} · ${esc(c.brand)}${c.last4 ? ` · •••• ${esc(c.last4)}` : ""}
      </div>
      <div class="label">Limite disponível</div>
      <div class="stat-value" style="color:${barColor}">${fmtBRL(c.availableLimit)}</div>
      ${progressHTML(pct, barColor)}
      <div class="between muted" style="font-size:12px;margin:8px 0 12px">
        <span>Usado ${fmtBRL(c.usedLimit)}</span><span>Limite ${fmtBRL(c.limit)}</span>
      </div>
      <div class="between" style="font-size:13px">
        <span class="muted">Fatura ${String(c.currentInvoiceMonth).padStart(2, "0")}/${c.currentInvoiceYear}</span>
        <span class="font-mono" style="font-weight:500">${fmtBRL(c.currentInvoiceTotal)}</span>
      </div>
    </div>
  </div>`;
}

// ─── Formulário de cartão ────────────────────────────────────────────────────
async function openCardForm(card, onSaved) {
  let banks, brands;
  try {
    [banks, brands] = await Promise.all([api.get("/banks"), api.get("/cards/brands")]);
  } catch (err) {
    return toast.error(errorMessage(err, "Erro ao carregar bancos"));
  }

  const f = card || { bankId: "", nickname: "", brand: brands[0], last4: "", limit: "", closingDay: "", dueDay: "", isArchived: false };
  const bankOptions = (selected) =>
    banks.map((b) => `<option value="${b.id}" ${b.id === selected ? "selected" : ""}>${esc(b.icon)} ${esc(b.name)}</option>`).join("");

  const { el: modal, close } = openModal(
    card ? "Editar cartão" : "Novo cartão",
    `<div class="form">
      <div class="field"><label>Banco</label>
        <select name="bankId"><option value="">Selecione...</option>${bankOptions(f.bankId)}<option value="__new__">+ Novo banco...</option></select>
      </div>
      <div class="form-2" id="new-bank" hidden>
        <div class="field"><label>Nome do banco</label><input name="bankName" maxlength="50" /></div>
        <div class="field"><label>Cor</label><input name="bankColor" type="color" value="#15803d" /></div>
      </div>
      <div class="field"><label>Apelido</label><input name="nickname" value="${esc(f.nickname)}" placeholder="Ex: Cartão principal" /></div>
      <div class="form-2">
        <div class="field"><label>Bandeira</label>
          <select name="brand">${brands.map((b) => `<option ${b === f.brand ? "selected" : ""}>${esc(b)}</option>`).join("")}</select>
        </div>
        <div class="field"><label>Últimos 4 dígitos (opcional)</label><input name="last4" value="${esc(f.last4)}" inputmode="numeric" maxlength="4" placeholder="0000" /></div>
      </div>
      <div class="field"><label>Limite (R$)</label><input name="limit" type="number" value="${esc(f.limit)}" min="0" step="0.01" /></div>
      <div class="form-2">
        <div class="field"><label>Dia de fechamento</label><input name="closingDay" type="number" value="${esc(f.closingDay)}" min="1" max="31" /></div>
        <div class="field"><label>Dia de vencimento</label><input name="dueDay" type="number" value="${esc(f.dueDay)}" min="1" max="31" /></div>
      </div>
      ${card ? `<label class="check"><input name="isArchived" type="checkbox" ${f.isArchived ? "checked" : ""} /> Cartão arquivado</label>` : ""}
      <div class="form-actions">
        <button class="btn btn-primary btn-block" id="save">Salvar</button>
        <button class="btn btn-ghost" data-close>Cancelar</button>
      </div>
    </div>`
  );

  const val = (name) => modal.querySelector(`[name="${name}"]`);
  const newBank = modal.querySelector("#new-bank");
  val("bankId").addEventListener("change", () => (newBank.hidden = val("bankId").value !== "__new__"));
  val("last4").addEventListener("input", () => (val("last4").value = val("last4").value.replace(/\D/g, "")));

  modal.querySelector("#save").addEventListener("click", async () => {
    const btn = modal.querySelector("#save");
    const payload = {
      nickname: val("nickname").value.trim(),
      brand: val("brand").value,
      last4: val("last4").value || null,
      limit: parseFloat(val("limit").value),
      closingDay: parseInt(val("closingDay").value),
      dueDay: parseInt(val("dueDay").value),
    };
    if (card) payload.isArchived = val("isArchived").checked;

    const creatingBank = val("bankId").value === "__new__";
    if (!val("bankId").value || (creatingBank && !val("bankName").value.trim()) || !payload.nickname ||
        isNaN(payload.limit) || isNaN(payload.closingDay) || isNaN(payload.dueDay))
      return toast.error("Preencha todos os campos");

    btn.disabled = true;
    try {
      payload.bankId = creatingBank
        ? (await api.post("/banks", { name: val("bankName").value.trim(), color: val("bankColor").value })).id
        : parseInt(val("bankId").value);
      if (card) await api.put(`/cards/${card.id}`, payload);
      else await api.post("/cards", payload);
      toast.success(card ? "Cartão atualizado!" : "Cartão adicionado!");
      close();
      onSaved();
    } catch (err) {
      toast.error(errorMessage(err, "Erro ao salvar cartão"));
      btn.disabled = false;
    }
  });
}

// ─── Detalhe do cartão / fatura ──────────────────────────────────────────────
function renderCardDetail(el, card, onBack) {
  const state = { year: card.currentInvoiceYear, month: card.currentInvoiceMonth };

  el.innerHTML = `
    <div class="stack">
      <div class="page-header">
        <div class="row">
          <button class="btn btn-ghost btn-sm" id="back">${icon("chevronLeft", 14)} Cartões</button>
          <h1 class="page-title">${esc(card.bankIcon)} ${esc(card.nickname)}</h1>
        </div>
        <div class="row">
          <button class="btn btn-ghost" id="edit">${icon("pencil", 14)} Editar</button>
          <button class="btn btn-ghost" id="delete">${icon("trash", 14)} Excluir</button>
          <button class="btn btn-primary" id="purchase" ${card.isArchived ? "disabled" : ""}>${icon("plus", 15)} Nova compra</button>
        </div>
      </div>
      <div id="month"></div>
      <div id="invoice"></div>
    </div>`;

  const box = el.querySelector("#invoice");

  async function load() {
    box.innerHTML = spinnerHTML();
    try {
      const inv = await api.get(`/cards/${card.id}/invoices/${state.year}/${state.month}`);
      if (!el.isConnected) return;
      paintInvoice(inv);
    } catch (err) {
      box.innerHTML = "";
      toast.error(errorMessage(err, "Erro ao carregar fatura"));
    }
    refreshUnread();
  }

  function paintInvoice(inv) {
    const st = INVOICE_STATUS[inv.status] || INVOICE_STATUS.open;
    const paid = inv.status === "paid";

    const rows = inv.items.length
      ? `<div class="table-wrap"><table>
          <thead><tr><th>Descrição</th><th>Valor</th><th>Data</th><th></th></tr></thead>
          <tbody>${inv.items
            .map(
              (e) => `<tr>
                <td style="font-weight:500">${esc(e.description)}${installmentLabel(e)}</td>
                <td class="font-mono" style="color:#dc2626">${fmtBRL(e.amount)}</td>
                <td class="font-mono muted" style="font-size:12px">${fmtDate(e.date)}</td>
                <td><div class="td-actions">
                  <button class="icon-btn danger" data-del="${e.id}" data-group="${esc(e.installmentGroupId || "")}" aria-label="Remover">${icon("trash", 13)}</button>
                </div></td>
              </tr>`
            )
            .join("")}</tbody>
        </table></div>`
      : emptyHTML("📭", "Nenhuma compra nesta fatura");

    box.innerHTML = `<div class="stack">
      <div class="grid grid-3">
        ${statCardHTML({ label: "Total da fatura", value: fmtBRL(inv.total), sub: `Fecha em ${fmtDate(inv.closingDate)}`, icon: "🧾", accent: "#dc2626" })}
        ${statCardHTML({ label: "Vencimento", value: fmtDate(inv.dueDate), sub: paid && inv.paidAt ? `Paga em ${fmtDate(inv.paidAt)}` : "", icon: "📅", accent: "#d97706" })}
        ${statCardHTML({ label: "Limite disponível", value: fmtBRL(card.availableLimit), sub: `de ${fmtBRL(card.limit)}`, icon: "💳", accent: "#15803d" })}
      </div>
      <div class="row">
        <span class="tag ${st.tag}">${st.label}</span>
        <button class="btn btn-ghost btn-sm" id="pay">${paid ? "Desfazer pagamento" : "Marcar como paga"}</button>
      </div>
      <div class="card">${rows}</div>
    </div>`;

    box.querySelector("#pay").addEventListener("click", async () => {
      try {
        const url = `/cards/${card.id}/invoices/${inv.year}/${inv.month}/pay`;
        if (paid) await api.delete(url);
        else await api.post(url);
        toast.success(paid ? "Pagamento desfeito" : "Fatura marcada como paga!");
        load();
      } catch (err) {
        toast.error(errorMessage(err, "Erro ao atualizar fatura"));
      }
    });

    box.querySelectorAll("[data-del]").forEach((b) =>
      b.addEventListener("click", () => removeItem(b.dataset.del, b.dataset.group))
    );
  }

  async function removeItem(id, groupId) {
    // Compra parcelada: OK remove todas as parcelas; Cancelar pergunta se remove só esta
    let all = false;
    if (groupId) {
      all = confirm("Remover todas as parcelas desta compra?\n\nOK = todas · Cancelar = escolher só esta parcela");
      if (!all && !confirm("Remover somente esta parcela?")) return;
    } else if (!confirm("Remover esta compra?")) return;

    try {
      if (all) await api.delete(`/cards/${card.id}/purchases/${groupId}`);
      else await api.delete(`/expenses/${id}`);
      toast.success("Removido!");
      load();
    } catch (err) {
      toast.error(errorMessage(err, "Erro ao remover compra"));
    }
  }

  el.querySelector("#back").addEventListener("click", onBack);
  el.querySelector("#edit").addEventListener("click", () => openCardForm(card, onBack));
  el.querySelector("#purchase").addEventListener("click", () => openPurchaseForm(card, load));
  el.querySelector("#delete").addEventListener("click", async () => {
    if (!confirm("Excluir este cartão?")) return;
    try {
      const res = await api.delete(`/cards/${card.id}`);
      toast.success(res && res.archived ? "Cartão com compras: foi arquivado." : "Cartão excluído!");
      onBack();
    } catch (err) {
      toast.error(errorMessage(err, "Erro ao excluir cartão"));
    }
  });

  mountMonthNav(el.querySelector("#month"), state, load);
  load();
}

// "2/6" ao lado da descrição de compras parceladas
function installmentLabel(e) {
  return e.installmentTotal > 1
    ? ` <span class="tag tag-blue">${e.installmentNumber}/${e.installmentTotal}</span>`
    : "";
}

// ─── Nova compra ─────────────────────────────────────────────────────────────
async function openPurchaseForm(card, onSaved) {
  let categories;
  try {
    categories = await api.get("/categories");
  } catch (err) {
    return toast.error(errorMessage(err, "Erro ao carregar categorias"));
  }

  const { el: modal, close } = openModal(
    "Nova compra no cartão",
    `<div class="form">
      <div class="field"><label>Descrição</label><input name="description" placeholder="Ex: Geladeira" /></div>
      <div class="form-2">
        <div class="field"><label>Valor total (R$)</label><input name="amount" type="number" min="0" step="0.01" placeholder="0,00" /></div>
        <div class="field"><label>Data</label><input name="date" type="date" value="${today()}" /></div>
      </div>
      <div class="field"><label>Categoria</label>
        <select name="categoryId"><option value="">Selecione...</option>${categories
          .map((c) => `<option value="${c.id}">${esc(c.icon)} ${esc(c.name)}</option>`)
          .join("")}</select>
      </div>
      <div class="field"><label>Parcelas (1-48)</label>
        <input name="installments" type="number" min="1" max="48" value="1" />
        <span class="muted" id="preview" style="font-size:12px"></span>
      </div>
      <label class="check"><input name="isRecurring" type="checkbox" /> Compra recorrente (mensal)</label>
      <div class="form-actions">
        <button class="btn btn-primary btn-block" id="save">Salvar</button>
        <button class="btn btn-ghost" data-close>Cancelar</button>
      </div>
    </div>`
  );

  const val = (name) => modal.querySelector(`[name="${name}"]`);
  const preview = modal.querySelector("#preview");

  function paintPreview() {
    const n = parseInt(val("installments").value) || 1;
    const total = parseFloat(val("amount").value) || 0;
    preview.textContent = n > 1 && total > 0 ? `${n}x de aproximadamente ${fmtBRL(total / n)}` : "";
  }
  function syncRecurring() {
    const recurring = val("isRecurring").checked;
    val("installments").disabled = recurring;
    if (recurring) val("installments").value = 1;
    paintPreview();
  }
  val("isRecurring").addEventListener("change", syncRecurring);
  val("installments").addEventListener("input", paintPreview);
  val("amount").addEventListener("input", paintPreview);

  modal.querySelector("#save").addEventListener("click", async () => {
    const btn = modal.querySelector("#save");
    const payload = {
      description: val("description").value.trim(),
      amount: parseFloat(val("amount").value),
      date: val("date").value,
      categoryId: parseInt(val("categoryId").value),
      installments: parseInt(val("installments").value) || 1,
      isRecurring: val("isRecurring").checked,
    };
    if (!payload.description || !(payload.amount > 0) || !payload.date || isNaN(payload.categoryId))
      return toast.error("Preencha todos os campos");
    if (payload.installments < 1 || payload.installments > 48)
      return toast.error("Parcelas devem estar entre 1 e 48");

    btn.disabled = true;
    try {
      await api.post(`/cards/${card.id}/purchases`, payload);
      toast.success("Compra registrada!");
      close();
      onSaved();
    } catch (err) {
      toast.error(errorMessage(err, "Erro ao registrar compra"));
      btn.disabled = false;
    }
  });
}
