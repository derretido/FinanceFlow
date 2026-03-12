using FinancasApi.Data;
using FinancasApi.DTOs;
using FinancasApi.Models;
using FinancasApi.Services;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FinancasApi.Controllers;

[Route("api/expenses")]
public class ExpensesController(AppDbContext db, AlertService alerts) : BaseController
{
    [HttpGet]
    public async Task<ActionResult<IEnumerable<ExpenseDto>>> List(
        [FromQuery] int? year, [FromQuery] int? month, [FromQuery] int? categoryId)
    {
        var q = db.Expenses
            .Include(e => e.Category)
            .Where(e => e.UserId == UserId);

        if (year.HasValue)     q = q.Where(e => e.Date.Year == year.Value);
        if (month.HasValue)    q = q.Where(e => e.Date.Month == month.Value);
        if (categoryId.HasValue) q = q.Where(e => e.CategoryId == categoryId.Value);

        var list = await q.OrderByDescending(e => e.Date).ThenByDescending(e => e.CreatedAt).ToListAsync();
        return Ok(list.Select(ToDto));
    }

    [HttpGet("{id}")]
    public async Task<ActionResult<ExpenseDto>> Get(int id)
    {
        var e = await db.Expenses.Include(e => e.Category)
            .FirstOrDefaultAsync(e => e.Id == id && e.UserId == UserId);
        return e == null ? NotFound() : Ok(ToDto(e));
    }

    [HttpPost]
    public async Task<ActionResult<ExpenseDto>> Create(CreateExpenseRequest req)
    {
        if (!await db.Categories.AnyAsync(c => c.Id == req.CategoryId))
            return BadRequest(new { message = "Categoria inválida." });

        var expense = new Expense
        {
            Description = req.Description,
            Amount      = req.Amount,
            Date        = req.Date,
            CategoryId  = req.CategoryId,
            IsRecurring = req.IsRecurring,
            UserId      = UserId
        };
        db.Expenses.Add(expense);
        await db.SaveChangesAsync();
        await alerts.CheckAndCreateAlertsAsync(UserId, req.Date.Year, req.Date.Month);

        await db.Entry(expense).Reference(e => e.Category).LoadAsync();
        return CreatedAtAction(nameof(Get), new { id = expense.Id }, ToDto(expense));
    }

    [HttpPut("{id}")]
    public async Task<ActionResult<ExpenseDto>> Update(int id, UpdateExpenseRequest req)
    {
        var expense = await db.Expenses.Include(e => e.Category)
            .FirstOrDefaultAsync(e => e.Id == id && e.UserId == UserId);
        if (expense == null) return NotFound();

        expense.Description = req.Description;
        expense.Amount      = req.Amount;
        expense.Date        = req.Date;
        expense.CategoryId  = req.CategoryId;
        expense.IsRecurring = req.IsRecurring;
        await db.SaveChangesAsync();
        await alerts.CheckAndCreateAlertsAsync(UserId, req.Date.Year, req.Date.Month);

        await db.Entry(expense).Reference(e => e.Category).LoadAsync();
        return Ok(ToDto(expense));
    }

    [HttpDelete("{id}")]
    public async Task<IActionResult> Delete(int id)
    {
        var expense = await db.Expenses.FirstOrDefaultAsync(e => e.Id == id && e.UserId == UserId);
        if (expense == null) return NotFound();
        db.Expenses.Remove(expense);
        await db.SaveChangesAsync();
        return NoContent();
    }

    private static ExpenseDto ToDto(Expense e) => new(
        e.Id, e.Description, e.Amount, e.Date,
        new CategoryDto(e.Category.Id, e.Category.Name, e.Category.Icon, e.Category.Color, e.Category.IsSystem),
        e.IsRecurring, e.CreatedAt);
}
