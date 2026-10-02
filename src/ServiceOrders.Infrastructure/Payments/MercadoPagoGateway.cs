using System.Net.Http.Json;
using System.Security.Cryptography;
using System.Text;
using Microsoft.Extensions.Options;
using ServiceOrders.Domain.Interfaces;

namespace ServiceOrders.Infrastructure.Payments;

public class MercadoPagoOptions
{
    public string AccessToken { get; set; } = string.Empty;
    public string WebhookSecret { get; set; } = string.Empty;
    public string BaseUrl { get; set; } = "https://api.mercadopago.com";
}

public class MercadoPagoGateway : IPaymentGateway
{
    private readonly HttpClient _http;
    private readonly MercadoPagoOptions _opts;

    public MercadoPagoGateway(HttpClient http, IOptions<MercadoPagoOptions> opts)
    {
        _http = http;
        _opts = opts.Value;
    }

    public async Task<PaymentResult> CreatePixChargeAsync(PaymentRequest request, CancellationToken ct)
    {
        if (string.IsNullOrEmpty(_opts.AccessToken))
        {
            var demoQr = $"00020126580014BR.GOV.BCB.PIX0136{request.OrderId}" +
                         $"520400005303986540{request.Amount:F2}5802BR" +
                         $"5925DEMO ORDENS DE SERVICO6009SAO PAULO62070503***6304DEMO";
            return new PaymentResult($"DEMO-{request.OrderId}", demoQr, DateTime.UtcNow.AddMinutes(30));
        }

        var body = new
        {
            transaction_amount = request.Amount,
            description = $"Order {request.OrderId}",
            payment_method_id = "pix",
            external_reference = request.IdempotencyKey,
            payer = new { email = "customer@example.com" },
        };

        var httpReq = new HttpRequestMessage(HttpMethod.Post, "/v1/payments")
        {
            Content = JsonContent.Create(body),
        };
        httpReq.Headers.Add("X-Idempotency-Key", request.IdempotencyKey);

        var response = await _http.SendAsync(httpReq, ct);
        response.EnsureSuccessStatusCode();

        var json = await response.Content.ReadFromJsonAsync<MpPaymentResponse>(cancellationToken: ct)
            ?? throw new InvalidOperationException("Empty response from Mercado Pago.");

        return new PaymentResult(
            json.Id.ToString(),
            json.PointOfInteraction?.TransactionData?.QrCode ?? string.Empty,
            DateTime.UtcNow.AddMinutes(30));
    }

    public bool ValidateWebhookSignature(string payload, string signature, string secret)
    {
        var key = Encoding.UTF8.GetBytes(secret);
        var data = Encoding.UTF8.GetBytes(payload);
        var hash = HMACSHA256.HashData(key, data);
        var computed = Convert.ToHexString(hash).ToLowerInvariant();
        return computed == signature.ToLowerInvariant();
    }

    private record MpPaymentResponse(
        long Id,
        PointOfInteraction? PointOfInteraction);

    private record PointOfInteraction(TransactionData? TransactionData);
    private record TransactionData(string? QrCode);
}
