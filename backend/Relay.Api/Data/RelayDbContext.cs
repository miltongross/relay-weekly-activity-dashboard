using Microsoft.EntityFrameworkCore;
using Relay.Api.Models;

namespace Relay.Api.Data;

public class RelayDbContext : DbContext
{
    public RelayDbContext(DbContextOptions<RelayDbContext> options) : base(options)
    {
    }

    public DbSet<Account> Accounts => Set<Account>();
    public DbSet<ActivityEvent> ActivityEvents => Set<ActivityEvent>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Account>(entity =>
        {
            entity.ToTable("accounts");
            entity.HasKey(a => a.Id);
            entity.Property(a => a.Id).HasColumnName("id").ValueGeneratedNever();
            entity.Property(a => a.Name).HasColumnName("name").HasMaxLength(120).IsRequired();
            entity.Property(a => a.Industry).HasColumnName("industry").HasMaxLength(60).IsRequired();
            entity.Property(a => a.Timezone).HasColumnName("timezone").HasMaxLength(60).IsRequired();
            entity.Property(a => a.CreatedAt).HasColumnName("created_at").HasColumnType("datetime2").IsRequired();
        });

        modelBuilder.Entity<ActivityEvent>(entity =>
        {
            entity.ToTable("activity_events");
            entity.HasKey(e => e.Id);
            entity.Property(e => e.Id).HasColumnName("id").ValueGeneratedNever();
            entity.Property(e => e.AccountId).HasColumnName("account_id").IsRequired();
            entity.Property(e => e.Location).HasColumnName("location").HasMaxLength(80).IsRequired();
            entity.Property(e => e.EventType).HasColumnName("event_type").HasMaxLength(40).IsRequired();
            entity.Property(e => e.OccurredAt).HasColumnName("occurred_at").HasColumnType("datetime2").IsRequired();
            entity.Property(e => e.DurationSeconds).HasColumnName("duration_seconds");
            entity.Property(e => e.Outcome).HasColumnName("outcome").HasMaxLength(40);

            entity.HasOne(e => e.Account)
                .WithMany(a => a.ActivityEvents)
                .HasForeignKey(e => e.AccountId)
                .OnDelete(DeleteBehavior.Restrict);
        });
    }
}
