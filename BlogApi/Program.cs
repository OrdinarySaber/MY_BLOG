using System.Text.Json;
using Microsoft.AspNetCore.Cors;
using System.Text.Json.Serialization;
using System.Security.Cryptography;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});

var basePath = Directory.GetParent(AppDomain.CurrentDomain.BaseDirectory)?.Parent?.Parent?.Parent?.Parent?.FullName ?? Directory.GetCurrentDirectory();
var port = builder.Configuration.GetValue<int>("ServerPort", 5096);
builder.WebHost.UseUrls($"http://0.0.0.0:{port}");
var docsPath = Path.Combine(basePath, "docs");
var configPath = Path.Combine(basePath, "config.js");
var usersFilePath = Path.Combine(basePath, "BlogApi", "users.json");
var sessionsFilePath = Path.Combine(basePath, "BlogApi", "sessions.json");
var commentsFilePath = Path.Combine(basePath, "BlogApi", "comments.json");

var app = builder.Build();

app.UseCors();

Console.WriteLine($"Base path: {basePath}");
Console.WriteLine($"Docs path: {docsPath}");
Console.WriteLine($"");
Console.WriteLine($"========================================");
Console.WriteLine($"  服务器已启动！");
Console.WriteLine($"  请在浏览器访问: http://localhost:5096");
Console.WriteLine($"========================================");
Console.WriteLine($"");

InitializeUsersFile();

app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new Microsoft.Extensions.FileProviders.PhysicalFileProvider(basePath),
    RequestPath = ""
});

app.MapGet("/", () => Results.Redirect("/index.html"));

void InitializeUsersFile()
{
    if (!File.Exists(usersFilePath))
    {
        var defaultUsers = new List<User>
        {
            new User
            {
                Id = 1,
                Username = "admin",
                PasswordHash = HashPassword("admin123"),
                IsAdmin = true,
                CreatedAt = DateTime.Now
            }
        };
        var directory = Path.GetDirectoryName(usersFilePath);
        if (!string.IsNullOrEmpty(directory) && !Directory.Exists(directory))
        {
            Directory.CreateDirectory(directory);
        }
        var json = JsonSerializer.Serialize(defaultUsers, new JsonSerializerOptions { WriteIndented = true });
        File.WriteAllText(usersFilePath, json);
        Console.WriteLine("已创建默认管理员账户: admin / admin123");
        Console.WriteLine("请登录后立即修改密码！");
    }
}

string HashPassword(string password)
{
    using (var sha256 = SHA256.Create())
    {
        var bytes = sha256.ComputeHash(Encoding.UTF8.GetBytes(password + "blog_salt_2024"));
        return Convert.ToBase64String(bytes);
    }
}

List<User> LoadUsers()
{
    try
    {
        if (File.Exists(usersFilePath))
        {
            var json = File.ReadAllText(usersFilePath);
            return JsonSerializer.Deserialize<List<User>>(json) ?? new List<User>();
        }
    }
    catch (Exception ex)
    {
        Console.WriteLine($"Error loading users: {ex.Message}");
    }
    return new List<User>();
}

void SaveUsers(List<User> users)
{
    var directory = Path.GetDirectoryName(usersFilePath);
    if (!string.IsNullOrEmpty(directory) && !Directory.Exists(directory))
    {
        Directory.CreateDirectory(directory);
    }
    var json = JsonSerializer.Serialize(users, new JsonSerializerOptions { WriteIndented = true });
    File.WriteAllText(usersFilePath, json);
}

List<Session> LoadSessions()
{
    try
    {
        if (File.Exists(sessionsFilePath))
        {
            var json = File.ReadAllText(sessionsFilePath);
            return JsonSerializer.Deserialize<List<Session>>(json) ?? new List<Session>();
        }
    }
    catch (Exception ex)
    {
        Console.WriteLine($"Error loading sessions: {ex.Message}");
    }
    return new List<Session>();
}

