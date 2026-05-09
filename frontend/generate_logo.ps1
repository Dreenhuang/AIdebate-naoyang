$headers = @{
    'Authorization' = 'Bearer sk-cp-4My7ZCqGbnsNSaI-lJlYzEerIkZ_W8kZn6sTdT456dPPZu36WS_6LXTQCKQTYOBxFkjv-7tMT4buMjb3hX55BfArRmOgKs5nu8g8IZNywXF8rlgYGHR-KKI'
}

$body = @{
    model = "image-01"
    prompt = "Create a modern minimalist website logo for '脑痒' (Naoyang), a Chinese intelligent discussion and debate platform with tagline '脑痒是长脑子的前兆' (Itchiness in the brain is a sign of thinking). The logo should feature a stylized brain icon combined with a creative itch/scratch motif, using a vibrant color scheme with purple and cyan gradients. Clean, professional, suitable for favicon and brand identity. Square composition, centered design, no text needed."
    aspect_ratio = "1:1"
    response_format = "url"
} | ConvertTo-Json -Compress

$response = Invoke-RestMethod -Uri 'https://api.minimaxi.com/v1/image_generation' -Method Post -Headers $headers -Body $body -ContentType 'application/json'

$response | ConvertTo-Json | Out-File -FilePath 'g:\ai-gongju\prd-debate\taolun-web\frontend\logo_response.json' -Encoding UTF8

Write-Host "Logo URL: $($response.data[0].url)"
