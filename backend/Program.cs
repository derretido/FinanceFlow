using System.Text;
using FinancasApi.Data;
using FinancasApi.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi.Models;

var builder = WebApplication.CreateBuilder(args);

// Database
builder.Services.AddDbContext<AppDbContext>(opt =>
    opt.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

// Auth
var jwtSection = builder.Configuration.GetSection("JwtSettings");
var secretKey = jwtSection["SecretKey"]!;
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(opt =>
    {
        opt.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer           = true,
            ValidateAudience         = true,
            ValidateLifetime         = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer               = jwtSection["Issuer"],
            ValidAudience             = jwtSection["Audience"],
            IssuerSigningKey         = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secretKey))
        };
    });

builder.Services.AddAuthorization();

// Services
builder.Services.AddScoped<JwtService>();
builder.Services.AddScoped<AlertService>();

// Controllers
builder.Services.AddControllers()
    .AddJsonOptions(opt =>
    {
        opt.JsonSerializerOptions.Converters.Add(new System.Text.Json.Serialization.JsonStringEnumConverter());
    });

// --- AJUSTE DE CORS AQUI ---
builder.Services.AddCors(opt => opt.AddDefaultPolicy(p =>
    p.WithOrigins(
        "http://localhost:5173", 
        "http://localhost:3000", 
        "https://finance-flow-beryl-eight.vercel.app" // Sua URL da Vercel
    )
    .AllowAnyHeader()
    .AllowAnyMethod()));

// Swagger
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new OpenApiInfo { Title = "Finanças API", Version = "v1" });
    c.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
    {
        In = ParameterLocation.Header, Type = SecuritySchemeType.Http,
        Scheme = "Bearer", BearerFormat = "JWT"
    });
    c.AddSecurityRequirement(new OpenApiSecurityRequirement {{
        new OpenApiSecurityScheme { Reference = new OpenApiReference { Type = ReferenceType.SecurityScheme, Id = "Bearer" }},
        []
    }});
});

var app = builder.Build();

// Auto-migrate on startup (Com Try/Catch para não travar na Render)
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    try 
    {
        var dbCtx = services.GetRequiredService<AppDbContext>();
        Console.WriteLine("--- Tentando conectar ao banco e rodar migrações... ---");
        await dbCtx.Database.MigrateAsync();
        Console.WriteLine("--- Migrações executadas com sucesso! ---");
    }
    catch (Exception ex) 
    {
        Console.WriteLine("!!! ERRO NAS MIGRAÇÕES MAS O APP VAI SUBIR !!!");
        Console.WriteLine($"Erro: {ex.Message}");
    }
}

app.UseSwagger();
app.UseSwaggerUI();

// O UseCors deve vir antes do Authentication/Authorization
app.UseCors();

app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.Run();