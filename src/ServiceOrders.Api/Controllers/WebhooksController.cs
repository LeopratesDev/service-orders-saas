using MediatR;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using ServiceOrders.Infrastructure.Payments;

namespace ServiceOrders.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class WebhooksController : ControllerBase
{
    private readonly IMediator _mediator;
    private readonly MercadoPagoOptions _opts;

    public WebhooksController(IMediator mediator, IOptions<MercadoPagoOptions> opts)
    {
        _mediator = mediator;
        _opts = opts.Value;
    }

    [HttpPost("mercadopago")]
    public async Task<IActionResult> MercadoPago(CancellationToken ct)
    {
        var signature = Request.Headers["X-Signature"].FirstOrDefault() ?? string.Empty;
        using var reader = new StreamReader(Request.Body);
        var payload = await reader.ReadToEndAsync(ct);

        // Validate signature before processing
        var gateway = HttpContext.RequestServices.GetRequiredService<ServiceOrders.Domain.Interfaces.IPaymentGateway>();
        if (!gateway.ValidateWebhookSignature(payload, signature, _opts.WebhookSecret))
            return Unauthorized("Invalid webhook signature.");

        // TODO: parse event type, dispatch domain command (e.g., MarkOrderAsPaidCommand)
        return Ok();
    }
}
