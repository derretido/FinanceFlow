# Estágio de Build
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

# Copia o projeto e restaura (Nome deve ser igual ao seu arquivo .csproj)
COPY ["FinancasApi.csproj", "./"]
RUN dotnet restore "FinancasApi.csproj"

# Copia o restante dos arquivos e compila
COPY . .
RUN dotnet publish "FinancasApi.csproj" -c Release -o /app/publish /p:UseAppHost=false

# Estágio Final (Runtime)
FROM mcr.microsoft.com/dotnet/aspnet:9.0
WORKDIR /app
COPY --from=build /app/publish .

# Garante que a porta seja a 8080 (Padrão Render)
ENV ASPNETCORE_URLS=http://+:8080
EXPOSE 8080

ENTRYPOINT ["dotnet", "FinancasApi.dll"]