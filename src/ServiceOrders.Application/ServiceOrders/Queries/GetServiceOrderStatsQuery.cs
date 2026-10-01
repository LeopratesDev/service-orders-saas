using MediatR;
using ServiceOrders.Domain.Interfaces;
using System.Linq;

namespace ServiceOrders.Application.ServiceOrders.Queries;

public record GetServiceOrderStatsQuery : IRequest<ServiceOrderStats>;

public record ServiceOrderStatItem(string Status, int Count, decimal Total);

public record ServiceOrderStats(IReadOnlyList<ServiceOrderStatItem> ByStatus);

public class GetServiceOrderStatsHandler : IRequestHandler<GetServiceOrderStatsQuery, ServiceOrderStats>
{
    private readonly IServiceOrderRepository _repository;

    public GetServiceOrderStatsHandler(IServiceOrderRepository repository)
        => _repository = repository;

    public async Task<ServiceOrderStats> Handle(GetServiceOrderStatsQuery request, CancellationToken cancellationToken)
    {
        var raw = await _repository.GetStatsByStatusAsync(cancellationToken);
        var stats = raw.Select(r => new ServiceOrderStatItem(r.Status, r.Count, r.Total)).ToList();
        return new ServiceOrderStats(stats);
    }
}
