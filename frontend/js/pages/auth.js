// Tela de login / cadastro

function renderAuthPage(root) {
  let mode = "login";

  root.innerHTML = `
    <div class="auth">
      <div class="auth-box">
        <div class="auth-logo">
          <h1>controle</h1>
          <p>financeiro pessoal</p>
        </div>
        <div class="auth-card">
          <div class="tabs">
            <button class="tab active" data-mode="login">Entrar</button>
            <button class="tab" data-mode="register">Cadastrar</button>
          </div>
          <form class="form" id="auth-form">
            <div class="field" id="name-field" hidden>
              <label for="name">Nome</label>
              <input id="name" placeholder="Seu nome" />
            </div>
            <div class="field">
              <label for="email">E-mail</label>
              <input id="email" type="email" placeholder="seu@email.com" required />
            </div>
            <div class="field">
              <label for="password">Senha</label>
              <input id="password" type="password" placeholder="••••••••" required />
            </div>
            <button type="submit" class="btn btn-primary" id="submit" style="margin-top:8px;padding:10px 16px">Entrar</button>
          </form>
        </div>
      </div>
    </div>`;

  const form = root.querySelector("#auth-form");
  const nameField = root.querySelector("#name-field");
  const nameInput = root.querySelector("#name");
  const submit = root.querySelector("#submit");
  const submitLabel = () => (mode === "login" ? "Entrar" : "Criar conta");

  root.querySelectorAll(".tab").forEach((tab) =>
    tab.addEventListener("click", () => {
      mode = tab.dataset.mode;
      root.querySelectorAll(".tab").forEach((t) => t.classList.toggle("active", t === tab));
      nameField.hidden = mode !== "register";
      nameInput.required = mode === "register";
      submit.textContent = submitLabel();
    })
  );

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    submit.disabled = true;
    submit.textContent = "Aguarde...";
    const email = root.querySelector("#email").value;
    const password = root.querySelector("#password").value;
    try {
      if (mode === "login") await Auth.login(email, password);
      else await Auth.register(nameInput.value, email, password);
      navigate("/");
    } catch (err) {
      toast.error(errorMessage(err, "Erro ao autenticar"));
      submit.disabled = false;
      submit.textContent = submitLabel();
    }
  });
}
