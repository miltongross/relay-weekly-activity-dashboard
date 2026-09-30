#Requires -Version 5.1
<#
.SYNOPSIS
    Repeatable local setup: apply the EF Core migration to a SQL Server database, then load the
    unchanged seed dataset (seed/schema.sql via migration, seed/seed.sql via sqlcmd).

.DESCRIPTION
    Intended for a fresh target database. Seed data is loaded once with plain INSERT statements
    (no upsert), so re-running against a database that already has seed rows will fail on duplicate
    keys. Pass -Force to drop and recreate the target database first.

.PARAMETER ServerInstance
    SQL Server instance for sqlcmd. Defaults to the local default instance (".").

.PARAMETER DatabaseName
    Target database name. Defaults to "Relay". Must not target a database you do not own; the
    script refuses to run against a non-empty database unless -Force is supplied.

.PARAMETER Force
    Drop the target database first if it already exists, then recreate it via migration.

.EXAMPLE
    ./backend/scripts/setup-local-db.ps1
    Run from the repo root. Applies the migration and loads the seed into a fresh "Relay"
    database on the default instance.
#>
param(
    [string]$ServerInstance = ".",
    [string]$DatabaseName = "Relay",
    [switch]$Force
)

$ErrorActionPreference = "Stop"

# Guard against SQL injection: DatabaseName is interpolated into T-SQL identifiers and literals below.
if ($DatabaseName -notmatch '^[A-Za-z][A-Za-z0-9_]*$') {
    throw "DatabaseName '$DatabaseName' is not valid. Use only letters, digits, and underscores, starting with a letter."
}

$repoRoot = Resolve-Path (Join-Path $PSScriptRoot "..\..")
$backendDir = Resolve-Path (Join-Path $PSScriptRoot "..")
$seedFile = Join-Path $repoRoot "seed\seed.sql"

if (-not (Test-Path $seedFile)) {
    throw "Seed file not found at $seedFile"
}

function Get-DatabaseRowCounts {
    param([string]$ServerInstance, [string]$DatabaseName)
    $result = sqlcmd -S $ServerInstance -d $DatabaseName -E -b -h -1 -W -Q "SET NOCOUNT ON; IF OBJECT_ID('accounts') IS NULL SELECT -1 ELSE SELECT COUNT(*) FROM accounts;"
    return [int]($result | Select-Object -First 1)
}

$dbExists = (sqlcmd -S $ServerInstance -E -b -h -1 -W -Q "SET NOCOUNT ON; SELECT COUNT(*) FROM sys.databases WHERE name = '$DatabaseName';" | Select-Object -First 1).Trim() -eq "1"

if ($dbExists) {
    $existingAccountCount = Get-DatabaseRowCounts -ServerInstance $ServerInstance -DatabaseName $DatabaseName
    if ($existingAccountCount -ne 0) {
        if (-not $Force) {
            throw "Database '$DatabaseName' already exists and is not provably empty (accounts rows: $existingAccountCount). Re-run with -Force to drop and recreate it, or choose a different -DatabaseName."
        }
        Write-Host "Dropping existing database '$DatabaseName' (accounts rows: $existingAccountCount) because -Force was supplied."
        sqlcmd -S $ServerInstance -E -b -Q "ALTER DATABASE [$DatabaseName] SET SINGLE_USER WITH ROLLBACK IMMEDIATE; DROP DATABASE [$DatabaseName];"
        if ($LASTEXITCODE -ne 0) { throw "Dropping database '$DatabaseName' failed with exit code $LASTEXITCODE" }
    }
}

Write-Host "Applying EF Core migration to '$DatabaseName' on '$ServerInstance'..."
# dotnet ef must run from backend/ so --project/--startup-project resolve against Relay.Api, and so it
# picks up the local tool from backend/dotnet-tools.json.
Push-Location $backendDir
try {
    $env:ConnectionStrings__RelayDatabase = "Data Source=$ServerInstance;Initial Catalog=$DatabaseName;Integrated Security=True;TrustServerCertificate=True;Encrypt=False"
    dotnet ef database update --project Relay.Api --startup-project Relay.Api
    if ($LASTEXITCODE -ne 0) { throw "dotnet ef database update failed with exit code $LASTEXITCODE" }
}
finally {
    Remove-Item Env:\ConnectionStrings__RelayDatabase -ErrorAction SilentlyContinue
    Pop-Location
}

Write-Host "Loading unchanged seed data from $seedFile ..."
sqlcmd -S $ServerInstance -d $DatabaseName -E -b -i $seedFile
if ($LASTEXITCODE -ne 0) { throw "sqlcmd seed load failed with exit code $LASTEXITCODE" }

$accountCount = [int](sqlcmd -S $ServerInstance -d $DatabaseName -E -b -h -1 -W -Q "SET NOCOUNT ON; SELECT COUNT(*) FROM accounts;" | Select-Object -First 1)
$eventCount = [int](sqlcmd -S $ServerInstance -d $DatabaseName -E -b -h -1 -W -Q "SET NOCOUNT ON; SELECT COUNT(*) FROM activity_events;" | Select-Object -First 1)
$orphanCount = [int](sqlcmd -S $ServerInstance -d $DatabaseName -E -b -h -1 -W -Q "SET NOCOUNT ON; SELECT COUNT(*) FROM activity_events e LEFT JOIN accounts a ON e.account_id = a.id WHERE a.id IS NULL;" | Select-Object -First 1)

Write-Host "accounts: $accountCount, activity_events: $eventCount, orphaned FKs: $orphanCount"
if ($accountCount -ne 20 -or $eventCount -ne 12626 -or $orphanCount -ne 0) {
    throw "Unexpected counts after seed load (expected 20 accounts, 12626 events, 0 orphaned FKs)."
}

Write-Host "Setup complete: '$DatabaseName' is migrated and seeded."
