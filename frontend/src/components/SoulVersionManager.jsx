import { useState, useEffect } from 'react';
import { X, Plus, Trash2, Save, Copy, Download, Upload, GitBranch, Layers, History, Check, ChevronRight, Sparkles } from 'lucide-react';
import { useDebateStore } from '../stores/debateStore';
import { getSoulVersionManager, SoulVersion as SoulVersionClass, SoulCombination as SoulCombinationClass } from '../data/soulVersionManager';
import { soulPresets, roleTypeNames, getSoulPresets } from '../data/soulPresets';

export default function SoulVersionManager({ isOpen, onClose }) {
  const [activeTab, setActiveTab] = useState('versions'); // versions, combinations, history
  const [versionManager] = useState(() => {
    try {
      return getSoulVersionManager();
    } catch (e) {
      console.error('[SoulVersionManager] 初始化失败:', e);
      return null;
    }
  });
  const [versions, setVersions] = useState([]);
  const [combinations, setCombinations] = useState([]);
  const [history, setHistory] = useState([]);
  const [selectedVersion, setSelectedVersion] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [showComboForm, setShowComboForm] = useState(false);
  const [newVersionName, setNewVersionName] = useState('');
  const [newVersionDesc, setNewVersionDesc] = useState('');
  const [newComboName, setNewComboName] = useState('');
  const [newComboDesc, setNewComboDesc] = useState('');
  const [editingCombo, setEditingCombo] = useState(null);
  const [mixRules, setMixRules] = useState({});
  const [notification, setNotification] = useState(null);

  const { config, updateRole, applySoulPreset } = useDebateStore();

  // 刷新数据
  const refreshData = () => {
    if (!versionManager) return;
    setVersions(versionManager.getVersions());
    setCombinations(versionManager.getCombinations());
    setHistory(versionManager.getHistory());
  };

  useEffect(() => {
    if (isOpen && versionManager) {
      refreshData();
    }
  }, [isOpen, versionManager]);

  // 显示通知
  const showNotification = (message, type = 'success') => {
    setNotification({ message, type });
    setTimeout(() => setNotification(null), 3000);
  };

  // 创建新版本
  const handleCreateVersion = () => {
    if (!versionManager || !newVersionName.trim()) return;
    
    try {
      const newVersion = versionManager.createVersion(newVersionName, newVersionDesc);
      refreshData();
      setSelectedVersion(newVersion);
      setShowCreateForm(false);
      setNewVersionName('');
      setNewVersionDesc('');
      showNotification(`版本 "${newVersion.name}" 创建成功`);
    } catch (error) {
      showNotification(error.message, 'error');
    }
  };

  // 删除版本
  const handleDeleteVersion = (versionId) => {
    if (!versionManager) return;
    try {
      versionManager.deleteVersion(versionId);
      refreshData();
      if (selectedVersion?.id === versionId) {
        setSelectedVersion(null);
      }
      showNotification('版本已删除');
    } catch (error) {
      showNotification(error.message, 'error');
    }
  };

  // 切换版本
  const handleSwitchVersion = (version) => {
    if (!versionManager) return;
    try {
      versionManager.switchVersion(version.id);
      
      // 更新所有角色的提示词
      Object.keys(version.roleConfigs).forEach(roleType => {
        const roleConfig = version.roleConfigs[roleType];
        const role = config.roles.find(r => r.roleType === roleType);
        if (role) {
          updateRole(role.id, {
            soul: roleConfig.soul,
            soulPresetId: roleConfig.presetId,
            name: roleConfig.name || role.name
          });
        }
      });
      
      refreshData();
      showNotification(`已切换到版本: ${version.name}`);
    } catch (error) {
      showNotification(error.message, 'error');
    }
  };

  // 克隆版本
  const handleCloneVersion = (version) => {
    if (!versionManager) return;
    const cloned = version.clone(`${version.name} 副本`);
    versionManager.versions.push(cloned);
    versionManager.saveVersions();
    refreshData();
    showNotification(`版本 "${version.name}" 已克隆`);
  };

  // 导出版本
  const handleExportVersion = (version) => {
    if (!versionManager) return;
    const json = versionManager.exportVersion(version.id);
    if (json) {
      const blob = new Blob([json], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `soul-version-${version.name}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showNotification('版本已导出');
    }
  };

  // 导入版本
  const handleImportVersion = (event) => {
    if (!versionManager) return;
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      const imported = versionManager.importVersion(e.target.result);
      if (imported) {
        refreshData();
        showNotification(`版本 "${imported.name}" 导入成功`);
      } else {
        showNotification('导入失败', 'error');
      }
    };
    reader.readAsText(file);
  };

  // 创建组合
  const handleCreateCombination = () => {
    if (!versionManager || !newComboName.trim()) return;
    
    const combo = versionManager.createCombination(newComboName, newComboDesc);
    refreshData();
    setEditingCombo(combo);
    setShowComboForm(false);
    setNewComboName('');
    setNewComboDesc('');
    setMixRules({});
    showNotification(`组合 "${combo.name}" 创建成功`);
  };

  // 更新组合规则
  const updateMixRule = (roleType, presetId, weight, aspects) => {
    setMixRules(prev => ({
      ...prev,
      [roleType]: [
        ...(prev[roleType] || []).filter(r => r.presetId !== presetId),
        { presetId, weight, aspects }
      ]
    }));
  };

  // 移除混合规则
  const removeMixRule = (roleType, presetId) => {
    setMixRules(prev => ({
      ...prev,
      [roleType]: (prev[roleType] || []).filter(r => r.presetId !== presetId)
    }));
  };

  // 保存组合
  const handleSaveCombination = () => {
    if (!versionManager || !editingCombo) return;
    
    editingCombo.mixRules = mixRules;
    versionManager.saveCombinations();
    refreshData();
    showNotification('组合已保存');
  };

  // 删除组合
  const handleDeleteCombination = (comboId) => {
    if (!versionManager) return;
    versionManager.deleteCombination(comboId);
    refreshData();
    if (editingCombo?.id === comboId) {
      setEditingCombo(null);
    }
    showNotification('组合已删除');
  };

  // 应用组合到当前版本
  const handleApplyCombination = (combo) => {
    if (!versionManager) return;
    const activeVersion = versionManager.getActiveVersion();
    if (!activeVersion) return;
    
    versionManager.applyCombinationToVersion(activeVersion.id, combo.id);
    refreshData();
    showNotification(`组合 "${combo.name}" 已应用到当前版本`);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-bg-secondary rounded-lg w-[1000px] h-[750px] flex flex-col">
        {/* 头部 */}
        <div className="px-6 py-4 border-b border-border-primary flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Layers className="w-5 h-5 text-brand-primary" />
              Soul 版本管理系统
            </h2>
            <p className="text-sm text-text-muted mt-1">
              管理提示词版本、创建组合、追踪变更历史
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-bg-hover rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 通知 */}
        {notification && (
          <div className={`px-6 py-2 ${notification.type === 'error' ? 'bg-error/10 text-error' : 'bg-success/10 text-success'} text-sm flex items-center gap-2`}>
            <Check className="w-4 h-4" />
            {notification.message}
          </div>
        )}

        {/* 标签页 */}
        <div className="flex border-b border-border-primary">
          <button
            onClick={() => setActiveTab('versions')}
            className={`px-6 py-3 text-sm font-medium transition-colors flex items-center gap-2 ${
              activeTab === 'versions'
                ? 'text-brand-primary border-b-2 border-brand-primary'
                : 'text-text-muted hover:text-text-primary'
            }`}
          >
            <GitBranch className="w-4 h-4" />
            版本管理
            <span className="text-xs bg-bg-tertiary px-2 py-0.5 rounded">{versions.length}</span>
          </button>
          <button
            onClick={() => setActiveTab('combinations')}
            className={`px-6 py-3 text-sm font-medium transition-colors flex items-center gap-2 ${
              activeTab === 'combinations'
                ? 'text-brand-primary border-b-2 border-brand-primary'
                : 'text-text-muted hover:text-text-primary'
            }`}
          >
            <Sparkles className="w-4 h-4" />
            组合工坊
            <span className="text-xs bg-bg-tertiary px-2 py-0.5 rounded">{combinations.length}</span>
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-6 py-3 text-sm font-medium transition-colors flex items-center gap-2 ${
              activeTab === 'history'
                ? 'text-brand-primary border-b-2 border-brand-primary'
                : 'text-text-muted hover:text-text-primary'
            }`}
          >
            <History className="w-4 h-4" />
            变更历史
            <span className="text-xs bg-bg-tertiary px-2 py-0.5 rounded">{history.length}</span>
          </button>
        </div>

        {/* 内容区域 */}
        <div className="flex-1 overflow-hidden flex">
          {/* 版本管理 */}
          {activeTab === 'versions' && (
            <>
              {/* 左侧版本列表 */}
              <div className="w-1/3 border-r border-border-primary overflow-y-auto">
                <div className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-medium">版本列表</h3>
                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => setShowCreateForm(true)}
                        className="flex items-center gap-1 text-xs bg-brand-primary hover:bg-brand-primary/90 text-white px-3 py-1.5 rounded transition-colors"
                      >
                        <Plus className="w-3 h-3" />
                        新建
                      </button>
                      <label className="flex items-center gap-1 text-xs bg-bg-tertiary hover:bg-bg-hover border border-border-primary px-3 py-1.5 rounded transition-colors cursor-pointer">
                        <Upload className="w-3 h-3" />
                        导入
                        <input
                          type="file"
                          accept=".json"
                          onChange={handleImportVersion}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>

                  {/* 新建版本表单 */}
                  {showCreateForm && (
                    <div className="mb-4 p-3 bg-bg-tertiary rounded-lg border border-border-primary">
                      <input
                        type="text"
                        value={newVersionName}
                        onChange={(e) => setNewVersionName(e.target.value)}
                        placeholder="版本名称"
                        className="w-full bg-bg-primary border border-border-primary rounded px-3 py-2 text-sm mb-2"
                      />
                      <textarea
                        value={newVersionDesc}
                        onChange={(e) => setNewVersionDesc(e.target.value)}
                        placeholder="版本描述（可选）"
                        className="w-full bg-bg-primary border border-border-primary rounded px-3 py-2 text-sm mb-2 resize-none"
                        rows={2}
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={handleCreateVersion}
                          className="flex-1 bg-brand-primary hover:bg-brand-primary/90 text-white py-1.5 rounded text-sm"
                        >
                          创建
                        </button>
                        <button
                          onClick={() => setShowCreateForm(false)}
                          className="flex-1 bg-bg-primary hover:bg-bg-hover border border-border-primary py-1.5 rounded text-sm"
                        >
                          取消
                        </button>
                      </div>
                    </div>
                  )}

                  {/* 版本列表 */}
                  <div className="space-y-2">
                    {versions.map((version) => (
                      <div
                        key={version.id}
                        onClick={() => setSelectedVersion(version)}
                        className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                          selectedVersion?.id === version.id
                            ? 'bg-brand-primary/10 border-brand-primary'
                            : 'bg-bg-tertiary border-border-primary hover:border-brand-primary/50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-sm">{version.name}</span>
                          {version.isSystem && (
                            <span className="text-xs bg-brand-primary/20 text-brand-primary px-1.5 py-0.5 rounded">
                              系统
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-text-muted mt-1">{version.description}</p>
                        <div className="flex items-center justify-between mt-2">
                          <span className="text-xs text-text-muted">
                            {new Date(version.updatedAt).toLocaleDateString()}
                          </span>
                          {versionManager && versionManager.activeVersionId === version.id && (
                            <span className="text-xs bg-success/20 text-success px-1.5 py-0.5 rounded">
                              当前
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* 右侧版本详情 */}
              <div className="w-2/3 overflow-y-auto">
                {selectedVersion ? (
                  <div className="p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium text-lg">{selectedVersion.name}</h3>
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleSwitchVersion(selectedVersion)}
                          className="flex items-center gap-1 text-xs bg-brand-primary hover:bg-brand-primary/90 text-white px-3 py-1.5 rounded transition-colors"
                          disabled={versionManager && versionManager.activeVersionId === selectedVersion.id}
                        >
                          <Check className="w-3 h-3" />
                          应用
                        </button>
                        <button
                          onClick={() => handleCloneVersion(selectedVersion)}
                          className="flex items-center gap-1 text-xs bg-bg-tertiary hover:bg-bg-hover border border-border-primary px-3 py-1.5 rounded transition-colors"
                        >
                          <Copy className="w-3 h-3" />
                          克隆
                        </button>
                        <button
                          onClick={() => handleExportVersion(selectedVersion)}
                          className="flex items-center gap-1 text-xs bg-bg-tertiary hover:bg-bg-hover border border-border-primary px-3 py-1.5 rounded transition-colors"
                        >
                          <Download className="w-3 h-3" />
                          导出
                        </button>
                        {!selectedVersion.isSystem && (
                          <button
                            onClick={() => handleDeleteVersion(selectedVersion.id)}
                            className="flex items-center gap-1 text-xs bg-error/10 hover:bg-error/20 text-error px-3 py-1.5 rounded transition-colors"
                          >
                            <Trash2 className="w-3 h-3" />
                            删除
                          </button>
                        )}
                      </div>
                    </div>

                    <p className="text-sm text-text-muted">{selectedVersion.description}</p>

                    {/* 角色配置 */}
                    <div className="space-y-3">
                      <h4 className="font-medium">角色配置</h4>
                      {Object.entries(selectedVersion.roleConfigs).map(([roleType, config]) => (
                        <div key={roleType} className="p-3 bg-bg-tertiary rounded-lg border border-border-primary">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-sm">{roleTypeNames[roleType]}</span>
                            <span className="text-xs text-text-muted">{config.name}</span>
                          </div>
                          <div className="text-xs text-text-muted bg-bg-primary rounded p-2 max-h-32 overflow-y-auto">
                            {config.soul.substring(0, 200)}...
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-text-muted">
                    <GitBranch className="w-12 h-12 mb-4 opacity-50" />
                    <p>选择一个版本查看详情</p>
                  </div>
                )}
              </div>
            </>
          )}

          {/* 组合工坊 */}
          {activeTab === 'combinations' && (
            <>
              {/* 左侧组合列表 */}
              <div className="w-1/3 border-r border-border-primary overflow-y-auto">
                <div className="p-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-medium">组合列表</h3>
                    <button
                      onClick={() => setShowComboForm(true)}
                      className="flex items-center gap-1 text-xs bg-brand-primary hover:bg-brand-primary/90 text-white px-3 py-1.5 rounded transition-colors"
                    >
                      <Plus className="w-3 h-3" />
                      新建组合
                    </button>
                  </div>

                  {/* 新建组合表单 */}
                  {showComboForm && (
                    <div className="mb-4 p-3 bg-bg-tertiary rounded-lg border border-border-primary">
                      <input
                        type="text"
                        value={newComboName}
                        onChange={(e) => setNewComboName(e.target.value)}
                        placeholder="组合名称"
                        className="w-full bg-bg-primary border border-border-primary rounded px-3 py-2 text-sm mb-2"
                      />
                      <textarea
                        value={newComboDesc}
                        onChange={(e) => setNewComboDesc(e.target.value)}
                        placeholder="组合描述（可选）"
                        className="w-full bg-bg-primary border border-border-primary rounded px-3 py-2 text-sm mb-2 resize-none"
                        rows={2}
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={handleCreateCombination}
                          className="flex-1 bg-brand-primary hover:bg-brand-primary/90 text-white py-1.5 rounded text-sm"
                        >
                          创建
                        </button>
                        <button
                          onClick={() => setShowComboForm(false)}
                          className="flex-1 bg-bg-primary hover:bg-bg-hover border border-border-primary py-1.5 rounded text-sm"
                        >
                          取消
                        </button>
                      </div>
                    </div>
                  )}

                  {/* 组合列表 */}
                  <div className="space-y-2">
                    {combinations.map((combo) => (
                      <div
                        key={combo.id}
                        onClick={() => {
                          setEditingCombo(combo);
                          setMixRules(combo.mixRules || {});
                        }}
                        className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                          editingCombo?.id === combo.id
                            ? 'bg-brand-primary/10 border-brand-primary'
                            : 'bg-bg-tertiary border-border-primary hover:border-brand-primary/50'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-sm">{combo.name}</span>
                        </div>
                        <p className="text-xs text-text-muted mt-1">{combo.description}</p>
                        <div className="flex items-center gap-2 mt-2">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleApplyCombination(combo);
                            }}
                            className="text-xs bg-brand-primary/20 text-brand-primary px-2 py-1 rounded"
                          >
                            应用
                          </button>
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              handleDeleteCombination(combo.id);
                            }}
                            className="text-xs bg-error/10 text-error px-2 py-1 rounded"
                          >
                            删除
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* 右侧组合编辑 */}
              <div className="w-2/3 overflow-y-auto">
                {editingCombo ? (
                  <div className="p-4 space-y-4">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium text-lg">{editingCombo.name}</h3>
                      <button
                        onClick={handleSaveCombination}
                        className="flex items-center gap-1 text-xs bg-brand-primary hover:bg-brand-primary/90 text-white px-3 py-1.5 rounded transition-colors"
                      >
                        <Save className="w-3 h-3" />
                        保存组合
                      </button>
                    </div>

                    <p className="text-sm text-text-muted">{editingCombo.description}</p>

                    {/* 角色混合配置 */}
                    <div className="space-y-4">
                      {Object.keys(roleTypeNames).map((roleType) => (
                        <div key={roleType} className="p-3 bg-bg-tertiary rounded-lg border border-border-primary">
                          <h4 className="font-medium text-sm mb-3">{roleTypeNames[roleType]}</h4>
                          
                          {/* 已选择的预设 */}
                          <div className="space-y-2 mb-3">
                            {(mixRules[roleType] || []).map((rule) => {
                              const preset = getSoulPresetById(roleType, rule.presetId);
                              return (
                                <div key={rule.presetId} className="flex items-center gap-2 p-2 bg-bg-primary rounded">
                                  <span className="text-sm flex-1">{preset?.name || rule.presetId}</span>
                                  <input
                                    type="range"
                                    min="0"
                                    max="100"
                                    value={rule.weight * 100}
                                    onChange={(e) => {
                                      updateMixRule(roleType, rule.presetId, parseInt(e.target.value) / 100, rule.aspects);
                                    }}
                                    className="w-20 accent-brand-primary"
                                  />
                                  <span className="text-xs w-10">{Math.round(rule.weight * 100)}%</span>
                                  <button
                                    onClick={() => removeMixRule(roleType, rule.presetId)}
                                    className="p-1 hover:bg-error/20 rounded"
                                  >
                                    <Trash2 className="w-3 h-3 text-error" />
                                  </button>
                                </div>
                              );
                            })}
                          </div>

                          {/* 添加预设 */}
                          <div className="flex items-center gap-2">
                            <select
                              onChange={(e) => {
                                if (e.target.value) {
                                  updateMixRule(roleType, e.target.value, 0.5, ['all']);
                                  e.target.value = '';
                                }
                              }}
                              className="flex-1 bg-bg-primary border border-border-primary rounded px-3 py-2 text-sm"
                            >
                              <option value="">添加预设...</option>
                              {getSoulPresets(roleType).map((preset) => (
                                <option key={preset.id} value={preset.id}>
                                  {preset.name}
                                </option>
                              ))}
                            </select>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-text-muted">
                    <Sparkles className="w-12 h-12 mb-4 opacity-50" />
                    <p>选择一个组合进行编辑</p>
                    <p className="text-sm mt-2">或创建新组合来混合不同提示词</p>
                  </div>
                )}
              </div>
            </>
          )}

          {/* 变更历史 */}
          {activeTab === 'history' && (
            <div className="w-full overflow-y-auto">
              <div className="p-4">
                <h3 className="font-medium mb-4">变更历史</h3>
                <div className="space-y-2">
                  {history.slice().reverse().map((item) => (
                    <div key={item.id} className="flex items-center gap-3 p-3 bg-bg-tertiary rounded-lg border border-border-primary">
                      <History className="w-4 h-4 text-text-muted" />
                      <div className="flex-1">
                        <p className="text-sm">{item.description}</p>
                        <p className="text-xs text-text-muted">
                          {new Date(item.timestamp).toLocaleString()}
                        </p>
                      </div>
                      <span className={`text-xs px-2 py-1 rounded ${
                        item.action.includes('create') ? 'bg-success/20 text-success' :
                        item.action.includes('delete') ? 'bg-error/20 text-error' :
                        item.action.includes('switch') ? 'bg-brand-primary/20 text-brand-primary' :
                        'bg-bg-primary text-text-muted'
                      }`}>
                        {item.action}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
