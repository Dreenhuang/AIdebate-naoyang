const fs = require('fs').promises;
const path = require('path');

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
        if (file.endsWith('.md') || file.endsWith('.html')) {
          const filepath = path.join(this.exportDir, file);
          const stat = await fs.stat(filepath);
          fileList.push({
            name: file,
            path: filepath,
            size: stat.size,
            created: stat.birthtime,
            format: file.endsWith('.md') ? 'markdown' : 'html',
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
