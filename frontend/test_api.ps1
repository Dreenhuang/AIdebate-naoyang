$apiKey = "sk-cp-4My7ZCqGbnsNSaI-lJlYzEerIkZ_W8kZn6sTdT456dPPZu36WS_6LXTQCKQTYOBxFkjv-7tMT4buMjb3hX55BfArRmOgKs5nu8g8IZNywXF8rlgYGHR-KKI"

$headers = @{
    'Authorization' = "Bearer $apiKey"
    'Content-Type' = 'application/json'
}

$body = @{
    model = "image-01"
    prompt = "Modern minimalist logo for brain-themed platform, featuring a stylized brain icon with creative itch sensation, purple and cyan gradient colors, clean professional design suitable for website favicon, square composition"
    aspect_ratio = "1:1"
    response_format = "url"
} | ConvertTo-Json -Compress

Write-Host "Sending request to MiniMax API..."

try {
    $response = Invoke-RestMethod -Uri 'https://api.minimaxi.com/v1/image_generation' -Method Post -Headers $headers -Body $body -ContentType 'application/json' -TimeoutSec 60
    
    Write-Host "Response received:"
    $response | ConvertTo-Json -Depth 10 | Out-File -FilePath 'g:\ai-gongju\prd-debate\taolun-web\frontend\logo_response2.json' -Encoding UTF8
    
    if ($response.base_resp.status_code -eq 0) {
        Write-Host "SUCCESS: Logo generated!"
        Write-Host "Logo URL: $($response.data[0].url)"
    } else {
        Write-Host "ERROR: $($response.base_resp.status_msg)"
    }
} catch {
    Write-Host "Request failed: $_"
    Write-Host "Response: $($_.Exception.Response)"
}
