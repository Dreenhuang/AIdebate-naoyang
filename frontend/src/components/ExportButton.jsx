import { useState } from 'react';
import { FileDown, FileText, FileSpreadsheet, Printer, CheckCircle, AlertCircle, Loader2 } from 'lucide-react';
import { useDebateStore } from '../stores/debateStore';

export default function ExportButton() {
  const [isExporting, setIsExporting] = useState(false);
  const [exportResult, setExportResult] = useState(null);
  const [showMenu, setShowMenu] = useState(false);
  
  const { 
    debateStatus, 
    topic, 
    messages, 
    consensus, 
    backtrackResults,
    config,
    phases,
    currentPhase
  } = useDebateStore();

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:9528/api';

  const getDebateData = () => ({
    status: debateStatus,
    topic: topic || config?.topic || '',
    messages: messages || [],
    consensus: consensus || [],
    backtrackResults: backtrackResults || [],
    config: config || null,
    phases: phases || [],
    currentPhase: currentPhase || 0,
  });

  const handleExport = async (format) => {
    console.log('[Export] 开始导出，格式:', format);
    console.log('[Export] 辩论数据:', {
      topic: topic || config?.topic,
      messagesCount: messages?.length || 0,
      consensusCount: consensus?.length || 0,
    });
    
    setIsExporting(true);
    setExportResult(null);
    setShowMenu(false);

    try {
      const debateData = getDebateData();
      
      // 检查数据完整性
      if (!debateData.messages || debateData.messages.length === 0) {
        throw new Error('当前没有辩论内容可导出。请先开始一场辩论！');
      }
      
      // docx 格式：后端直接返回二进制文件，不走 JSON 流程
      if (format === 'docx') {
        console.log('[Export] 正在导出 DOCX...');
        const response = await fetch(`${API_URL}/exports/docx`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(debateData),
        });

        console.log('[Export] DOCX 响应状态:', response.status);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('[Export] DOCX 导出失败:', errorText);
          throw new Error(errorText || '导出 Word 文档失败');
        }

        const blob = await response.blob();
        console.log('[Export] DOCX blob 大小:', blob.size, 'bytes');
        const filename = `辩论报告-${topic || config?.topic || '未命名'}-${Date.now()}.docx`;
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);

        setExportResult({
          success: true,
          format,
          filename,
          note: 'Word 文档已下载到本地',
        });
        console.log('[Export] DOCX 导出成功!');
        setIsExporting(false);
        return;
      }

      // markdown / pdf 格式：后端返回 JSON
      const endpoint = format === 'markdown' ? '/markdown' : '/pdf';
      
      const response = await fetch(`${API_URL}/exports${endpoint}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(debateData),
      });

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
    } catch (error) {
      setExportResult({
        success: false,
        error: error.message || '网络错误',
      });
    } finally {
      setIsExporting(false);
    }
  };

  const downloadFile = (content, filename, type = 'text/markdown') => {
    const blob = new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="relative">
      <button
        onClick={() => {
          // 改进：检查是否有内容可导出
          if (messages.length === 0) {
            setExportResult({
              success: false,
              error: '当前没有辩论内容可导出。请先开始一场辩论！',
            });
            setTimeout(() => setExportResult(null), 4000);
            return;
          }
          setShowMenu(!showMenu);
        }}
        disabled={isExporting}
        className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-bg-tertiary hover:bg-hover border border-border-primary rounded-md transition-colors disabled:opacity-50"
        title="导出辩论报告"
      >
        {isExporting ? (
          <Loader2 className="w-3.5 h-3.5 animate-spin" />
        ) : (
          <FileDown className="w-3.5 h-3.5" />
        )}
        导出报告
      </button>

      {showMenu && (
        <div className="absolute right-0 top-full mt-1 w-48 bg-bg-secondary border border-border-primary rounded-lg shadow-lg z-10 overflow-hidden">
          <div className="p-1.5 border-b border-border-primary text-xs text-text-muted font-medium">
            选择导出格式
          </div>
          
          <button
            onClick={() => handleExport('markdown')}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-bg-hover transition-colors"
          >
            <FileText className="w-4 h-4 text-text-secondary" />
            <span>Markdown (.md)</span>
          </button>
          
          <button
            onClick={() => handleExport('docx')}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-bg-hover transition-colors"
          >
            <FileSpreadsheet className="w-4 h-4 text-text-secondary" />
            <span>Word 文档 (.docx)</span>
          </button>
          
          <button
            onClick={() => handleExport('pdf')}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-bg-hover transition-colors"
          >
            <Printer className="w-4 h-4 text-text-secondary" />
            <span>PDF (通过打印)</span>
          </button>

          {(messages.length === 0 || debateStatus === 'idle') && (
            <div className="px-3 py-2 text-xs text-warning bg-warning/10 m-1.5 rounded">
              当前无内容可导出
            </div>
          )}
        </div>
      )}

      {exportResult && (
        <div className={`absolute right-0 top-full mt-1 w-64 p-3 rounded-lg shadow-lg z-20 ${
        exportResult.success 
          ? 'bg-success/10 border border-success/30' 
          : 'bg-error/10 border border-error/30'
      }`}>
        <div className="flex items-start gap-2">
          {exportResult.success ? (
            <CheckCircle className="w-4 h-4 text-success mt-0.5 flex-shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-error mt-0.5 flex-shrink-0" />
          )}
          <div className="text-xs">
            <p className={exportResult.success ? 'text-success font-medium' : 'text-error font-medium'}>
              {exportResult.success ? '导出成功！' : '导出失败'}
            </p>
            
            {exportResult.success ? (
              <>
                <p className="text-text-secondary mt-1">文件: {exportResult.filename}</p>
                
                {exportResult.format === 'markdown' && (
                  <button
                    onClick={() => downloadFile(exportResult.content, exportResult.filename)}
                    className="mt-2 px-2 py-1 text-xs bg-brand-primary text-white rounded hover:bg-brand-primary/90 transition-colors"
                  >
                    下载 Markdown 文件
                  </button>
                )}
                
                {exportResult.format === 'docx' && exportResult.note && (
                  <p className="text-text-muted mt-1 italic">{exportResult.note}</p>
                )}
                
                {exportResult.format === 'pdf' && exportResult.note && (
                  <p className="text-text-muted mt-1 italic">{exportResult.note}</p>
                )}
              </>
            ) : (
              <p className="text-error mt-1">{exportResult.error}</p>
            )}
          </div>
        </div>
        
        <button
          onClick={() => setExportResult(null)}
          className="absolute top-1 right-1 w-4 h-4 text-text-muted hover:text-text-secondary"
        >
          ×
        </button>
      </div>
      )}
    </div>
  );
}
