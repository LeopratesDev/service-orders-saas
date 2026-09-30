using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Design;
using ServiceOrders.Domain.Interfaces;

namespace ServiceOrders.Infrastructure.Persistence;

// Used only by EF Core CLI at design time (migrations). Never runs in production.
public class AppDbContextFactory : IDesignTimeDbContextFactory<AppDbContext>
{
    public AppDbContext CreateDbContext(string[] args)
    {
        var opts = new DbContextOptionsBuilder<AppDbContext>()
            .UseNpgsql("Host=localhost;Database=service_orders_dev;Username=postgres;Password=postgres")
            .Options;

        return new AppDbContext(opts, new DesignTimeTenantContext());
    }

    private class DesignTimeTenantContext : ITenantContext
    {
        public Guid TenantId => Guid.Empty;
    }
}
