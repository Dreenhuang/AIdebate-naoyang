# .docx 文档导出功能实现计划

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 为辩论系统新增 .docx 格式导出功能，严格遵循用户指定的文档格式标准。

**Architecture:** 后端使用 `docx` 库生成 Word 文档，直接返回二进制 Buffer；前端接收 Blob 并触发下载。保持与现有导出架构一致。

**Tech Stack:** Node.js + Express (后端), React + Vite (前端), docx 库 (文档生成)

---

## 文件变更清单

| 文件 | 操作 | 说明 |
|------|------|------|
| `backend/package.json` | 修改 | 新增 `docx` 依赖 |
| `backend/src/services/exportService.js` | 修改 | 新增 `exportToDocx()` 方法 |
| `backend/src/routes/exports.js` | 修改 | 新增 `/docx` POST 路由 |
| `frontend/src/components/ExportButton.jsx` | 修改 | 新增 .docx 选项与下载逻辑 |

---

## Task 1: 安装 docx 依赖

**Files:**
- Modify: `backend/package.json`

- [ ] **Step 1: 在后端安装 docx 库**

Run:
```bash
cd g:\ai-gongju\prd-debate\taolun-web\backend
bun install docx
```

Expected: `docx` 成功安装到 `backend/node_modules`

- [ ] **Step 2: 验证安装**

Run:
```bash
cd g:\ai-gongju\prd-debate\taolun-web\backend
node -e "const docx = require('docx'); console.log('docx version:', docx.VERSION || 'installed');"
```

Expected: 输出 `docx version: installed` 或版本号，无报错

---

## Task 2: 实现后端 exportToDocx 方法

**Files:**
- Modify: `backend/src/services/exportService.js`

- [ ] **Step 1: 在文件顶部引入 docx 模块**

在 `const path = require('path');` 下方添加：
```javascript
const docx = require('docx');
const { Document, Packer, Paragraph, TextRun, Header, Footer, PageNumber, AlignmentType, HeadingLevel, convertInchesToTwip, BorderStyle } = docx;
```

- [ ] **Step 2: 在 ExportService 类中添加 exportToDocx 方法**

在 `deleteExport` 方法之前添加以下完整方法：

