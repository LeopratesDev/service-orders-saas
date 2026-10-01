using MediatR;

namespace ServiceOrders.Application.ServiceOrders.Queries;

public record ListServiceOrdersQuery(int Page = 1, int PageSize = 20) : IRequest<PagedResult<ServiceOrderSummary>>;

public record ServiceOrderSummary(Guid Id, string Title, string Status, decimal Amount, DateTime CreatedAt);

public record PagedResult<T>(IReadOnlyList<T> Data, int Total, int Page, int PageSize)
{
    public int TotalPages => (int)Math.Ceiling(Total / (double)PageSize);
    public bool HasNext => Page < TotalPages;
    public bool HasPrevious => Page > 1;
}
