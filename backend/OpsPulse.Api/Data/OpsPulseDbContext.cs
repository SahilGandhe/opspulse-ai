using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Storage.ValueConversion;
using OpsPulse.Api.Models;

namespace OpsPulse.Api.Data;

public sealed class OpsPulseDbContext(DbContextOptions<OpsPulseDbContext> options)
    : DbContext(options)
{
    public DbSet<Incident> Incidents => Set<Incident>();
    public DbSet<IncidentLog> IncidentLogs => Set<IncidentLog>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Incident>(entity =>
        {
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Title).HasMaxLength(160).IsRequired();
            entity.Property(x => x.ServiceName).HasMaxLength(120).IsRequired();
            entity.HasIndex(x => x.CreatedAt);
            entity.HasIndex(x => new { x.Status, x.Severity });
            entity.HasMany(x => x.Logs)
                .WithOne()
                .HasForeignKey(x => x.IncidentId)
                .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<IncidentLog>(entity =>
        {
            entity.HasKey(x => x.Id);
            entity.Property(x => x.Message).HasMaxLength(12000).IsRequired();
            entity.Property(x => x.Level).HasMaxLength(20).IsRequired();
            entity.HasIndex(x => new { x.IncidentId, x.CreatedAt });
        });

        // SQLite stores DateTime as text without timezone information, so
        // values come back with Kind=Unspecified and JSON clients would
        // misread them as local time. Treat database values as UTC so API
        // responses serialize with a trailing "Z".
        var dateTimeConverter = new ValueConverter<DateTime, DateTime>(
            v => v,
            v => DateTime.SpecifyKind(v, DateTimeKind.Utc));
        var nullableDateTimeConverter = new ValueConverter<DateTime?, DateTime?>(
            v => v,
            v => v.HasValue ? DateTime.SpecifyKind(v.Value, DateTimeKind.Utc) : v);

        foreach (var entityType in modelBuilder.Model.GetEntityTypes())
        {
            foreach (var property in entityType.GetProperties())
            {
                if (property.ClrType == typeof(DateTime))
                    property.SetValueConverter(dateTimeConverter);
                else if (property.ClrType == typeof(DateTime?))
                    property.SetValueConverter(nullableDateTimeConverter);
            }
        }
    }
    }
