# Shared helpers for KEMIX Supabase deploy scripts (PowerShell)
# Save as UTF-8 with BOM for Korean console output on Windows.

$script:KemixSupabaseProjectRef = 'cdkyoeskhrwrpxgbmpqu'

function Initialize-KemixConsole {
    if ($PSVersionTable.PSVersion.Major -ge 6) {
        $null = [Console]::OutputEncoding
    }
    try {
        [Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false)
        $global:OutputEncoding = [System.Text.UTF8Encoding]::new($false)
    } catch {
        # ignore
    }
}

function Set-KemixSupabaseAccessToken {
    param([string] $AccessToken)

    if ($AccessToken -and $AccessToken -ne 'sbp_...') {
        $env:SUPABASE_ACCESS_TOKEN = $AccessToken.Trim()
    }
}

function Test-KemixSupabaseAuth {
    $output = npx supabase projects list 2>&1 | Out-String
    if ($LASTEXITCODE -eq 0) {
        return $true
    }
    if ($output -match 'Access token not provided') {
        return $false
    }
    # Other errors still mean CLI ran; let caller surface details.
    return $LASTEXITCODE -eq 0
}

function Ensure-KemixSupabaseAuth {
    param([string] $AccessToken = '')

    Set-KemixSupabaseAccessToken -AccessToken $AccessToken

    if (Test-KemixSupabaseAuth) {
        return
    }

    if ($env:SUPABASE_ACCESS_TOKEN) {
        Write-Host '[ERROR] SUPABASE_ACCESS_TOKEN is set but Supabase CLI rejected it.' -ForegroundColor Red
        Write-Host '        Check the token or create a new one:' -ForegroundColor Yellow
        Write-Host '        https://supabase.com/dashboard/account/tokens' -ForegroundColor Yellow
        exit 1
    }

    Write-Host '[ERROR] Supabase CLI is not authenticated.' -ForegroundColor Red
    Write-Host '  Option 1: npx supabase login' -ForegroundColor Yellow
    Write-Host '  Option 2: .\scripts\deploy-resources-stack.ps1 -AccessToken "sbp_..."' -ForegroundColor Yellow
    Write-Host '            https://supabase.com/dashboard/account/tokens' -ForegroundColor Yellow
    exit 1
}

function Ensure-KemixSupabaseLinked {
    param([string] $ProjectRef = $script:KemixSupabaseProjectRef)

    Write-Host "Linking project: $ProjectRef" -ForegroundColor Cyan
    npx supabase link --project-ref $ProjectRef --yes 2>&1 | Out-String | Write-Host
    if ($LASTEXITCODE -ne 0) {
        Write-Host '[ERROR] supabase link failed.' -ForegroundColor Red
        exit $LASTEXITCODE
    }
}

function Invoke-KemixSupabaseDbFile {
    param(
        [Parameter(Mandatory = $true)][string] $RelativePath
    )

    $path = Join-Path (Get-Location) $RelativePath
    if (-not (Test-Path $path)) {
        Write-Host "[ERROR] SQL file not found: $path" -ForegroundColor Red
        exit 1
    }

    Write-Host "Applying: $RelativePath" -ForegroundColor Cyan
    npx supabase db query --linked --file $path
    if ($LASTEXITCODE -ne 0) {
        Write-Host "[ERROR] Failed: $RelativePath" -ForegroundColor Red
        exit $LASTEXITCODE
    }
    Write-Host "[OK] $RelativePath" -ForegroundColor Green
}
