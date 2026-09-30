using Microsoft.Data.SqlClient;
using Microsoft.EntityFrameworkCore;
using Relay.Api.Data;

namespace Relay.Tests.Fixtures;

// Ephemeral LocalDB database, created fresh per test run and dropped afterward; never touches the shared "Relay" database or the seed files.
public class LocalDbFixture : IAsyncLifetime
{
    private const string LocalDbServer = @"(localdb)\MSSQLLocalDB";

    public string DatabaseName { get; } = $"RelayTests_{Guid.NewGuid():N}";

    private string ConnectionString =>
        $"Server={LocalDbServer};Database={DatabaseName};Integrated Security=True;TrustServerCertificate=True";

    private static string MasterConnectionString =>
        $"Server={LocalDbServer};Database=master;Integrated Security=True;TrustServerCertificate=True";

    public async Task InitializeAsync()
    {
        await using var context = CreateContext();
        await context.Database.MigrateAsync();
    }

    public async Task DisposeAsync()
    {
        await using var connection = new SqlConnection(MasterConnectionString);
        await connection.OpenAsync();
        await using var command = connection.CreateCommand();
        command.CommandText =
            $"IF DB_ID('{DatabaseName}') IS NOT NULL " +
            $"BEGIN ALTER DATABASE [{DatabaseName}] SET SINGLE_USER WITH ROLLBACK IMMEDIATE; DROP DATABASE [{DatabaseName}]; END";
        await command.ExecuteNonQueryAsync();
    }

    public RelayDbContext CreateContext()
    {
        var options = new DbContextOptionsBuilder<RelayDbContext>()
            .UseSqlServer(ConnectionString)
            .Options;
        return new RelayDbContext(options);
    }
}
