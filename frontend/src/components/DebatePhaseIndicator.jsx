import { useDebateStore } from '../stores/debateStore';
import { CheckCircle, Circle, ChevronRight } from 'lucide-react';

export default function DebatePhaseIndicator() {
  const { phases, currentPhase, debateStatus } = useDebateStore();

  if (debateStatus === 'idle') return null;

  return (
    <div className="bg-gray-1 border-b border-gray-3 px-4 py-3">
      <div className="flex items-center justify-between">
        <h3 className="text-body font-medium text-gray-7">辩论阶段</h3>
        <span className="text-small text-gray-7">
          {debateStatus === 'running' ? '进行中' : debateStatus === 'completed' ? '已完成' : '已暂停'}
        </span>
      </div>
      
      <div className="flex items-center mt-2 space-x-1">
        {phases.map((phase, index) => {
          const isCompleted = index < currentPhase;
          const isCurrent = index === currentPhase && debateStatus === 'running';
          const isPending = index > currentPhase;

          return (
            <div key={phase.id} className="flex items-center flex-1">
              <div className={`flex items-center gap-1.5 px-2 py-1 rounded-md text-small font-medium transition-all ${
                isCompleted 
                  ? 'bg-success-1 text-success-5' 
                  : isCurrent 
                    ? 'bg-brand-1 text-brand-5 animate-pulse'
                    : 'bg-gray-2 text-gray-7'
              }`}>
                {isCompleted ? (
                  <CheckCircle className="w-3.5 h-3.5" />
                ) : (
                  <Circle className="w-3.5 h-3.5" />
                )}
                <span className="hidden sm:inline">{phase.name}</span>
                <span className="sm:hidden">{index + 1}</span>
              </div>
              
              {index < phases.length - 1 && (
                <ChevronRight className={`w-3 h-3 mx-1 ${
                  isCompleted ? 'text-success-5' : 'text-gray-7'
                }`} />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
