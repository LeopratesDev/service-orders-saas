using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata.Builders;
using ServiceOrders.Domain.Entities;

namespace ServiceOrders.Infrastructure.Persistence.Configurations;

public class ServiceOrderConfiguration : IEntityTypeConfiguration<ServiceOrder>
{
    public void Configure(EntityTypeBuilder<ServiceOrder> builder)
    {
        builder.HasKey(o => o.Id);
        builder.Property(o => o.TenantId).IsRequired();
        builder.Property(o => o.Title).IsRequired().HasMaxLength(200);
        builder.Property(o => o.Description).IsRequired().HasMaxLength(2000);
        builder.Property(o => o.Amount).HasPrecision(18, 2);
        builder.Property(o => o.Status).HasConversion<string>();
        builder.Property(o => o.IdempotencyKey).HasMaxLength(256);
        builder.HasIndex(o => o.IdempotencyKey).IsUnique().HasFilter("\"IdempotencyKey\" IS NOT NULL");
        builder.HasIndex(o => o.TenantId);
    }
}
