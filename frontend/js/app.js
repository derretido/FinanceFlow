

const ROUTES = {
  "/": renderDashboard,
  "/receitas": renderIncomes,
  "/gastos": renderExpenses,
  "/investimentos": renderInvestments,
  "/metas": renderGoals,
  "/alertas": renderAlerts,
};

function currentPath() {
  return location.hash.replace(/^#/, "") || "/";
}

function navigate(path) {
  if (currentPath() === path) router();
  else location.hash = path;
}

function router() {
  const root = document.getElementById("root");
  const path = currentPath();
  const loggedIn = !!Auth.user;

  document.querySelectorAll(".modal").forEach((m) => m.remove());

  if (path === "/login") {
    if (loggedIn) return navigate("/");
    unmountLayout();
    return renderAuthPage(root);
  }

  if (!loggedIn) return navigate("/login");

  const page = ROUTES[path];
  if (!page) return navigate("/");

  page(mountLayout(root, path));
}

window.addEventListener("hashchange", router);
router();
