using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace FinancasApi.Controllers;

/// <summary>
/// Controlador base para endpoints autenticados.
/// Fornece acesso rápido ao ID do usuário logado.
/// </summary>
[Authorize]
[ApiController]
public abstract class BaseController : ControllerBase
{
    /// <summary>
    /// Obtém o ID do usuário autenticado a partir dos claims do token.
    /// </summary>
    protected int CurrentUserId
    {
        get
        {
            // Tenta buscar o identificador padrão (NameIdentifier).
            var idClaim = User.FindFirstValue(ClaimTypes.NameIdentifier);

            // Se não existir, usa o "sub" (subject) como fallback.
            idClaim ??= User.FindFirstValue("sub");

            return int.Parse(idClaim!);
        }
    }
}
