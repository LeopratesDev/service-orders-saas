using ServiceOrders.Domain.Entities;

namespace ServiceOrders.Domain.Interfaces;

public interface IServiceOrderRepository
{
    Task<ServiceOrder?> GetByIdAsync(Guid id, CancellationToken ct = default);
    Task<IReadOnlyList<ServiceOrder>> GetAllAsync(CancellationToken ct = default);
    Task<(IReadOnlyList<ServiceOrder> Items, int Total)> GetPagedAsync(
        int page, int pageSize,
        string? status = null, DateTime? from = null, DateTime? to = null,
        CancellationToken ct = default);
    Task<IReadOnlyList<ServiceOrder>> GetAllFilteredAsync(
        string? status = null, DateTime? from = null, DateTime? to = null,
        CancellationToken ct = default);
    Task<IReadOnlyList<(string Status, int Count, decimal Total)>> GetStatsByStatusAsync(CancellationToken ct = default);
    Task AddAsync(ServiceOrder order, CancellationToken ct = default);
    Task SaveChangesAsync(CancellationToken ct = default);
}
