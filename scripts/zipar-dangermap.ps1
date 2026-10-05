# Cria o DangerMap.zip na Area de Trabalho, sem as pastas pesadas (node_modules,
# builds, banco de dados local) e SEM o arquivo .env (que tem senhas e chaves).
# Uso (na pasta do projeto):
#   powershell -ExecutionPolicy Bypass -File scripts\zipar-dangermap.ps1

$raiz = Split-Path -Parent $PSScriptRoot
$destino = Join-Path ([Environment]::GetFolderPath('Desktop')) 'DangerMap.zip'
$temp = Join-Path $env:TEMP ('dangermap-zip-' + [guid]::NewGuid().ToString('N'))
$copia = Join-Path $temp 'DangerMap'

# Pastas e arquivos que NAO entram no zip (em qualquer nivel)
$pastasFora = @('node_modules', 'dist', 'dist-mobile', 'release', 'build', '.git', '.docker', 'uploads', 'downloads', '.gradle', '.idea', 'win-unpacked')
$arquivosFora = @('.env', '*.log')

New-Item -ItemType Directory -Force $temp | Out-Null

# robocopy copia tudo menos o que esta nas listas (codigos 0 a 7 = sucesso)
$opcoes = @('/E', '/NFL', '/NDL', '/NJH', '/NJS', '/NP', '/XD') + $pastasFora + @('/XF') + $arquivosFora
& robocopy $raiz $copia @opcoes | Out-Null
if ($LASTEXITCODE -ge 8) {
    Write-Error 'Falha ao copiar os arquivos.'
    exit 1
}

if (Test-Path $destino) { Remove-Item -LiteralPath $destino -Force }
Compress-Archive -Path $copia -DestinationPath $destino -CompressionLevel Optimal
Remove-Item -LiteralPath $temp -Recurse -Force

$mb = [math]::Round((Get-Item $destino).Length / 1MB, 1)
Write-Host "Pronto! $destino ($mb MB)"
