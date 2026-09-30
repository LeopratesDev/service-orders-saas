using Microsoft.AspNetCore.Http;
using ServiceOrders.Domain.Interfaces;

namespace ServiceOrders.Infrastructure.MultiTenancy;

public class HttpContextTenantContext : ITenantContext
{
    private readonly IHttpContextAccessor _accessor;

    public HttpContextTenantContext(IHttpContextAccessor accessor) => _accessor = accessor;

    public Guid TenantId
    {
        get
        {
            var claim = _accessor.HttpContext?.User?.FindFirst("tenant_id")?.Value;
            if (Guid.TryParse(claim, out var id)) return id;

            // Fallback: X-Tenant-Id header (useful for dev / service-to-service)
            var header = _accessor.HttpContext?.Request.Headers["X-Tenant-Id"].FirstOrDefault();
            if (Guid.TryParse(header, out id)) return id;

            throw new UnauthorizedAccessException("Tenant could not be resolved.");
        }
    }
}
