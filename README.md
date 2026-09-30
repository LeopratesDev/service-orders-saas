# Service Orders SaaS

Plataforma SaaS multi-tenant de gestão de ordens de serviço com integração de pagamentos Pix via Mercado Pago.

Desenvolvido por **Leonardo Prates** — [github.com/LeopratesDev](https://github.com/LeopratesDev)

---

## Stack

| Camada | Tecnologia |
|---|---|
| Backend | C# / ASP.NET Core 7 |
| ORM | Entity Framework Core + PostgreSQL |
| Frontend | Next.js 14 (App Router) + TypeScript + Tailwind |
| Pagamentos | Mercado Pago (Pix) — webhook com validação HMAC |
| Resiliência | Polly — Retry exponencial + Circuit Breaker |
| Testes | xUnit + Testcontainers + WebApplicationFactory |
| Container | Docker + docker-compose |

---

## Arquitetura

```
service-orders-saas/
├── src/
│   ├── ServiceOrders.Domain/          # Entidades, enums, interfaces
│   ├── ServiceOrders.Application/     # Use cases (MediatR), DTOs, validações (FluentValidation)
│   ├── ServiceOrders.Infrastructure/  # EF Core, repositórios, gateway de pagamento
│   └── ServiceOrders.Api/             # Controllers, middlewares, DI root
└── tests/
    └── ServiceOrders.IntegrationTests/ # Testes com banco real via Testcontainers
```

Clean Architecture com dependências apontando para dentro:
`API → Application → Domain ← Infrastructure`

---

## Decisões técnicas

### Multi-tenancy com Global Query Filters
Banco compartilhado com coluna `TenantId` em todas as tabelas. O `AppDbContext` aplica um `HasQueryFilter` automático, garantindo que cada tenant só veja seus próprios dados sem precisar filtrar manualmente em cada query.

O `TenantId` é resolvido via JWT claim (`tenant_id`) ou header `X-Tenant-Id` pelo `HttpContextTenantContext`.

### Máquina de estados explícita
A `ServiceOrder` define transições declarativas no próprio domínio:

```
Draft → Pending → Paid
       ↘ Cancelled
```

Qualquer transição inválida lança `DomainException`. Não há `if/switch` espalhados nos handlers — o domínio é a única fonte de verdade do ciclo de vida.

### Idempotência em pagamentos
Cada cobrança usa uma `IdempotencyKey` gerada a partir do `OrderId + data`. Essa chave é enviada como header para o Mercado Pago, garantindo que reenvios de webhook ou retries não criem cobranças duplicadas.

### Resiliência com Polly
O `HttpClient` do gateway de pagamento tem duas políticas encadeadas:
- **Retry exponencial** (3 tentativas: 2s, 4s, 8s)
- **Circuit Breaker** (abre após 5 falhas consecutivas por 30s)

---

## Como rodar

### Pré-requisitos
- Docker Desktop
- .NET 7 SDK
- Node.js 18+

```bash
# Subir banco de dados
docker-compose up postgres -d

# Rodar a API
cd src/ServiceOrders.Api
dotnet run

# Swagger disponível em http://localhost:5000/swagger
```

### Testes de integração

```bash
dotnet test tests/ServiceOrders.IntegrationTests
```

Os testes sobem um container PostgreSQL real via Testcontainers — sem mocks de banco.

---

## Endpoints principais

| Método | Rota | Descrição |
|---|---|---|
| POST | `/api/serviceorders` | Criar ordem de serviço |
| POST | `/api/serviceorders/{id}/submit-payment` | Gerar cobrança Pix |
| POST | `/api/webhooks/mercadopago` | Receber evento de pagamento |

---

## Próximos passos

- [ ] Frontend Next.js com dashboard por tenant
- [ ] Migrations EF Core + seed de tenants
- [ ] Autenticação completa (registro, login, emissão de JWT com `tenant_id`)
- [ ] CI/CD com GitHub Actions
- [ ] Deploy na Railway ou Render

---

*Construído com princípios de arquitetura declarativa e orientada a contratos, inspirados em GraphHelm/Keel: menor escopo possível por entrega, transições de estado explícitas e isolamento de infraestrutura da regra de negócio.*
