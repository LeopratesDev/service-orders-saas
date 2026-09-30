import { defineRailway, project, service, database } from "railway/iac";

export const partial = "service-orders-saas";

export default defineRailway(() => {
  const postgres = database("Postgres");

  const api = service("service-orders-saas", {
    build: {
      builder: "dockerfile",
      dockerfilePath: "src/ServiceOrders.Api/Dockerfile",
    },
    start: "dotnet ServiceOrders.Api.dll",
    healthcheck: "/health",
    variables: {
      DATABASE_URL: postgres.databaseUrl,
    },
  });

  return project("amused-enthusiasm", {
    resources: [postgres, api],
  });
});
