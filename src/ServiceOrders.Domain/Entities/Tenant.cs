namespace ServiceOrders.Domain.Entities;

public class Tenant
{
    public Guid Id { get; private set; }
    public string Name { get; private set; } = string.Empty;
    public string Subdomain { get; private set; } = string.Empty;
    public string Plan { get; private set; } = "free";
    public DateTime CreatedAt { get; private set; }

    private Tenant() { }

    public static Tenant Create(string name, string subdomain)
    {
        if (string.IsNullOrWhiteSpace(name)) throw new ArgumentException("Name is required.", nameof(name));
        if (string.IsNullOrWhiteSpace(subdomain)) throw new ArgumentException("Subdomain is required.", nameof(subdomain));
        return new Tenant
        {
            Id = Guid.NewGuid(),
            Name = name,
            Subdomain = subdomain.ToLowerInvariant(),
            CreatedAt = DateTime.UtcNow,
        };
    }

    public void Upgrade(string plan) => Plan = plan;
}
