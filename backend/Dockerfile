# Estágio de Build
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /app

# Copiar arquivos de projeto e restaurar dependências
COPY *.csproj ./
RUN dotnet restore

# Copiar o restante e publicar
COPY . ./
RUN dotnet publish -c Release -o out

# Estágio Final (Runtime)
FROM mcr.microsoft.com/dotnet/aspnet:9.0
WORKDIR /app
COPY --from=build /app/out .

# Porta padrão do Render/Heroku/Railway costuma ser variável
# Mas o .NET por padrão ouve na 8080 no Docker
EXPOSE 8080
ENV ASPNETCORE_URLS=http://+:8080

ENTRYPOINT ["dotnet", "FinancasApi.dll"]