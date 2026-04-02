using FinancasApi.Data;
using FinancasApi.DTOs;
using FinancasApi.Models;
using FinancasApi.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FinancasApi.Controllers;

/// <summary>
/// Controlador responsável por operações de despesas.
/// Permite listar, consultar, criar, atualizar e excluir despesas.
/// </summary>
[Route("api/expenses")]
public class ExpensesController : BaseController
{
    private readonly AppDbContext _context;
    private readonly AlertService _alertService;

    public ExpensesController(AppDbContext context, AlertService alertService)
    {
        _context = context;
        _alertService = alertService;
    }

    /// <summary>
    /// Lista despesas filtradas por ano, mês e categoria.
    /// </summary>
    [HttpGet]
    public async Task<ActionResult<IEnumerable<ExpenseDto>>> List(
        [FromQuery] int? year, [FromQuery] int? month, [FromQuery] int? categoryId)
    {
        var query = _context.Expenses
            .Include(e => e.Category)
            .Where(e => e.UserId == CurrentUserId);

        if (year.HasValue) query = query.Where(e => e.Date.Year == year.Value);
        if (month.HasValue) query = query.Where(e => e.Date.Month == month.Value);
        if (categoryId.HasValue) query = query.Where(e => e.CategoryId == categoryId.Value);

        var expenses = await query
            .OrderByDescending(e => e.Date)
            .ThenByDescending(e => e.CreatedAt)
            .ToListAsync();

        return Ok(expenses.Select(ToDto));
    }

    /// <summary>
    /// Retorna uma despesa específica pelo ID.
    /// </summary>
    [HttpGet("{id}")]
    public async Task<ActionResult<ExpenseDto>> Get(int id)
    {
        var expense = await _context.Expenses
            .Include(e => e.Category)
            .FirstOrDefaultAsync(e => e.Id == id && e.UserId == CurrentUserId);

        return expense == null ? NotFound() : Ok(ToDto(expense));
    }

    /// <summary>
    /// Cria uma nova despesa.
    /// </summary>
    [HttpPost]
    public async Task<ActionResult<ExpenseDto>> Create(CreateExpenseRequest request)
    {
        if (!await _context.Categories.AnyAsync(c => c.Id == request.CategoryId))
            return BadRequest(new { message = "Categoria inválida." });

        var expense = new Expense
        {
            Description = request.Description,
            Amount = request.Amount,
            Date = request.Date,
            CategoryId = request.CategoryId,
            IsRecurring = request.IsRecurring,
            UserId = CurrentUserId
        };

        _context.Expenses.Add(expense);
        await _context.SaveChangesAsync();

        await _alertService.CheckAndCreateAlertsAsync(CurrentUserId, request.Date.Year, request.Date.Month);

        await _context.Entry(expense).Reference(e => e.Category).LoadAsync();

        return CreatedAtAction(nameof(Get), new { id = expense.Id }, ToDto(expense));
    }

    /// <summary>
    /// Atualiza uma despesa existente.
    /// </summary>
    [HttpPut("{id}")]
    public async Task<ActionResult<ExpenseDto>> Update(int id, UpdateExpenseRequest request)
    {
        var expense = await _context.Expenses
            .Include(e => e.Category)
            .FirstOrDefaultAsync(e => e.Id == id && e.UserId == CurrentUserId);

        if (expense == null) return NotFound();

        expense.Description = request.Description;
        expense.Amount = request.Amount;
        expense.Date = request.Date;
        expense.CategoryId = request.CategoryId;
        expense.IsRecurring = request.IsRecurring;

        await _context.SaveChangesAsync();
        await _alertService.CheckAndCreateAlertsAsync(CurrentUserId, request.Date.Year, request.Date.Month);

        await _context.Entry(expense).Reference(e => e.Category).LoadAsync();

        return Ok(ToDto(expense));
    }

    /// <summary>
    /// Exclui uma despesa pelo ID.
    /// </summary>
    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var expense = await _context.Expenses
            .FirstOrDefaultAsync(e => e.Id == id && e.UserId == CurrentUserId);

        if (expense == null) return NotFound();

        _context.Expenses.Remove(expense);
        await _context.SaveChangesAsync();

        return NoContent();
    }

    /// <summary>
    /// Converte entidade Expense para DTO.
    /// </summary>
    private static ExpenseDto ToDto(Expense expense) => new(
        expense.Id,
        expense.Description,
        expense.Amount,
        expense.Date,
        new CategoryDto(
            expense.Category.Id,
            expense.Category.Name,
            expense.Category.Icon,
            expense.Category.Color,
            expense.Category.IsSystem
        ),
        expense.IsRecurring,
        expense.CreatedAt
    );
}
