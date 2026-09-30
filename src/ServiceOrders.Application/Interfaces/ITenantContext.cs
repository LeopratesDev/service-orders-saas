namespace ServiceOrders.Domain.Interfaces;

public interface ITenantContext
{
    Guid TenantId { get; }
}
