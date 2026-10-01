using MediatR;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using ServiceOrders.Application.ServiceOrders.Commands;
using ServiceOrders.Infrastructure.Payments;
using System.Text.Json;

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

        var gateway = HttpContext.RequestServices
            .GetRequiredService<ServiceOrders.Domain.Interfaces.IPaymentGateway>();
        if (!gateway.ValidateWebhookSignature(payload, signature, _opts.WebhookSecret))
            return Unauthorized("Invalid webhook signature.");

        using var doc = JsonDocument.Parse(payload);
        var root = doc.RootElement;

        // Mercado Pago sends { "action": "payment.updated", "data": { "id": "123" } }
        var action = root.TryGetProperty("action", out var a) ? a.GetString() : null;
        if (action is not ("payment.updated" or "payment.created"))
            return Ok(); // ignore other event types

        var status = root.TryGetProperty("data", out var data) &&
                     data.TryGetProperty("status", out var s)
            ? s.GetString()
            : null;

        if (status != "approved")
            return Ok();

        var gatewayId = data.TryGetProperty("id", out var idProp) ? idProp.GetString() : null;
        var externalRef = data.TryGetProperty("external_reference", out var extRef)
            ? extRef.GetString()
            : null;

        if (gatewayId is null || externalRef is null)
            return BadRequest("Missing id or external_reference.");

        // external_reference format: "order-{orderId}-{date}"
        if (!externalRef.StartsWith("order-") ||
            !Guid.TryParse(externalRef.Split('-')[1], out var orderId))
            return BadRequest("Cannot parse order id from external_reference.");

        await _mediator.Send(new MarkOrderAsPaidCommand(orderId, gatewayId, externalRef), ct);
        return Ok();
    }
}