```javascript
  async exportToDocx(debateData) {
    try {
      const doc = this.generateDocxDocument(debateData);
      const buffer = await Packer.toBuffer(doc);
      const filename = `辩论报告-${debateData.topic || '未命名'}-${Date.now()}.docx`;
      
      return {
        success: true,
        filename,
        buffer,
        format: 'docx',
      };
    } catch (error) {
      console.error('[Export] DOCX export failed:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  generateDocxDocument(data) {
    const topic = data.topic || '未命名辩论';
    const now = new Date().toLocaleString('zh-CN');
    
    // 构建文档内容数组
    const children = [];
    
    // 1. 报告标题
    children.push(
      new Paragraph({
        text: '辩论报告',
        heading: HeadingLevel.TITLE,
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
      })
    );
    
    // 2. 元信息
    children.push(
      new Paragraph({
        children: [
          new TextRun({ text: '生成时间: ', bold: true }),
          new TextRun({ text: now }),
        ],
        spacing: { after: 100 },
      })
    );
    children.push(
      new Paragraph({
        children: [
          new TextRun({ text: '辩论话题: ', bold: true }),
          new TextRun({ text: topic }),
        ],
        spacing: { after: 100 },
      })
    );
    children.push(
      new Paragraph({
        children: [
          new TextRun({ text: '辩论状态: ', bold: true }),
          new TextRun({ text: this.getStatusText(data.status) }),
        ],
        spacing: { after: 300 },
      })
    );
    
    // 3. 辩论阶段概览
    if (data.phases && data.phases.length > 0) {
      children.push(
        new Paragraph({
          text: '1. 辩论阶段概览',
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 300, after: 200 },
        })
      );
      
      data.phases.forEach((phase, index) => {
        const isCompleted = index < data.currentPhase;
        const isCurrent = index === data.currentPhase;
        let statusText = '未开始';
        if (isCompleted) statusText = '已完成';
        else if (isCurrent) statusText = '进行中';
        
        children.push(
          new Paragraph({
            children: [
              new TextRun({ text: `${index + 1}. `, bold: true }),
              new TextRun({ text: phase.name, bold: true }),
              new TextRun({ text: ` - ${phase.description} (${statusText})` }),
            ],
            spacing: { after: 100 },
            indent: { firstLine: convertInchesToTwip(0.35) },
          })
        );
      });
    }
    
    // 4. 辩论记录
    if (data.messages && data.messages.length > 0) {
      children.push(
        new Paragraph({
          text: '2. 辩论记录',
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 300, after: 200 },
        })
      );
      
      let currentPhase = '';
      data.messages.forEach((msg) => {
        if (msg.phase !== undefined && msg.phase !== currentPhase) {
          currentPhase = msg.phase;
          children.push(
            new Paragraph({
              text: `阶段 ${currentPhase + 1}`,
              heading: HeadingLevel.HEADING_2,
              spacing: { before: 200, after: 100 },
            })
          );
        }
        
        const timeStr = msg.timestamp ? new Date(msg.timestamp).toLocaleTimeString('zh-CN') : '-';
        children.push(
          new Paragraph({
            children: [
              new TextRun({ text: `${msg.role || '未知角色'}`, bold: true }),
              new TextRun({ text: ` (${timeStr})` }),
            ],
            spacing: { after: 50 },
            indent: { firstLine: convertInchesToTwip(0.35) },
          })
        );
        children.push(
          new Paragraph({
            text: msg.content || '(无内容)',
            spacing: { after: 150 },
            indent: { firstLine: convertInchesToTwip(0.35) },
          })
        );
      });
    }
    
    // 5. 阶段共识
    if (data.consensus && data.consensus.length > 0) {
      children.push(
        new Paragraph({
          text: '3. 阶段共识',
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 300, after: 200 },
        })
      );
      
      data.consensus.forEach((consensus, index) => {
        children.push(
          new Paragraph({
            text: `${index + 1}. ${consensus.phaseName || `阶段 ${index + 1}`}`,
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 150, after: 100 },
          })
        );
        children.push(
          new Paragraph({
            text: consensus.summary || '(无摘要)',
            spacing: { after: 100 },
            indent: { firstLine: convertInchesToTwip(0.35) },
          })
        );
        
        if (consensus.commitments && consensus.commitments.length > 0) {
          children.push(
            new Paragraph({
              text: '核心承诺:',
              spacing: { after: 50 },
              indent: { firstLine: convertInchesToTwip(0.35) },
            })
          );
          consensus.commitments.forEach(commitment => {
            children.push(
              new Paragraph({
                text: `• ${commitment}`,
                spacing: { after: 50 },
                indent: { left: convertInchesToTwip(0.5) },
              })
            );
          });
        }
      });
    }
    
    // 6. 回溯校验结果
    if (data.backtrackResults && data.backtrackResults.length > 0) {
      children.push(
        new Paragraph({
          text: '4. 回溯校验结果',
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 300, after: 200 },
        })
      );
      
      const latestResult = data.backtrackResults[data.backtrackResults.length - 1];
      const statusText = latestResult.status === 'SUPPORTED' ? '通过' : 
                        latestResult.status === 'TENSION' ? '存在张力' : '发现矛盾';
      
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: '校验状态: ', bold: true }),
            new TextRun({ text: statusText }),
          ],
          spacing: { after: 50 },
          indent: { firstLine: convertInchesToTwip(0.35) },
        })
      );
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: '整体评分: ', bold: true }),
            new TextRun({ text: `${latestResult.overallScore || '-'}/100` }),
          ],
          spacing: { after: 50 },
          indent: { firstLine: convertInchesToTwip(0.35) },
        })
      );
      children.push(
        new Paragraph({
          children: [
            new TextRun({ text: '校验摘要: ', bold: true }),
            new TextRun({ text: latestResult.summary || '-' }),
          ],
          spacing: { after: 150 },
          indent: { firstLine: convertInchesToTwip(0.35) },
        })
      );
      
      if (latestResult.violations && latestResult.violations.length > 0) {
        children.push(
          new Paragraph({
            text: '严重问题:',
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 100, after: 100 },
          })
        );
        latestResult.violations.forEach((violation, index) => {
          children.push(
            new Paragraph({
              text: `${index + 1}. ${violation.commitment}`,
              spacing: { after: 50 },
              indent: { firstLine: convertInchesToTwip(0.35) },
            })
          );
          if (violation.issues) {
            violation.issues.forEach(issue => {
              children.push(
                new Paragraph({
                  text: `• ${issue.message}`,
                  spacing: { after: 30 },
                  indent: { left: convertInchesToTwip(0.5) },
                })
              );
              if (issue.suggestion) {
                children.push(
                  new Paragraph({
                    text: `建议: ${issue.suggestion}`,
                    spacing: { after: 50 },
                    indent: { left: convertInchesToTwip(0.7) },
                  })
                );
              }
            });
          }
        });
      }
    }
    
    // 7. 参与角色
    if (data.config && data.config.roles) {
      children.push(
        new Paragraph({
          text: '5. 参与角色',
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 300, after: 200 },
        })
      );
      
      data.config.roles.forEach((role, index) => {
        children.push(
          new Paragraph({
            children: [
              new TextRun({ text: `${index + 1}. `, bold: true }),
              new TextRun({ text: role.name, bold: true }),
              new TextRun({ text: ` (${role.roleType || '未知类型'})` }),
            ],
            spacing: { after: 50 },
            indent: { firstLine: convertInchesToTwip(0.35) },
          })
        );
        children.push(
          new Paragraph({
            text: `模型: ${role.model || '-'}`,
            spacing: { after: 50 },
            indent: { left: convertInchesToTwip(0.5) },
          })
        );
        if (role.soul) {
          children.push(
            new Paragraph({
              text: `Soul: ${role.soul.substring(0, 100)}...`,
              spacing: { after: 100 },
              indent: { left: convertInchesToTwip(0.5) },
            })
          );
        }
      });
    }
    
    // 8. 页脚信息
    children.push(
      new Paragraph({
        text: '—— 本报告由 脑痒 智能辩论平台自动生成 ——',
        alignment: AlignmentType.CENTER,
        spacing: { before: 400 },
        italics: true,
      })
    );
    
    // 创建文档
    return new Document({
      sections: [{
        properties: {
          page: {
            margin: {
              top: convertInchesToTwip(0.79),    // 2厘米
              right: convertInchesToTwip(0.79),  // 2厘米
              bottom: convertInchesToTwip(0.79), // 2厘米
              left: convertInchesToTwip(0.79),   // 2厘米
            },
          },
        },
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                text: topic,
                alignment: AlignmentType.CENTER,
                spacing: { after: 100 },
              }),
            ],
          }),
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  new TextRun({ text: '第 ' }),
                  new TextRun({ children: [PageNumber.CURRENT] }),
                  new TextRun({ text: ' 页 / 共 ' }),
                  new TextRun({ children: [PageNumber.TOTAL_PAGES] }),
                  new TextRun({ text: ' 页' }),
                ],
              }),
            ],
          }),
        },
        children,
      }],
    });
  }
```

