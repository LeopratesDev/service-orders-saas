using MediatR;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ServiceOrders.Application.ServiceOrders.Commands;
using ServiceOrders.Application.ServiceOrders.Queries;
using ServiceOrders.Domain.Exceptions;
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
    public async Task<IActionResult> GetAll(
        [FromQuery] int page = 1, [FromQuery] int pageSize = 20,
        [FromQuery] string? status = null,
        [FromQuery] DateTime? from = null, [FromQuery] DateTime? to = null,
        CancellationToken ct = default)
    {
        var result = await _mediator.Send(new ListServiceOrdersQuery(page, pageSize, status, from, to), ct);
        return Ok(result);
    }

    [HttpGet("export")]
    public async Task<IActionResult> Export(
        [FromQuery] string? status = null,
        [FromQuery] DateTime? from = null, [FromQuery] DateTime? to = null,
        CancellationToken ct = default)
    {
        var csv = await _mediator.Send(new ExportServiceOrdersCsvQuery(status, from, to), ct);
        var filename = $"ordens-{DateTime.UtcNow:yyyy-MM-dd}.csv";
        return File(csv, "text/csv; charset=utf-8", filename);
    }

    [HttpGet("{id:guid}")]
    public async Task<IActionResult> GetById(Guid id, CancellationToken ct)
    {
        var order = await _mediator.Send(new GetServiceOrderByIdQuery(id), ct);
        if (order is null) return NotFound();
        return Ok(order);
    }

    [HttpGet("stats")]
    public async Task<IActionResult> GetStats(CancellationToken ct)
    {
        var result = await _mediator.Send(new GetServiceOrderStatsQuery(), ct);
        return Ok(result);
    }

    [HttpDelete("{id:guid}")]
    public async Task<IActionResult> Cancel(Guid id, CancellationToken ct)
    {
        try
        {
            await _mediator.Send(new CancelServiceOrderCommand(id), ct);
            return NoContent();
        }
        catch (DomainException ex) when (ex.Message.Contains("not found"))
        {
            return NotFound(new { error = ex.Message });
        }
        catch (DomainException ex)
        {
            return Conflict(new { error = ex.Message });
        }
    }
}
