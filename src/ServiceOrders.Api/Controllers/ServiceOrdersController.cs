using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ServiceOrders.Application.ServiceOrders.Commands;
using ServiceOrders.Application.ServiceOrders.Queries;
namespace ServiceOrders.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
[Authorize]
public class ServiceOrdersController : ControllerBase
{
    private readonly IMediator _mediator;

    public ServiceOrdersController(IMediator mediator) => _mediator = mediator;

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
    public async Task<IActionResult> GetAll([FromQuery] int page = 1, [FromQuery] int pageSize = 20, CancellationToken ct = default)
    {
        var result = await _mediator.Send(new ListServiceOrdersQuery(page, pageSize), ct);
        return Ok(result);
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id, CancellationToken ct)
    {
        var order = await _mediator.Send(new GetServiceOrderByIdQuery(id), ct);
        if (order is null) return NotFound();
        return Ok(order);
    }
}
