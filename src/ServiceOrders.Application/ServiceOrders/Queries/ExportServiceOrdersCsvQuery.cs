using MediatR;
using ServiceOrders.Domain.Interfaces;
using System.Text;

namespace ServiceOrders.Application.ServiceOrders.Queries;

public record ExportServiceOrdersCsvQuery(
    string? Status = null, DateTime? From = null, DateTime? To = null
) : IRequest<byte[]>;

public class ExportServiceOrdersCsvHandler : IRequestHandler<ExportServiceOrdersCsvQuery, byte[]>
{
    private readonly IServiceOrderRepository _repository;

    public ExportServiceOrdersCsvHandler(IServiceOrderRepository repository)
        => _repository = repository;

    public async Task<byte[]> Handle(ExportServiceOrdersCsvQuery request, CancellationToken cancellationToken)
    {
        var orders = await _repository.GetAllFilteredAsync(request.Status, request.From, request.To, cancellationToken);

        var sb = new StringBuilder();
        sb.AppendLine("Id,Title,Status,Amount,CreatedAt,UpdatedAt");

        foreach (var o in orders)
        {
            sb.AppendLine(string.Join(",",
                o.Id,
                $"\"{o.Title.Replace("\"", "\"\"")}\"",
                o.Status.ToString(),
                o.Amount.ToString("F2", System.Globalization.CultureInfo.InvariantCulture),
                o.CreatedAt.ToString("yyyy-MM-ddTHH:mm:ssZ"),
                o.UpdatedAt.ToString("yyyy-MM-ddTHH:mm:ssZ")));
        }

        return Encoding.UTF8.GetBytes(sb.ToString());
    }
}
