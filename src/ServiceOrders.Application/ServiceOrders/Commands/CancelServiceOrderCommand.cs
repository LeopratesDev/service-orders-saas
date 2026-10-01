using MediatR;
using ServiceOrders.Domain.Exceptions;
using ServiceOrders.Domain.Interfaces;

namespace ServiceOrders.Application.ServiceOrders.Commands;

public record CancelServiceOrderCommand(Guid Id) : IRequest;

public class CancelServiceOrderHandler : IRequestHandler<CancelServiceOrderCommand>
{
    private readonly IServiceOrderRepository _repository;

    public CancelServiceOrderHandler(IServiceOrderRepository repository)
        => _repository = repository;

    public async Task Handle(CancelServiceOrderCommand request, CancellationToken cancellationToken)
    {
        var order = await _repository.GetByIdAsync(request.Id, cancellationToken)
            ?? throw new DomainException($"Order {request.Id} not found.");

        order.Cancel("Cancelled by user.");
        await _repository.SaveChangesAsync(cancellationToken);
    }
}
