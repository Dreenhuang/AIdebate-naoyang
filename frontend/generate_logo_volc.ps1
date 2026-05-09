$headers = @{
    'Authorization' = 'Bearer sk-cp-4My7ZCqGbnsNSaI-lJlYzEerIkZ_W8kZn6sTdT456dPPZu36WS_6LXTQCKQTYOBxFkjv-7tMT4buMjb3hX55BfArRmOgKs5nu8g8IZNywXF8rlgYGHR-KKI'
    'Content-Type' = 'application/json'
}

$body = @{
    model = "general-v2.3"
    prompt = "Create a modern minimalist website logo for '脑痒' (Naoyang), a Chinese intelligent discussion and debate platform. Features: stylized brain icon with creative itch/scratch motif, purple and cyan gradient colors, clean professional design suitable for favicon, square composition, centered design"
    size = "2K"
} | ConvertTo-Json -Compress

Write-Host "Sending request to Volcano Engine API..."

try {
    $response = Invoke-RestMethod -Uri 'https://ark.cn-beijing.volces.com/api/v3/images/generations' -Method Post -Headers $headers -Body $body -ContentType 'application/json' -TimeoutSec 60
    
    Write-Host "Response received:"
    $response | ConvertTo-Json -Depth 10 | Out-File -FilePath 'g:\ai-gongju\prd-debate\taolun-web\frontend\logo_response_volc.json' -Encoding UTF8
    
    Write-Host "SUCCESS: Logo generated!"
} catch {
    Write-Host "Request failed: $_"
    $errorResponse = $_.Exception.Response
    if ($errorResponse -ne $null) {
        $reader = [System.IO.StreamReader]::new($errorResponse.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        $reader.Close()
        Write-Host "Response body: $responseBody"
    }
}
