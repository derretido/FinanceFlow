
// Todos se redesenham quando o container muda de largura e mostram tooltip ao passar o mouse.

const CHART_MARGIN = { top: 8, right: 12, bottom: 24, left: 56 };
const AXIS_TEXT = 'fill="#6b7b73" font-size="11" font-family="DM Sans, sans-serif"';
const kFormat = (v) => `R$${(v / 1000).toFixed(0)}k`;

// Chama render(largura) agora e sempre que a largura do container mudar.
function responsive(container, render) {
  let lastWidth = 0;
  const ro = new ResizeObserver(() => {
    if (!container.isConnected) return ro.disconnect();
    const w = container.clientWidth;
    if (w && w !== lastWidth) {
      lastWidth = w;
      render(w);
    }
  });
  ro.observe(container);
}

function niceTicks(min, max, count = 5) {
  if (min === max) max = min + 1;
  const raw = (max - min) / (count - 1);
  const mag = Math.pow(10, Math.floor(Math.log10(raw)));
  const norm = raw / mag;
  const step = (norm <= 1 ? 1 : norm <= 2 ? 2 : norm <= 2.5 ? 2.5 : norm <= 5 ? 5 : 10) * mag;
  const ticks = [];
  for (let v = Math.floor(min / step) * step; v <= Math.ceil(max / step) * step + step / 2; v += step) {
    ticks.push(Math.round(v * 100) / 100);
  }
  return ticks;
}

// Escala Y + grade horizontal + rótulos do eixo Y
function yAxis(values, width, height) {
  const ticks = niceTicks(Math.min(0, ...values), Math.max(0, ...values));
  const lo = ticks[0];
  const hi = ticks[ticks.length - 1];
  const top = CHART_MARGIN.top;
  const bottom = height - CHART_MARGIN.bottom;
  const y = (v) => bottom - ((v - lo) / (hi - lo)) * (bottom - top);

  const svg = ticks
    .map(
      (t) => `
      <line x1="${CHART_MARGIN.left}" x2="${width - CHART_MARGIN.right}" y1="${y(t)}" y2="${y(t)}" stroke="#dbe4df" stroke-dasharray="3 3"/>
      <text x="${CHART_MARGIN.left - 8}" y="${y(t)}" ${AXIS_TEXT} text-anchor="end" dominant-baseline="middle">${kFormat(t)}</text>`
    )
    .join("");
  return { y, svg };
}

function tooltip(container) {
  let el = container.querySelector(".chart-tooltip");
  if (!el) {
    el = document.createElement("div");
    el.className = "chart-tooltip";
    el.hidden = true;
    container.appendChild(el);
  }
  return {
    show(html, x, y) {
      el.innerHTML = html;
      el.hidden = false;
      const w = el.offsetWidth;
      const left = x + 12 + w > container.clientWidth ? x - 12 - w : x + 12;
      el.style.left = `${Math.max(0, left)}px`;
      el.style.top = `${Math.max(0, y - el.offsetHeight / 2)}px`;
    },
    hide() {
      el.hidden = true;
    },
  };
}

function tooltipRows(title, rows) {
  return (
    (title ? `<div class="tt-title">${esc(title)}</div>` : "") +
    rows.map((r) => `<div class="tt-row" style="color:${r.color}">${esc(r.name)}: ${fmtBRL(r.value)}</div>`).join("")
  );
}

function legendHTML(series) {
  return `<div class="chart-legend">${series
    .map((s) => `<span><span class="legend-dot" style="background:${s.color}"></span>${esc(s.name)}</span>`)
    .join("")}</div>`;
}

