namespace Relay.Api.Models;

// Mirrors the read-only seed schema in seed/schema.sql; ids are supplied by the seed data, not generated.
public class ActivityEvent
{
    public int Id { get; set; }
    public int AccountId { get; set; }
    public string Location { get; set; } = string.Empty;
    public string EventType { get; set; } = string.Empty;
    public DateTime OccurredAt { get; set; }
    public int? DurationSeconds { get; set; }
    public string? Outcome { get; set; }

    public Account? Account { get; set; }
}
