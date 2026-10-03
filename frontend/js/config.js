// Endereço da API.
// Local: usa a API .NET rodando na sua máquina.
const PRODUCTION_API_URL = "https://financeflowv2-production.up.railway.app/api";

const isLocal =
  location.protocol === "file:" ||
  location.hostname === "localhost" ||
  location.hostname === "127.0.0.1";

const API_URL =
  isLocal || !PRODUCTION_API_URL
    ? "http://localhost:5000/api"
    : PRODUCTION_API_URL;
