# =============================================================================
# FEE-MENOUF Smart University Platform - Configuration Script
# =============================================================================
# Usage:
#   powershell -ExecutionPolicy Bypass -File scripts\configure.ps1
# =============================================================================

param(
    [switch]$Auto
)

$ErrorActionPreference = "Stop"

function Write-Step {
    param([string]$Message)
    Write-Host "`n══════════════════════════════════════════════════════════════" -ForegroundColor Cyan
    Write-Host "  $Message" -ForegroundColor Cyan
    Write-Host "══════════════════════════════════════════════════════════════`n" -ForegroundColor Cyan
}

function Write-Info {
    param([string]$Message)
    Write-Host "[INFO]  $Message" -ForegroundColor Green
}

function Write-Warn {
    param([string]$Message)
    Write-Host "[WARN]  $Message" -ForegroundColor Yellow
}

function Write-ErrorMsg {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor Red
}

function New-RandomHex {
    param([int]$Bytes = 32)
    $rng = New-Object System.Security.Cryptography.RNGCryptoServiceProvider
    $result = ""
    for ($i = 0; $i -lt $Bytes; $i++) {
        $single = New-Object byte[] 1
        $rng.GetBytes($single)
        $result += $single[0].ToString("x2")
    }
    return $result
}

function Update-FileBatch {
    param(
        [string]$FilePath,
        [hashtable]$Values
    )
    if (-not (Test-Path $FilePath)) {
        Write-Warn "File not found: $FilePath"
        return
    }
    $content = Get-Content $FilePath -Raw
    $changed = $false
    foreach ($kv in $Values.GetEnumerator()) {
        $pattern = "(?m)^$([regex]::Escape($kv.Key))=.*"
        if ($content -match $pattern) {
            $content = $content -replace $pattern, "$($kv.Key)=$($kv.Value)"
            Write-Info "Updated $($kv.Key) in $FilePath"
            $changed = $true
        }
    }
    if ($changed) {
        Set-Content $FilePath -Value $content -NoNewline
    }
}

function New-Backup {
    param([string]$FilePath)
    if (Test-Path $FilePath) {
        $backup = "$FilePath.backup"
        if (-not (Test-Path $backup)) {
            Copy-Item $FilePath $backup
            Write-Info "Backup created: $backup"
        }
    }
}

# =============================================================================
# START
# =============================================================================

Write-Host @"
  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
  ▓                                                             ▓
  ▓  FEE-MENOUF Smart University Platform                       ▓
  ▓  Configuration Script                                       ▓
  ▓                                                             ▓
  ▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓
"@ -ForegroundColor Green

$ProjectRoot = Split-Path -Parent (Split-Path -Parent $PSCommandPath)

# =============================================================================
# STEP 1: Collect user inputs
# =============================================================================

Write-Step "Step 1: Enter your API keys"

if (-not $Auto) {
    $openaiKey = Read-Host "  OpenAI API Key (press Enter to skip)"
    $smtpPass = Read-Host "  SMTP Password (press Enter to skip)"
    $googleMapsKey = Read-Host "  Google Maps API Key (press Enter to skip)"
    $domain = Read-Host "  Your domain name (e.g. fee-menouf.edu.eg, press Enter for localhost)"
}

# =============================================================================
# STEP 2: Generate random secrets
# =============================================================================

Write-Step "Step 2: Generating secure random secrets"

$jwtAccessSecret   = New-RandomHex 64
$jwtRefreshSecret  = New-RandomHex 64
$encryptionKey     = New-RandomHex 32
$csrfSecret        = New-RandomHex 16
$sessionSecret     = New-RandomHex 32
$dbPassword        = New-RandomHex 16
$minioPassword     = New-RandomHex 16
$redisPassword     = New-RandomHex 16

Write-Info "All secrets generated successfully."

# =============================================================================
# STEP 3: Configure .env (from .env.example)
# =============================================================================

Write-Step "Step 3: Configuring root .env"

$envFile = Join-Path $ProjectRoot ".env"
$envExample = Join-Path $ProjectRoot ".env.example"

if (Test-Path $envFile) {
    New-Backup $envFile
} else {
    if (Test-Path $envExample) {
        Copy-Item $envExample $envFile
        Write-Info "Created .env from .env.example"
    } else {
        Write-ErrorMsg ".env.example not found, skipping root .env"
    }
}

