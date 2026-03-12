# Estágio de Build
FROM mcr.microsoft.com/dotnet/sdk:9.0-alpine AS build
WORKDIR /src

# Copia e restaura
COPY ["FinancasApi.csproj", "./"]
RUN dotnet restore "FinancasApi.csproj"

# Copia tudo e publica de forma otimizada para Linux
COPY . .
RUN dotnet publish "FinancasApi.csproj" \
    -c Release \
    -o /app/publish \
    --runtime linux-musl-x64 \
    --self-contained false \
    /p:UseAppHost=false

# Estágio de Execução (Runtime ultra-leve)
FROM mcr.microsoft.com/dotnet/aspnet:9.0-alpine
WORKDIR /app
COPY --from=build /app/publish .

# Variáveis de ambiente essenciais
ENV ASPNETCORE_URLS=http://+:8080
ENV DOTNET_RUNNING_IN_CONTAINER=true

EXPOSE 8080

ENTRYPOINT ["dotnet", "FinancasApi.dll"]