// ─── Área ────────────────────────────────────────────────────────────────────
// series: [{ key, name, color }]
function areaChart(container, data, series, height = 220) {
  container.classList.add("chart");

  responsive(container, (width) => {
    const n = data.length;
    const values = data.flatMap((d) => series.map((s) => Number(d[s.key]) || 0));
    const { y, svg: grid } = yAxis(values, width, height);
    const plotW = width - CHART_MARGIN.left - CHART_MARGIN.right;
    const x = (i) => CHART_MARGIN.left + (n > 1 ? (i * plotW) / (n - 1) : plotW / 2);
    const baseY = y(0);

    const curve = (key) =>
      data
        .map((d, i) => {
          const px = x(i);
          const py = y(Number(d[key]) || 0);
          if (i === 0) return `M${px},${py}`;
          const prevX = x(i - 1);
          const prevY = y(Number(data[i - 1][key]) || 0);
          const mid = (prevX + px) / 2;
          return `C${mid},${prevY} ${mid},${py} ${px},${py}`;
        })
        .join("");

    const defs = series
      .map(
        (s) => `<linearGradient id="grad-${s.key}" x1="0" y1="0" x2="0" y2="1">
          <stop offset="5%" stop-color="${s.color}" stop-opacity="0.3"/>
          <stop offset="95%" stop-color="${s.color}" stop-opacity="0"/>
        </linearGradient>`
      )
      .join("");

    const areas = n
      ? series
          .map((s) => {
            const line = curve(s.key);
            return `<path d="${line}L${x(n - 1)},${baseY}L${x(0)},${baseY}Z" fill="url(#grad-${s.key})"/>
              <path d="${line}" fill="none" stroke="${s.color}" stroke-width="1.5"/>`;
          })
          .join("")
      : "";

    const labels = data
      .map((d, i) => `<text x="${x(i)}" y="${height - 6}" ${AXIS_TEXT} text-anchor="middle">${esc(d.label)}</text>`)
      .join("");

    container.innerHTML = `
      <svg width="${width}" height="${height}">
        <defs>${defs}</defs>
        ${grid}${areas}${labels}
        <line class="hover-line" y1="${CHART_MARGIN.top}" y2="${height - CHART_MARGIN.bottom}" stroke="#9aaba2" visibility="hidden"/>
        <g class="hover-dots"></g>
        <rect class="hover-zone" x="${CHART_MARGIN.left}" y="0" width="${plotW}" height="${height}" fill="transparent"/>
      </svg>`;

    if (!n) return;
    const tip = tooltip(container);
    const zone = container.querySelector(".hover-zone");
    const lineEl = container.querySelector(".hover-line");
    const dots = container.querySelector(".hover-dots");

    zone.addEventListener("mousemove", (e) => {
      const mx = e.clientX - container.getBoundingClientRect().left;
      const i = n > 1 ? Math.round(((mx - CHART_MARGIN.left) / plotW) * (n - 1)) : 0;
      const idx = Math.max(0, Math.min(n - 1, i));
      const d = data[idx];
      lineEl.setAttribute("x1", x(idx));
      lineEl.setAttribute("x2", x(idx));
      lineEl.setAttribute("visibility", "visible");
      dots.innerHTML = series
        .map((s) => `<circle cx="${x(idx)}" cy="${y(Number(d[s.key]) || 0)}" r="4" fill="${s.color}" stroke="#ffffff" stroke-width="2"/>`)
        .join("");
      tip.show(
        tooltipRows(d.label, series.map((s) => ({ name: s.name, color: s.color, value: d[s.key] }))),
        x(idx),
        e.clientY - container.getBoundingClientRect().top
      );
    });
    zone.addEventListener("mouseleave", () => {
      lineEl.setAttribute("visibility", "hidden");
      dots.innerHTML = "";
      tip.hide();
    });
  });
}

// ─── Barras agrupadas ────────────────────────────────────────────────────────
// Retângulo com os cantos arredondados só do lado do topo (ou da base, se negativo)
function barPath(x, y0, y1, w, r) {
  const top = Math.min(y0, y1);
  const h = Math.abs(y1 - y0);
  if (h < 0.5) return "";
  r = Math.min(r, h, w / 2);
  if (y1 <= y0) {
    return `M${x},${top + h}V${top + r}Q${x},${top} ${x + r},${top}H${x + w - r}Q${x + w},${top} ${x + w},${top + r}V${top + h}Z`;
  }
  return `M${x},${top}V${top + h - r}Q${x},${top + h} ${x + r},${top + h}H${x + w - r}Q${x + w},${top + h} ${x + w},${top + h - r}V${top}Z`;
}

