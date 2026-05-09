from PIL import Image
import numpy as np

# 打开用户提供的参考图片
img = Image.open(r'C:\Users\Administrator\Pictures\PixPin_2026-05-09_12-02-20.jpg')
print(f'原始图片尺寸: {img.size}')
print(f'原始模式: {img.mode}')

# 转换为RGBA
img_rgba = img.convert('RGBA')
data = np.array(img_rgba)

# 分析颜色分布 - 找出背景色
# 背景通常是图片边缘的颜色或最频繁出现的颜色
print(f'\n=== 颜色分析 ===')

# 获取四个角的颜色
corners = [
    data[0, 0],                    # 左上
    data[0, -1],                   # 右上
    data[-1, 0],                   # 左下
    data[-1, -1]                  # 右下
]
print(f'四角颜色(RGB): {[(c[0], c[1], c[2]) for c in corners]}')

# 获取最常见的颜色
pixels = data.reshape(-1, 4)
unique_colors, counts = np.unique(pixels[:, :3], axis=0, return_counts=True)
top_5_idx = counts.argsort()[-5:][::-1]
print(f'\nTop 5 最常见颜色:')
for idx in top_5_idx:
    print(f'  RGB{tuple(unique_colors[idx])}: {counts[idx]} 像素 ({100*counts[idx]/len(pixels):.1f}%)')

# 背景色检测 - 使用最常见的颜色作为背景
bg_color = unique_colors[top_5_idx[0]]
print(f'\n检测到的背景色: RGB{tuple(bg_color)}')

# 创建掩码 - 将接近背景色的像素设为透明
r, g, b = bg_color
tolerance = 40  # 颜色容差

mask = (
    (np.abs(data[:,:,0].astype(int) - r) < tolerance) &
    (np.abs(data[:,:,1].astype(int) - g) < tolerance) &
    (np.abs(data[:,:,2].astype(int) - b) < tolerance)
)

# 设置透明通道
data[mask, 3] = 0

# 创建新图像
result = Image.fromarray(data)

# 裁剪到内容区域
bbox = result.getbbox()
if bbox:
    result_cropped = result.crop(bbox)
    print(f'\n裁剪后尺寸: {result_cropped.size}')
else:
    result_cropped = result

# 放大到合适尺寸 (256x256 用于显示)
final_size = 256
result_resized = result_cropped.resize((final_size, final_size), Image.LANCZOS)

# 保存结果
output_path = r'g:\ai-gongju\prd-debate\taolun-web\frontend\public\logo-transparent.png'
result_resized.save(output_path, 'PNG')
print(f'\n已保存透明LOGO到: {output_path}')

# 同时保存512版本用于SVG嵌入
output_512 = r'g:\ai-gongju\prd-debate\taolun-web\frontend\public\logo-512.png'
result_cropped.resize((512, 512), Image.LANCZOS).save(output_512, 'PNG')
print(f'已保存512版到: {output_512}')

# 统计透明度
transparent_count = np.sum(data[:, :, 3] == 0)
total = data.shape[0] * data.shape[1]
print(f'\n透明像素统计: {transparent_count}/{total} ({100*transparent_count/total:.1f}%)')