if (Test-Path $envFile) {
    $envValues = @{
        "DB_PASS"              = $dbPassword
        "JWT_ACCESS_SECRET"    = $jwtAccessSecret
        "JWT_REFRESH_SECRET"   = $jwtRefreshSecret
        "ENCRYPTION_KEY"       = $encryptionKey
        "SESSION_SECRET"       = $sessionSecret
        "CSRF_SECRET"          = $csrfSecret
        "MINIO_ROOT_PASSWORD"  = $minioPassword
        "REDIS_PASSWORD"       = $redisPassword
        "S3_ACCESS_KEY"        = (New-RandomHex 16)
        "S3_SECRET_KEY"        = (New-RandomHex 32)
    }

    if ($openaiKey)   { $envValues["OPENAI_API_KEY"] = $openaiKey }
    if ($smtpPass)    { $envValues["SMTP_PASS"] = $smtpPass }
    if ($googleMapsKey) { $envValues["GOOGLE_MAPS_API_KEY"] = $googleMapsKey }
    if ($domain) {
        $envValues["NEXT_PUBLIC_API_URL"] = "https://api.$domain"
        $envValues["NEXT_PUBLIC_WS_URL"]  = "wss://api.$domain"
        $envValues["NEXT_PUBLIC_APP_URL"] = "https://$domain"
        $envValues["CORS_ORIGINS"] = "https://$domain,https://admin.$domain"
    }

    Update-FileBatch -FilePath $envFile -Values $envValues
}

# =============================================================================
# STEP 4: Configure backend\.env
# =============================================================================

Write-Step "Step 4: Configuring backend\.env"

$backendEnv = Join-Path (Join-Path $ProjectRoot "backend") ".env"
New-Backup $backendEnv

$backendValues = @{
    "DB_PASSWORD"        = $dbPassword
    "JWT_SECRET"         = $jwtAccessSecret
    "JWT_REFRESH_SECRET" = $jwtRefreshSecret
    "ENCRYPTION_KEY"     = $encryptionKey
    "CSRF_SECRET"        = $csrfSecret
    "SESSION_SECRET"     = $sessionSecret
    "REDIS_PASSWORD"     = $redisPassword
    "MINIO_ROOT_PASSWORD" = $minioPassword
    "S3_ACCESS_KEY"      = (New-RandomHex 16)
    "S3_SECRET_KEY"      = (New-RandomHex 32)
}

if ($openaiKey)   { $backendValues["OPENAI_API_KEY"] = $openaiKey }
if ($smtpPass)    { $backendValues["SMTP_PASS"] = $smtpPass }
if ($googleMapsKey) { $backendValues["GOOGLE_MAPS_API_KEY"] = $googleMapsKey }

Update-FileBatch -FilePath $backendEnv -Values $backendValues

# =============================================================================
# STEP 5: Configure ai-engine\.env
# =============================================================================

Write-Step "Step 5: Configuring ai-engine\.env"

$aiEnv = Join-Path (Join-Path $ProjectRoot "ai-engine") ".env"
New-Backup $aiEnv

$aiValues = @{}
if ($openaiKey) { $aiValues["OPENAI_API_KEY"] = $openaiKey }
$dbUrl = "postgresql://postgres:$dbPassword@localhost:5432/fee_ai"
$aiValues["DATABASE_URL"] = $dbUrl
Update-FileBatch -FilePath $aiEnv -Values $aiValues

# =============================================================================
# STEP 6: Configure docker-compose.yml (domain)
# =============================================================================

if ($domain) {
    Write-Step "Step 6: Configuring docker-compose.yml with domain"

    $composeFile = Join-Path $ProjectRoot "docker-compose.yml"
    New-Backup $composeFile

    $compose = Get-Content $composeFile -Raw

    $compose = $compose -replace "https://api\.your-domain\.com", "https://api.$domain"
    $compose = $compose -replace "wss://api\.your-domain\.com", "wss://api.$domain"
    $compose = $compose -replace "storage\.your-domain\.com", "storage.$domain"

    Set-Content $composeFile -Value $compose -NoNewline
    Write-Info "Updated $composeFile with domain $domain"
} else {
    Write-Step "Step 6: Skipping domain configuration (localhost mode)"
}

