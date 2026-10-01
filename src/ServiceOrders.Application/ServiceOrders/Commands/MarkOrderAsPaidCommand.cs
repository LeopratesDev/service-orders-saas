using MediatR;
using ServiceOrders.Domain.Exceptions;
using ServiceOrders.Domain.Interfaces;

namespace ServiceOrders.Application.ServiceOrders.Commands;

public record MarkOrderAsPaidCommand(Guid OrderId, string GatewayId, string IdempotencyKey) : IRequest;

public class MarkOrderAsPaidHandler : IRequestHandler<MarkOrderAsPaidCommand>
{
    private readonly IServiceOrderRepository _repository;

    public MarkOrderAsPaidHandler(IServiceOrderRepository repository)
        => _repository = repository;

    public async Task Handle(MarkOrderAsPaidCommand request, CancellationToken cancellationToken)
    {
        var order = await _repository.GetByIdAsync(request.OrderId, cancellationToken)
            ?? throw new DomainException($"Order {request.OrderId} not found.");

        order.MarkAsPaid(request.GatewayId, request.IdempotencyKey);
        await _repository.SaveChangesAsync(cancellationToken);
    }
}