- [ ] **Step 3: 验证代码语法**

Run:
```bash
cd g:\ai-gongju\prd-debate\taolun-web\backend
node -c src/services/exportService.js
```

Expected: `Syntax OK`

---

## Task 3: 新增后端 /docx 路由

**Files:**
- Modify: `backend/src/routes/exports.js`

- [ ] **Step 1: 在 /pdf 路由之后添加 /docx 路由**

在 `router.post('/pdf', ...)` 代码块之后、`router.get('/list', ...)` 之前插入：

```javascript
router.post('/docx', async (req, res) => {
  try {
    const debateData = req.body;
    
    if (!debateData || Object.keys(debateData).length === 0) {
      return res.status(400).json({
        success: false,
        message: '请求体不能为空',
      });
    }
    
    const result = await exportService.exportToDocx(debateData);
    
    if (result.success) {
      res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
      res.setHeader('Content-Disposition', `attachment; filename="${encodeURIComponent(result.filename)}"`);
      res.send(result.buffer);
    } else {
      res.status(500).json({
        success: false,
        message: 'DOCX 导出失败',
        error: result.error,
      });
    }
  } catch (error) {
    console.error('[Export] DOCX error:', error);
    res.status(500).json({
      success: false,
      message: '导出过程中发生错误',
      error: error.message,
    });
  }
});
```

- [ ] **Step 2: 验证路由文件语法**

Run:
```bash
cd g:\ai-gongju\prd-debate\taolun-web\backend
node -c src/routes/exports.js
```

Expected: `Syntax OK`

---

## Task 4: 修改前端 ExportButton 组件

**Files:**
- Modify: `frontend/src/components/ExportButton.jsx`

- [ ] **Step 1: 引入 FileSpreadsheet 图标**

将第2行的导入语句修改为：
```javascript
import { FileDown, FileText, Printer, FileSpreadsheet, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
```

- [ ] **Step 2: 修改 handleExport 函数支持 docx 格式**

将 `handleExport` 函数中的 `const endpoint = format === 'markdown' ? '/markdown' : '/pdf';` 修改为：

```javascript
      let endpoint;
      if (format === 'markdown') endpoint = '/markdown';
      else if (format === 'pdf') endpoint = '/pdf';
      else if (format === 'docx') endpoint = '/docx';
```

- [ ] **Step 3: 添加 docx 下载逻辑**

在 `handleExport` 函数的 `if (result.success && result.data)` 代码块内部，在 `// 如果是 HTML 格式，自动打开` 注释之后添加：

```javascript
        // 如果是 DOCX 格式，直接下载二进制文件
        if (format === 'docx' && result.data.content) {
          const byteCharacters = atob(result.data.content);
          const byteNumbers = new Array(byteCharacters.length);
          for (let i = 0; i < byteCharacters.length; i++) {
            byteNumbers[i] = byteCharacters.charCodeAt(i);
          }
          const byteArray = new Uint8Array(byteNumbers);
          const blob = new Blob([byteArray], { type: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' });
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = result.data.filename || `辩论报告-${Date.now()}.docx`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
        }
```