# =============================================================================
# STEP 7: Configure nginx.conf (domain)
# =============================================================================

if ($domain) {
    Write-Step "Step 7: Configuring nginx.conf with domain"

    $nginxFile = Join-Path (Join-Path (Join-Path $ProjectRoot "docker") "nginx") "nginx.conf"
    New-Backup $nginxFile

    $nginx = Get-Content $nginxFile -Raw
    $nginx = $nginx -replace "your-domain\.com", $domain
    $nginx = $nginx -replace "api\.$domain\.$domain", "api.$domain"  # fix double domain if replacement happened twice

    Set-Content $nginxFile -Value $nginx -NoNewline
    Write-Info "Updated $nginxFile with domain $domain"
}

# =============================================================================
# DONE
# =============================================================================

Write-Step "Configuration Complete!"

Write-Host @"
  ${ProjectRoot}
"@ -ForegroundColor Green

Write-Host "  Summary:" -ForegroundColor Yellow
Write-Host "  ├─ .env                      " -NoNewline
if (Test-Path $envFile) { Write-Host "✓ Configured" -ForegroundColor Green } else { Write-Host "✗ Skipped" -ForegroundColor Red }
Write-Host "  ├─ backend\.env              " -NoNewline
if (Test-Path $backendEnv) { Write-Host "✓ Configured" -ForegroundColor Green } else { Write-Host "✗ Skipped" -ForegroundColor Red }
Write-Host "  ├─ ai-engine\.env            " -NoNewline
if (Test-Path $aiEnv) { Write-Host "✓ Configured" -ForegroundColor Green } else { Write-Host "✗ Skipped" -ForegroundColor Red }
Write-Host "  ├─ docker-compose.yml        " -NoNewline
if ($domain) { Write-Host "✓ Updated" -ForegroundColor Green } else { Write-Host "─ Skipped (localhost)" -ForegroundColor Gray }
Write-Host "  └─ docker/nginx/nginx.conf   " -NoNewline
if ($domain) { Write-Host "✓ Updated" -ForegroundColor Green } else { Write-Host "─ Skipped (localhost)" -ForegroundColor Gray }

Write-Host "`n  ${ProjectRoot}\" -ForegroundColor Gray
Write-Host "  └── scripts\configure.ps1  ✅" -ForegroundColor Green

Write-Host "`n  ${ProjectRoot}\\" -ForegroundColor Gray
Write-Host "  ┌── backend\.env" -ForegroundColor Gray
Write-Host "  │   ├── OPENAI_API_KEY    " -NoNewline
if ($openaiKey) { Write-Host "✅" -ForegroundColor Green } else { Write-Host "⚠ Skipped" -ForegroundColor Yellow }
Write-Host "  │   ├── SMTP_PASS        " -NoNewline
if ($smtpPass) { Write-Host "✅" -ForegroundColor Green } else { Write-Host "⚠ Skipped" -ForegroundColor Yellow }
Write-Host "  │   ├── GOOGLE_MAPS_API_KEY " -NoNewline
if ($googleMapsKey) { Write-Host "✅" -ForegroundColor Green } else { Write-Host "⚠ Skipped" -ForegroundColor Yellow }
Write-Host "  │   └── secrets (JWT, Encryption, CSRF, Session) ✅" -ForegroundColor Green
Write-Host "  ├── ai-engine\.env" -ForegroundColor Gray
Write-Host "  │   └── OPENAI_API_KEY    " -NoNewline
if ($openaiKey) { Write-Host "✅" -ForegroundColor Green } else { Write-Host "⚠ Skipped" -ForegroundColor Yellow }
Write-Host "  └── docker-compose.yml" -ForegroundColor Gray
Write-Host "      └── domain          " -NoNewline
if ($domain) { Write-Host "✅ ($domain)" -ForegroundColor Green } else { Write-Host "⚠ Skipped (localhost)" -ForegroundColor Yellow }

Write-Host "`n  📌 Backup files created with .backup extension" -ForegroundColor Cyan
Write-Host "  📌 Run 'docker compose up -d' to start the platform" -ForegroundColor Cyan
