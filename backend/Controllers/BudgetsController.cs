using FinancasApi.Data;
using FinancasApi.DTOs;
using FinancasApi.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace FinancasApi.Controllers;

/// <summary>
/// Controlador responsável por operações de orçamento mensal.
/// Permite consultar e atualizar salário, despesas e investimentos.
/// </summary>
[Route("api/budgets")]
public class BudgetsController : BaseController
{
    private readonly AppDbContext _context;

    public BudgetsController(AppDbContext context)
    {
        _context = context;
    }

    /// <summary>
    /// Retorna o orçamento de um mês específico.
    /// </summary>
    [HttpGet("{year}/{month}")]
    public async Task<ActionResult<BudgetDto>> Get(int year, int month)
    {
        var budget = await _context.MonthlyBudgets
            .FirstOrDefaultAsync(b => b.UserId == CurrentUserId && b.Year == year && b.Month == month);

        return Ok(await BuildBudgetDto(budget, year, month));
    }

    /// <summary>
    /// Cria ou atualiza o orçamento de um mês específico.
    /// </summary>
    [HttpPut]
    public async Task<ActionResult<BudgetDto>> Upsert(UpsertBudgetRequest request)
    {
        var budget = await _context.MonthlyBudgets
            .FirstOrDefaultAsync(b => b.UserId == CurrentUserId && b.Year == request.Year && b.Month == request.Month);

        if (budget == null)
        {
            budget = new MonthlyBudget
            {
                UserId = CurrentUserId,
                Year = request.Year,
                Month = request.Month
            };
            _context.MonthlyBudgets.Add(budget);
        }

        budget.Salary = request.Salary;
        await _context.SaveChangesAsync();

        return Ok(await BuildBudgetDto(budget, request.Year, request.Month));
    }

    /// <summary>
    /// Monta o DTO do orçamento com salário, despesas, investimentos e saldo.
    /// </summary>
    private async Task<BudgetDto> BuildBudgetDto(MonthlyBudget? budget, int year, int month)
    {
        var salary = budget?.Salary ?? 0;

        var expenses = await _context.Expenses
            .Where(e => e.UserId == CurrentUserId && e.Date.Year == year && e.Date.Month == month)
            .SumAsync(e => (decimal?)e.Amount) ?? 0;

        var investments = await _context.Investments
            .Where(i => i.UserId == CurrentUserId && i.Date.Year == year && i.Date.Month == month)
            .SumAsync(i => (decimal?)i.Amount) ?? 0;

        var balance = salary - expenses - investments;
        var expensePercentage = salary > 0 ? Math.Round(expenses / salary * 100, 1) : 0;

        return new BudgetDto(
            budget?.Id ?? 0,
            year,
            month,
            salary,
            expenses,
            investments,
            balance,
            expensePercentage
        );
    }
}
