using MediatR;
using ServiceOrders.Domain.Exceptions;
using ServiceOrders.Domain.Interfaces;

namespace ServiceOrders.Application.ServiceOrders.Commands;

public class SubmitPaymentHandler : IRequestHandler<SubmitPaymentCommand, SubmitPaymentResult>
{
    private readonly IServiceOrderRepository _repository;
    private readonly IPaymentGateway _paymentGateway;

    public SubmitPaymentHandler(IServiceOrderRepository repository, IPaymentGateway paymentGateway)
    {
        _repository = repository;
        _paymentGateway = paymentGateway;
    }

    public async Task<SubmitPaymentResult> Handle(SubmitPaymentCommand request, CancellationToken cancellationToken)
    {
        var order = await _repository.GetByIdAsync(request.OrderId, cancellationToken)
            ?? throw new DomainException($"Order {request.OrderId} not found.");

        // Allow regenerating PIX for already-pending orders (idempotent retry)
        if (order.Status == Domain.Enums.ServiceOrderStatus.Draft)
        {
            order.Submit();
            await _repository.SaveChangesAsync(cancellationToken);
        }
        else if (order.Status != Domain.Enums.ServiceOrderStatus.Pending)
        {
            throw new DomainException($"Cannot generate PIX for an order with status '{order.Status}'.");
        }

        var idempotencyKey = $"order-{order.Id}-{DateTime.UtcNow:yyyyMMdd}";
        var paymentRequest = new PaymentRequest(order.Id, order.Amount, idempotencyKey);
        var result = await _paymentGateway.CreatePixChargeAsync(paymentRequest, cancellationToken);

        return new SubmitPaymentResult(result.PixQrCode, result.ExpiresAt);
    }
}
