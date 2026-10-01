using MediatR;
using ServiceOrders.Domain.Interfaces;

namespace ServiceOrders.Application.ServiceOrders.Queries;

public class ListServiceOrdersHandler : IRequestHandler<ListServiceOrdersQuery, PagedResult<ServiceOrderSummary>>
{
    private readonly IServiceOrderRepository _repository;

    public ListServiceOrdersHandler(IServiceOrderRepository repository)
        => _repository = repository;

    public async Task<PagedResult<ServiceOrderSummary>> Handle(ListServiceOrdersQuery request, CancellationToken cancellationToken)
    {
        var page = Math.Max(1, request.Page);
        var pageSize = Math.Clamp(request.PageSize, 1, 100);

        var (items, total) = await _repository.GetPagedAsync(page, pageSize, request.Status, request.From, request.To, cancellationToken);

        var summaries = items
            .Select(o => new ServiceOrderSummary(o.Id, o.Title, o.Status.ToString(), o.Amount, o.CreatedAt))
            .ToList();

        return new PagedResult<ServiceOrderSummary>(summaries, total, page, pageSize);
    }
}
