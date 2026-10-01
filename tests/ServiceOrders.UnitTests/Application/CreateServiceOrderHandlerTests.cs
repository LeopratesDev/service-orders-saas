using FluentAssertions;
using NSubstitute;
using ServiceOrders.Application.ServiceOrders.Commands;
using ServiceOrders.Domain.Entities;
using ServiceOrders.Domain.Interfaces;
using Xunit;

namespace ServiceOrders.UnitTests.Application;

public class CreateServiceOrderHandlerTests
{
    private readonly IServiceOrderRepository _repository = Substitute.For<IServiceOrderRepository>();
    private readonly ITenantContext _tenantContext = Substitute.For<ITenantContext>();
    private readonly CreateServiceOrderHandler _sut;

    public CreateServiceOrderHandlerTests()
    {
        _sut = new CreateServiceOrderHandler(_repository, _tenantContext);
    }

    [Fact]
    public async Task Handle_ValidCommand_ReturnsNewGuid()
    {
        var tenantId = Guid.NewGuid();
        _tenantContext.TenantId.Returns(tenantId);

        var cmd = new CreateServiceOrderCommand("Fix AC", "Replace compressor", 1500m);
        var result = await _sut.Handle(cmd, CancellationToken.None);

        result.Should().NotBeEmpty();
    }

    [Fact]
    public async Task Handle_ValidCommand_PersistsOrder()
    {
        _tenantContext.TenantId.Returns(Guid.NewGuid());
        var cmd = new CreateServiceOrderCommand("Title", null, 200m);

        await _sut.Handle(cmd, CancellationToken.None);

        await _repository.Received(1).AddAsync(
            Arg.Is<ServiceOrder>(o => o.Title == "Title" && o.Description == string.Empty),
            Arg.Any<CancellationToken>());
        await _repository.Received(1).SaveChangesAsync(Arg.Any<CancellationToken>());
    }

    [Fact]
    public async Task Handle_ValidCommand_OrderBelongsToTenant()
    {
        var tenantId = Guid.NewGuid();
        _tenantContext.TenantId.Returns(tenantId);
        ServiceOrder? captured = null;
        await _repository.AddAsync(Arg.Do<ServiceOrder>(o => captured = o), Arg.Any<CancellationToken>());

        var cmd = new CreateServiceOrderCommand("Title", "Desc", 100m);
        await _sut.Handle(cmd, CancellationToken.None);

        captured.Should().NotBeNull();
        captured!.TenantId.Should().Be(tenantId);
    }
}
