// Dashboard: resumo do mês, gráficos e metas

const CATEGORY_COLORS = [
  "#60a5fa", "#34d399", "#f87171", "#fbbf24", "#a78bfa", "#f472b6",
  "#818cf8", "#fb923c", "#2dd4bf", "#e879f9", "#facc15", "#94a3b8",
];

function renderDashboard(el) {
  const state = currentMonth();

  el.innerHTML = `
    <div class="stack">
      <div class="page-header">
        <div id="month"></div>
        <div class="row" style="gap:8px">
          <span class="label">Salário</span>
          <input id="salary" type="number" class="font-mono" style="width:144px;text-align:right" placeholder="R$ 0,00" />
          <button class="btn btn-ghost" id="save-salary">Salvar</button>
        </div>
      </div>
      <div id="dash-body" class="stack"></div>
    </div>`;

  const body = el.querySelector("#dash-body");
  const salaryInput = el.querySelector("#salary");

  async function load() {
    body.innerHTML = spinnerHTML();
    try {
      const data = await api.get(`/dashboard/${state.year}/${state.month}`);
      if (!el.isConnected) return;
      salaryInput.value = data.budget.salary || "";
      paintDashboard(body, data);
    } catch {
      body.innerHTML = "";
      toast.error("Erro ao carregar dashboard");
    }
  }

  el.querySelector("#save-salary").addEventListener("click", async () => {
    try {
      await api.put("/budgets", {
        year: state.year,
        month: state.month,
        salary: parseFloat(salaryInput.value) || 0,
      });
      toast.success("Salário salvo!");
      load();
    } catch {
      toast.error("Erro ao salvar salário");
    }
  });

  mountMonthNav(el.querySelector("#month"), state, load);
  load();
}

function paintDashboard(body, data) {
  const b = data.budget || {};
  const trend = data.monthlyTrend || [];
  const cats = data.categorySummaries || [];
  const goals = data.activeGoals || [];
  const unreadAlerts = data.unreadAlerts || [];
  const invPct = b.salary > 0 ? (b.totalInvestments / b.salary) * 100 : 0;

  const alertsHTML = unreadAlerts.length
    ? `<div class="stack" style="gap:8px">${unreadAlerts
        .slice(0, 3)
        .map(
          (a) => `<div class="alert-banner alert-${a.type === "danger" || a.type === "warning" ? a.type : "info"}">
            <span style="font-weight:600">${esc(a.title)}</span>
            <span class="msg">${esc(a.message)}</span>
          </div>`
        )
        .join("")}</div>`
    : "";

  const stats = `<div class="grid grid-4">
    ${statCardHTML({ label: "Salário", value: fmtBRL(b.salary), sub: "entrada do mês", icon: "💵", accent: "#4ade80" })}
    ${statCardHTML({ label: "Gastos", value: fmtBRL(b.totalExpenses), sub: `${b.spendingPercent ?? 0}% do salário`, icon: "📤", accent: "#f87171" })}
    ${statCardHTML({ label: "Investido", value: fmtBRL(b.totalInvestments), sub: "aporte do mês", icon: "💎", accent: "#a78bfa" })}
    ${statCardHTML({ label: "Saldo livre", value: fmtBRL(b.balance), sub: "o que sobrou", icon: "🏦", accent: b.balance >= 0 ? "#fbbf24" : "#f87171" })}
  </div>`;

  const split = cardHTML(`<div class="card-body">
    <div class="label" style="margin-bottom:12px">Distribuição do salário</div>
    <div class="split-bar">
      ${
        b.salary > 0
          ? `<div style="width:${Math.min(100, b.spendingPercent)}%;background:#f87171">${b.spendingPercent > 8 ? `${b.spendingPercent}%` : ""}</div>
              <div style="width:${Math.max(0, Math.min(100 - b.spendingPercent, invPct))}%;background:#a78bfa">${invPct > 8 ? `${invPct.toFixed(0)}%` : ""}</div>
              <div style="flex:1;background:rgba(34,197,94,0.3)"></div>`
          : ""
      }
    </div>
    <div class="legend">
      <span><span class="legend-dot" style="background:#f87171"></span>Gastos</span>
      <span><span class="legend-dot" style="background:#c084fc"></span>Investimentos</span>
      <span><span class="legend-dot" style="background:rgba(34,197,94,0.4)"></span>Saldo livre</span>
    </div>
  </div>`);

  const catList = cats
    .slice(0, 6)
    .map(
      (c, i) => `<div class="pie-list-row">
        <span class="name"><span class="dot" style="background:${CATEGORY_COLORS[i % CATEGORY_COLORS.length]}"></span>${esc(c.category.icon)} ${esc(c.category.name)}</span>
        <span class="val">${fmtBRL(c.total)}</span>
      </div>`
    )
    .join("");

  const charts = `<div class="grid grid-charts">
    ${cardHTML(`<div class="card-body">
      <div class="label card-title">Tendência — 6 meses</div>
      <div id="trend-chart"></div>
    </div>`)}
    ${cardHTML(`<div class="card-body">
      <div class="label card-title">Gastos por categoria</div>
      ${
        cats.length === 0
          ? '<div class="empty" style="padding:64px 0">Sem gastos este mês</div>'
          : `<div class="pie-wrap"><div id="pie-chart"></div><div class="pie-list">${catList}</div></div>`
      }
    </div>`)}
  </div>`;

  const bars = cardHTML(`<div class="card-body">
    <div class="label card-title">Comparativo mensal</div>
    <div id="bar-chart"></div>
  </div>`);

  const goalsHTML = goals.length
    ? cardHTML(`<div class="card-body">
        <div class="label card-title">Metas ativas</div>
        <div class="grid grid-2">
          ${goals
            .map(
              (g) => `<div class="goal-mini">
                <div class="between" style="margin-bottom:8px">
                  <span style="font-weight:500;font-size:14px">${esc(g.icon)} ${esc(g.name)}</span>
                  <span class="font-mono" style="font-size:12px;color:#c084fc">${g.progressPercent}%</span>
                </div>
                ${progressHTML(g.progressPercent, "#a78bfa")}
                <div class="between muted" style="font-size:12px;margin-top:8px">
                  <span>${fmtBRL(g.currentAmount)}</span>
                  <span>${fmtBRL(g.targetAmount)}</span>
                </div>
              </div>`
            )
            .join("")}
        </div>
      </div>`)
    : "";

  body.innerHTML = alertsHTML + stats + split + charts + bars + goalsHTML;

  areaChart(body.querySelector("#trend-chart"), trend, [
    { key: "salary", name: "Salário", color: "#4ade80" },
    { key: "expenses", name: "Gastos", color: "#f87171" },
  ]);

  barChart(body.querySelector("#bar-chart"), trend, [
    { key: "expenses", name: "Gastos", color: "#f87171" },
    { key: "investments", name: "Investimentos", color: "#a78bfa" },
    { key: "balance", name: "Saldo", color: "#4ade80" },
  ]);

  if (cats.length) {
    donutChart(
      body.querySelector("#pie-chart"),
      cats.map((c, i) => ({
        name: `${c.category.icon} ${c.category.name}`,
        value: c.total,
        color: CATEGORY_COLORS[i % CATEGORY_COLORS.length],
      }))
    );
  }
}
