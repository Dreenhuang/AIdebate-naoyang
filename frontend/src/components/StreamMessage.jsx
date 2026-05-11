/**
 * V11.0 加载动画组件（替代流式文字输出）
 * 原则：不显示流式内容（避免重复词语），只用动画告知用户AI正在工作
 */
import { useEffect, useState, useRef } from 'react';
import { Loader2, Sparkles, Brain, Zap } from 'lucide-react';
import { useDebateStore } from '../stores/debateStore';
import { useWebSocket } from '../hooks/useWebSocket';

export default function StreamMessage() {
  const { isStreaming, canCancel } = useDebateStore();
  const { cancelRequest } = useWebSocket();
  const [dots, setDots] = useState(0);
  const [phaseText, setPhaseText] = useState(0);

  // 动画效果：跳动圆点
  useEffect(() => {
    if (!isStreaming) return;
    const timer = setInterval(() => {
      setDots(prev => (prev + 1) % 4);
    }, 500);
    return () => clearInterval(timer);
  }, [isStreaming]);

  // 阶段文字轮换
  useEffect(() => {
    if (!isStreaming) return;
    const phases = [
      '正在深度思考...',
      '构建论证框架...',
      '调用AI模型生成...',
      '优化表达方式...',
      '即将完成...',
    ];
    const timer = setInterval(() => {
      setPhaseText(prev => Math.min(prev + 1, phases.length - 1));
    }, 3000);
    return () => clearInterval(timer);
  }, [isStreaming]);

  // 关键：只在非流式状态时隐藏整个组件
  if (!isStreaming) return null;

  const phases = [
    '正在深度思考...',
    '构建论证框架...',
    '调用AI模型生成...',
    '优化表达方式...',
    '即将完成...',
  ];

  return (
    <div className="p-6 border-l-4 border-blue-400 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg shadow-sm">
      {/* 头部：状态指示 */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          {/* 动态图标 */}
          <div className="relative">
            <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center animate-pulse">
              <Brain className="w-5 h-5 text-white" />
            </div>
            {/* 光晕效果 */}
            <div className="absolute inset-0 w-10 h-10 bg-blue-400 rounded-full animate-ping opacity-30"></div>
          </div>
          
          <div>
            <p className="text-base font-semibold text-gray-800 flex items-center gap-2">
              AI 正在思考
              <span className="text-gray-400">{'.'.repeat(dots)}</span>
            </p>
            <p className="text-xs text-gray-500 mt-0.5">{phases[phaseText]}</p>
          </div>
        </div>

        {canCancel && (
          <button
            onClick={() => cancelRequest()}
            className="px-3 py-1.5 text-xs font-medium bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors"
          >
            取消生成
          </button>
        )}
      </div>

      {/* 进度条动画 */}
      <div className="space-y-3">
        <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
          <div 
            className="h-full bg-gradient-to-r from-blue-400 to-purple-500 rounded-full transition-all duration-1000 ease-out"
            style={{ width: `${Math.min(20 + phaseText * 20, 90)}%` }}
          ></div>
        </div>

        {/* 状态标签 */}
        <div className="flex items-center justify-between text-xs text-gray-500">
          <div className="flex items-center gap-1">
            <Zap className="w-3 h-3 text-yellow-500" />
            <span>模型处理中</span>
          </div>
          <div className="flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-blue-500" />
            <span>请稍候，内容将在完成后一次性展示</span>
          </div>
        </div>
      </div>

      {/* 底部提示 */}
      <div className="mt-4 pt-3 border-t border-blue-100">
        <p className="text-xs text-gray-400 text-center">
          💡 为确保内容质量，采用完整生成模式，避免流式输出的重复问题
        </p>
      </div>
    </div>
  );
}
