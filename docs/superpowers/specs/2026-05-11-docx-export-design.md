# .docx 文档导出功能设计文档

> **日期**: 2026-05-11  
> **功能**: 辩论报告 .docx 格式导出  
> **方案**: 后端生成（方案A）

---

## 一、功能概述

为现有辩论系统新增 **.docx 格式导出功能**，用户可在导出下拉菜单中选择 "Word 文档 (.docx)"，系统将生成符合指定格式标准的专业 Word 文档并自动下载。

**核心要求**：
- 内容完整：包含辩论话题、阶段概览、辩论记录、共识结果、回溯校验等全部信息
- 格式规范：严格遵循用户指定的文档格式标准
- 兼容现有：不影响原有的 .md 和 .pdf 导出功能
- 错误处理：完善的异常捕获与用户提示

---

## 二、格式标准规范（全局默认）

以下标准来自全局规则与记忆库，适用于本次实现：

### 2.1 字体与间距
| 项目 | 值 |
|------|-----|
| 正文字号 | 4号字体（14磅） |
| 行间距 | 20磅 |
| 段落首行缩进 | 2个字符（约 480 twips） |

### 2.2 页面布局
| 项目 | 值 |
|------|-----|
| 纸张大小 | A4 |
| 左右页边距 | 2厘米（约 1134 twips） |
| 上下页边距 | 2厘米（约 1134 twips） |

### 2.3 页眉页脚
| 区域 | 内容 | 对齐 |
|------|------|------|
| 页眉 | 文档标题（辩论话题） | 居中 |
| 页脚 | "第 X 页 / 共 Y 页" | 居中 |

### 2.4 内容排版
- 所有标题使用 **粗体** 突出显示
- 采用结构化层级编号（1、1.1、1.1.1 等）
- 内容逻辑层次分明，确保良好阅读体验

---

## 三、系统架构

### 3.1 整体流程

```
用户点击 "Word 文档 (.docx)"
    ↓
前端发送 POST /api/exports/docx (debateData)
    ↓
后端 exports.js 路由接收请求
    ↓
exportService.exportToDocx() 生成文档
    ↓
使用 docx 库构建文档对象
    ↓
设置页面边距、页眉页脚、字体样式
    ↓
添加结构化内容（标题、段落、列表）
    ↓
生成 Buffer 并返回前端
    ↓
前端接收 Blob 并触发下载
    ↓
用户获得 .docx 文件
```

### 3.2 文件变更清单

| 文件 | 操作 | 说明 |
|------|------|------|
| `backend/package.json` | 修改 | 新增 `docx` 依赖 |
| `backend/src/services/exportService.js` | 修改 | 新增 `exportToDocx()` 方法 |
| `backend/src/routes/exports.js` | 修改 | 新增 `/docx` POST 路由 |
| `frontend/src/components/ExportButton.jsx` | 修改 | 新增 .docx 选项与下载逻辑 |

---

## 四、详细设计

### 4.1 后端服务层（exportService.js）

**新增方法：`exportToDocx(debateData)`**

使用 `docx` 库（`docx` npm 包）构建文档：

```javascript
const docx = require('docx');
const { Document, Packer, Paragraph, TextRun, Header, Footer, PageNumber, AlignmentType, HeadingLevel } = docx;
```

**文档结构**：
1. **文档属性设置**
   - 页面大小：A4（宽度 11906 twips，高度 16838 twips）
   - 页边距：上下左右各 1134 twips（2厘米）
   - 默认字体：宋体（中文字体兼容）

2. **页眉**
   - 内容：辩论话题（`data.topic`）
   - 样式：居中、粗体、小四号

3. **页脚**
   - 内容：`第 {PAGE} 页 / 共 {NUMPAGES} 页`
   - 样式：居中、五号字

4. **正文内容层级**
   - 一级标题："辩论报告" + 生成时间（18磅、粗体、居中）
   - 二级标题：各章节标题（16磅、粗体）
   - 三级标题：子章节（14磅、粗体）
   - 正文段落：14磅、行距20磅、首行缩进2字符
   - 列表项：带项目符号或编号

**内容章节顺序**：
1. 报告标题与元信息
2. 辩论阶段概览
3. 辩论记录（按阶段分组）
4. 阶段共识
5. 回溯校验结果
6. 参与角色
7. 生成信息页脚

