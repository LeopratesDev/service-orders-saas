using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ServiceOrders.Application.ServiceOrders.Commands;
using ServiceOrders.Domain.Interfaces;

namespace ServiceOrders.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ServiceOrdersController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly IServiceOrderRepository _repository;

    public ServiceOrdersController(IMediator mediator, IServiceOrderRepository repository)
    {
        _mediator = mediator;
        _repository = repository;
    }

    [HttpPost]
    public async Task<IActionResult> Create([FromBody] CreateServiceOrderCommand command, CancellationToken ct)
    {
        var id = await _mediator.Send(command, ct);
        return CreatedAtAction(nameof(GetById), new { id }, new { id });
    }

    [HttpPost("{id:guid}/submit-payment")]
    public async Task<IActionResult> SubmitPayment(Guid id, CancellationToken ct)
    {
        var result = await _mediator.Send(new SubmitPaymentCommand(id), ct);
        return Ok(result);
    }

    [HttpGet]
    public async Task<IActionResult> GetAll(CancellationToken ct)
    {
        var orders = await _repository.GetAllAsync(ct);
        return Ok(orders.Select(o => new { o.Id, o.Title, o.Status, o.Amount, o.CreatedAt }));
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id, CancellationToken ct)
    {
        var order = await _repository.GetByIdAsync(id, ct);
        if (order is null) return NotFound();
        return Ok(new { order.Id, order.Title, order.Status, order.Amount, order.CreatedAt });
    }
}
