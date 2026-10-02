FROM mcr.microsoft.com/dotnet/aspnet:7.0 AS base
WORKDIR /app
EXPOSE 8080
ENV ASPNETCORE_URLS=http://+:8080

FROM mcr.microsoft.com/dotnet/sdk:7.0 AS build
WORKDIR /src
COPY ["src/ServiceOrders.Api/ServiceOrders.Api.csproj", "src/ServiceOrders.Api/"]
COPY ["src/ServiceOrders.Application/ServiceOrders.Application.csproj", "src/ServiceOrders.Application/"]
COPY ["src/ServiceOrders.Infrastructure/ServiceOrders.Infrastructure.csproj", "src/ServiceOrders.Infrastructure/"]
COPY ["src/ServiceOrders.Domain/ServiceOrders.Domain.csproj", "src/ServiceOrders.Domain/"]
RUN dotnet restore "src/ServiceOrders.Api/ServiceOrders.Api.csproj"
COPY . .
RUN dotnet build "src/ServiceOrders.Api/ServiceOrders.Api.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "src/ServiceOrders.Api/ServiceOrders.Api.csproj" -c Release -o /app/publish

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "ServiceOrders.Api.dll"]
