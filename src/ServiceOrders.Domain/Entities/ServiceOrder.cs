using ServiceOrders.Domain.Enums;
using ServiceOrders.Domain.Exceptions;

namespace ServiceOrders.Domain.Entities;

public class ServiceOrder
{
    public Guid Id { get; private set; }
    public Guid TenantId { get; private set; }
    public string Title { get; private set; } = string.Empty;
    public string Description { get; private set; } = string.Empty;
    public decimal Amount { get; private set; }
    public ServiceOrderStatus Status { get; private set; }
    public string? PaymentGatewayId { get; private set; }
    public string? IdempotencyKey { get; private set; }
    public DateTime CreatedAt { get; private set; }
    public DateTime UpdatedAt { get; private set; }

    private ServiceOrder() { }

    public static ServiceOrder Create(Guid tenantId, string title, string? description, decimal amount)
    {
        return new ServiceOrder
        {
            Id = Guid.NewGuid(),
            TenantId = tenantId,
            Title = title,
            Description = description ?? string.Empty,
            Amount = amount,
            Status = ServiceOrderStatus.Draft,
            CreatedAt = DateTime.UtcNow,
            UpdatedAt = DateTime.UtcNow,
        };
    }

    // State machine: explicit, declarative transitions
    public void Submit()
    {
        EnsureStatus(ServiceOrderStatus.Draft, "submit");
        Status = ServiceOrderStatus.Pending;
        UpdatedAt = DateTime.UtcNow;
    }

    public void MarkAsPaid(string gatewayId, string idempotencyKey)
    {
        EnsureStatus(ServiceOrderStatus.Pending, "mark as paid");
        PaymentGatewayId = gatewayId;
        IdempotencyKey = idempotencyKey;
        Status = ServiceOrderStatus.Paid;
        UpdatedAt = DateTime.UtcNow;
    }

    public void Cancel(string reason)
    {
        if (Status == ServiceOrderStatus.Paid)
            throw new DomainException("Cannot cancel a paid order.");
        Status = ServiceOrderStatus.Cancelled;
        UpdatedAt = DateTime.UtcNow;
    }

    private void EnsureStatus(ServiceOrderStatus expected, string action)
    {
        if (Status != expected)
            throw new DomainException($"Cannot {action} an order with status '{Status}'.");
    }
}
