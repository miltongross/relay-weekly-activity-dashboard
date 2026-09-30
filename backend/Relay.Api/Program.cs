using System.Text.Json.Serialization;
using Microsoft.EntityFrameworkCore;
using Relay.Api.Data;
using Relay.Api.Endpoints;
using Relay.Api.Services;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.
// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddOpenApi();

builder.Services.AddDbContext<RelayDbContext>(options =>
    options.UseSqlServer(builder.Configuration.GetConnectionString("RelayDatabase")));

builder.Services.AddScoped<IWeeklyActivityService, WeeklyActivityService>();

builder.Services.ConfigureHttpJsonOptions(options =>
{
    options.SerializerOptions.Converters.Add(new JsonStringEnumConverter());
});

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseHttpsRedirection();

app.MapWeeklyActivityEndpoints();

app.Run();
