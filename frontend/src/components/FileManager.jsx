import { useState } from 'react';
import { Folder, FileText, Download, Eye, CheckSquare, Square, X } from 'lucide-react';
import { useDebateStore } from '../stores/debateStore';

export default function FileManager() {
  const { files } = useDebateStore();
  const [selectedFiles, setSelectedFiles] = useState(new Set());
  const [previewFile, setPreviewFile] = useState(null);

  const toggleSelection = (filename) => {
    const newSelected = new Set(selectedFiles);
    if (newSelected.has(filename)) {
      newSelected.delete(filename);
    } else {
      newSelected.add(filename);
    }
    setSelectedFiles(newSelected);
  };

  const selectAll = () => {
    if (selectedFiles.size === files.length) {
      setSelectedFiles(new Set());
    } else {
      setSelectedFiles(new Set(files.map(f => f.name)));
    }
  };

  const downloadFile = (content, filename, type = 'text/plain') => {
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

  const downloadSelected = () => {
    const selected = files.filter(f => selectedFiles.has(f.name));
    selected.forEach((file, index) => {
      setTimeout(() => downloadFile(file.content || '', file.name), index * 100);
    });
  };

  const downloadAll = () => {
    files.forEach((file, index) => {
      setTimeout(() => downloadFile(file.content || '', file.name), index * 100);
    });
  };

  const handleFileDownload = (file) => {
    downloadFile(file.content || '', file.name);
  };

  const formatSize = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  return (
    <div className="h-[140px] bg-bg-secondary border-t border-border-primary flex flex-col overflow-hidden">
      {/* 头部 */}
      <div className="px-4 py-1.5 border-b border-border-primary flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Folder className="w-3.5 h-3.5 text-brand-primary" />
          <span className="text-xs font-medium text-text-secondary">文件列表 ({files.length})</span>
        </div>
        <div className="flex items-center gap-2">
          {selectedFiles.size > 0 && (
            <button
              onClick={downloadSelected}
              className="flex items-center gap-1 text-xs bg-brand-primary hover:bg-brand-primary/90 text-white px-3 py-1.5 rounded transition-colors"
            >
              <Download className="w-3 h-3" />
              批量下载 ({selectedFiles.size})
            </button>
          )}
          <button
            onClick={downloadAll}
            className="flex items-center gap-1 text-xs bg-bg-tertiary hover:bg-bg-hover border border-border-primary text-text-secondary px-3 py-1.5 rounded transition-colors"
          >
            <Download className="w-3 h-3" />
            全部下载
          </button>
        </div>
      </div>

      {/* 文件列表 */}
      <div className="flex-1 overflow-y-auto">
        {files.length === 0 ? (
          <div className="flex items-center justify-center h-full text-text-muted py-2">
            <p className="text-xs">暂无文件，请先完成辩论</p>
          </div>
        ) : (
          <div className="divide-y divide-border-primary">
            {/* 全选 */}
            <div className="px-4 py-2 flex items-center gap-2 hover:bg-bg-hover transition-colors">
              <button onClick={selectAll} className="flex items-center gap-2">
                {selectedFiles.size === files.length ? (
                  <CheckSquare className="w-4 h-4 text-brand-primary" />
                ) : (
                  <Square className="w-4 h-4 text-text-muted" />
                )}
                <span className="text-xs text-text-muted">全选</span>
              </button>
            </div>
            
            {files.map((file) => (
              <div
                key={file.name}
                className={`px-4 py-2 flex items-center justify-between hover:bg-bg-hover transition-colors ${
                  selectedFiles.has(file.name) ? 'bg-bg-hover border-l-2 border-l-brand-primary' : ''
                }`}
              >
                <div className="flex items-center gap-3">
                  <button onClick={() => toggleSelection(file.name)}>
                    {selectedFiles.has(file.name) ? (
                      <CheckSquare className="w-4 h-4 text-brand-primary" />
                    ) : (
                      <Square className="w-4 h-4 text-text-muted" />
                    )}
                  </button>
                  <FileText className="w-4 h-4 text-text-secondary" />
                  <span className="text-sm text-text-primary">{file.name}</span>
                  <span className="text-xs text-text-muted">{formatSize(file.size)}</span>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => setPreviewFile(file)}
                    className="p-1.5 hover:bg-bg-tertiary rounded transition-colors"
                    title="预览"
                  >
                    <Eye className="w-4 h-4 text-text-secondary" />
                  </button>
                  <button
                    onClick={() => handleFileDownload(file)}
                    className="p-1.5 hover:bg-bg-tertiary rounded transition-colors"
                    title="下载"
                  >
                    <Download className="w-4 h-4 text-text-secondary" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 预览弹窗 */}
      {previewFile && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-bg-secondary rounded-lg w-[800px] h-[600px] flex flex-col">
            <div className="px-4 py-3 border-b border-border-primary flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-brand-primary" />
                <span className="font-medium">{previewFile.name}</span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleFileDownload(previewFile)}
                  className="flex items-center gap-1 text-xs bg-brand-primary hover:bg-brand-primary/90 text-white px-3 py-1.5 rounded transition-colors"
                >
                  <Download className="w-3 h-3" />
                  下载
                </button>
                <button
                  onClick={() => setPreviewFile(null)}
                  className="p-1.5 hover:bg-bg-tertiary rounded transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-auto p-4">
              <pre className="text-sm text-text-primary whitespace-pre-wrap">
                {previewFile.content || '文件内容加载中...'}
              </pre>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
