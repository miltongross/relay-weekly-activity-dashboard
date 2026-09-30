namespace Relay.Api.Models;

// Mirrors the read-only seed schema in seed/schema.sql; ids are supplied by the seed data, not generated.
public class Account
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string Industry { get; set; } = string.Empty;
    public string Timezone { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }

    public ICollection<ActivityEvent> ActivityEvents { get; set; } = new List<ActivityEvent>();
}
