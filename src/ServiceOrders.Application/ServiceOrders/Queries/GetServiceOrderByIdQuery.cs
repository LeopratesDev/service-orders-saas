using MediatR;
using ServiceOrders.Domain.Interfaces;

namespace ServiceOrders.Application.ServiceOrders.Queries;

public record GetServiceOrderByIdQuery(Guid Id) : IRequest<ServiceOrderDetail?>;

public record ServiceOrderDetail(
    Guid Id, string Title, string Description, string Status,
    decimal Amount, DateTime CreatedAt, DateTime UpdatedAt);

public class GetServiceOrderByIdHandler : IRequestHandler<GetServiceOrderByIdQuery, ServiceOrderDetail?>
{
    private readonly IServiceOrderRepository _repository;

    public GetServiceOrderByIdHandler(IServiceOrderRepository repository)
        => _repository = repository;

    public async Task<ServiceOrderDetail?> Handle(GetServiceOrderByIdQuery request, CancellationToken cancellationToken)
    {
        var order = await _repository.GetByIdAsync(request.Id, cancellationToken);
        if (order is null) return null;

        return new ServiceOrderDetail(
            order.Id, order.Title, order.Description, order.Status.ToString(),
            order.Amount, order.CreatedAt, order.UpdatedAt);
    }
}