void SaveSessions(List<Session> sessions)
{
    var directory = Path.GetDirectoryName(sessionsFilePath);
    if (!string.IsNullOrEmpty(directory) && !Directory.Exists(directory))
    {
        Directory.CreateDirectory(directory);
    }
    var json = JsonSerializer.Serialize(sessions, new JsonSerializerOptions { WriteIndented = true });
    File.WriteAllText(sessionsFilePath, json);
}

string GenerateToken()
{
    using (var rng = RandomNumberGenerator.Create())
    {
        var bytes = new byte[32];
        rng.GetBytes(bytes);
        return Convert.ToBase64String(bytes).Replace("/", "_").Replace("+", "-");
    }
}

User? ValidateToken(string? token)
{
    if (string.IsNullOrEmpty(token)) return null;
    
    var sessions = LoadSessions();
    var session = sessions.FirstOrDefault(s => s.Token == token && s.ExpiresAt > DateTime.Now);
    if (session == null) return null;
    
    var users = LoadUsers();
    return users.FirstOrDefault(u => u.Id == session.UserId);
}

app.MapPost("/api/auth/login", (LoginRequest request) =>
{
    var users = LoadUsers();
    var user = users.FirstOrDefault(u => u.Username == request.Username);
    
    if (user == null || user.PasswordHash != HashPassword(request.Password))
    {
        return Results.Unauthorized();
    }
    
    var token = GenerateToken();
    var sessions = LoadSessions();
    sessions.Add(new Session
    {
        Token = token,
        UserId = user.Id,
        ExpiresAt = DateTime.Now.AddDays(7)
    });
    SaveSessions(sessions);
    
    Console.WriteLine($"用户 {user.Username} 登录成功");
    
    return Results.Ok(new { 
        token, 
        user = new { 
            id = user.Id, 
            username = user.Username, 
            isAdmin = user.IsAdmin 
        } 
    });
});

app.MapPost("/api/auth/logout", (HttpRequest request) =>
{
    var token = request.Headers["Authorization"].FirstOrDefault()?.Replace("Bearer ", "");
    if (!string.IsNullOrEmpty(token))
    {
        var sessions = LoadSessions();
        sessions.RemoveAll(s => s.Token == token);
        SaveSessions(sessions);
    }
    return Results.Ok(new { success = true });
});

app.MapGet("/api/auth/me", (HttpRequest request) =>
{
    var token = request.Headers["Authorization"].FirstOrDefault()?.Replace("Bearer ", "");
    var user = ValidateToken(token);
    
    if (user == null)
    {
        return Results.Unauthorized();
    }
    
    return Results.Ok(new { 
        id = user.Id, 
        username = user.Username, 
        isAdmin = user.IsAdmin 
    });
});

app.MapPost("/api/auth/change-password", (HttpRequest request, ChangePasswordRequest body) =>
{
    var token = request.Headers["Authorization"].FirstOrDefault()?.Replace("Bearer ", "");
    var user = ValidateToken(token);
    
    if (user == null)
    {
        return Results.Unauthorized();
    }
    
    if (user.PasswordHash != HashPassword(body.OldPassword))
    {
        return Results.BadRequest(new { error = "原密码错误" });
    }
    
    var users = LoadUsers();
    var dbUser = users.FirstOrDefault(u => u.Id == user.Id);
    if (dbUser != null)
    {
        dbUser.PasswordHash = HashPassword(body.NewPassword);
        SaveUsers(users);
        Console.WriteLine($"用户 {user.Username} 修改了密码");
    }
    
    return Results.Ok(new { success = true, message = "密码修改成功" });
});

app.MapGet("/api/users", (HttpRequest request) =>
{
    var token = request.Headers["Authorization"].FirstOrDefault()?.Replace("Bearer ", "");
    var user = ValidateToken(token);
    
    if (user == null || !user.IsAdmin)
    {
        return Results.Unauthorized();
    }
    
    var users = LoadUsers();
    return Results.Ok(users.Select(u => new { 
        id = u.Id, 
        username = u.Username, 
        isAdmin = u.IsAdmin,
        createdAt = u.CreatedAt
    }));
});

