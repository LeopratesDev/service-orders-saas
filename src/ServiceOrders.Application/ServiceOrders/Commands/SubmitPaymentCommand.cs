using MediatR;

namespace ServiceOrders.Application.ServiceOrders.Commands;

public record SubmitPaymentCommand(Guid OrderId) : IRequest<SubmitPaymentResult>;
public record SubmitPaymentResult(string PixQrCode, DateTime ExpiresAt);