function barChart(container, data, series, height = 200) {
  container.classList.add("chart");
  const chartBox = document.createElement("div");
  container.innerHTML = "";
  container.appendChild(chartBox);
  container.insertAdjacentHTML("beforeend", legendHTML(series));
  chartBox.style.position = "relative";

  responsive(chartBox, (width) => {
    const n = data.length;
    const values = data.flatMap((d) => series.map((s) => Number(d[s.key]) || 0));
    const { y, svg: grid } = yAxis(values, width, height);
    const plotW = width - CHART_MARGIN.left - CHART_MARGIN.right;
    const band = n ? plotW / n : plotW;
    const gap = 4;
    const barW = Math.max(4, Math.min(24, (band * 0.8 - gap * (series.length - 1)) / series.length));
    const groupW = barW * series.length + gap * (series.length - 1);

    const bars = data
      .map((d, i) => {
        const gx = CHART_MARGIN.left + i * band + (band - groupW) / 2;
        return series
          .map((s, j) => {
            const p = barPath(gx + j * (barW + gap), y(0), y(Number(d[s.key]) || 0), barW, 4);
            return p ? `<path d="${p}" fill="${s.color}"/>` : "";
          })
          .join("");
      })
      .join("");

    const labels = data
      .map(
        (d, i) =>
          `<text x="${CHART_MARGIN.left + i * band + band / 2}" y="${height - 6}" ${AXIS_TEXT} text-anchor="middle">${esc(d.label)}</text>`
      )
      .join("");

    const zones = data
      .map(
        (_, i) =>
          `<rect class="band" data-i="${i}" x="${CHART_MARGIN.left + i * band}" y="${CHART_MARGIN.top}" width="${band}" height="${height - CHART_MARGIN.top - CHART_MARGIN.bottom}" fill="transparent"/>`
      )
      .join("");

    chartBox.innerHTML = `<svg width="${width}" height="${height}">${grid}<g class="zones">${zones}</g>${bars}${labels}</svg>`;

    const tip = tooltip(chartBox);
    chartBox.querySelectorAll(".band").forEach((rect) => {
      const d = data[rect.dataset.i];
      rect.addEventListener("mousemove", (e) => {
        rect.setAttribute("fill", "rgba(22,101,52,0.06)");
        const box = chartBox.getBoundingClientRect();
        tip.show(
          tooltipRows(d.label, series.map((s) => ({ name: s.name, color: s.color, value: d[s.key] }))),
          e.clientX - box.left,
          e.clientY - box.top
        );
      });
      rect.addEventListener("mouseleave", () => {
        rect.setAttribute("fill", "transparent");
        tip.hide();
      });
    });
  });
}

// ─── Rosca ───────────────────────────────────────────────────────────────────
// items: [{ name, value, color }]
function donutChart(container, items, { height = 200, outer = 80, inner = 50 } = {}) {
  container.classList.add("chart");

  responsive(container, (width) => {
    const cx = width / 2;
    const cy = height / 2;
    const R = Math.min(outer, width / 2 - 2);
    const r = Math.min(inner, R * 0.62);
    const total = items.reduce((s, it) => s + (Number(it.value) || 0), 0) || 1;
    const pt = (rad, a) => [cx + rad * Math.cos(a), cy + rad * Math.sin(a)];

    let angle = -Math.PI / 2;
    const slices = items
      .map((it, i) => {
        const frac = (Number(it.value) || 0) / total;
        if (frac <= 0) return "";
        // Uma fatia de 100% vira um anel (dois semicírculos) porque um arco de 360° não é desenhável
        const sweep = Math.min(frac * Math.PI * 2, Math.PI * 2 - 0.0001);
        const a0 = angle;
        const a1 = angle + sweep;
        angle += frac * Math.PI * 2;
        const large = sweep > Math.PI ? 1 : 0;
        const [x0, y0] = pt(R, a0);
        const [x1, y1] = pt(R, a1);
        const [x2, y2] = pt(r, a1);
        const [x3, y3] = pt(r, a0);
        return `<path data-i="${i}" d="M${x0},${y0}A${R},${R} 0 ${large} 1 ${x1},${y1}L${x2},${y2}A${r},${r} 0 ${large} 0 ${x3},${y3}Z" fill="${it.color}" stroke="#ffffff" stroke-width="1"/>`;
      })
      .join("");

    container.innerHTML = `<svg width="${width}" height="${height}">${slices}</svg>`;

    const tip = tooltip(container);
    container.querySelectorAll("path").forEach((p) => {
      const it = items[p.dataset.i];
      p.addEventListener("mousemove", (e) => {
        p.style.opacity = "0.85";
        const box = container.getBoundingClientRect();
        tip.show(tooltipRows("", [{ name: it.name, color: it.color, value: it.value }]), e.clientX - box.left, e.clientY - box.top);
      });
      p.addEventListener("mouseleave", () => {
        p.style.opacity = "";
        tip.hide();
      });
    });
  });
}