app.MapPost("/api/users", (HttpRequest request, CreateUserRequest body) =>
{
    var token = request.Headers["Authorization"].FirstOrDefault()?.Replace("Bearer ", "");
    var user = ValidateToken(token);
    
    if (user == null || !user.IsAdmin)
    {
        return Results.Unauthorized();
    }
    
    var users = LoadUsers();
    if (users.Any(u => u.Username == body.Username))
    {
        return Results.BadRequest(new { error = "用户名已存在" });
    }
    
    var newUser = new User
    {
        Id = users.Count > 0 ? users.Max(u => u.Id) + 1 : 1,
        Username = body.Username,
        PasswordHash = HashPassword(body.Password),
        IsAdmin = body.IsAdmin,
        CreatedAt = DateTime.Now
    };
    users.Add(newUser);
    SaveUsers(users);
    
    Console.WriteLine($"管理员 {user.Username} 创建了新用户: {newUser.Username}");
    
    return Results.Ok(new { 
        id = newUser.Id, 
        username = newUser.Username, 
        isAdmin = newUser.IsAdmin 
    });
});

app.MapDelete("/api/users/{id:int}", (HttpRequest request, int id) =>
{
    var token = request.Headers["Authorization"].FirstOrDefault()?.Replace("Bearer ", "");
    var user = ValidateToken(token);
    
    if (user == null || !user.IsAdmin)
    {
        return Results.Unauthorized();
    }
    
    if (user.Id == id)
    {
        return Results.BadRequest(new { error = "不能删除自己的账户" });
    }
    
    var users = LoadUsers();
    var targetUser = users.FirstOrDefault(u => u.Id == id);
    if (targetUser == null)
    {
        return Results.NotFound(new { error = "用户不存在" });
    }
    
    users.Remove(targetUser);
    SaveUsers(users);
    
    var sessions = LoadSessions();
    sessions.RemoveAll(s => s.UserId == id);
    SaveSessions(sessions);
    
    Console.WriteLine($"管理员 {user.Username} 删除了用户: {targetUser.Username}");
    
    return Results.Ok(new { success = true });
});

app.MapPut("/api/users/{id:int}/admin", (HttpRequest request, int id, SetAdminRequest body) =>
{
    var token = request.Headers["Authorization"].FirstOrDefault()?.Replace("Bearer ", "");
    var user = ValidateToken(token);
    
    if (user == null || !user.IsAdmin)
    {
        return Results.Unauthorized();
    }
    
    if (user.Id == id)
    {
        return Results.BadRequest(new { error = "不能修改自己的管理员权限" });
    }
    
    var users = LoadUsers();
    var targetUser = users.FirstOrDefault(u => u.Id == id);
    if (targetUser == null)
    {
        return Results.NotFound(new { error = "用户不存在" });
    }
    
    targetUser.IsAdmin = body.IsAdmin;
    SaveUsers(users);
    
    Console.WriteLine($"管理员 {user.Username} 将用户 {targetUser.Username} 的管理员权限设置为: {body.IsAdmin}");
    
    return Results.Ok(new { success = true });
});

