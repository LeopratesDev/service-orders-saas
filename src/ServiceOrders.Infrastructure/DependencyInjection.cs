using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using ServiceOrders.Domain.Interfaces;
using ServiceOrders.Infrastructure.MultiTenancy;
using ServiceOrders.Infrastructure.Payments;
using ServiceOrders.Infrastructure.Persistence;
using ServiceOrders.Infrastructure.Persistence.Repositories;
using ServiceOrders.Infrastructure.Resilience;

namespace ServiceOrders.Infrastructure;

public static class DependencyInjection
{
    public static IServiceCollection AddInfrastructure(this IServiceCollection services, IConfiguration config)
    {
        // IHttpContextAccessor is registered by AddControllers in the API project
        services.AddScoped<ITenantContext, HttpContextTenantContext>();

        // Railway provides DATABASE_URL as postgresql://user:pass@host:port/db
        var connStr = Environment.GetEnvironmentVariable("DATABASE_URL") is { } url
            ? ConvertDatabaseUrl(url)
            : config.GetConnectionString("Postgres");

        services.AddDbContext<AppDbContext>(opts => opts.UseNpgsql(connStr));

        services.AddScoped<IServiceOrderRepository, ServiceOrderRepository>();

        services.Configure<MercadoPagoOptions>(opts => config.GetSection("MercadoPago").Bind(opts));
        services.AddHttpClient<IPaymentGateway, MercadoPagoGateway>(c =>
        {
            c.BaseAddress = new Uri(config["MercadoPago:BaseUrl"] ?? "https://api.mercadopago.com");
            c.DefaultRequestHeaders.Add("Authorization", $"Bearer {config["MercadoPago:AccessToken"]}");
        })
        .AddPolicyHandler(PollyPolicies.GetRetryPolicy())
        .AddPolicyHandler(PollyPolicies.GetCircuitBreakerPolicy());

        return services;
    }

    private static string ConvertDatabaseUrl(string url)
    {
        var uri = new Uri(url);
        var userInfo = uri.UserInfo.Split(':');
        return $"Host={uri.Host};Port={uri.Port};Database={uri.AbsolutePath.TrimStart('/')};Username={userInfo[0]};Password={userInfo[1]};SSL Mode=Require;Trust Server Certificate=true";
    }
}
