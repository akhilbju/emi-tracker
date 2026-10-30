var builder = WebApplication.CreateBuilder(args);
builder.Services.AddCors(options => options.AddDefaultPolicy(policy =>
    policy.AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod()));
var app = builder.Build();
app.UseCors();
app.MapGet("/api/health", () => Results.Ok(new { status = "healthy", service = "EMI Tracker API" }));
app.Run();