app.MapGet("/api/documents", async () =>
{
    try
    {
        if (!File.Exists(configPath))
        {
            return Results.Ok(new List<object>());
        }
        
        var configContent = await File.ReadAllTextAsync(configPath);
        
        var documentsMatch = System.Text.RegularExpressions.Regex.Match(
            configContent,
            @"documents\s*:\s*\[([\s\S]*?)\n\s*\]",
            System.Text.RegularExpressions.RegexOptions.IgnoreCase
        );

        if (!documentsMatch.Success)
        {
            Console.WriteLine("未找到 documents 数组");
            return Results.Ok(new List<object>());
        }

        var docsJson = "[" + documentsMatch.Groups[1].Value.Trim() + "]";
        
        docsJson = System.Text.RegularExpressions.Regex.Replace(docsJson, @"//.*$", "", System.Text.RegularExpressions.RegexOptions.Multiline);
        docsJson = System.Text.RegularExpressions.Regex.Replace(docsJson, @"\s+", " ");
        docsJson = System.Text.RegularExpressions.Regex.Replace(docsJson, @"([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)\s*:", "$1\"$2\":");
        
        try
        {
            var docs = JsonSerializer.Deserialize<List<JsonElement>>(docsJson);
            if (docs == null) return Results.Ok(new List<object>());
            
            var documents = new List<object>();
            foreach (var doc in docs)
            {
                var docObj = new Dictionary<string, object>();
                if (doc.TryGetProperty("id", out var idProp))
                    docObj["id"] = idProp.GetInt32();
                if (doc.TryGetProperty("title", out var titleProp))
                    docObj["title"] = titleProp.GetString() ?? "";
                if (doc.TryGetProperty("category", out var catProp))
                    docObj["category"] = catProp.GetString() ?? "uncategorized";
                if (doc.TryGetProperty("date", out var dateProp))
                    docObj["date"] = dateProp.GetString() ?? "";
                if (doc.TryGetProperty("description", out var descProp))
                    docObj["description"] = descProp.GetString() ?? "";
                if (doc.TryGetProperty("file", out var fileProp))
                    docObj["file"] = fileProp.GetString() ?? "";
                
                var tags = new List<string>();
                if (doc.TryGetProperty("tags", out var tagsProp))
                {
                    foreach (var tag in tagsProp.EnumerateArray())
                    {
                        tags.Add(tag.GetString() ?? "");
                    }
                }
                docObj["tags"] = tags;
                
                documents.Add(docObj);
            }
            return Results.Ok(documents);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"Parse error: {ex.Message}");
            return Results.Ok(new List<object>());
        }
    }
    catch (Exception ex)
    {
        Console.WriteLine($"Error: {ex.Message}");
        return Results.StatusCode(500);
    }
});

app.MapGet("/api/documents/{id:int}", async (int id) =>
{
    try
    {
        if (!File.Exists(configPath))
        {
            return Results.NotFound(new { error = "配置文件不存在" });
        }
        
        var configContent = await File.ReadAllTextAsync(configPath);
        
        var documentsMatch = System.Text.RegularExpressions.Regex.Match(
            configContent,
            @"documents\s*:\s*\[([\s\S]*?)\n\s*\]",
            System.Text.RegularExpressions.RegexOptions.IgnoreCase
        );

        if (!documentsMatch.Success)
        {
            return Results.NotFound(new { error = "未找到文档列表" });
        }

        var docsJson = "[" + documentsMatch.Groups[1].Value.Trim() + "]";
        
        docsJson = System.Text.RegularExpressions.Regex.Replace(docsJson, @"//.*$", "", System.Text.RegularExpressions.RegexOptions.Multiline);
        docsJson = System.Text.RegularExpressions.Regex.Replace(docsJson, @"\s+", " ");
        docsJson = System.Text.RegularExpressions.Regex.Replace(docsJson, @"([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)\s*:", "$1\"$2\":");
        
        Console.WriteLine($"Fetching document {id}");
        
        List<JsonElement> docs;
        try
        {
            docs = JsonSerializer.Deserialize<List<JsonElement>>(docsJson);
        }
        catch (Exception ex)
        {
            Console.WriteLine($"JSON Parse Error: {ex.Message}");
            return Results.StatusCode(500);
        }
        
        if (docs == null || docs.Count == 0)
        {
            return Results.NotFound(new { error = "无法解析文档" });
        }
        
        JsonElement? targetDoc = null;
        foreach (var doc in docs)
        {
            if (doc.TryGetProperty("id", out var propId) && propId.GetInt32() == id)
            {
                targetDoc = doc;
                break;
            }
        }
        
        if (targetDoc == null)
        {
            return Results.NotFound(new { error = "文档不存在" });
        }
        
        var docEl = targetDoc.Value;
        
        if (docEl.TryGetProperty("file", out var filePathProp))
        {
            var filePath = filePathProp.GetString();
            if (!string.IsNullOrEmpty(filePath) && filePath.EndsWith(".md", StringComparison.OrdinalIgnoreCase))
            {
                var fullPath = Path.Combine(basePath, filePath);
                Console.WriteLine($"Looking for file: {fullPath}");
                if (File.Exists(fullPath))
                {
                    var content = await File.ReadAllTextAsync(fullPath);
                    var result = new Dictionary<string, object>();
                    result["id"] = id;
                    
                    if (docEl.TryGetProperty("title", out var t))
                        result["title"] = t.GetString() ?? "";
                    if (docEl.TryGetProperty("category", out var c))
                        result["category"] = c.GetString() ?? "";
                    if (docEl.TryGetProperty("date", out var d))
                        result["date"] = d.GetString() ?? "";
                    if (docEl.TryGetProperty("description", out var desc))
                        result["description"] = desc.GetString() ?? "";
                    if (docEl.TryGetProperty("file", out var f))
                        result["file"] = f.GetString() ?? "";
                    
                    var tags = new List<string>();
                    if (docEl.TryGetProperty("tags", out var tagsProp))
                    {
                        foreach (var tag in tagsProp.EnumerateArray())
                        {
                            tags.Add(tag.GetString() ?? "");
                        }
                    }
                    result["tags"] = tags;
                    result["content"] = content;
                    
                    Console.WriteLine($"Document {id} loaded successfully, content length: {content.Length}");
                    return Results.Ok(result);
                }
                else
                {
                    Console.WriteLine($"File not found: {fullPath}");
                }
            }
        }

        return Results.Ok(new { id = id, message = "PDF文件" });
    }
    catch (Exception ex)
    {
        Console.WriteLine($"Error getting document: {ex.Message}");
        return Results.StatusCode(500);
    }
});

