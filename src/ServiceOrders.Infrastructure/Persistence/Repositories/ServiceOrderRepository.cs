using Microsoft.EntityFrameworkCore;
using ServiceOrders.Domain.Entities;
using ServiceOrders.Domain.Interfaces;

namespace ServiceOrders.Infrastructure.Persistence.Repositories;

public class ServiceOrderRepository : IServiceOrderRepository
{
    private readonly AppDbContext _db;

    public ServiceOrderRepository(AppDbContext db) => _db = db;

    public Task<ServiceOrder?> GetByIdAsync(Guid id, CancellationToken ct)
        => _db.ServiceOrders.FirstOrDefaultAsync(o => o.Id == id, ct);

    public async Task<IReadOnlyList<ServiceOrder>> GetAllAsync(CancellationToken ct)
        => await _db.ServiceOrders.OrderByDescending(o => o.CreatedAt).ToListAsync(ct);

    public async Task<(IReadOnlyList<ServiceOrder> Items, int Total)> GetPagedAsync(int page, int pageSize, CancellationToken ct)
    {
        var query = _db.ServiceOrders.OrderByDescending(o => o.CreatedAt);
        var total = await query.CountAsync(ct);
        var items = await query
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync(ct);
        return (items, total);
    }

    public async Task<IReadOnlyList<(string Status, int Count, decimal Total)>> GetStatsByStatusAsync(CancellationToken ct)
    {
        var rows = await _db.ServiceOrders
            .GroupBy(o => o.Status)
            .Select(g => new { Status = g.Key.ToString(), Count = g.Count(), Total = g.Sum(o => o.Amount) })
            .ToListAsync(ct);
        return rows.Select(r => (r.Status, r.Count, r.Total)).ToList();
    }

    public Task AddAsync(ServiceOrder order, CancellationToken ct)
    {
        _db.ServiceOrders.Add(order);
        return Task.CompletedTask;
    }

    public Task SaveChangesAsync(CancellationToken ct) => _db.SaveChangesAsync(ct);
}
