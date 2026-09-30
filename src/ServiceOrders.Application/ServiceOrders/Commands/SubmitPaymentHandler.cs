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

        order.Submit();

        var idempotencyKey = $"order-{order.Id}-{DateTime.UtcNow:yyyyMMdd}";
        var paymentRequest = new PaymentRequest(order.Id, order.Amount, idempotencyKey);
        var result = await _paymentGateway.CreatePixChargeAsync(paymentRequest, cancellationToken);

        await _repository.SaveChangesAsync(cancellationToken);

        return new SubmitPaymentResult(result.PixQrCode, result.ExpiresAt);
    }
}
