# Service Orders SaaS

[![CI](https://github.com/LeopratesDev/service-orders-saas/actions/workflows/ci.yml/badge.svg)](https://github.com/LeopratesDev/service-orders-saas/actions/workflows/ci.yml)
[![Railway](https://img.shields.io/badge/API-Railway-blueviolet)](https://service-orders-api-production.up.railway.app/health)
[![Vercel](https://img.shields.io/badge/Frontend-Vercel-black)](https://service-orders-saas.vercel.app)

Plataforma SaaS **multi-tenant** de gestão de ordens de serviço com integração de pagamentos Pix via Mercado Pago.

> **Frontend:** https://service-orders-saas.vercel.app  
> **API (Swagger):** https://service-orders-api-production.up.railway.app/swagger  
> **Health:** https://service-orders-api-production.up.railway.app/health

Desenvolvido por **Leonardo Prates** — [github.com/LeopratesDev](https://github.com/LeopratesDev)

---

## Métricas do projeto

| Item | Resultado |
|---|---|
| Testes unitários | 29 passando (xUnit + NSubstitute + FluentAssertions) |
| Testes de integração | 6 passando (banco real via Testcontainers) |
| Total de testes | **35** |
| Isolamento multi-tenant | Provado por teste automatizado |
| Rate limiting | Sliding window — 60 req/min geral, 10 req/min em `/auth` |
| CI/CD | GitHub Actions: unit → integration → Railway deploy |
| Linhas de código backend | ~1 200 (excluindo migrations) |

---

## Stack

| Camada | Tecnologia |
|---|---|
| Backend | C# / ASP.NET Core 7, Clean Architecture (4 camadas) |
| CQRS | MediatR + FluentValidation (auto-validation via pipeline) |
| ORM | Entity Framework Core 7 + PostgreSQL |
| Multi-tenancy | EF Core Global Query Filters (`HasQueryFilter`) por `TenantId` |
| Frontend | Next.js 15 (App Router) + TypeScript + Tailwind CSS |
| State management | TanStack Query (React Query v5) |
| Charts | Recharts — donut (contagem por status) + barras (valor por status) |
| Pagamentos | Mercado Pago Pix — webhook com validação HMAC-SHA256 |
| Resiliência | Polly — Retry exponencial (3×) + Circuit Breaker (5 falhas / 30 s) |
| Rate Limiting | .NET 7 built-in — sliding window por IP |
| Observabilidade | Sentry (ativa quando `Sentry:Dsn` estiver configurado) |
| Testes unitários | xUnit + NSubstitute + FluentAssertions |
| Testes integração | Testcontainers.PostgreSql + WebApplicationFactory |
| CI/CD | GitHub Actions → Railway (Dockerfile, migrate on startup) |

---

## Arquitetura

```
service-orders-saas/
├── src/
│   ├── ServiceOrders.Domain/           # Entidades, enums, interfaces, DomainException
│   ├── ServiceOrders.Application/      # Use cases (MediatR CQRS), DTOs, validações
│   ├── ServiceOrders.Infrastructure/   # EF Core, repositórios, Mercado Pago gateway, Polly
│   └── ServiceOrders.Api/              # Controllers, JWT auth, Rate Limiting, DI root
├── tests/
│   ├── ServiceOrders.UnitTests/        # 29 testes — domínio, handlers, validators
│   └── ServiceOrders.IntegrationTests/ # 6 testes — banco real via Testcontainers
└── web/                                # Next.js 15 frontend (proxy reverso → API)
```

Fluxo de dependência: `API → Application → Domain ← Infrastructure`

A camada de Domínio não conhece nenhuma outra — é o núcleo imutável do sistema.

---

## Decisões técnicas

### Multi-tenancy com Global Query Filters

Banco compartilhado com coluna `TenantId` em todas as tabelas. O `AppDbContext` aplica `HasQueryFilter` automaticamente — nenhum repositório precisa filtrar manualmente. O `TenantId` é extraído do claim `tenant_id` do JWT via `HttpContextTenantContext`.

Isolamento provado por teste automatizado: Tenant B não consegue ver orders do Tenant A, mesmo num banco compartilhado.

### Máquina de estados explícita no domínio

```
Draft → Pending → Paid
       ↘ Cancelled
```

Transições são métodos na entidade (`Submit()`, `MarkAsPaid()`, `Cancel()`). Qualquer chamada inválida lança `DomainException`. Não há `if/switch` nos handlers — o domínio é a única fonte de verdade sobre o que é permitido.

### Idempotência em pagamentos

Cada cobrança tem uma `IdempotencyKey` gerada a partir do `OrderId`, enviada como header `X-Idempotency-Key` para o Mercado Pago e salva com índice único filtrado. Reenvios de webhook ou retries não criam cobranças duplicadas.

### CQRS via MediatR

Controllers não injetam repositórios diretamente. Toda lógica passa por `IMediator.Send()`:
- **Commands** — CreateServiceOrder, SubmitPayment, CancelServiceOrder, MarkAsPaid
- **Queries** — ListServiceOrders (paginado + filtros), GetServiceOrder, GetServiceOrderStats, ExportServiceOrdersCsv

### Paginação com metadados

Todas as listagens retornam `PagedResult<T>` com `items`, `totalCount`, `page`, `pageSize`, `hasNext` e `hasPrevious`. O frontend usa esses campos para montar navegação sem cálculo extra.

### Resiliência com Polly

O `HttpClient` do gateway Mercado Pago tem duas políticas encadeadas:
- **Retry exponencial** — 3 tentativas, backoff de 2 s, 4 s, 8 s
- **Circuit Breaker** — abre após 5 falhas consecutivas, permanece aberto por 30 s

### Rate Limiting (.NET 7 built-in)

- Endpoint geral: sliding window 60 req/min por IP (6 segmentos de 10 s)
- Endpoint `/api/auth`: sliding window 10 req/min por IP — proteção contra brute-force

---

## Como rodar localmente

**Pré-requisitos:** Docker Desktop, .NET 7 SDK, Node.js 18+

```bash
# 1. Subir banco PostgreSQL
docker-compose up postgres -d

# 2. Rodar a API  (http://localhost:5000 · Swagger em /swagger)
cd src/ServiceOrders.Api
dotnet run

# 3. Rodar o frontend  (http://localhost:3000)
cd web
npm install
npm run dev
```

### Variáveis de ambiente necessárias (API)

| Variável | Descrição |
|---|---|
| `DATABASE_URL` | Connection string PostgreSQL (Railway auto-injeta) |
| `Jwt__Secret` | Chave HMAC ≥ 32 caracteres para assinatura JWT |
| `MercadoPago__AccessToken` | Token de acesso do Mercado Pago |
| `MercadoPago__WebhookSecret` | Secret para validação HMAC-SHA256 do webhook |
| `Cors__AllowedOrigins` | Origens permitidas, separadas por vírgula |
| `Sentry__Dsn` | DSN do Sentry (opcional — ativa monitoramento de erros) |

### Testes

```bash
# Unitários (rápidos, sem Docker)
dotnet test tests/ServiceOrders.UnitTests

# Integração (sobe PostgreSQL real via Testcontainers)
dotnet test tests/ServiceOrders.IntegrationTests
```

---

## Fluxo principal de uso

1. `POST /api/auth/login` → recebe JWT com `tenant_id` embutido
2. `POST /api/serviceorders` → cria ordem (status `Draft`)
3. `POST /api/serviceorders/{id}/submit-payment` → gera cobrança Pix (status → `Pending`, retorna `pixQrCode`)
4. `POST /api/webhooks/mercadopago` → confirmação Mercado Pago (status → `Paid`)
5. `POST /api/serviceorders/{id}/cancel` → cancela ordem `Draft` ou `Pending`

---

## Endpoints

| Método | Rota | Auth | Descrição |
|---|---|---|---|
| `POST` | `/api/auth/login` | — | Emite JWT com tenant_id |
| `GET` | `/api/serviceorders` | JWT | Lista paginada (filtros: status, from, to) |
| `GET` | `/api/serviceorders/{id}` | JWT | Detalhe da ordem (404 se outro tenant) |
| `POST` | `/api/serviceorders` | JWT | Criar ordem |
| `POST` | `/api/serviceorders/{id}/submit-payment` | JWT | Gerar cobrança Pix |
| `POST` | `/api/serviceorders/{id}/cancel` | JWT | Cancelar ordem Draft/Pending |
| `GET` | `/api/serviceorders/stats` | JWT | Contagem e total por status (charts) |
| `GET` | `/api/serviceorders/export` | JWT | Exportar CSV (filtros: status, from, to) |
| `POST` | `/api/webhooks/mercadopago` | HMAC | Receber evento de pagamento |
| `GET` | `/health` | — | Health check |

### Parâmetros de listagem

```
GET /api/serviceorders?page=1&pageSize=20&status=Pending&from=2024-01-01&to=2024-12-31
```

---

## Frontend — funcionalidades

| Feature | Detalhe |
|---|---|
| Dashboard paginado | Tabela clicável com badges de status, paginação, empty states |
| Filtros | Por status e intervalo de datas — reseta para página 1 automaticamente |
| Exportar CSV | Download via Axios (blob) com filtros ativos aplicados |
| Charts | Donut (contagem por status) + barras (valor por status) com Recharts |
| Página de detalhe | `/dashboard/[id]` — título, valor, status, descrição, datas, botões de ação |
| Toast notifications | Sistema próprio (sem biblioteca) — success, error, info, auto-dismiss |
| Proxy reverso | Rota `/api/proxy/[...path]` no Next.js — elimina CORS em produção |

---

## CI/CD

```
push → main
  └─ GitHub Actions
       ├── dotnet test (unit)
       ├── dotnet test (integration — PostgreSQL service container)
       └── railway deploy (requer RAILWAY_TOKEN no GitHub Secrets)
```

Deploy automático no Railway após testes passarem. Migrations são aplicadas no startup da API.

---

*Clean Architecture · CQRS · Multi-tenancy · 35 testes · CI/CD*