app.MapPut("/api/documents/{id:int}", async (HttpRequest request, int id, DocumentUpdateRequest body) =>
{
    var token = request.Headers["Authorization"].FirstOrDefault()?.Replace("Bearer ", "");
    var user = ValidateToken(token);
    
    if (user == null || !user.IsAdmin)
    {
        return Results.Unauthorized();
    }
    
    try
    {
        if (!File.Exists(configPath))
        {
            return Results.NotFound(new { error = "配置文件不存在" });
        }
        
        var configContent = await File.ReadAllTextAsync(configPath);
        
        var documentsMatch = System.Text.RegularExpressions.Regex.Match(
            configContent,
            @"documents\s*:\s*\[([\s\S]*?)\n\s*\]",
            System.Text.RegularExpressions.RegexOptions.IgnoreCase
        );

        if (!documentsMatch.Success)
        {
            return Results.NotFound(new { error = "未找到文档列表" });
        }

        var docsJson = "[" + documentsMatch.Groups[1].Value.Trim() + "]";
        docsJson = System.Text.RegularExpressions.Regex.Replace(docsJson, @"//.*$", "", System.Text.RegularExpressions.RegexOptions.Multiline);
        docsJson = System.Text.RegularExpressions.Regex.Replace(docsJson, @"\s+", " ");
        docsJson = System.Text.RegularExpressions.Regex.Replace(docsJson, @"([{,]\s*)([a-zA-Z_][a-zA-Z0-9_]*)\s*:", "$1\"$2\":");
        
        var docs = JsonSerializer.Deserialize<List<JsonElement>>(docsJson);
        if (docs == null)
        {
            return Results.NotFound(new { error = "无法解析文档" });
        }
        
        var docIndex = -1;
        JsonElement doc = default;
        for (int i = 0; i < docs.Count; i++)
        {
            if (docs[i].TryGetProperty("id", out var propId) && propId.GetInt32() == id)
            {
                docIndex = i;
                doc = docs[i];
                break;
            }
        }

        if (docIndex == -1)
        {
            return Results.NotFound(new { error = "文档不存在" });
        }

        if (doc.TryGetProperty("file", out var filePathProp))
        {
            var filePath = filePathProp.GetString();
            if (!string.IsNullOrEmpty(filePath) && filePath.EndsWith(".md", StringComparison.OrdinalIgnoreCase))
            {
                var fullPath = Path.Combine(basePath, filePath);
                var directory = Path.GetDirectoryName(fullPath);
                if (!string.IsNullOrEmpty(directory) && !Directory.Exists(directory))
                {
                    Directory.CreateDirectory(directory);
                }
                await File.WriteAllTextAsync(fullPath, body.Content);
                Console.WriteLine($"管理员 {user.Username} 保存了文档 {id} 到 {fullPath}");
                return Results.Ok(new { success = true, message = "文档已保存" });
            }
        }

        return Results.BadRequest(new { error = "不支持编辑此类型文件" });
    }
    catch (Exception ex)
    {
        Console.WriteLine($"Error saving document: {ex.Message}");
        return Results.StatusCode(500);
    }
});

