namespace ServiceOrders.Domain.Interfaces;

public record PaymentRequest(Guid OrderId, decimal Amount, string IdempotencyKey);
public record PaymentResult(string GatewayId, string PixQrCode, DateTime ExpiresAt);

public interface IPaymentGateway
{
    Task<PaymentResult> CreatePixChargeAsync(PaymentRequest request, CancellationToken ct = default);
    bool ValidateWebhookSignature(string payload, string signature, string secret);
}
