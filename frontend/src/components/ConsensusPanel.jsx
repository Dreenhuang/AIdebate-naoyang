import { useDebateStore } from '../stores/debateStore';
import { CheckCircle, AlertTriangle, Shield, XCircle, Info, ChevronDown, ChevronUp, TrendingUp, TrendingDown } from 'lucide-react';
import { useState } from 'react';

export default function ConsensusPanel() {
  const { consensus, backtrackResults, debateStatus } = useDebateStore();
  const [expandedCheck, setExpandedCheck] = useState(null);

  if (debateStatus === 'idle' || consensus.length === 0) return null;

  const latestConsensus = consensus[consensus.length - 1];
  const latestBacktrack = backtrackResults[backtrackResults.length - 1];

  return (
    <div className="bg-bg-secondary border border-border-primary rounded-lg overflow-hidden">
      <div className="p-4 space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium flex items-center gap-2">
            <CheckCircle className="w-4 h-4 text-success" />
            阶段共识
          </h3>
          <span className="text-xs px-2 py-0.5 rounded-full bg-brand-primary/10 text-brand-primary">
            {latestConsensus.phaseName}
          </span>
        </div>

        {/* 共识摘要 */}
        <div className="text-sm text-text-secondary bg-bg-tertiary rounded p-3 leading-relaxed">
          {latestConsensus.summary || '共识生成中...'}
        </div>

        {/* 承诺列表 */}
        {latestConsensus.commitments && latestConsensus.commitments.length > 0 && (
          <div className="space-y-2">
            <h4 className="text-xs font-medium text-text-muted flex items-center gap-1.5">
              <Shield className="w-3.5 h-3.5" />
              核心承诺 ({latestConsensus.commitments.length})
            </h4>
            <div className="space-y-1.5">
              {latestConsensus.commitments.map((commitment, index) => (
                <div key={index} className="flex items-start gap-2 text-xs group">
                  <span className="w-5 h-5 flex-shrink-0 rounded-full bg-success/20 text-success flex items-center justify-center text-[10px] font-bold mt-0.5">
                    {index + 1}
                  </span>
                  <span className="text-text-secondary group-hover:text-text-primary transition-colors flex-1">
                    {commitment}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 回溯校验结果 - 增强版 */}
        {latestBacktrack && (
          <div className={`border rounded-lg overflow-hidden ${
            latestBacktrack.status === 'SUPPORTED' 
              ? 'border-success/30 bg-success/5' 
              : latestBacktrack.status === 'TENSION'
                ? 'border-warning/30 bg-warning/5'
                : 'border-error/30 bg-error/5'
          }`}>
            {/* 校验状态头部 */}
            <div 
              className="px-3 py-2 cursor-pointer flex items-center justify-between"
              onClick={() => setExpandedCheck(expandedCheck === null ? 'main' : null)}
            >
              <div className="flex items-center gap-2">
                {latestBacktrack.status === 'SUPPORTED' ? (
                  <CheckCircle className="w-4 h-4 text-success" />
                ) : latestBacktrack.status === 'TENSION' ? (
                  <AlertTriangle className="w-4 h-4 text-warning animate-pulse" />
                ) : (
                  <XCircle className="w-4 h-4 text-error" />
                )}
                <span className="font-medium text-xs">
                  回溯校验: {
                    latestBacktrack.status === 'SUPPORTED' ? '通过' :
                    latestBacktrack.status === 'TENSION' ? '存在张力' : '发现矛盾'
                  }
                </span>
              </div>
              
              <div className="flex items-center gap-2">
                {/* 整体评分 */}
                {latestBacktrack.overallScore !== undefined && (
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] text-text-muted">评分</span>
                    <span className={`text-xs font-bold ${
                      latestBacktrack.overallScore >= 80 ? 'text-success' :
                      latestBacktrack.overallScore >= 50 ? 'text-warning' : 'text-error'
                    }`}>
                      {latestBacktrack.overallScore}/100
                    </span>
                    {latestBacktrack.overallScore >= 80 ? (
                      <TrendingUp className="w-3 h-3 text-success" />
                    ) : (
                      <TrendingDown className="w-3 h-3 text-error" />
                    )}
                  </div>
                )}
                
                {expandedCheck === 'main' ? (
                  <ChevronUp className="w-3.5 h-3.5" />
                ) : (
                  <ChevronDown className="w-3.5 h-3.5" />
                )}
              </div>
            </div>

            {/* 展开的详细内容 */}
            {expandedCheck === 'main' && (
              <div className="border-t border-current/10 p-3 space-y-3">
                {/* 校验摘要 */}
                {latestBacktrack.summary && (
                  <div className="text-xs italic text-text-muted pl-2 border-l-2 border-current/20">
                    {latestBacktrack.summary}
                  </div>
                )}

                {/* 问题统计 */}
                <div className="grid grid-cols-2 gap-2 text-xs">
                  <div className="bg-bg-tertiary/50 rounded p-2">
                    <span className="text-text-muted">严重问题</span>
                    <span className="ml-1 font-bold text-error">
                      {(latestBacktrack.violations || []).length}
                    </span>
                  </div>
                  <div className="bg-bg-tertiary/50 rounded p-2">
                    <span className="text-text-muted">潜在问题</span>
                    <span className="ml-1 font-bold text-warning">
                      {(latestBacktrack.warnings || []).length}
                    </span>
                  </div>
                </div>

                {/* 详细检查项 */}
                {latestBacktrack.checks && latestBacktrack.checks.length > 0 && (
                  <div className="space-y-2">
                    <h5 className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider">
                      检查详情
                    </h5>
                    
                    {latestBacktrack.checks.map((check, index) => (
                      <div key={check.id || index} className="border border-border-primary/50 rounded p-2">
                        <div className="flex items-start justify-between mb-1.5">
                          <span className="text-xs font-medium truncate max-w-[150px]" title={check.commitment}>
                            {check.commitment.substring(0, 40)}{check.commitment.length > 40 ? '...' : ''}
                          </span>
                          <span className={`text-[10px] font-bold ml-2 flex-shrink-0 px-1.5 py-0.5 rounded ${
                            check.status === 'OK' ? 'bg-success/20 text-success' :
                            check.status === 'CONTRADICTED' ? 'bg-error/20 text-error' :
                            'bg-warning/20 text-warning'
                          }`}>
                            {check.score !== undefined ? `${check.score}分` : check.status}
                          </span>
                        </div>

                        {/* 检查详情展开按钮 */}
                        {check.details && Object.keys(check.details).length > 0 && (
                          <button
                            onClick={() => setExpandedCheck(expandedCheck === check.id ? null : check.id)}
                            className="text-[10px] text-text-muted hover:text-text-secondary flex items-center gap-1"
                          >
                            <Info className="w-3 h-3" />
                            {expandedCheck === check.id ? '收起' : '查看详情'}
                          </button>
                        )}

                        {/* 展开的检查详情 */}
                        {expandedCheck === check.id && check.details && (
                          <div className="mt-2 space-y-2 pl-2 border-l-2 border-border-primary/30">
                            {/* 对齐检查 */}
                            {check.details.alignment && (
                              <div className="text-[11px]">
                                <div className="flex items-center gap-1 mb-1">
                                  <span className={`
                                    w-2 h-2 rounded-full ${check.details.alignment.status === 'PASS' ? 'bg-success' : check.details.alignment.status === 'FAIL' ? 'bg-error' : 'bg-warning'}
                                  `}></span>
                                  <span className="font-medium">对齐检查</span>
                                </div>
                                
                                {check.details.alignment.semanticSimilarity !== undefined && (
                                  <div className="ml-3 text-text-muted">
                                    相似度: {(check.details.alignment.semanticSimilarity * 100).toFixed(0)}%
                                    <div className="w-full h-1 bg-bg-tertiary rounded-full mt-1 overflow-hidden">
                                      <div 
                                        className={`h-full rounded-full transition-all ${
                                          check.details.alignment.semanticSimilarity >= 0.7 ? 'bg-success' :
                                          check.details.alignment.semanticSimilarity >= 0.4 ? 'bg-warning' : 'bg-error'
                                        }`}
                                        style={{ width: `${check.details.alignment.semanticSimilarity * 100}%` }}
                                      ></div>
                                    </div>
                                  </div>
                                )}
                              </div>
                            )}

                            {/* 范围检查 */}
                            {check.details.scope && (
                              <div className="text-[11px]">
                                <div className="flex items-center gap-1 mb-1">
                                  <span className={`
                                    w-2 h-2 rounded-full ${check.details.scope.status === 'PASS' ? 'bg-success' : 'bg-warning'}
                                  `}></span>
                                  <span className="font-medium">范围检查</span>
                                </div>
                                {check.details.scope.crossPhaseReferences?.length > 0 && (
                                  <div className="ml-3 text-text-muted">
                                    跨阶段引用: {check.details.scope.crossPhaseReferences.join(', ')}
                                  </div>
                                )}
                              </div>
                            )}

                            {/* 优先级检查 */}
                            {check.details.priority && (
                              <div className="text-[11px]">
                                <div className="flex items-center gap-1 mb-1">
                                  <span className={`
                                    w-2 h-2 rounded-full ${check.details.priority.status === 'PASS' ? 'bg-success' : 'bg-warning'}
                                  `}></span>
                                  <span className="font-medium">优先级</span>
                                </div>
                                {check.details.priority.committedPriority && (
                                  <div className="ml-3 text-text-muted">
                                    承诺级别: {check.details.priority.committedPriority}
                                  </div>
                                )}
                              </div>
                            )}

                            {/* 一致性检查 */}
                            {check.details.consistency && (
                              <div className="text-[11px]">
                                <div className="flex items-center gap-1 mb-1">
                                  <span className={`
                                    w-2 h-2 rounded-full ${check.details.consistency.status === 'PASS' ? 'bg-success' : check.details.consistency.status === 'FAIL' ? 'bg-error' : 'bg-warning'}
                                  `}></span>
                                  <span className="font-medium">历史一致性</span>
                                </div>
                                {check.details.consistency.contradictions?.length > 0 && (
                                  <div className="ml-3 text-text-muted">
                                    发现 {check.details.consistency.contradictions.length} 处矛盾
                                  </div>
                                )}
                              </div>
                            )}

                            {/* 可行性检查 */}
                            {check.details.feasibility && (
                              <div className="text-[11px]">
                                <div className="flex items-center gap-1 mb-1">
                                  <span className={`
                                    w-2 h-2 rounded-full ${check.details.feasibility.status === 'PASS' ? 'bg-success' : 'bg-warning'}
                                  `}></span>
                                  <span className="font-medium">可行性</span>
                                </div>
                                {check.details.feasibility.unrealisticPatterns?.length > 0 && (
                                  <div className="ml-3 text-text-muted">
                                    不切实际模式: {check.details.feasibility.unrealisticPatterns.join(', ')}
                                  </div>
                                )}
                              </div>
                            )}

                            {/* 具体问题列表 */}
                            {check.issues && check.issues.length > 0 && (
                              <div className="mt-2 space-y-1">
                                {check.issues.map((issue, i) => (
                                  <div key={i} className={`pl-2 py-1 rounded text-[10px] ${
                                    issue.severity >= 3 ? 'bg-error/10 text-error' :
                                    issue.severity >= 2 ? 'bg-warning/10 text-warning' :
                                    issue.severity >= 1 ? 'bg-info/10 text-info' : ''
                                  }`}>
                                    <div className="font-medium">{issue.code}</div>
                                    <div>{issue.message}</div>
                                    {issue.suggestion && (
                                      <div className="italic opacity-75 mt-0.5">
                                        💡 {issue.suggestion}
                                      </div>
                                    )}
                                  </div>
                                ))}
                              </div>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}

                {/* 跨阶段问题 */}
                {latestBacktrack.crossPhaseChecks && latestBacktrack.crossPhaseChecks.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-current/10">
                    <h5 className="text-[11px] font-semibold text-text-secondary uppercase tracking-wider mb-2">
                      跨阶段问题 ({latestBacktrack.crossPhaseChecks.filter(c => c.severity >= 2).length})
                    </h5>
                    
                    {latestBacktrack.crossPhaseChecks.map((issue, index) => (
                      <div key={index} className={`mb-2 last:mb-0 text-[11px] p-2 rounded ${
                        issue.severity >= 3 ? 'bg-error/10 border-l-2 border-error' :
                        issue.severity >= 2 ? 'bg-warning/10 border-l-2 border-warning' :
                        'bg-info/10 border-l-2 border-info'
                      }`}>
                        <div className="font-medium">{issue.type}</div>
                        <div className="text-text-muted">{issue.message}</div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
