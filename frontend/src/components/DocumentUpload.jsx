import { useState, useRef } from 'react';
import { Upload, FileText, X, CheckCircle, AlertCircle, Loader2, Eye } from 'lucide-react';
import { useDebateStore } from '../stores/debateStore';

const ALLOWED_TYPES = {
  'text/markdown': '.md',
  'text/plain': '.txt',
  'application/pdf': '.pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
};

const ALLOWED_EXTENSIONS = ['.md', '.txt', '.pdf', '.docx'];
const MAX_FILE_SIZE = 20 * 1024 * 1024; // 20MB

// PRD 文档特征关键词
const PRD_KEYWORDS = [
  '需求', 'requirement', '功能', 'feature', '用户故事', 'user story',
  '验收标准', 'acceptance criteria', '产品', 'product', 'PRD',
  '需求文档', '需求规格', '模块', 'module', '接口', 'interface',
  '优先级', 'priority', '里程碑', 'milestone', '用例', 'use case',
];

export default function DocumentUpload() {
  const { uploadedDoc, setUploadedDoc } = useDebateStore();
  const [isDragging, setIsDragging] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadStatus, setUploadStatus] = useState('idle'); // idle, uploading, success, error
  const [statusMessage, setStatusMessage] = useState('');
  const [showPreview, setShowPreview] = useState(false);
  const fileInputRef = useRef(null);

  const analyzeDocumentType = (fileName, content) => {
    const lowerContent = (content || '').toLowerCase();
    const lowerFileName = (fileName || '').toLowerCase();
    const combined = lowerFileName + ' ' + lowerContent;
    
    let matchCount = 0;
    PRD_KEYWORDS.forEach(keyword => {
      if (combined.includes(keyword.toLowerCase())) {
        matchCount++;
      }
    });

    const matchRatio = PRD_KEYWORDS.length > 0 ? matchCount / PRD_KEYWORDS.length : 0;
    
    if (matchRatio >= 0.15 || lowerFileName.includes('prd') || lowerFileName.includes('需求')) {
      return { type: 'prd', confidence: Math.min(matchRatio * 3, 0.95) };
    }
    
    return { type: 'general', confidence: 0.3 };
  };

  const extractDocSummary = (content) => {
    if (!content) return '';
    const lines = content.split('\n').filter(line => line.trim());
    const firstLines = lines.slice(0, 5).join(' ').substring(0, 200);
    return firstLines + (lines.length > 5 ? '...' : '');
  };

  const processFile = async (file) => {
    // 1. 验证文件类型
    const ext = '.' + file.name.split('.').pop().toLowerCase();
    if (!ALLOWED_EXTENSIONS.includes(ext)) {
      setUploadStatus('error');
      setStatusMessage(`不支持的文件格式: ${ext}`);
      return;
    }

    // 2. 验证文件大小
    if (file.size > MAX_FILE_SIZE) {
      setUploadStatus('error');
      setStatusMessage(`文件过大，最大支持 ${MAX_FILE_SIZE / 1024 / 1024}MB`);
      return;
    }

    // 3. 模拟上传过程（实际项目中应调用后端 API）
    setUploadStatus('uploading');
    setUploadProgress(0);
    setStatusMessage('正在上传并分析文档...');

    try {
      // 读取文件内容（针对文本文件）
      let content = '';
      if (ext === '.md' || ext === '.txt') {
        content = await file.text();
      }

      // 模拟上传进度
      const simulateProgress = () => {
        return new Promise((resolve) => {
          let progress = 0;
          const interval = setInterval(() => {
            progress += Math.random() * 30;
            if (progress >= 100) {
              progress = 100;
              clearInterval(interval);
              resolve();
            }
            setUploadProgress(Math.round(progress));
          }, 200);
        });
      };

      await simulateProgress();

      // 分析文档类型
      const docAnalysis = analyzeDocumentType(file.name, content);
      const summary = extractDocSummary(content);

      setUploadedDoc({
        name: file.name,
        size: file.size,
        type: ext,
        analysis: docAnalysis,
        summary,
        content: ext === '.md' || ext === '.txt' ? content.substring(0, 5000) : '',
        uploadedAt: new Date().toISOString(),
      });

      setUploadStatus('success');
      setStatusMessage(
        docAnalysis.type === 'prd' 
          ? `检测到 PRD 文档 (置信度: ${(docAnalysis.confidence * 100).toFixed(0)}%)`
          : '文档上传成功'
      );
    } catch (error) {
      setUploadStatus('error');
      setStatusMessage(`上传失败: ${error.message}`);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      processFile(files[0]);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleFileSelect = (e) => {
    const files = e.target.files;
    if (files.length > 0) {
      processFile(files[0]);
    }
  };

  const clearDocument = () => {
    setUploadedDoc(null);
    setUploadStatus('idle');
    setUploadProgress(0);
    setStatusMessage('');
    setShowPreview(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-3">
      {/* 标签 */}
      <div className="flex items-center gap-2">
        <FileText className="w-4 h-4 text-text-muted" />
        <label className="text-sm font-medium">PRD 文档上传</label>
        <span className="text-xs text-text-muted ml-auto">
          支持 .md .txt .pdf .docx (最大 20MB)
        </span>
      </div>

      {/* 已上传文档显示 */}
      {uploadedDoc && (
        <div className="bg-bg-tertiary border border-border-primary rounded-lg p-3">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3 flex-1 min-w-0">
              <div className={`p-2 rounded-lg ${
                uploadedDoc.analysis.type === 'prd' 
                  ? 'bg-brand-primary/20 text-brand-primary' 
                  : 'bg-bg-hover text-text-muted'
              }`}>
                <FileText className="w-5 h-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium truncate">{uploadedDoc.name}</span>
                  {uploadedDoc.analysis.type === 'prd' && (
                    <span className="text-xs px-1.5 py-0.5 bg-brand-primary/20 text-brand-primary rounded">
                      PRD
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-3 mt-1 text-xs text-text-muted">
                  <span>{(uploadedDoc.size / 1024).toFixed(1)} KB</span>
                  <span>置信度: {(uploadedDoc.analysis.confidence * 100).toFixed(0)}%</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-1">
              {uploadedDoc.content && (
                <button
                  onClick={() => setShowPreview(!showPreview)}
                  className="p-1 hover:bg-bg-hover rounded transition-colors text-text-muted hover:text-text-primary"
                  title="预览文档"
                >
                  <Eye className="w-4 h-4" />
                </button>
              )}
              <button
                onClick={clearDocument}
                className="p-1 hover:bg-error/20 rounded transition-colors text-text-muted hover:text-error"
                title="移除文档"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* 文档摘要 */}
          {uploadedDoc.summary && (
            <div className="mt-2 pt-2 border-t border-border-primary">
              <p className="text-xs text-text-muted line-clamp-2">{uploadedDoc.summary}</p>
            </div>
          )}

          {/* 文档预览 */}
          {showPreview && uploadedDoc.content && (
            <div className="mt-2 pt-2 border-t border-border-primary">
              <pre className="text-xs text-text-secondary bg-bg-secondary p-2 rounded max-h-32 overflow-y-auto whitespace-pre-wrap">
                {uploadedDoc.content}
              </pre>
            </div>
          )}
        </div>
      )}

      {/* 上传区域 */}
      {!uploadedDoc && (
        <div
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-lg p-4 text-center cursor-pointer transition-all ${
            isDragging
              ? 'border-brand-primary bg-brand-primary/10'
              : uploadStatus === 'error'
              ? 'border-error bg-error/5'
              : 'border-border-primary hover:border-border-focus hover:bg-bg-hover'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".md,.txt,.pdf,.docx"
            onChange={handleFileSelect}
            className="hidden"
          />
          
          {uploadStatus === 'uploading' ? (
            <div className="space-y-2">
              <Loader2 className="w-8 h-8 mx-auto text-brand-primary animate-spin" />
              <p className="text-sm text-text-secondary">{statusMessage}</p>
              <div className="w-full bg-bg-tertiary rounded-full h-2">
                <div
                  className="bg-brand-primary h-2 rounded-full transition-all duration-300"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          ) : uploadStatus === 'error' ? (
            <div className="space-y-2">
              <AlertCircle className="w-8 h-8 mx-auto text-error" />
              <p className="text-sm text-error">{statusMessage}</p>
              <p className="text-xs text-text-muted">点击重新上传</p>
            </div>
          ) : uploadStatus === 'success' ? (
            <div className="space-y-2">
              <CheckCircle className="w-8 h-8 mx-auto text-success" />
              <p className="text-sm text-success">{statusMessage}</p>
              <p className="text-xs text-text-muted">点击上传新文档</p>
            </div>
          ) : (
            <div className="space-y-2">
              <Upload className="w-8 h-8 mx-auto text-text-muted" />
              <p className="text-sm text-text-secondary">
                拖拽文件到此处，或 <span className="text-brand-primary">点击选择文件</span>
              </p>
              <p className="text-xs text-text-muted">
                支持 .md .txt .pdf .docx 格式，最大 20MB
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
