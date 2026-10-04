

const NAV_LINKS = [
  { path: "/", icon: "dashboard", label: "Dashboard" },
  { path: "/receitas", icon: "wallet", label: "Receitas" },
  { path: "/gastos", icon: "receipt", label: "Gastos" },
  { path: "/investimentos", icon: "trendingUp", label: "Investimentos" },
  { path: "/metas", icon: "target", label: "Metas" },
  { path: "/alertas", icon: "bell", label: "Alertas" },
];

let unreadTimer = null;

// Garante que o layout está na tela e devolve o elemento onde a página deve ser desenhada.
function mountLayout(root, activePath) {
  let content = root.querySelector(".main-inner");

  if (!content) {
    const user = Auth.user || {};
    root.innerHTML = `
      <div class="app">
        <aside class="sidebar">
          <div class="sidebar-logo">
            <h1>controle</h1>
            <p>financeiro</p>
          </div>
          <nav class="sidebar-nav">
            ${NAV_LINKS.map(
              (l) => `<a class="nav-link" href="#${l.path}" data-path="${l.path}">
                ${icon(l.icon)} ${l.label}
                ${l.path === "/alertas" ? '<span class="nav-badge" id="unread-badge" hidden></span>' : ""}
              </a>`
            ).join("")}
          </nav>
          <div class="sidebar-user">
            <div class="user-row">
              <div class="avatar">${esc((user.name || "?")[0].toUpperCase())}</div>
              <div class="user-info">
                <p class="user-name">${esc(user.name)}</p>
                <p class="user-email">${esc(user.email)}</p>
              </div>
            </div>
            <button class="logout-btn" id="logout">${icon("logOut", 14)} Sair</button>
          </div>
        </aside>
        <main class="main"><div class="main-inner"></div></main>
      </div>`;

    root.querySelector("#logout").addEventListener("click", () => Auth.logout());
    content = root.querySelector(".main-inner");

    refreshUnread();
    clearInterval(unreadTimer);
    unreadTimer = setInterval(refreshUnread, 60000);
  }

  root.querySelectorAll(".nav-link").forEach((a) => a.classList.toggle("active", a.dataset.path === activePath));
  content.innerHTML = "";
  return content;
}

function unmountLayout() {
  clearInterval(unreadTimer);
  unreadTimer = null;
}

async function refreshUnread() {
  try {
    const list = await api.get("/alerts", { unreadOnly: true });
    const badge = document.getElementById("unread-badge");
    if (!badge) return;
    badge.hidden = list.length === 0;
    badge.textContent = list.length > 9 ? "9+" : list.length;
  } catch {
    // silencioso, como antes
  }
}
