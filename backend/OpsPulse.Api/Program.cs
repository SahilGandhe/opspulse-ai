using Microsoft.EntityFrameworkCore;
using OpsPulse.Api.Data;
using OpsPulse.Api.Services;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
if (!string.IsNullOrWhiteSpace(connectionString))
{
    builder.Services.AddDbContext<OpsPulseDbContext>(options =>
        options.UseNpgsql(connectionString));
}

builder.Services.AddScoped<IIncidentAnalysisService, IncidentAnalysisService>();

builder.Services.AddCors(options =>
{
    options.AddPolicy("Frontend", policy =>
    {
        var origins = builder.Configuration.GetSection("Cors:AllowedOrigins").Get<string[]>()
                      ?? ["http://localhost:5173"];
        policy.WithOrigins(origins).AllowAnyHeader().AllowAnyMethod();
    });
});

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("Frontend");
app.MapGet("/api/health", () => Results.Ok(new
{
    status = "healthy",
    service = "OpsPulse.Api",
    timestampUtc = DateTimeOffset.UtcNow
}));
app.MapControllers();

app.Run();
