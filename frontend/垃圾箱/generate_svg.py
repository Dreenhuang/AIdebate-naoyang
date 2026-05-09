import base64
from PIL import Image
from io import BytesIO

img = Image.open(r'g:\ai-gongju\prd-debate\taolun-web\frontend\public\downloaded-logo.png')
img_resized = img.resize((512, 512), Image.LANCZOS)

buffer = BytesIO()
img_resized.save(buffer, format='PNG')
b64_data = base64.b64encode(buffer.getvalue()).decode('utf-8')

svg_content = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">
  <title>脑痒 - 智能PRD辩论平台</title>
  <desc>脑痒品牌LOGO</desc>
  <image href="data:image/png;base64,{b64_data}" width="512" height="512"/>
</svg>'''

with open(r'g:\ai-gongju\prd-debate\taolun-web\frontend\public\logo.svg', 'w', encoding='utf-8') as f:
    f.write(svg_content)

print(f'SVG file generated with embedded Base64 image')
print(f'SVG size: {len(svg_content)} bytes')
