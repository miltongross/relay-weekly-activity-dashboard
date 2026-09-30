using Microsoft.EntityFrameworkCore;
using Relay.Api.Models;
using Relay.Tests.Fixtures;
using Xunit;

namespace Relay.Tests;

// Verifies the InitialCreate migration against a real, ephemeral SQL Server (LocalDB) database.
// Uses isolated fixture rows only; the supplied seed dataset is never loaded or altered here.
[Collection(LocalDbCollection.Name)]
public class RelayDbContextMigrationTests
{
    private readonly LocalDbFixture _fixture;

    public RelayDbContextMigrationTests(LocalDbFixture fixture)
    {
        _fixture = fixture;
    }

    [Fact]
    public async Task Migration_CreatesAccountsAndActivityEventsTables()
    {
        await using var context = _fixture.CreateContext();

        var tableNames = await context.Database
            .SqlQueryRaw<string>("SELECT name AS [Value] FROM sys.tables")
            .ToListAsync();

        Assert.Contains("accounts", tableNames);
        Assert.Contains("activity_events", tableNames);
    }

    [Fact]
    public async Task AccountAndActivityEvent_RoundTrip_PreservesExplicitIdsAndNullableColumns()
    {
        await using var context = _fixture.CreateContext();
        var account = new Account
        {
            Id = 1001,
            Name = "Fixture Account",
            Industry = "Testing",
            Timezone = "UTC",
            CreatedAt = new DateTime(2026, 1, 1, 0, 0, 0, DateTimeKind.Utc)
        };
        context.Accounts.Add(account);
        context.ActivityEvents.Add(new ActivityEvent
        {
            Id = 2001,
            AccountId = account.Id,
            Location = "Fixture Site",
            EventType = "lead_created",
            OccurredAt = new DateTime(2026, 3, 2, 12, 0, 0, DateTimeKind.Utc),
            DurationSeconds = null,
            Outcome = null
        });

        await context.SaveChangesAsync();

        await using var verifyContext = _fixture.CreateContext();
        var savedAccount = await verifyContext.Accounts.AsNoTracking().SingleAsync(a => a.Id == 1001);
        var savedEvent = await verifyContext.ActivityEvents.AsNoTracking().SingleAsync(e => e.Id == 2001);

        Assert.Equal("Fixture Account", savedAccount.Name);
        Assert.Null(savedEvent.DurationSeconds);
        Assert.Null(savedEvent.Outcome);
    }

    [Fact]
    public async Task ActivityEvent_WithUnknownAccountId_ViolatesForeignKeyConstraint()
    {
        await using var context = _fixture.CreateContext();
        context.ActivityEvents.Add(new ActivityEvent
        {
            Id = 3001,
            AccountId = 999999,
            Location = "Fixture Site",
            EventType = "call_received",
            OccurredAt = DateTime.UtcNow
        });

        await Assert.ThrowsAsync<DbUpdateException>(() => context.SaveChangesAsync());
    }
}
