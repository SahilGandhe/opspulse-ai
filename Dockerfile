# Build and publish the ASP.NET Core API.
FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src
COPY backend/OpsPulse.Api/OpsPulse.Api.csproj backend/OpsPulse.Api/
RUN dotnet restore backend/OpsPulse.Api/OpsPulse.Api.csproj
COPY backend/OpsPulse.Api/ backend/OpsPulse.Api/
RUN dotnet publish backend/OpsPulse.Api/OpsPulse.Api.csproj -c Release -o /app/publish /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS final
WORKDIR /app
ENV ASPNETCORE_URLS=http://0.0.0.0:8080
EXPOSE 8080
COPY --from=build /app/publish .
ENTRYPOINT ["dotnet", "OpsPulse.Api.dll"]
