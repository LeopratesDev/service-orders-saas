using FluentAssertions;
using NSubstitute;
using NSubstitute.ExceptionExtensions;
using ServiceOrders.Application.ServiceOrders.Commands;
using ServiceOrders.Domain.Entities;
using ServiceOrders.Domain.Exceptions;
using ServiceOrders.Domain.Interfaces;
using Xunit;

namespace ServiceOrders.UnitTests.Application;

public class SubmitPaymentHandlerTests
{
    private readonly IServiceOrderRepository _repository = Substitute.For<IServiceOrderRepository>();
    private readonly IPaymentGateway _paymentGateway = Substitute.For<IPaymentGateway>();
    private readonly SubmitPaymentHandler _sut;

    public SubmitPaymentHandlerTests()
    {
        _sut = new SubmitPaymentHandler(_repository, _paymentGateway);
    }

    [Fact]
    public async Task Handle_ExistingDraftOrder_ReturnsPixQrCode()
    {
        var order = ServiceOrder.Create(Guid.NewGuid(), "Fix AC", "desc", 500m);
        _repository.GetByIdAsync(order.Id, Arg.Any<CancellationToken>()).Returns(order);
        var expiresAt = DateTime.UtcNow.AddMinutes(30);
        _paymentGateway.CreatePixChargeAsync(Arg.Any<PaymentRequest>(), Arg.Any<CancellationToken>())
            .Returns(new PaymentResult("gw-id", "qr-code-data", expiresAt));

        var result = await _sut.Handle(new SubmitPaymentCommand(order.Id), CancellationToken.None);

        result.PixQrCode.Should().Be("qr-code-data");
        result.ExpiresAt.Should().BeCloseTo(expiresAt, TimeSpan.FromSeconds(1));
    }

    [Fact]
    public async Task Handle_OrderNotFound_ThrowsDomainException()
    {
        var orderId = Guid.NewGuid();
        _repository.GetByIdAsync(orderId, Arg.Any<CancellationToken>()).Returns((ServiceOrder?)null);

        var act = async () => await _sut.Handle(new SubmitPaymentCommand(orderId), CancellationToken.None);

        await act.Should().ThrowAsync<DomainException>()
            .WithMessage($"*{orderId}*");
    }

    [Fact]
    public async Task Handle_ValidOrder_TransitionsStatusToPending()
    {
        var order = ServiceOrder.Create(Guid.NewGuid(), "Fix AC", "desc", 500m);
        _repository.GetByIdAsync(order.Id, Arg.Any<CancellationToken>()).Returns(order);
        _paymentGateway.CreatePixChargeAsync(Arg.Any<PaymentRequest>(), Arg.Any<CancellationToken>())
            .Returns(new PaymentResult("gw-id", "qr", DateTime.UtcNow.AddMinutes(30)));

        await _sut.Handle(new SubmitPaymentCommand(order.Id), CancellationToken.None);

        order.Status.Should().Be(ServiceOrders.Domain.Enums.ServiceOrderStatus.Pending);
        await _repository.Received(1).SaveChangesAsync(Arg.Any<CancellationToken>());
    }
}
