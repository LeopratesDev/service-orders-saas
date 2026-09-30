using MediatR;
using ServiceOrders.Domain.Entities;
using ServiceOrders.Domain.Interfaces;

namespace ServiceOrders.Application.ServiceOrders.Commands;

public class CreateServiceOrderHandler : IRequestHandler<CreateServiceOrderCommand, Guid>
{
    private readonly IServiceOrderRepository _repository;
    private readonly ITenantContext _tenantContext;

    public CreateServiceOrderHandler(IServiceOrderRepository repository, ITenantContext tenantContext)
    {
        _repository = repository;
        _tenantContext = tenantContext;
    }

    public async Task<Guid> Handle(CreateServiceOrderCommand request, CancellationToken cancellationToken)
    {
        var order = ServiceOrder.Create(_tenantContext.TenantId, request.Title, request.Description, request.Amount);
        await _repository.AddAsync(order, cancellationToken);
        await _repository.SaveChangesAsync(cancellationToken);
        return order.Id;
    }
}
