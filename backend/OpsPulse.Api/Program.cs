using Microsoft.EntityFrameworkCore;
using OpsPulse.Api.Analysis;
using OpsPulse.Api.Data;
using OpsPulse.Api.Services;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers()
    .AddJsonOptions(options =>
        options.JsonSerializerOptions.Converters.Add(
            new System.Text.Json.Serialization.JsonStringEnumConverter()));
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// Database: PostgreSQL when a connection string is configured (customer/
// production deployments), otherwise a local SQLite file so the demo runs
// with zero setup. SQLite mode creates and seeds the demo database on start.
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection");
var usingPostgres = !string.IsNullOrWhiteSpace(connectionString);
if (usingPostgres)
{
    builder.Services.AddDbContext<OpsPulseDbContext>(options =>
        options.UseNpgsql(connectionString));
}
else
{
    var sqlitePath = builder.Configuration.GetValue<string>("Demo:SqlitePath")
                     ?? "opspulse-demo.db";
    builder.Services.AddDbContext<OpsPulseDbContext>(options =>
        options.UseSqlite($"Data Source={sqlitePath}"));
}

builder.Services.AddScoped<IRedactionService, RedactionService>();
builder.Services.AddScoped<IIncidentAnalysisService>(sp =>
{
    var configuration = sp.GetRequiredService<IConfiguration>();
    return string.IsNullOrWhiteSpace(configuration["Gemini:ApiKey"])
        ? new SimulatedIncidentAnalysisService(
            sp.GetService<OpsPulseDbContext>(),
            sp.GetRequiredService<IRedactionService>())
        : new IncidentAnalysisService(configuration);
});

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

// Demo convenience: the zero-config SQLite database is created and seeded
// with synthetic incidents automatically. PostgreSQL deployments apply
// migrations deliberately through their own release process instead.
using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetService<OpsPulseDbContext>();
    if (db is not null && db.Database.IsSqlite())
    {
        await db.Database.EnsureCreatedAsync();
        await DemoSeeder.SeedAsync(db);
    }
}

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("Frontend");

// Hosted demo: serve the built React frontend from wwwroot so the whole app
// is reachable at one URL. In local dev the Vite dev server is used instead.
app.UseDefaultFiles();
app.UseStaticFiles();

app.MapGet("/api/health", () => Results.Ok(new
{
    status = "healthy",
    service = "OpsPulse.Api",
    database = usingPostgres ? "postgresql" : "sqlite-demo",
    timestampUtc = DateTime.UtcNow
}));
app.MapControllers();
app.MapFallbackToFile("index.html");

app.Run();
