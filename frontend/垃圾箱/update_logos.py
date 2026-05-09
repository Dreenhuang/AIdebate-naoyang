import base64
from PIL import Image
from io import BytesIO

# 打开新生成的透明PNG
img = Image.open(r'g:\ai-gongju\prd-debate\taolun-web\frontend\public\logo-transparent.png')
print(f'透明LOGO尺寸: {img.size}')

# 生成512版本用于显示
img_512 = img.resize((512, 512), Image.LANCZOS)
buffer = BytesIO()
img_512.save(buffer, format='PNG')
b64_data = base64.b64encode(buffer.getvalue()).decode('utf-8')

# 生成SVG文件（内嵌Base64）
svg_content = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <title>脑痒 - 智能PRD辩论平台</title>
  <desc>脑痒品牌LOGO - 透明背景</desc>
  <image href="data:image/png;base64,{b64_data}" width="512" height="512"/>
</svg>'''

with open(r'g:\ai-gongju\prd-debate\taolun-web\frontend\public\logo.svg', 'w', encoding='utf-8') as f:
    f.write(svg_content)

print(f'SVG已生成 (内嵌Base64): {len(svg_content)} bytes')

# 生成多尺寸favicon
sizes = [16, 32, 48, 64, 128, 192, 256, 512]
for size in sizes:
    resized = img.resize((size, size), Image.LANCZOS)
    resized.save(rf'g:\ai-gongju\prd-debate\taolun-web\frontend\public\favicon-{size}x{size}.png', 'PNG')
    print(f'Created favicon-{size}x{size}.png')

print('\n所有LOGO文件已更新完成!')
