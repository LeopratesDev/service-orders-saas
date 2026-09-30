# Service Orders SaaS

[![CI](https://github.com/LeopratesDev/service-orders-saas/actions/workflows/ci.yml/badge.svg)](https://github.com/LeopratesDev/service-orders-saas/actions/workflows/ci.yml)
[![Railway](https://img.shields.io/badge/API-Railway-blueviolet)](https://service-orders-api-production.up.railway.app/health)

Plataforma SaaS multi-tenant de gestão de ordens de serviço com integração de pagamentos Pix via Mercado Pago.

> **API em produção:** https://service-orders-api-production.up.railway.app

Desenvolvido por **Leonardo Prates** — [github.com/LeopratesDev](https://github.com/LeopratesDev)

---

## Métricas do projeto

| Item | Resultado |
|---|---|
| Testes de integração | 4/4 passando (banco real via Testcontainers) |
| Cobertura de isolamento multi-tenant | Provada por teste automatizado |
| Tempo médio de test suite | ~9 s |
| CI/CD | GitHub Actions (push → build → test) |
| Linhas de código backend | ~800 (excluindo migrations) |

---

## Stack

| Camada | Tecnologia |
|---|---|
| Backend | C# / ASP.NET Core 7, Clean Architecture |
| CQRS | MediatR + FluentValidation |
| ORM | Entity Framework Core 7 + PostgreSQL |
| Multi-tenancy | EF Core Global Query Filters (`HasQueryFilter`) |
| Frontend | Next.js 15 (App Router) + TypeScript + Tailwind CSS |
| State management | TanStack Query (React Query) |
| Pagamentos | Mercado Pago Pix — webhook com validação HMAC-SHA256 |
| Resiliência | Polly — Retry exponencial (3x) + Circuit Breaker (5 falhas / 30 s) |
| Testes | xUnit + Testcontainers.PostgreSql + WebApplicationFactory |
| CI | GitHub Actions com PostgreSQL service container |
| Deploy | Railway (Dockerfile) — `DATABASE_URL` auto-convertida, migrate on startup |

---

## Arquitetura

```
service-orders-saas/
├── src/
│   ├── ServiceOrders.Domain/           # Entidades, enums, interfaces, DomainException
│   ├── ServiceOrders.Application/      # Use cases (MediatR CQRS), DTOs, validações
│   ├── ServiceOrders.Infrastructure/   # EF Core, repositórios, Mercado Pago gateway, Polly
│   └── ServiceOrders.Api/              # Controllers, JWT auth, DI root, health endpoint
├── tests/
│   └── ServiceOrders.IntegrationTests/ # Banco real via Testcontainers
└── web/                                # Next.js frontend (proxy reverso → API)
```

Dependências apontam para dentro: `API → Application → Domain ← Infrastructure`

---

## Decisões técnicas

### Multi-tenancy com Global Query Filters

Banco compartilhado com coluna `TenantId` em todas as tabelas. O `AppDbContext` aplica `HasQueryFilter` automaticamente — nenhum repositório precisa filtrar manualmente. O `TenantId` é resolvido via claim `tenant_id` do JWT (ou header `X-Tenant-Id`) pelo `HttpContextTenantContext`.

Isolamento provado por teste automatizado: Tenant B não consegue ver orders do Tenant A, mesmo compartilhando o mesmo banco.

### Máquina de estados explícita no domínio

```
Draft → Pending → Paid
       ↘ Cancelled
```

Transições são métodos na entidade (`Submit()`, `MarkAsPaid()`, `Cancel()`). Qualquer chamada inválida lança `DomainException`. Não há `if/switch` nos handlers — o domínio é a única fonte de verdade.

### Idempotência em pagamentos

Cada cobrança tem uma `IdempotencyKey` gerada a partir do `OrderId`. Essa chave é enviada como header `X-Idempotency-Key` para o Mercado Pago e salva no banco com índice único filtrado (excluindo NULLs). Reenvios de webhook ou retries não criam cobranças duplicadas.

### Resiliência com Polly

O `HttpClient` do gateway tem duas políticas encadeadas:

- **Retry exponencial** — 3 tentativas, backoff de 2s, 4s, 8s
- **Circuit Breaker** — abre após 5 falhas consecutivas, permanece aberto por 30 s

---

## Como rodar localmente

**Pré-requisitos:** Docker Desktop, .NET 7 SDK, Node.js 18+

```bash
# Subir banco
docker-compose up postgres -d

# Rodar a API (http://localhost:5000 + Swagger em /swagger)
cd src/ServiceOrders.Api
dotnet run

# Rodar o frontend (http://localhost:3000)
cd web
npm install
npm run dev
```

### Testes de integração

```bash
dotnet test tests/ServiceOrders.IntegrationTests
```

Os testes sobem um container PostgreSQL real via Testcontainers — sem mocks de banco.

---

## Fluxo de uso

1. `POST /api/auth/login` → recebe JWT com `tenant_id` embutido
2. `POST /api/serviceorders` → cria ordem (status `Draft`)
3. `POST /api/serviceorders/{id}/submit-payment` → gera cobrança Pix (status → `Pending`)
4. `POST /api/webhooks/mercadopago` → confirmação de pagamento (status → `Paid`)

---

## Endpoints

| Método | Rota | Auth | Descrição |
|---|---|---|---|
| POST | `/api/auth/login` | — | Emite JWT com tenant_id |
| GET | `/api/serviceorders` | JWT | Lista orders do tenant |
| GET | `/api/serviceorders/{id}` | JWT | Detalhe (404 se outro tenant) |
| POST | `/api/serviceorders` | JWT | Criar ordem |
| POST | `/api/serviceorders/{id}/submit-payment` | JWT | Gerar cobrança Pix |
| POST | `/api/webhooks/mercadopago` | HMAC | Receber evento de pagamento |
| GET | `/health` | — | Health check |

---

*Construído com princípios de entrega incremental e contratos explícitos, inspirados em GraphHelm/Keel: menor escopo por entrega, transições de estado declarativas, infraestrutura isolada da regra de negócio.*
