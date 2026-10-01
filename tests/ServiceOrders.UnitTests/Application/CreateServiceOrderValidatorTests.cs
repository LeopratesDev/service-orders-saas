using FluentAssertions;
using FluentValidation.TestHelper;
using ServiceOrders.Application.ServiceOrders.Commands;
using ServiceOrders.Application.ServiceOrders.Validators;
using Xunit;

namespace ServiceOrders.UnitTests.Application;

public class CreateServiceOrderValidatorTests
{
    private readonly CreateServiceOrderValidator _sut = new();

    [Fact]
    public void Valid_AllFields_PassesValidation()
    {
        var cmd = new CreateServiceOrderCommand("Fix AC", "Replace compressor", 1500m);
        _sut.TestValidate(cmd).ShouldNotHaveAnyValidationErrors();
    }

    [Fact]
    public void Valid_NullDescription_PassesValidation()
    {
        var cmd = new CreateServiceOrderCommand("Fix AC", null, 1500m);
        _sut.TestValidate(cmd).ShouldNotHaveAnyValidationErrors();
    }

    [Fact]
    public void Valid_EmptyDescription_PassesValidation()
    {
        var cmd = new CreateServiceOrderCommand("Fix AC", "", 1500m);
        _sut.TestValidate(cmd).ShouldNotHaveAnyValidationErrors();
    }

    [Theory]
    [InlineData(null)]
    [InlineData("")]
    [InlineData("   ")]
    public void Invalid_EmptyTitle_FailsValidation(string? title)
    {
        var cmd = new CreateServiceOrderCommand(title!, "desc", 100m);
        _sut.TestValidate(cmd).ShouldHaveValidationErrorFor(x => x.Title);
    }

    [Fact]
    public void Invalid_TitleTooLong_FailsValidation()
    {
        var cmd = new CreateServiceOrderCommand(new string('x', 201), "desc", 100m);
        _sut.TestValidate(cmd).ShouldHaveValidationErrorFor(x => x.Title);
    }

    [Fact]
    public void Invalid_DescriptionTooLong_FailsValidation()
    {
        var cmd = new CreateServiceOrderCommand("Title", new string('x', 2001), 100m);
        _sut.TestValidate(cmd).ShouldHaveValidationErrorFor(x => x.Description);
    }

    [Theory]
    [InlineData(0)]
    [InlineData(-1)]
    [InlineData(-0.01)]
    public void Invalid_AmountNotPositive_FailsValidation(decimal amount)
    {
        var cmd = new CreateServiceOrderCommand("Title", "desc", amount);
        _sut.TestValidate(cmd).ShouldHaveValidationErrorFor(x => x.Amount);
    }

    [Fact]
    public void Invalid_AmountAboveMax_FailsValidation()
    {
        var cmd = new CreateServiceOrderCommand("Title", "desc", 1_000_000m);
        _sut.TestValidate(cmd).ShouldHaveValidationErrorFor(x => x.Amount);
    }

    [Theory]
    [InlineData(0.01)]
    [InlineData(999_999.99)]
    public void Valid_BoundaryAmounts_PassValidation(decimal amount)
    {
        var cmd = new CreateServiceOrderCommand("Title", "desc", amount);
        _sut.TestValidate(cmd).ShouldNotHaveAnyValidationErrors();
    }
}
