const fs = require('fs').promises;
const path = require('path');
const docx = require('docx');

class ExportService {
  constructor() {
    this.exportDir = path.join(process.cwd(), '..', 'exports');
  }

  async ensureExportDir() {
    try {
      await fs.mkdir(this.exportDir, { recursive: true });
    } catch (error) {
      console.error('[Export] Failed to create export directory:', error);
    }
  }

  async exportToMarkdown(debateData) {
    await this.ensureExportDir();

    const markdown = this.generateMarkdown(debateData);
    const filename = `debate-${Date.now()}.md`;
    const filepath = path.join(this.exportDir, filename);

    try {
      await fs.writeFile(filepath, markdown, 'utf-8');
      return {
        success: true,
        filepath,
        filename,
        content: markdown,
        format: 'markdown',
      };
    } catch (error) {
      console.error('[Export] Markdown export failed:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async exportToPDF(debateData) {
    await this.ensureExportDir();

    // 先生成 Markdown，然后转换为 HTML，最后提示用户可以打印为 PDF
    const htmlContent = this.generateHTML(debateData);
    const filename = `debate-${Date.now()}.html`;
    const filepath = path.join(this.exportDir, filename);

    try {
      await fs.writeFile(filepath, htmlContent, 'utf-8');
      return {
        success: true,
        filepath,
        filename,
        content: htmlContent,
        format: 'html',
        note: '请在浏览器中打开此文件，使用 Ctrl+P 保存为 PDF',
      };
    } catch (error) {
      console.error('[Export] PDF export failed:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async exportToDocx(debateData) {
    try {
      const doc = this.generateDocxDocument(debateData);
      const filename = `辩论报告-${debateData.topic || '未命名'}-${Date.now()}.docx`;
      const buffer = await docx.Packer.toBuffer(doc);
      
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

  /**
   * V13.0 按规范生成Word文档
   * 规范要求：
   * - 正文字体：四号字体（14pt = 28 half-points）
   * - 行距：1.2倍行距（276 DXA = 20磅 × 138/10）
   * - 首行缩进：2字符（480 DXA）
   * - 页边距：上/下/左/右 各 2cm（1134 DXA）
   * - 页眉：文档标题，居中对齐
   * - 页脚：第X页/共Y页
   */
  generateDocxDocument(data) {
    const {
      Document, Paragraph, TextRun, AlignmentType, HeadingLevel,
      Header, Footer, PageNumber, BorderStyle, Table, TableRow, TableCell,
      WidthType, ShadingType, convertMillimetersToTwip, UnderlineType,
      PageBreak,
    } = docx;

    const topic = data.topic || '未指定';
    const now = new Date().toLocaleString('zh-CN');
    const totalPages = Math.ceil((data.messages?.length || 0) / 20) || 1;

    // ══════════════════════════════════════
    // 规范常量定义
    // ══════════════════════════════════════
    const FONT_FAMILY = 'Microsoft YaHei';
    const FONT_SIZE_NORMAL = 28; // 14pt (四号)
    const FONT_SIZE_TITLE = 36; // 18pt (小二)
    const FONT_SIZE_HEADING = 32; // 16pt (三号)
    const LINE_SPACING = 276; // 1.2倍行距 (20磅)
    const INDENT_FIRST_LINE = 480; // 首行缩进2字符
    const MARGIN = convertMillimetersToTwip(20); // 2cm

    // 辅助函数：创建规范化的文本运行
    const bold = (text, size = FONT_SIZE_NORMAL) => new TextRun({
      text, bold: true, font: FONT_FAMILY, size,
    });
    const normal = (text, size = FONT_SIZE_NORMAL) => new TextRun({
      text, font: FONT_FAMILY, size,
    });
    const emphasis = (text, size = FONT_SIZE_NORMAL) => new TextRun({
      text, bold: true, underline: { type: UnderlineType.SINGLE }, font: FONT_FAMILY, size,
    });

    // 创建标准段落（带首行缩进和行距）
    const createPara = (children, options = {}) => new Paragraph({
      children: Array.isArray(children) ? children : [children],
      spacing: { line: LINE_SPACING, after: 120 },
      indent: options.noIndent ? {} : { firstLine: INDENT_FIRST_LINE },
      ...options,
    });

    // 创建空行
    const emptyLine = () => new Paragraph({ text: '', spacing: { line: LINE_SPACING } });

    const children = [];

    // ══════════════════════════════════════
    // 1. 报告封面标题（居中、加粗、大字号）
    // ══════════════════════════════════════
    children.push(
      emptyLine(),
      emptyLine(),
      new Paragraph({
        text: '📋 脑痒辩论报告',
        alignment: AlignmentType.CENTER,
        heading: HeadingLevel.TITLE,
        spacing: { after: 200, line: LINE_SPACING },
        run: {
          bold: true, size: 44, font: FONT_FAMILY, color: '1a365d',
        },
      }),
      new Paragraph({
        text: `「${topic}」`,
        alignment: AlignmentType.CENTER,
        spacing: { after: 400, line: LINE_SPACING },
        run: {
          size: FONT_SIZE_HEADING, font: FONT_FAMILY, color: '4a5568',
          italics: true,
        },
      }),
      emptyLine(),
    );

    // ══════════════════════════════════════
    // 2. 元信息表格（规范格式）
    // ══════════════════════════════════════
    children.push(
      new Table({
        width: { size: 100, type: WidthType.PERCENTAGE },
        rows: [
          new TableRow({
            tableHeader: false,
            children: [
              new TableCell({
                children: [createPara([bold('生成时间'), normal(`：${now}`)], { noIndent: true })],
                width: { size: 50, type: WidthType.PERCENTAGE },
                margins: { top: 100, bottom: 100, left: 150, right: 150 },
              }),
              new TableCell({
                children: [createPara([bold('文档版本'), normal('：V13.0')], { noIndent: true })],
                width: { size: 50, type: WidthType.PERCENTAGE },
                margins: { top: 100, bottom: 100, left: 150, right: 150 },
              }),
            ],
          }),
          new TableRow({
            children: [
              new TableCell({
                children: [createPara([bold('辩论话题'), normal(`：${topic}`)], { noIndent: true })],
                columnSpan: 2,
                margins: { top: 100, bottom: 100, left: 150, right: 150 },
              }),
            ],
          }),
          new TableRow({
            children: [
              new TableCell({
                children: [createPara([bold('辩论状态'), normal(`：${this.getStatusText(data.status)}`)], { noIndent: true })],
                columnSpan: 2,
                margins: { top: 100, bottom: 100, left: 150, right: 150 },
              }),
            ],
          }),
          new TableRow({
            children: [
              new TableCell({
                children: [createPara([
                  bold('消息总数'),
                  normal(`：${data.messages?.length || 0} 条`),
                  normal('  |  '),
                  bold('参与角色'),
                  normal(`：${data.roles?.map(r => r.name).join('、') || '-'} `),
                ], { noIndent: true })],
                columnSpan: 2,
                margins: { top: 100, bottom: 100, left: 150, right: 150 },
              }),
            ],
          }),
        ],
      })
    );

    children.push(emptyLine());

    // ══════════════════════════════════════
    // 3. 辩论阶段概览
    // ══════════════════════════════════════
    if (data.phases && data.phases.length > 0) {
      children.push(
        new Paragraph({
          children: [emphasis('一、辩论阶段概览')],
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 300, after: 150, line: LINE_SPACING },
          border: { bottom: { color: '3b82f6', style: BorderStyle.SINGLE, size: 6 } },
        })
      );

      data.phases.forEach((phase, index) => {
        const isCompleted = index < data.currentPhase;
        const isCurrent = index === data.currentPhase;
        let statusText = '⏳ 未开始';
        if (isCompleted) statusText = '✅ 已完成';
        else if (isCurrent) statusText = '🔄 进行中';

        children.push(
          createPara([
            bold(`${index + 1}. ${phase.name || `阶段 ${index + 1}`}`),
            normal(`  ${phase.description || ''} (${statusText})`),
          ])
        );
      });

      children.push(emptyLine());
    }

    // ══════════════════════════════════════
    // 4. 辩论记录（按阶段分组，增强格式）
    // ══════════════════════════════════════
    if (data.messages && data.messages.length > 0) {
      children.push(
        new Paragraph({
          children: [emphasis('二、详细辩论记录')],
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 300, after: 150, line: LINE_SPACING },
          border: { bottom: { color: '3b82f6', style: BorderStyle.SINGLE, size: 6 } },
        })
      );

      let currentPhase = -1;
      let currentRound = -1;

      data.messages.forEach((msg) => {
        // 阶段分隔
        if (msg.phase !== undefined && msg.phase !== currentPhase) {
          currentPhase = msg.phase;
          children.push(
            new Paragraph({
              text: `▎ ${data.phases[currentPhase]?.name || `阶段 ${currentPhase + 1}`}`,
              heading: HeadingLevel.HEADING_2,
              spacing: { before: 250, after: 120, line: LINE_SPACING },
              run: { bold: true, size: FONT_SIZE_HEADING, font: FONT_FAMILY, color: '2563eb' },
            })
          );
        }

        // 轮次分隔
        if (msg.round !== undefined && msg.round !== currentRound) {
          currentRound = msg.round;
          children.push(
            new Paragraph({
              text: `◆ 第 ${currentRound} 轮`,
              spacing: { before: 180, after: 80, line: LINE_SPACING },
              run: { bold: true, size: FONT_SIZE_NORMAL, font: FONT_FAMILY, color: '64748b' },
            })
          );
        }

        // 发言者信息
        const timeStr = msg.timestamp
          ? new Date(msg.timestamp).toLocaleTimeString('zh-CN')
          : '-';
        
        const roleEmoji = this.getRoleEmoji(msg.role);

        children.push(
          new Paragraph({
            children: [
              bold(`${roleEmoji} ${msg.roleName || msg.role}`),
              normal(`  （${timeStr}）`),
            ],
            spacing: { before: 80, after: 40, line: LINE_SPACING },
            run: { bold: true, size: FONT_SIZE_NORMAL, font: FONT_FAMILY },
          })
        );

        // 发言内容（带首行缩进）
        children.push(
          createPara(normal(msg.content || '（无内容）'))
        );

        // 字数统计
        if (msg.content) {
          children.push(
            new Paragraph({
              children: [
                normal(`【字数统计】${msg.content.length} 字`, { size: 18, color: '9ca3af' }),
              ],
              spacing: { before: 0, after: 60, line: LINE_SPACING },
              alignment: AlignmentType.RIGHT,
            })
          );
        }
      });

      children.push(emptyLine());
    }

    // ══════════════════════════════════════
    // 5. 阶段共识总结
    // ══════════════════════════════════════
    if (data.consensus && data.consensus.length > 0) {
      children.push(
        new Paragraph({
          children: [emphasis('三、阶段共识总结')],
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 300, after: 150, line: LINE_SPACING },
          border: { bottom: { color: '059669', style: BorderStyle.SINGLE, size: 6 } },
        })
      );

      data.consensus.forEach((consensus, index) => {
        children.push(
          new Paragraph({
            text: `${index + 1}. ${consensus.phaseName || `阶段 ${index + 1} 共识`}`,
            heading: HeadingLevel.HEADING_2,
            spacing: { before: 180, after: 80, line: LINE_SPACING },
            run: { bold: true, size: FONT_SIZE_HEADING, font: FONT_FAMILY, color: '059669' },
          }),
          createPara(consensus.summary || '(无摘要)')
        );

        if (consensus.commitments && consensus.commitments.length > 0) {
          children.push(
            new Paragraph({
              children: [bold('核心承诺：', { size: FONT_SIZE_NORMAL })],
              spacing: { before: 60, after: 40, line: LINE_SPACING },
            })
          );
          consensus.commitments.forEach((commitment) => {
            children.push(
              createPara([normal('✓ '), normal(commitment.text || commitment.content || commitment)])
            );
          });
        }
      });

      children.push(emptyLine());
    }

    // ══════════════════════════════════════
    // 6. 回溯校验结果（如有）
    // ══════════════════════════════════════
    if (data.backtrackResults && data.backtrackResults.length > 0) {
      children.push(new PageBreak());
      
      children.push(
        new Paragraph({
          children: [emphasis('四、回溯校验结果')],
          heading: HeadingLevel.HEADING_1,
          spacing: { before: 300, after: 150, line: LINE_SPACING },
          border: { bottom: { color: 'dc2626', style: BorderStyle.SINGLE, size: 6 } },
        })
      );

      const latestResult = data.backtrackResults[data.backtrackResults.length - 1];
      let statusText = '未知';
      if (latestResult.status === 'SUPPORTED') statusText = '✅ 通过';
      else if (latestResult.status === 'TENSION') statusText = '⚠️ 存在张力';
      else if (latestResult.status === 'CONTRADICTION') statusText = '❌ 发现矛盾';

      children.push(
        createPara([bold('校验状态：'), normal(statusText)]),
        createPara([bold('整体评分：'), normal(`${latestResult.overallScore || '-'}/100`)]),
        createPara([bold('校验摘要：'), normal(latestResult.summary || '-')])
      );

      if (latestResult.violations && latestResult.violations.length > 0) {
        children.push(
          new Paragraph({
            children: [bold('发现的问题：', { size: FONT_SIZE_NORMAL })],
            spacing: { before: 100, after: 60, line: LINE_SPACING },
          })
        );
        latestResult.violations.forEach((v) => {
          children.push(createPara([normal(`• [${v.severity}] ${v.description}`)]));
        });
      }
    }

    // ══════════════════════════════════════
    // 创建文档（应用规范配置）
    // ══════════════════════════════════════
    return new Document({
      sections: [{
        properties: {
          page: {
            margin: {
              top: MARGIN,
              right: MARGIN,
              bottom: MARGIN,
              left: MARGIN,
            },
            pageNumbers: {
              start: 1,
            },
          },
        },
        headers: {
          default: new Header({
            children: [
              new Paragraph({
                children: [`脑痒辩论报告 - ${topic}`],
                alignment: AlignmentType.CENTER,
                run: { size: 18, font: FONT_FAMILY, color: '6b7280' },
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
                  new TextRun({ text: '第 ', size: 18, font: FONT_FAMILY }),
                  new TextRun({ children: [PageNumber.CURRENT], size: 18, font: FONT_FAMILY }),
                  new TextRun({ text: ` / 共 ${totalPages} 页`, size: 18, font: FONT_FAMILY }),
                ],
              }),
            ],
          }),
        },
        children,
      }],
    });
  }
  generateMarkdown(data) {
    const lines = [];
    
    lines.push('# 脑痒 辩论报告');
    lines.push('');
    lines.push(`**生成时间**: ${new Date().toLocaleString('zh-CN')}`);
    lines.push(`**辩论话题**: ${data.topic || '未指定'}`);
    lines.push(`**辩论状态**: ${this.getStatusText(data.status)}`);
    lines.push('');

    if (data.phases && data.phases.length > 0) {
      lines.push('## 辩论阶段概览');
      lines.push('');
      
      data.phases.forEach((phase, index) => {
        const isCompleted = index < data.currentPhase;
        const isCurrent = index === data.currentPhase;
        
        let statusIcon = '⬜';
        if (isCompleted) statusIcon = '✅';
        else if (isCurrent) statusIcon = '🔄';
        
        lines.push(`${statusIcon} **${phase.name}** - ${phase.description}`);
      });
      lines.push('');
    }

    if (data.messages && data.messages.length > 0) {
      lines.push('## 辩论记录');
      lines.push('');
      
      let currentPhase = '';
      data.messages.forEach((msg) => {
        if (msg.phase !== undefined && msg.phase !== currentPhase) {
          currentPhase = msg.phase;
          lines.push(`### 阶段 ${currentPhase + 1} (第${msg.round || '-'}轮)`);
          lines.push('');
        }
        
        const roleEmoji = this.getRoleEmoji(msg.role);
        lines.push(`**${roleEmoji} ${msg.role}** (${new Date(msg.timestamp).toLocaleTimeString()})`);
        lines.push('');
        lines.push('> ' + (msg.content || '(无内容)'));
        lines.push('');
      });
    }

    if (data.consensus && data.consensus.length > 0) {
      lines.push('## 阶段共识');
      lines.push('');
      
      data.consensus.forEach((consensus, index) => {
        lines.push(`### ${index + 1}. ${consensus.phaseName || `阶段 ${index + 1}`}`);
        lines.push('');
        lines.push(consensus.summary || '(无摘要)');
        lines.push('');
        
        if (consensus.commitments && consensus.commitments.length > 0) {
          lines.push('**核心承诺:**');
          consensus.commitments.forEach(commitment => {
            lines.push(`- ${commitment}`);
          });
          lines.push('');
        }
      });
    }

    if (data.backtrackResults && data.backtrackResults.length > 0) {
      lines.push('## 回溯校验结果');
      lines.push('');
      
      const latestResult = data.backtrackResults[data.backtrackResults.length - 1];
      lines.push(`**校验状态**: ${latestResult.status === 'SUPPORTED' ? '✅ 通过' : latestResult.status === 'TENSION' ? '⚠️ 存在张力' : '❌ 发现矛盾'}`);
      lines.push(`**整体评分**: ${latestResult.overallScore || '-'}/100`);
      lines.push(`**校验摘要**: ${latestResult.summary || '-'}`);
      lines.push('');
      
      if (latestResult.violations && latestResult.violations.length > 0) {
        lines.push('### 严重问题');
        latestResult.violations.forEach((violation, index) => {
          lines.push(`${index + 1}. **${violation.commitment}**`);
          if (violation.issues) {
            violation.issues.forEach(issue => {
              lines.push(`   - ${issue.message}`);
              if (issue.suggestion) {
                lines.push(`     💡 建议: ${issue.suggestion}`);
              }
            });
          }
          lines.push('');
        });
      }
      
      if (latestResult.warnings && latestResult.warnings.length > 0) {
        lines.push('### 潜在问题');
        latestResult.warnings.forEach((warning, index) => {
          lines.push(`${index + 1}. **${warning.commitment}**`);
          if (warning.issues) {
            warning.issues.forEach(issue => {
              lines.push(`   - ${issue.message}`);
            });
          }
          lines.push('');
        });
      }
    }

    if (data.config && data.config.roles) {
      lines.push('## 参与角色');
      lines.push('');
      data.config.roles.forEach((role, index) => {
        lines.push(`${index + 1}. **${role.name}** (${role.roleType})`);
        lines.push(`   - 模型: ${role.model}`);
        if (role.soul) {
          lines.push(`   - Soul: ${role.soul.substring(0, 100)}...`);
        }
        lines.push('');
      });
    }

    lines.push('---');
    lines.push('*本报告由 Taolun PRD Debate Dashboard 自动生成*');

    return lines.join('\n');
  }

  generateHTML(data) {
    const markdown = this.generateMarkdown(data);
    
    const htmlTemplate = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>PRD 辩论报告 - ${data.topic || '未命名'}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 800px;
      margin: 40px auto;
      padding: 20px;
      background: #fff;
    }
    h1 { 
      font-size: 24px; 
      border-bottom: 2px solid #3B82F6; 
      padding-bottom: 10px; 
      margin-bottom: 20px;
      color: #1a1a1a;
    }
    h2 { 
      font-size: 18px; 
      color: #3B82F6;
      margin-top: 30px;
      margin-bottom: 15px;
      border-left: 4px solid #3B82F6;
      padding-left: 12px;
    }
    h3 {
      font-size: 16px;
      color: #555;
      margin-top: 20px;
      margin-bottom: 10px;
    }
    p { margin-bottom: 15px; text-align: justify; }
    blockquote {
      background: #f8f9fa;
      border-left: 4px solid #ddd;
      padding: 12px 16px;
      margin: 15px 0;
      font-style: italic;
      color: #555;
    }
    ul, ol { margin-left: 25px; margin-bottom: 15px; }
    li { margin-bottom: 5px; }
    strong { color: #1a1a1a; }
    hr { 
      border: none; 
      border-top: 1px solid #e5e7eb; 
      margin: 30px 0; 
    }
    .meta-info {
      background: #f8f9fa;
      padding: 15px;
      border-radius: 8px;
      margin-bottom: 20px;
      font-size: 14px;
      color: #666;
    }
    .status-passed { color: #10B981; font-weight: bold; }
    .status-warning { color: #F59E0B; font-weight: bold; }
    .status-failed { color: #EF4444; font-weight: bold; }
    .footer {
      text-align: center;
      color: #999;
      font-size: 14px;
      margin-top: 40px;
      font-style: italic;
    }
    @media print {
      body { margin: 0; padding: 20px; }
      .no-print { display: none; }
    }
  </style>
</head>
<body>
  <div class="meta-info no-print" style="text-align:center;margin-bottom:20px;">
    <p style="margin:0;">💡 提示：按 <strong>Ctrl+P</strong> 可将此页面保存为 PDF</p>
  </div>
  
  ${this.markdownToHtml(markdown)}
  
  <div class="footer">
    本报告由 脑痒 自动生成
  </div>

  <script>
    window.onload = function() {
      if (window.matchMedia('print').matches) {
        document.querySelectorAll('.no-print').forEach(el => el.style.display = 'none');
      }
    };
  </script>
</body>
</html>`;

    return htmlTemplate;
  }

  markdownToHtml(markdown) {
    let html = markdown
      .replace(/^# (.+)$/gm, '<h1>$1</h1>')
      .replace(/^## (.+)$/gm, '<h2>$1</h2>')
      .replace(/^### (.+)$/gm, '<h3>$1</h3>')
      .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
      .replace(/`(.+?)`/g, '<code>$1</code>')
      .replace(/^> (.+)$/gm, '<blockquote>$1</blockquote>')
      .replace(/^- (.+)$/gm, '<li>$1</li>')
      .replace(/^(\d+)\. (.+)$/gm, '<li>$2</li>')
      .replace(/\n\n/g, '</p><p>')
      .replace(/\n/g, '<br>');
    
    return `<p>${html}</p>`;
  }

  getStatusText(status) {
    const statusMap = {
      idle: '未开始',
      running: '进行中',
      paused: '已暂停',
      completed: '已完成',
    };
    return statusMap[status] || status;
  }

  getRoleEmoji(role) {
    const roleEmojis = {
      '主持人': '🎯',
      '提案者': '💡',
      '审查者': '🔍',
      'system': '📢',
    };
    return roleEmojis[role] || '👤';
  }

  async getExportList() {
    try {
      const files = await fs.readdir(this.exportDir);
      const fileList = [];
      
      for (const file of files) {
        if (file.endsWith('.md') || file.endsWith('.html') || file.endsWith('.docx')) {
          const filepath = path.join(this.exportDir, file);
          const stat = await fs.stat(filepath);
          fileList.push({
            name: file,
            path: filepath,
            size: stat.size,
            created: stat.birthtime,
            format: file.endsWith('.md') ? 'markdown' : file.endsWith('.html') ? 'html' : 'docx',
          });
        }
      }
      
      return fileList.sort((a, b) => b.created - a.created);
    } catch (error) {
      console.error('[Export] Failed to list exports:', error);
      return [];
    }
  }

  async deleteExport(filename) {
    try {
      const filepath = path.join(this.exportDir, filename);
      await fs.unlink(filepath);
      return { success: true };
    } catch (error) {
      console.error('[Export] Failed to delete export:', error);
      return { success: false, error: error.message };
    }
  }
}

module.exports = new ExportService();
