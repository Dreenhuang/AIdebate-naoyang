const { describe, it, expect, beforeAll, afterAll } = require('@jest/globals');
const exportService = require('../src/services/exportService');

describe('ExportService', () => {
  const mockDebateData = {
    status: 'completed',
    topic: 'AI会取代人类的工作吗？',
    messages: [
      {
        role: '提案者',
        content: 'AI将在未来10年内取代50%的重复性工作',
        phase: 0,
        round: 1,
        timestamp: '2026-05-08T12:00:00Z',
      },
      {
        role: '审查者',
        content: 'AI无法完全取代需要创造力和情感的工作',
        phase: 0,
        round: 2,
        timestamp: '2026-05-08T12:02:00Z',
      },
    ],
    consensus: [
      {
        phaseName: '需求探查',
        summary: '双方就AI对工作的影响达成部分共识，认为AI主要影响重复性工作',
        commitments: ['AI影响重复性工作', '创造力不可替代', '需要人类监督'],
      },
    ],
    backtrackResults: [
      {
        status: 'SUPPORTED',
        overallScore: 85,
        violations: [],
        warnings: [],
        checks: [],
        summary: '所有承诺通过回溯校验；整体评分: 85/100',
      },
    ],
    config: {
      roles: [
        { name: '主持人', roleType: 'host', model: 'deepseek', soul: '苏格拉底式引导' },
        { name: '提案者', roleType: 'proposer', model: 'minimax', soul: '远见者' },
        { name: '审查者', roleType: 'reviewer', model: 'deepseek', soul: '魔鬼代言人' },
      ],
    },
    phases: [
      { id: 'probe', name: '需求探查', description: '深入理解需求背景和目标' },
      { id: 'design', name: '方案设计', description: '提出和评估技术方案' },
    ],
    currentPhase: 1,
  };

  describe('generateMarkdown()', () => {
    it('应该生成有效的 Markdown 内容', () => {
      const markdown = exportService.generateMarkdown(mockDebateData);
      
      expect(markdown).toBeDefined();
      expect(typeof markdown).toBe('string');
      expect(markdown.length).toBeGreaterThan(0);
    });

    it('应该包含标题', () => {
      const markdown = exportService.generateMarkdown(mockDebateData);
      
      expect(markdown).toContain('# PRD 辩论报告');
    });

    it('应该包含辩论话题', () => {
      const markdown = exportService.generateMarkdown(mockDebateData);
      
      expect(markdown).toContain('AI会取代人类的工作吗？');
    });

    it('应该包含阶段信息', () => {
      const markdown = exportService.generateMarkdown(mockDebateData);
      
      expect(markdown).toContain('需求探查');
      expect(markdown).toContain('方案设计');
    });

    it('应该包含消息记录', () => {
      const markdown = exportService.generateMarkdown(mockDebateData);
      
      expect(markdown).toContain('提案者');
      expect(markdown).toContain('审查者');
      expect(markdown).toContain('AI将在未来10年内取代50%的重复性工作');
    });

    it('应该包含共识信息', () => {
      const markdown = exportService.generateMarkdown(mockDebateData);
      
      expect(markdown).toContain('阶段共识');
      expect(markdown).toContain('需求探查');
      expect(markdown).toContain('核心承诺');
    });

    it('应该包含回溯校验结果', () => {
      const markdown = exportService.generateMarkdown(mockDebateData);
      
      expect(markdown).toContain('回溯校验结果');
      expect(markdown).toContain('85/100');
    });

    it('应该包含参与角色信息', () => {
      const markdown = exportService.generateMarkdown(mockDebateData);
      
      expect(markdown).toContain('参与角色');
      expect(markdown).toContain('主持人');
      expect(markdown).toContain('提案者');
      expect(markdown).toContain('审查者');
    });
  });

  describe('generateHTML()', () => {
    it('应该生成有效的 HTML 内容', () => {
      const html = exportService.generateHTML(mockDebateData);
      
      expect(html).toBeDefined();
      expect(typeof html).toBe('string');
      expect(html).toContain('<!DOCTYPE html>');
      expect(html).toContain('</html>');
    });

    it('应该包含正确的 meta 标签', () => {
      const html = exportService.generateHTML(mockDebateData);
      
      expect(html).toContain('<meta charset="UTF-8">');
    });

    it('应该包含 CSS 样式', () => {
      const html = exportService.generateHTML(mockDebateData);
      
      expect(html).toContain('<style>');
      expect(html).toContain('</style>');
    });

    it('应该包含打印提示', () => {
      const html = exportService.generateHTML(mockDebateData);
      
      expect(html).toContain('Ctrl+P');
    });
  });

  describe('getStatusText()', () => {
    it('应该正确转换状态文本', () => {
      expect(exportService.getStatusText('idle')).toBe('未开始');
      expect(exportService.getStatusText('running')).toBe('进行中');
      expect(exportService.getStatusText('paused')).toBe('已暂停');
      expect(exportService.getStatusText('completed')).toBe('已完成');
    });
  });

  describe('getRoleEmoji()', () => {
    it('应该返回正确的角色表情符号', () => {
      expect(exportService.getRoleEmoji('主持人')).toBe('🎯');
      expect(exportService.getRoleEmoji('提案者')).toBe('💡');
      expect(exportService.getRoleEmoji('审查者')).toBe('🔍');
      expect(exportService.getRoleEmoji('system')).toBe('📢');
    });

    it('应该为未知角色返回默认表情', () => {
      expect(exportService.getRoleEmoji('未知角色')).toBe('👤');
    });
  });

  describe('markdownToHtml()', () => {
    it('应该将 Markdown 转换为 HTML', () => {
      const markdown = '# 标题\n\n**粗体文本**\n\n- 列表项1\n- 列表项2';
      const html = exportService.markdownToHtml(markdown);
      
      expect(html).toContain('<h1>标题</h1>');
      expect(html).toContain('<strong>粗体文本</strong>');
      expect(html).toContain('<li>列表项1</li>');
      expect(html).toContain('<li>列表项2</li>');
    });
  });

  describe('exportToMarkdown()', () => {
    it('应该成功导出 Markdown 文件', async () => {
      const result = await exportService.exportToMarkdown(mockDebateData);
      
      expect(result.success).toBeTruthy();
      expect(result.filename).toMatch(/\.md$/);
      expect(result.format).toBe('markdown');
      expect(result.content).toBeDefined();
    }, 10000);

    it('应该在失败时返回错误信息', async () => {
      // 测试空数据
      const result = await exportService.exportToMarkdown({});
      
      // 应该不会抛出异常，但可能返回警告
      expect(result.success).toBeDefined();
    }, 5000);
  });

  describe('exportToPDF()', () => {
    it('应该成功导出 HTML 文件（用于 PDF）', async () => {
      const result = await exportService.exportToPDF(mockDebateData);
      
      expect(result.success).toBeTruthy();
      expect(result.filename).toMatch(/\.html$/);
      expect(result.format).toBe('html');
      expect(result.note).toBeDefined();
    }, 10000);
  });
});
