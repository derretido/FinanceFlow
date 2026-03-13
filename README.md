# 💰 FinanceFlow — Controle Financeiro Pessoal

Aplicação web para **gestão financeira pessoal**, permitindo controlar gastos, investimentos, metas e orçamento mensal com dashboards interativos.

Stack: **.NET 9 (C#) • PostgreSQL • React + Vite • JWT Auth**

---

## 🌐 Acesso à aplicação

**Aplicação**
https://financeflow-production-d4ae.up.railway.app

**API**
https://financeflow-production-d4ae.up.railway.app/api

**Swagger**

https://financeflow-production-d4ae.up.railway.app/swagger


---

## 🚀 Tecnologias

**Backend**
- .NET 9
- ASP.NET Core Web API
- Entity Framework Core
- PostgreSQL
- JWT Authentication

**Frontend**
- React
- Vite
- Axios
- Recharts

---

## 📊 Funcionalidades

- Registro e login com **JWT**
- Controle de **salário mensal**
- CRUD de **gastos por categoria**
- Controle de **investimentos**
- **Metas financeiras** com progresso
- **Alertas automáticos** de orçamento
- **Dashboard com gráficos** financeiros

---

## 🏗️ Estrutura do Projeto
financas/
├── backend/
│ ├── Controllers
│ ├── Data
│ ├── DTOs
│ ├── Models
│ ├── Services
│ └── Program.cs
│
└── frontend/
└── src/
├── components
├── contexts
├── lib
└── pages


---

## 🔌 Principais Endpoints

**Auth**
POST /api/auth/register
POST /api/auth/login


**Gastos**
GET /api/expenses
POST /api/expenses
PUT /api/expenses/{id}
DELETE /api/expenses/{id}


**Metas**
GET /api/goals
POST /api/goals


**Dashboard**
GET /api/dashboard/{year}/{month}


---

## 🧪 Rodar localmente

Backend
cd backend
dotnet run


## Frontend

cd frontend
npm install
npm run dev


---

## 📈 Melhorias futuras

- Open Banking
- Exportação de relatórios
- Login social (Google/GitHub)
- Versão mobile