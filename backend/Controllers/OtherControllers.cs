using FinancasApi.Data;
using FinancasApi.DTOs;
using FinancasApi.Models;
using FinancasApi.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FinancasApi.Controllers;

/// <summary>
/// Controlador de categorias.
/// Permite listar e criar categorias.
/// </summary>
[Route("api/categories")]
public class CategoriesController : BaseController
{
    private readonly AppDbContext _context;

    public CategoriesController(AppDbContext context) => _context = context;

    [HttpGet]
    public async Task<ActionResult<IEnumerable<CategoryDto>>> List()
    {
        var categories = await _context.Categories
            .Where(c => c.IsSystem || c.UserId == CurrentUserId)
            .OrderBy(c => c.Name)
            .ToListAsync();

        return Ok(categories.Select(c => new CategoryDto(c.Id, c.Name, c.Icon, c.Color, c.IsSystem)));
    }

    [HttpPost]
    public async Task<ActionResult<CategoryDto>> Create(CreateCategoryRequest request)
    {
        var category = new Category
        {
            Name = request.Name,
            Icon = request.Icon,
            Color = request.Color,
            UserId = CurrentUserId
        };

        _context.Categories.Add(category);
        await _context.SaveChangesAsync();

        return Ok(new CategoryDto(category.Id, category.Name, category.Icon, category.Color, category.IsSystem));
    }
}

/// <summary>
/// Controlador de investimentos.
/// Permite listar, criar, atualizar e excluir investimentos.
/// </summary>
[Route("api/investments")]
public class InvestmentsController : BaseController
{
    private readonly AppDbContext _context;

    public InvestmentsController(AppDbContext context) => _context = context;

    [HttpGet]
    public async Task<ActionResult<IEnumerable<InvestmentDto>>> List([FromQuery] int? year, [FromQuery] int? month)
    {
        var query = _context.Investments.Where(i => i.UserId == CurrentUserId);

        if (year.HasValue) query = query.Where(i => i.Date.Year == year.Value);
        if (month.HasValue) query = query.Where(i => i.Date.Month == month.Value);

        var investments = await query.OrderByDescending(i => i.Date).ToListAsync();
        return Ok(investments.Select(ToDto));
    }

    [HttpPost]
    public async Task<ActionResult<InvestmentDto>> Create(CreateInvestmentRequest request)
    {
        var investment = new Investment
        {
            Name = request.Name,
            Type = request.Type,
            Amount = request.Amount,
            Date = request.Date,
            UserId = CurrentUserId
        };

        _context.Investments.Add(investment);
        await _context.SaveChangesAsync();

        return Ok(ToDto(investment));
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<InvestmentDto>> Update(int id, UpdateInvestmentRequest request)
    {
        var investment = await _context.Investments.FirstOrDefaultAsync(i => i.Id == id && i.UserId == CurrentUserId);
        if (investment == null) return NotFound();

        investment.Name = request.Name;
        investment.Type = request.Type;
        investment.Amount = request.Amount;
        investment.Date = request.Date;

        await _context.SaveChangesAsync();
        return Ok(ToDto(investment));
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var investment = await _context.Investments.FirstOrDefaultAsync(i => i.Id == id && i.UserId == CurrentUserId);
        if (investment == null) return NotFound();

        _context.Investments.Remove(investment);
        await _context.SaveChangesAsync();

        return NoContent();
    }

    private static InvestmentDto ToDto(Investment investment) =>
        new(investment.Id, investment.Name, investment.Type, investment.Amount, investment.Date, investment.CreatedAt);
}