**注意**：由于后端 `/docx` 路由直接返回二进制文件而非 JSON，上述逻辑需要调整为直接处理响应。将 `handleExport` 函数中 `const result = await response.json();` 之后的整个 `if (result.success...)` 块替换为：

```javascript
      if (format === 'docx') {
        // DOCX 直接返回二进制文件
        if (response.ok) {
          const blob = await response.blob();
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = `辩论报告-${debateData.topic || '未命名'}-${Date.now()}.docx`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          
          setExportResult({
            success: true,
            format,
            message: 'Word 文档下载成功',
          });
        } else {
          const errorData = await response.json().catch(() => ({}));
          setExportResult({
            success: false,
            error: errorData.message || 'DOCX 导出失败',
          });
        }
      } else {
        const result = await response.json();
        
        if (result.success && result.data) {
          setExportResult({
            success: true,
            format,
            filename: result.data.filename,
            filepath: result.data.filepath,
            note: result.data.note,
            content: result.data.content,
          });

          // 如果是 HTML 格式，自动打开
          if (format === 'pdf' && result.data.content) {
            const blob = new Blob([result.data.content], { type: 'text/html' });
            const url = URL.createObjectURL(blob);
            window.open(url, '_blank');
          }
        } else {
          setExportResult({
            success: false,
            error: result.error || result.message || '导出失败',
          });
        }
      }
```

- [ ] **Step 4: 在下拉菜单中添加 .docx 选项**

在现有两个按钮（Markdown 和 PDF）之间插入第三个按钮：

```javascript
          <button
            onClick={() => handleExport('docx')}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-bg-hover transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4 text-text-secondary" />
            <span>Word 文档 (.docx)</span>
          </button>
```

- [ ] **Step 5: 修改成功提示显示逻辑**

在 `exportResult.success` 的渲染部分，在 `exportResult.format === 'pdf'` 条件之后添加：

```javascript
                {exportResult.format === 'docx' && (
                  <p className="text-text-secondary mt-1">Word 文档已下载</p>
                )}
```

---

## Task 5: 测试验证

**Files:**
- Test: `backend/src/services/exportService.js`
- Test: `frontend/src/components/ExportButton.jsx`

- [ ] **Step 1: 启动后端服务**

Run:
```bash
cd g:\ai-gongju\prd-debate\taolun-web\backend
node src/index.js
```

Expected: 服务启动，控制台显示运行端口

- [ ] **Step 2: 使用 curl 测试 /docx 端点**

Run (在另一个终端):
```bash
curl -X POST http://localhost:9528/api/exports/docx ^
  -H "Content-Type: application/json" ^
  -d "{\"topic\":\"测试话题\",\"status\":\"completed\",\"messages\":[{\"role\":\"提案者\",\"content\":\"这是测试内容\",\"phase\":0,\"timestamp\":\"2026-05-11T10:00:00Z\"}],\"phases\":[{\"name\":\"阶段1\",\"description\":\"测试阶段\"}],\"currentPhase\":0}" ^
  -o test-output.docx
```

Expected: 文件 `test-output.docx` 生成，大小大于 0 字节

- [ ] **Step 3: 验证 docx 文件可打开**

尝试用 Word 或 WPS 打开 `test-output.docx`，验证：
- 页边距是否为 2厘米
- 页眉是否显示"测试话题"
- 页脚是否显示页码
- 内容是否包含"辩论报告"标题

- [ ] **Step 4: 启动前端并测试完整流程**

Run:
```bash
cd g:\ai-gongju\prd-debate\taolun-web\frontend
bun run dev
```

Expected: 前端服务启动，访问页面后点击导出按钮，选择"Word 文档 (.docx)"，文件成功下载

- [ ] **Step 5: 验证原有功能未受影响**

测试 Markdown 导出和 PDF 导出是否仍然正常工作

---

## 自审清单

- [ ] Spec 覆盖检查：所有格式要求（字体、行距、页边距、页眉页脚）都有对应实现
- [ ] Placeholder 扫描：无 "TBD"、"TODO"、"implement later"
- [ ] 类型一致性：`exportToDocx` 返回 `{success, filename, buffer, format}` 或 `{success, error}`
- [ ] 向后兼容：原有 `/markdown` 和 `/pdf` 端点未修改逻辑，仅新增 `/docx`
- [ ] 错误处理：所有异步操作都有 try-catch

---

*计划完成。执行方式选择：*

**1. Subagent-Driven (推荐)** - 每个 Task 分配独立子代理执行，主代理审查  
**2. Inline Execution** - 在当前会话中按步骤顺序执行
