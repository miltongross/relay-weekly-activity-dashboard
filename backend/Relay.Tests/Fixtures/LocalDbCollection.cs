using Xunit;

namespace Relay.Tests.Fixtures;

[CollectionDefinition(Name)]
public class LocalDbCollection : ICollectionFixture<LocalDbFixture>
{
    public const string Name = "LocalDb collection";
}
