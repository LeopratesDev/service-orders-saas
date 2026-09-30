using FluentValidation;
using ServiceOrders.Application.ServiceOrders.Commands;

namespace ServiceOrders.Application.ServiceOrders.Validators;

public class CreateServiceOrderValidator : AbstractValidator<CreateServiceOrderCommand>
{
    public CreateServiceOrderValidator()
    {
        RuleFor(x => x.Title).NotEmpty().MaximumLength(200);
        RuleFor(x => x.Description).MaximumLength(2000);
        RuleFor(x => x.Amount).GreaterThan(0).LessThanOrEqualTo(999_999.99m);
    }
}
