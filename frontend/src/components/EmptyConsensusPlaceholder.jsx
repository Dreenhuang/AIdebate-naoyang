import { Brain } from 'lucide-react';

export default function EmptyConsensusPlaceholder() {
  return (
    <div className="flex flex-col items-center justify-center h-full p-6 text-center">
      <div className="relative mb-4">
        <Brain className="w-16 h-16 text-brand-primary/40" />
      </div>

      <h4 className="text-sm font-medium text-text-primary mb-2">等待辩论开始</h4>
      <p className="text-xs text-text-muted leading-relaxed">
        配置辩论参数后点击"开始辩论"<br />
        共识内容将在此显示
      </p>

      <div className="flex gap-1.5 mt-4">
        <span className="w-1.5 h-1.5 rounded-full bg-brand-primary/40 animate-pulse" style={{ animationDelay: '0ms' }}></span>
        <span className="w-1.5 h-1.5 rounded-full bg-brand-primary/40 animate-pulse" style={{ animationDelay: '200ms' }}></span>
        <span className="w-1.5 h-1.5 rounded-full bg-brand-primary/40 animate-pulse" style={{ animationDelay: '400ms' }}></span>
      </div>
    </div>
  );
}