using MediatR;

namespace ServiceOrders.Application.ServiceOrders.Commands;

public record CreateServiceOrderCommand(string Title, string? Description, decimal Amount) : IRequest<Guid>;
