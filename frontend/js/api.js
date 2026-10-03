// Cliente HTTP da API: adiciona o token e renova automaticamente quando expira (401).

class ApiError extends Error {
  constructor(status, data) {
    super((data && data.message) || `Erro ${status}`);
    this.status = status;
    this.data = data;
  }
}

let refreshPromise = null;

function buildUrl(path, params) {
  const url = new URL(API_URL + path);
  if (params) {
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== "") url.searchParams.set(k, v);
    });
  }
  return url.toString();
}

async function parseBody(res) {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return text;
  }
}

async function refreshTokens() {
  const refreshToken = localStorage.getItem("refreshToken");
  if (!refreshToken) throw new Error("No refresh token");

  const res = await fetch(API_URL + "/auth/refresh", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ refreshToken }),
  });
  if (!res.ok) throw new ApiError(res.status, await parseBody(res));

  const data = await res.json();
  localStorage.setItem("accessToken", data.accessToken);
  localStorage.setItem("refreshToken", data.refreshToken);
}

async function request(method, path, { body, params, retried = false } = {}) {
  const headers = {};
  const token = localStorage.getItem("accessToken");
  if (token) headers.Authorization = `Bearer ${token}`;
  if (body !== undefined) headers["Content-Type"] = "application/json";

  const res = await fetch(buildUrl(path, params), {
    method,
    headers,
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });

  if (res.status === 401 && !retried && !path.startsWith("/auth/")) {
    try {
      // Várias requisições simultâneas compartilham a mesma renovação
      refreshPromise = refreshPromise || refreshTokens();
      await refreshPromise;
    } catch (err) {
      Auth.logout();
      throw err;
    } finally {
      refreshPromise = null;
    }
    return request(method, path, { body, params, retried: true });
  }

  const data = await parseBody(res);
  if (!res.ok) throw new ApiError(res.status, data);
  return data;
}

const api = {
  get: (path, params) => request("GET", path, { params }),
  post: (path, body) => request("POST", path, { body }),
  put: (path, body) => request("PUT", path, { body }),
  patch: (path, body) => request("PATCH", path, { body }),
  delete: (path) => request("DELETE", path),
};

// ─── Autenticação ────────────────────────────────────────────────────────────
const Auth = {
  get user() {
    try {
      return JSON.parse(localStorage.getItem("user") || "null");
    } catch {
      return null;
    }
  },

  saveSession(data) {
    localStorage.setItem("accessToken", data.accessToken);
    localStorage.setItem("refreshToken", data.refreshToken);
    localStorage.setItem("user", JSON.stringify(data.user));
  },

  async login(email, password) {
    this.saveSession(await api.post("/auth/login", { email, password }));
  },

  async register(name, email, password) {
    this.saveSession(await api.post("/auth/register", { name, email, password }));
  },

  logout() {
    localStorage.removeItem("accessToken");
    localStorage.removeItem("refreshToken");
    localStorage.removeItem("user");
    navigate("/login");
  },
};
