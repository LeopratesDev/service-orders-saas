using System.Net.Http.Json;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using ServiceOrders.Infrastructure.Persistence;
using Testcontainers.PostgreSql;
using Xunit;

namespace ServiceOrders.IntegrationTests;

public class ServiceOrderFlowTests : IAsyncLifetime
{
    private readonly PostgreSqlContainer _postgres = new PostgreSqlBuilder()
        .WithDatabase("so_test")
        .WithUsername("postgres")
        .WithPassword("postgres")
        .Build();

    private WebApplicationFactory<Program> _factory = null!;

    public async Task InitializeAsync()
    {
        await _postgres.StartAsync();

        _factory = new WebApplicationFactory<Program>().WithWebHostBuilder(host =>
        {
            host.ConfigureServices(services =>
            {
                // Replace DbContext with test Postgres
                var descriptor = services.SingleOrDefault(d =>
                    d.ServiceType == typeof(DbContextOptions<AppDbContext>));
                if (descriptor is not null) services.Remove(descriptor);

                services.AddDbContext<AppDbContext>(opts =>
                    opts.UseNpgsql(_postgres.GetConnectionString()));
            });
        });

        // Apply migrations
        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        await db.Database.EnsureCreatedAsync();
    }

    public async Task DisposeAsync()
    {
        await _factory.DisposeAsync();
        await _postgres.StopAsync();
    }

    [Fact(Skip = "Requires JWT token — add auth helper before running")]
    public async Task CreateOrder_ReturnsCreated()
    {
        var client = _factory.CreateClient();

        var response = await client.PostAsJsonAsync("/api/serviceorders", new
        {
            title = "Fix AC unit",
            description = "Replace compressor",
            amount = 1500.00,
        });

        Assert.Equal(System.Net.HttpStatusCode.Created, response.StatusCode);
    }

    [Fact(Skip = "Requires JWT token — add auth helper before running")]
    public async Task TenantIsolation_OrdersNotVisibleAcrossTenants()
    {
        // Tenant A creates order → Tenant B cannot see it
        // Add JWT generation helper per tenant and assert 404 from tenant B's client
        await Task.CompletedTask;
    }
}
