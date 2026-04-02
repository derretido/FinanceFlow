using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace FinancasApi.Migrations
{
    /// <summary>
    /// Migration inicial: cria as tabelas principais do sistema de finanças
    /// e insere categorias padrão.
    /// </summary>
    public partial class AdicionarSalarioEModelosIniciais : Migration
    {
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            // === Usuários ===
            migrationBuilder.CreateTable(
                name: "Users",
                columns: table => new
                {
                    Id = table.Column<int>(nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Name = table.Column<string>(nullable: false),
                    Email = table.Column<string>(nullable: false),
                    PasswordHash = table.Column<string>(nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    Salary = table.Column<decimal>(type: "numeric(18,2)", nullable: false)
                },
                constraints: table => table.PrimaryKey("PK_Users", x => x.Id)
            );

            // === Categorias ===
            migrationBuilder.CreateTable(
                name: "Categories",
                columns: table => new
                {
                    Id = table.Column<int>(nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Name = table.Column<string>(nullable: false),
                    Icon = table.Column<string>(nullable: false),
                    Color = table.Column<string>(nullable: false),
                    IsSystem = table.Column<bool>(nullable: false),
                    UserId = table.Column<int>(nullable: true)
                },
                constraints: table => table.PrimaryKey("PK_Categories", x => x.Id)
            );

            // === Alertas ===
            migrationBuilder.CreateTable(
                name: "Alerts",
                columns: table => new
                {
                    Id = table.Column<int>(nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    Title = table.Column<string>(nullable: false),
                    Message = table.Column<string>(nullable: false),
                    Type = table.Column<string>(nullable: false),
                    IsRead = table.Column<bool>(nullable: false),
                    UserId = table.Column<int>(nullable: false),
                    CreatedAt = table.Column<DateTime>(type: "timestamp with time zone", nullable: false)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_Alerts", x => x.Id);
                    table.ForeignKey("FK_Alerts_Users_UserId", x => x.UserId, "Users", "Id", onDelete: ReferentialAction.Cascade);
                }
            );

            // (segue a mesma lógica para Expenses, Goals, Investments, MonthlyBudgets e RefreshTokens…)

            // === Inserção de categorias padrão ===
            migrationBuilder.InsertData(
                table: "Categories",
                columns: new[] { "Id", "Color", "Icon", "IsSystem", "Name", "UserId" },
                values: new object[,]
                {
                    { 1, "#60a5fa", "🏠", true, "Moradia", null },
                    { 2, "#34d399", "🛒", true, "Alimentação", null },
                    { 3, "#f87171", "🍕", true, "Delivery", null },
                    { 4, "#fbbf24", "🎉", true, "Final de Semana", null },
                    { 5, "#a78bfa", "🚗", true, "Transporte", null },
                    { 6, "#f472b6", "💊", true, "Saúde", null },
                    { 7, "#818cf8", "📱", true, "Assinaturas", null },
                    { 8, "#fb923c", "👕", true, "Roupas", null },
                    { 9, "#2dd4bf", "🎮", true, "Lazer", null },
                    { 10, "#e879f9", "📚", true, "Educação", null },
                    { 11, "#facc15", "💡", true, "Contas Fixas", null },
                    { 12, "#94a3b8", "🛠️", true, "Outros", null }
                }
            );

            // === Índices importantes ===
            migrationBuilder.CreateIndex("IX_Users_Email", "Users", "Email", unique: true);
            migrationBuilder.CreateIndex("IX_MonthlyBudgets_UserId_Year_Month", "MonthlyBudgets", new[] { "UserId", "Year", "Month" }, unique: true);
        }

        protected override void Down(MigrationBuilder migrationBuilder)
        {
            // Remove todas as tabelas criadas
            migrationBuilder.DropTable("Alerts");
            migrationBuilder.DropTable("Expenses");
            migrationBuilder.DropTable("Goals");
            migrationBuilder.DropTable("Investments");
            migrationBuilder.DropTable("MonthlyBudgets");
            migrationBuilder.DropTable("RefreshTokens");
            migrationBuilder.DropTable("Categories");
            migrationBuilder.DropTable("Users");
        }
    }
}