### 4.2 后端路由层（exports.js）

**新增路由**：
```javascript
router.post('/docx', async (req, res) => {
  try {
    const debateData = req.body;
    const result = await exportService.exportToDocx(debateData);
    
    if (result.success) {
      // 设置响应头，直接返回二进制文件
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
      res.setHeader('Content-Disposition', `attachment; filename="${result.filename}"`);
      res.send(result.buffer);
    } else {
      res.status(500).json({ success: false, message: 'DOCX 导出失败', error: result.error });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: '导出过程中发生错误', error: error.message });
  }
});
```

**关键设计**：后端直接返回二进制 Buffer，前端通过 Blob 处理下载，无需先保存到服务器磁盘。

### 4.3 前端UI层（ExportButton.jsx）

**新增 .docx 选项**：
- 在下拉菜单中新增第三个选项："Word 文档 (.docx)"
- 使用 `FileText` 图标（或类似的 Word 图标）
- 点击后调用 `/exports/docx` 端点

**下载逻辑**：
```javascript
const handleDocxExport = async () => {
  const response = await fetch(`${API_URL}/exports/docx`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(debateData),
  });
  
  if (response.ok) {
    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `辩论报告-${Date.now()}.docx`;
    a.click();
    URL.revokeObjectURL(url);
  }
};
```

---

## 五、错误处理设计

### 5.1 后端错误处理

| 错误场景 | 处理方式 | 返回状态码 |
|----------|----------|-----------|
| 请求体为空 | 返回错误信息 | 400 |
| docx 库生成失败 | 捕获异常，返回详细错误 | 500 |
| 内存不足（大文档） | 流式生成或分页处理 | 500 |

### 5.2 前端错误处理

| 错误场景 | 处理方式 |
|----------|----------|
| 网络请求失败 | 显示 "网络错误，请检查连接" |
| 服务器返回 500 | 显示 "文档生成失败，请重试" |
| 浏览器阻止下载 | 提示用户手动允许弹窗 |
| 无辩论内容 | 提前拦截，显示 "请先开始辩论" |

---

## 六、兼容性保障

1. **向后兼容**：原有的 `/markdown` 和 `/pdf` 端点完全不受影响
2. **依赖兼容**：`docx` 库支持 Node.js 14+，项目当前使用环境兼容
3. **浏览器兼容**：Blob 下载 API 支持所有现代浏览器（Chrome 60+, Firefox 55+, Safari 10.1+, Edge 79+）
4. **文件格式兼容**：生成的 .docx 符合 Office Open XML 标准，可在 Word 2007+、WPS、LibreOffice 中正常打开

---

## 七、测试计划

### 7.1 单元测试（后端）

- **测试1**：验证 `exportToDocx` 方法返回正确的 Buffer 对象
- **测试2**：验证空数据输入时返回错误而非崩溃
- **测试3**：验证文档内容包含所有必要章节
- **测试4**：验证页眉页脚正确设置

### 7.2 集成测试（端到端）

- **测试1**：前端点击 .docx 导出，文件成功下载
- **测试2**：下载的 .docx 文件可在 Word 中正常打开
- **测试3**：文档格式符合标准（字体、行距、页边距）
- **测试4**：大量辩论数据（100+ 条消息）导出性能测试

### 7.3 异常测试

- **测试1**：网络断开时的错误提示
- **测试2**：服务器 500 错误时的前端处理
- **测试3**：空辩论数据时的友好提示

---

## 八、依赖安装

```bash
# 在后端目录执行
bun install docx
```

`docx` 库说明：
- 版本：^9.0.0（最新稳定版）
- 大小：约 2MB
- 功能：完整的 Word 文档生成能力
- 许可：MIT

---

## 九、实现计划概要

| 步骤 | 任务 | 预计时间 |
|------|------|----------|
| 1 | 安装 docx 依赖 | 1分钟 |
| 2 | 实现后端 exportToDocx 方法 | 15分钟 |
| 3 | 新增后端 /docx 路由 | 5分钟 |
| 4 | 修改前端 ExportButton 组件 | 10分钟 |
| 5 | 添加错误处理 | 5分钟 |
| 6 | 测试验证 | 10分钟 |

**总计**：约 46 分钟

---

*设计文档完成，等待用户审核确认后进入实现阶段。*
