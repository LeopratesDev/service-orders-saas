using System.Net;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using ServiceOrders.Infrastructure.Persistence;
using ServiceOrders.IntegrationTests.Helpers;
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
                var descriptor = services.SingleOrDefault(d =>
                    d.ServiceType == typeof(DbContextOptions<AppDbContext>));
                if (descriptor is not null) services.Remove(descriptor);

                services.AddDbContext<AppDbContext>(opts =>
                    opts.UseNpgsql(_postgres.GetConnectionString()));
            });
        });

        using var scope = _factory.Services.CreateScope();
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        await db.Database.EnsureCreatedAsync();
    }

    public async Task DisposeAsync()
    {
        await _factory.DisposeAsync();
        await _postgres.StopAsync();
    }

    [Fact]
    public async Task CreateOrder_AuthorizedTenant_ReturnsCreated()
    {
        var tenantId = Guid.NewGuid();
        var client = CreateClientFor(tenantId);

        var response = await client.PostAsJsonAsync("/api/serviceorders", new
        {
            title = "Fix AC unit",
            description = "Replace compressor in unit 3B",
            amount = 1500.00,
        });

        Assert.Equal(HttpStatusCode.Created, response.StatusCode);
        var body = await response.Content.ReadFromJsonAsync<IdResponse>();
        Assert.NotEqual(Guid.Empty, body!.Id);
    }

    [Fact]
    public async Task CreateOrder_NoToken_ReturnsUnauthorized()
    {
        var client = _factory.CreateClient();

        var response = await client.PostAsJsonAsync("/api/serviceorders", new
        {
            title = "Test",
            description = "Test desc",
            amount = 100,
        });

        Assert.Equal(HttpStatusCode.Unauthorized, response.StatusCode);
    }

    [Fact]
    public async Task TenantIsolation_TenantB_CannotSeeOrderFromTenantA()
    {
        var tenantA = Guid.NewGuid();
        var tenantB = Guid.NewGuid();

        // Tenant A creates an order
        var clientA = CreateClientFor(tenantA);
        var createResponse = await clientA.PostAsJsonAsync("/api/serviceorders", new
        {
            title = "Tenant A order",
            description = "Private order for tenant A",
            amount = 250.00,
        });
        Assert.Equal(HttpStatusCode.Created, createResponse.StatusCode);
        var created = await createResponse.Content.ReadFromJsonAsync<IdResponse>();

        // Tenant B tries to access Tenant A's order
        var clientB = CreateClientFor(tenantB);
        var getResponse = await clientB.GetAsync($"/api/serviceorders/{created!.Id}");

        // Should not find it (Global Query Filter returns null → 404)
        Assert.Equal(HttpStatusCode.NotFound, getResponse.StatusCode);
    }

    private HttpClient CreateClientFor(Guid tenantId)
    {
        var client = _factory.CreateClient();
        var token = JwtHelper.GenerateToken(tenantId);
        client.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", token);
        return client;
    }

    private record IdResponse(Guid Id);
}
