import { useState, useEffect } from 'react';
import { Download, X, FileText, CheckCircle } from 'lucide-react';
import { useDebateStore } from '../stores/debateStore';

export default function DownloadCompleteDialog({ show, onClose }) {
  const { messages, consensus, topic, currentRound } = useDebateStore();
  const [isDownloading, setIsDownloading] = useState(false);

  if (!show) return null;

  const handleDownload = async (format) => {
    setIsDownloading(true);
    
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:9528/api';
      
      // 获取当前讨论数据
      const currentMessages = useDebateStore.getState().messages || [];
      const currentConsensus = useDebateStore.getState().consensus || [];
      const currentConfig = useDebateStore.getState().config || {};
      const currentPhases = useDebateStore.getState().phases || [];
      
      console.log('[DownloadCompleteDialog] 准备导出:', {
        messagesCount: currentMessages.length,
        consensusCount: currentConsensus.length,
        topic: topic || currentConfig.topic,
      });
      
      const debateData = {
        status: 'completed',
        topic: topic || currentConfig.topic || '未指定',
        messages: currentMessages,
        consensus: currentConsensus,
        backtrackResults: useDebateStore.getState().backtrackResults || [],
        config: currentConfig,
        phases: currentPhases,
        currentPhase: useDebateStore.getState().currentPhase || 0,
      };

      if (format === 'docx') {
        console.log('[DownloadCompleteDialog] 正在请求 DOCX...');
        const response = await fetch(`${API_URL}/exports/docx`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(debateData),
        });

        console.log('[DownloadCompleteDialog] DOCX 响应状态:', response.status, response.statusText);
        
        if (!response.ok) {
          const errorText = await response.text();
          console.error('[DownloadCompleteDialog] DOCX 错误响应:', errorText);
          throw new Error(`导出失败 (${response.status}): ${errorText.substring(0, 200)}`);
        }

        const blob = await response.blob();
        console.log('[DownloadCompleteDialog] DOCX blob 大小:', blob.size, 'bytes');
        
        if (blob.size === 0) {
          throw new Error('服务器返回了空文件');
        }
        
        const filename = `辩论报告-${topic || currentConfig.topic || '未命名'}-${Date.now()}.docx`;
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        
        alert('报告已下载成功！');
      } else if (format === 'md') {
        console.log('[DownloadCompleteDialog] 正在请求 Markdown...');
        const response = await fetch(`${API_URL}/exports/markdown`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(debateData),
        });

        console.log('[DownloadCompleteDialog] Markdown 响应状态:', response.status);
        
        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`导出失败 (${response.status}): ${errorText.substring(0, 200)}`);
        }

        const result = await response.json();
        if (result.success && result.data) {
          const markdown = result.data.content || '';
          const blob = new Blob([markdown], { type: 'text/markdown;charset=utf-8' });
          const filename = `辩论报告-${topic || currentConfig.topic || '未命名'}-${Date.now()}.md`;
          const url = URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = filename;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          URL.revokeObjectURL(url);
          
          alert('Markdown报告已下载成功！');
        } else {
          throw new Error(result.message || '导出失败');
        }
      }
    } catch (error) {
      console.error('[DownloadCompleteDialog] 下载失败:', error);
      alert('下载失败: ' + error.message);
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <>
      {/* 遮罩层 */}
      <div 
        className="fixed inset-0 bg-black/50 z-[100]"
        onClick={onClose}
      />
      
      {/* 弹窗 */}
      <div className="fixed inset-0 z-[101] flex items-center justify-center p-4 pointer-events-none">
        <div 
          className="bg-white rounded-2xl shadow-2xl w-full max-w-md pointer-events-auto overflow-hidden"
          onClick={e => e.stopPropagation()}
        >
          {/* 头部 */}
          <div className="bg-gradient-to-r from-emerald-500 to-teal-500 px-6 py-5 text-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-6 h-6" />
                </div>
                <div>
                  <h2 className="text-xl font-bold">🎉 讨论已完成！</h2>
                  <p className="text-white/80 text-sm mt-0.5">辩论已顺利完成</p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-8 h-8 bg-white/20 hover:bg-white/30 rounded-full flex items-center justify-center transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* 内容 */}
          <div className="p-6 space-y-5">
            {/* 统计信息 */}
            <div className="bg-gray-50 rounded-xl p-4 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">讨论话题</span>
                <span className="font-medium text-gray-900 truncate max-w-[200px]">{topic || '未指定'}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">总轮次</span>
                <span className="font-medium text-gray-900">{currentRound || 0} 轮</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">消息总数</span>
                <span className="font-medium text-gray-900">{(messages || []).length} 条</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-600">共识阶段</span>
                <span className="font-medium text-gray-900">{(consensus || []).length} 个</span>
              </div>
            </div>

            {/* 提示信息 */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-4">
              <p className="text-blue-700 text-sm">
                💡 您可以下载完整的辩论报告，保存讨论内容供后续参考。
              </p>
            </div>

            {/* 下载按钮 */}
            <div className="space-y-3">
              <button
                onClick={() => handleDownload('docx')}
                disabled={isDownloading}
                className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-200 hover:shadow-xl"
              >
                {isDownloading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    正在生成报告...
                  </>
                ) : (
                  <>
                    <Download className="w-5 h-5" />
                    下载完整报告 (.docx)
                  </>
                )}
              </button>

              <button
                onClick={() => handleDownload('md')}
                disabled={isDownloading}
                className="w-full flex items-center justify-center gap-3 px-6 py-4 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-200 hover:shadow-xl"
              >
                {isDownloading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    正在生成报告...
                  </>
                ) : (
                  <>
                    <FileText className="w-5 h-5" />
                    下载Markdown (.md)
                  </>
                )}
              </button>

              <button
                onClick={onClose}
                className="w-full px-6 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-medium rounded-xl transition-colors"
              >
                稍后再说
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