List<Comment> LoadComments()
{
    try
    {
        if (File.Exists(commentsFilePath))
        {
            var json = File.ReadAllText(commentsFilePath);
            return JsonSerializer.Deserialize<List<Comment>>(json) ?? new List<Comment>();
        }
    }
    catch (Exception ex)
    {
        Console.WriteLine($"Error loading comments: {ex.Message}");
    }
    return new List<Comment>();
}

void SaveComments(List<Comment> comments)
{
    var directory = Path.GetDirectoryName(commentsFilePath);
    if (!string.IsNullOrEmpty(directory) && !Directory.Exists(directory))
    {
        Directory.CreateDirectory(directory);
    }
    var json = JsonSerializer.Serialize(comments, new JsonSerializerOptions { WriteIndented = true });
    File.WriteAllText(commentsFilePath, json);
}

app.MapGet("/api/comments", () =>
{
    var comments = LoadComments();
    return Results.Ok(comments.OrderByDescending(c => c.CreatedAt));
});

app.MapGet("/api/comments/{docId:int}", (int docId) =>
{
    var comments = LoadComments()
        .Where(c => c.DocumentId == docId)
        .OrderByDescending(c => c.CreatedAt)
        .ToList();
    return Results.Ok(comments);
});

app.MapPost("/api/comments", (Comment comment) =>
{
    var comments = LoadComments();
    comment.Id = comments.Count > 0 ? comments.Max(c => c.Id) + 1 : 1;
    comment.CreatedAt = DateTime.Now;
    comments.Add(comment);
    SaveComments(comments);
    Console.WriteLine($"新评论来自: {comment.Author}");
    return Results.Created($"/api/comments/{comment.Id}", comment);
});

app.MapDelete("/api/comments/{id:int}", (HttpRequest request, int id) =>
{
    var token = request.Headers["Authorization"].FirstOrDefault()?.Replace("Bearer ", "");
    var user = ValidateToken(token);
    
    if (user == null || !user.IsAdmin)
    {
        return Results.Unauthorized();
    }
    
    var comments = LoadComments();
    var comment = comments.FirstOrDefault(c => c.Id == id);
    if (comment == null)
    {
        return Results.NotFound(new { error = "评论不存在" });
    }
    comments.Remove(comment);
    SaveComments(comments);
    Console.WriteLine($"管理员 {user.Username} 删除了评论 {id}");
    return Results.Ok(new { success = true });
});

app.Run();

public class User
{
    public int Id { get; set; }
    public string Username { get; set; } = "";
    public string PasswordHash { get; set; } = "";
    public bool IsAdmin { get; set; }
    public DateTime CreatedAt { get; set; }
}

public class Session
{
    public string Token { get; set; } = "";
    public int UserId { get; set; }
    public DateTime ExpiresAt { get; set; }
}

public class LoginRequest
{
    public string Username { get; set; } = "";
    public string Password { get; set; } = "";
}

public class ChangePasswordRequest
{
    public string OldPassword { get; set; } = "";
    public string NewPassword { get; set; } = "";
}

public class CreateUserRequest
{
    public string Username { get; set; } = "";
    public string Password { get; set; } = "";
    public bool IsAdmin { get; set; }
}

public class SetAdminRequest
{
    public bool IsAdmin { get; set; }
}

public class DocumentUpdateRequest
{
    public string Content { get; set; } = "";
}

public class Comment
{
    public int Id { get; set; }
    public int DocumentId { get; set; }
    public string Author { get; set; } = "";
    public string Content { get; set; } = "";
    public DateTime CreatedAt { get; set; }
}
