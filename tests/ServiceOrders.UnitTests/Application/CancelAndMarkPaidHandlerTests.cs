using FluentAssertions;
using NSubstitute;
using NSubstitute.ExceptionExtensions;
using ServiceOrders.Application.ServiceOrders.Commands;
using ServiceOrders.Domain.Entities;
using ServiceOrders.Domain.Enums;
using ServiceOrders.Domain.Exceptions;
using ServiceOrders.Domain.Interfaces;
using Xunit;

namespace ServiceOrders.UnitTests.Application;

public class CancelServiceOrderHandlerTests
{
    private readonly IServiceOrderRepository _repository = Substitute.For<IServiceOrderRepository>();
    private readonly CancelServiceOrderHandler _sut;

    public CancelServiceOrderHandlerTests() => _sut = new CancelServiceOrderHandler(_repository);

    [Fact]
    public async Task Handle_ExistingDraftOrder_CancelsAndSaves()
    {
        var order = ServiceOrder.Create(Guid.NewGuid(), "Fix AC", null, 500m);
        _repository.GetByIdAsync(order.Id, Arg.Any<CancellationToken>()).Returns(order);

        await _sut.Handle(new CancelServiceOrderCommand(order.Id), CancellationToken.None);

        order.Status.Should().Be(ServiceOrderStatus.Cancelled);
        await _repository.Received(1).SaveChangesAsync(Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Handle_OrderNotFound_ThrowsDomainException()
    {
        var id = Guid.NewGuid();
        _repository.GetByIdAsync(id, Arg.Any<CancellationToken>()).Returns((ServiceOrder?)null);

        var act = async () => await _sut.Handle(new CancelServiceOrderCommand(id), CancellationToken.None);

        await act.Should().ThrowAsync<DomainException>().WithMessage($"*{id}*");
    }

    [Fact]
    public async Task Handle_PaidOrder_ThrowsDomainException()
    {
        var order = ServiceOrder.Create(Guid.NewGuid(), "Fix AC", null, 500m);
        order.Submit();
        order.MarkAsPaid("gw-1", "idem-1");
        _repository.GetByIdAsync(order.Id, Arg.Any<CancellationToken>()).Returns(order);

        var act = async () => await _sut.Handle(new CancelServiceOrderCommand(order.Id), CancellationToken.None);

        await act.Should().ThrowAsync<DomainException>().WithMessage("*paid*");
    }
}

public class MarkOrderAsPaidHandlerTests
{
    private readonly IServiceOrderRepository _repository = Substitute.For<IServiceOrderRepository>();
    private readonly MarkOrderAsPaidHandler _sut;

    public MarkOrderAsPaidHandlerTests() => _sut = new MarkOrderAsPaidHandler(_repository);

    [Fact]
    public async Task Handle_PendingOrder_MarksAsPaidAndSaves()
    {
        var order = ServiceOrder.Create(Guid.NewGuid(), "Fix AC", null, 500m);
        order.Submit();
        _repository.GetByIdAsync(order.Id, Arg.Any<CancellationToken>()).Returns(order);

        await _sut.Handle(new MarkOrderAsPaidCommand(order.Id, "gw-99", "idem-99"), CancellationToken.None);

        order.Status.Should().Be(ServiceOrderStatus.Paid);
        order.PaymentGatewayId.Should().Be("gw-99");
        await _repository.Received(1).SaveChangesAsync(Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Handle_OrderNotFound_ThrowsDomainException()
    {
        var id = Guid.NewGuid();
        _repository.GetByIdAsync(id, Arg.Any<CancellationToken>()).Returns((ServiceOrder?)null);

        var act = async () => await _sut.Handle(new MarkOrderAsPaidCommand(id, "gw", "idem"), CancellationToken.None);

        await act.Should().ThrowAsync<DomainException>().WithMessage($"*{id}*");
    }
}
