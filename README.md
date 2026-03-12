# 💰 Controle Financeiro Pessoal

Stack: **.NET 9** (C#) + **PostgreSQL** + **React + Vite** + **JWT Auth**

---

## 📁 Estrutura

```
financas/
├── backend/          # ASP.NET Core Web API
│   ├── Controllers/
│   ├── Data/         # AppDbContext (EF Core)
│   ├── DTOs/
│   ├── Models/
│   ├── Services/     # JwtService, AlertService
│   └── Program.cs
└── frontend/         # React + Vite
    └── src/
        ├── components/
        ├── contexts/
        ├── lib/      # axios client
        └── pages/
```

---

## ⚙️ Pré-requisitos

- [.NET 9 SDK](https://dotnet.microsoft.com/download)
- [Node.js 20+](https://nodejs.org)
- [PostgreSQL 15+](https://www.postgresql.org/download/)

---

## 🚀 Setup do Backend

### 1. Criar banco de dados

```sql
CREATE DATABASE financas_db;
```

### 2. Configurar connection string

Edite `backend/appsettings.json`:
```json
{
  "ConnectionStrings": {
    "DefaultConnection": "Host=localhost;Port=5432;Database=financas_db;Username=postgres;Password=SUA_SENHA"
  },
  "JwtSettings": {
    "SecretKey": "UMA_CHAVE_SECRETA_LONGA_MINIMO_32_CARACTERES_AQUI"
  }
}
```

### 3. Instalar EF Core CLI e criar migration

```bash
cd backend

# Instalar ferramenta EF (apenas na primeira vez)
dotnet tool install --global dotnet-ef

# Criar a migration inicial
dotnet ef migrations add InitialCreate

# Aplicar no banco (ou deixar o app fazer automaticamente no startup)
dotnet ef database update
```

### 4. Rodar o backend

```bash
dotnet run
```

API disponível em: `http://localhost:5000`  
Swagger UI: `http://localhost:5000/swagger`

---

## 🎨 Setup do Frontend

```bash
cd frontend

# Instalar dependências
npm install

# Rodar em modo desenvolvimento
npm run dev
```

App disponível em: `http://localhost:5173`

---

## 🔧 Funcionalidades

| Feature | Descrição |
|---|---|
| **Auth JWT** | Registro, login, refresh token automático |
| **Orçamento mensal** | Salário configurável por mês |
| **Gastos** | CRUD com 12 categorias + categorias personalizadas |
| **Investimentos** | Aportes mensais por tipo (Renda Fixa, Variável, Crypto...) |
| **Metas** | Progresso visual com depósitos |
| **Alertas** | Automáticos quando gastos passam de 80% do salário |
| **Dashboard** | Gráficos de área, pizza e barras (últimos 6 meses) |
| **Histórico** | Tendência mensal com Recharts |

---

## 🔌 Endpoints principais

### Auth
```
POST /api/auth/register   { name, email, password }
POST /api/auth/login      { email, password }
POST /api/auth/refresh    { refreshToken }
```

### Orçamento
```
GET  /api/budgets/{year}/{month}
PUT  /api/budgets         { year, month, salary }
```

### Gastos
```
GET    /api/expenses?year=&month=&categoryId=
POST   /api/expenses
PUT    /api/expenses/{id}
DELETE /api/expenses/{id}
```

### Investimentos
```
GET    /api/investments?year=&month=
POST   /api/investments
DELETE /api/investments/{id}
```

### Metas
```
GET    /api/goals
POST   /api/goals
POST   /api/goals/{id}/deposit   { amount }
DELETE /api/goals/{id}
```

### Alertas
```
GET    /api/alerts?unreadOnly=true
PATCH  /api/alerts/{id}/read
PATCH  /api/alerts/read-all
```

### Dashboard
```
GET /api/dashboard/{year}/{month}
```

---

## 🛠️ Produção

```bash
# Backend
dotnet publish -c Release -o ./publish

# Frontend
cd frontend && npm run build
# Servir a pasta /dist com nginx ou similar
```

Configure um reverse proxy nginx apontando `/api` para o backend e `/` para o frontend buildado.
