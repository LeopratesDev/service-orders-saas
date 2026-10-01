using FluentAssertions;
using ServiceOrders.Domain.Entities;
using ServiceOrders.Domain.Enums;
using ServiceOrders.Domain.Exceptions;
using Xunit;

namespace ServiceOrders.UnitTests.Domain;

public class ServiceOrderTests
{
    private static ServiceOrder NewDraft() =>
        ServiceOrder.Create(Guid.NewGuid(), "Fix AC", "Replace compressor", 1500m);

    [Fact]
    public void Create_ValidData_SetsDefaultsToDraft()
    {
        var order = NewDraft();

        order.Status.Should().Be(ServiceOrderStatus.Draft);
        order.Id.Should().NotBeEmpty();
        order.TenantId.Should().NotBeEmpty();
        order.CreatedAt.Should().BeCloseTo(DateTime.UtcNow, TimeSpan.FromSeconds(2));
    }

    [Fact]
    public void Create_NullDescription_DefaultsToEmptyString()
    {
        var order = ServiceOrder.Create(Guid.NewGuid(), "Title", null, 100m);

        order.Description.Should().Be(string.Empty);
    }

    [Fact]
    public void Submit_FromDraft_TransitionsToPending()
    {
        var order = NewDraft();

        order.Submit();

        order.Status.Should().Be(ServiceOrderStatus.Pending);
    }

    [Fact]
    public void Submit_AlreadyPending_ThrowsDomainException()
    {
        var order = NewDraft();
        order.Submit();

        var act = () => order.Submit();

        act.Should().Throw<DomainException>()
           .WithMessage("*submit*");
    }

    [Fact]
    public void MarkAsPaid_FromPending_TransitionsToPaid()
    {
        var order = NewDraft();
        order.Submit();

        order.MarkAsPaid("gw-123", "idem-abc");

        order.Status.Should().Be(ServiceOrderStatus.Paid);
        order.PaymentGatewayId.Should().Be("gw-123");
    }

    [Fact]
    public void MarkAsPaid_FromDraft_ThrowsDomainException()
    {
        var order = NewDraft();

        var act = () => order.MarkAsPaid("gw-1", "idem-1");

        act.Should().Throw<DomainException>()
           .WithMessage("*mark as paid*");
    }

    [Fact]
    public void Cancel_FromDraft_TransitionsToCancelled()
    {
        var order = NewDraft();

        order.Cancel("customer request");

        order.Status.Should().Be(ServiceOrderStatus.Cancelled);
    }

    [Fact]
    public void Cancel_FromPending_TransitionsToCancelled()
    {
        var order = NewDraft();
        order.Submit();

        order.Cancel("payment failed");

        order.Status.Should().Be(ServiceOrderStatus.Cancelled);
    }

    [Fact]
    public void Cancel_FromPaid_ThrowsDomainException()
    {
        var order = NewDraft();
        order.Submit();
        order.MarkAsPaid("gw-1", "idem-1");

        var act = () => order.Cancel("refund");

        act.Should().Throw<DomainException>()
           .WithMessage("*paid*");
    }
}
