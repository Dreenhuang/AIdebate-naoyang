import { useState } from 'react';
import { X, Plus, Trash2, Save, Sparkles, Edit3, Eye, EyeOff, Layers } from 'lucide-react';
import { useDebateStore } from '../stores/debateStore';
import { soulPresets, roleTypeNames, difficultyNames } from '../data/soulPresets';
import SoulVersionManager from './SoulVersionManager';

export default function SoulManager() {
  const {
    soulManagerOpen,
    setSoulManagerOpen,
    editingRoleId,
    customSouls,
    addCustomSoul,
    removeCustomSoul,
    updateCustomSoul,
    config
  } = useDebateStore();

  const [activeTab, setActiveTab] = useState('host');
  const [editingSoul, setEditingSoul] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [showVersionManager, setShowVersionManager] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    soul: '',
    difficulty: 'intermediate',
    tags: []
  });

  if (!soulManagerOpen) return null;

  const currentRole = config.roles.find(r => r.id === editingRoleId);
  const roleType = currentRole?.roleType || 'host';

  // 获取当前标签页的预设和自定义soul
  const builtInPresets = soulPresets[activeTab] || [];
  const customPresets = customSouls[activeTab] || [];

  const handleAddCustom = () => {
    setEditingSoul(null);
    setFormData({
      name: '',
      description: '',
      soul: '',
      difficulty: 'intermediate',
      tags: []
    });
    setShowForm(true);
  };

  const handleEditCustom = (soul) => {
    setEditingSoul(soul);
    setFormData({
      name: soul.name,
      description: soul.description,
      soul: soul.soul,
      difficulty: soul.difficulty,
      tags: soul.tags || []
    });
    setShowForm(true);
  };

  const handleSave = () => {
    if (!formData.name.trim() || !formData.soul.trim()) return;

    if (editingSoul) {
      updateCustomSoul(activeTab, editingSoul.id, formData);
    } else {
      addCustomSoul(activeTab, formData);
    }
    setShowForm(false);
  };

  const handleDelete = (soulId) => {
    if (confirm('确定要删除这个自定义Soul吗？')) {
      removeCustomSoul(activeTab, soulId);
    }
  };

  const addTag = (tag) => {
    if (tag && !formData.tags.includes(tag)) {
      setFormData({ ...formData, tags: [...formData.tags, tag] });
    }
  };

  const removeTag = (tag) => {
    setFormData({ ...formData, tags: formData.tags.filter(t => t !== tag) });
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-bg-secondary rounded-lg w-[900px] h-[700px] flex flex-col">
        {/* 头部 */}
        <div className="px-6 py-4 border-b border-border-primary flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-brand-primary" />
              Soul 预设管理
            </h2>
            <p className="text-sm text-text-muted mt-1">
              管理角色的灵魂设定，创建独特的讨论风格
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowVersionManager(true)}
              className="flex items-center gap-1 text-xs bg-brand-primary/20 hover:bg-brand-primary/30 text-brand-primary px-3 py-1.5 rounded transition-colors"
            >
              <Layers className="w-3 h-3" />
              版本管理
            </button>
            <button
              onClick={() => setSoulManagerOpen(false)}
              className="p-2 hover:bg-bg-hover rounded-lg transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* 版本管理弹窗 */}
        <SoulVersionManager
          isOpen={showVersionManager}
          onClose={() => setShowVersionManager(false)}
        />

        {/* 标签页 */}
        <div className="flex border-b border-border-primary">
          {Object.entries(roleTypeNames).map(([type, name]) => (
            <button
              key={type}
              onClick={() => {
                setActiveTab(type);
                setShowForm(false);
              }}
              className={`px-6 py-3 text-sm font-medium transition-colors ${
                activeTab === type
                  ? 'text-brand-primary border-b-2 border-brand-primary'
                  : 'text-text-muted hover:text-text-primary'
              }`}
            >
              {name}
              <span className="ml-2 text-xs bg-bg-tertiary px-2 py-0.5 rounded">
                {(soulPresets[type]?.length || 0) + (customSouls[type]?.length || 0)}
              </span>
            </button>
          ))}
        </div>

        {/* 内容区域 */}
        <div className="flex-1 overflow-hidden flex">
          {/* 左侧列表 */}
          <div className="w-1/2 border-r border-border-primary overflow-y-auto">
            <div className="p-4">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-medium">内置预设</h3>
                <button
                  onClick={handleAddCustom}
                  className="flex items-center gap-1 text-xs bg-brand-primary hover:bg-brand-primary/90 text-white px-3 py-1.5 rounded transition-colors"
                >
                  <Plus className="w-3 h-3" />
                  新建自定义
                </button>
              </div>

              {/* 内置预设 */}
              <div className="space-y-2 mb-6">
                {builtInPresets.map((preset) => (
                  <div
                    key={preset.id}
                    className="p-3 bg-bg-tertiary rounded-lg border border-border-primary"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium text-sm">{preset.name}</span>
                      <span className={`text-xs px-1.5 py-0.5 rounded ${
                        preset.difficulty === 'expert' ? 'bg-error/20 text-error' :
                        preset.difficulty === 'advanced' ? 'bg-warning/20 text-warning' :
                        'bg-success/20 text-success'
                      }`}>
                        {difficultyNames[preset.difficulty]}
                      </span>
                    </div>
                    <p className="text-xs text-text-muted mt-1">{preset.description}</p>
                    <div className="flex gap-1 mt-2">
                      {preset.tags.map((tag, i) => (
                        <span key={i} className="text-xs bg-bg-primary text-text-secondary px-1.5 py-0.5 rounded">
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>

              {/* 自定义预设 */}
              {customPresets.length > 0 && (
                <>
                  <h3 className="font-medium mb-3">自定义预设</h3>
                  <div className="space-y-2">
                    {customPresets.map((soul) => (
                      <div
                        key={soul.id}
                        className="p-3 bg-bg-tertiary rounded-lg border border-border-primary hover:border-brand-primary transition-colors"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-medium text-sm">{soul.name}</span>
                          <div className="flex items-center gap-1">
                            <button
                              onClick={() => handleEditCustom(soul)}
                              className="p-1 hover:bg-bg-hover rounded transition-colors"
                            >
                              <Edit3 className="w-3 h-3 text-text-secondary" />
                            </button>
                            <button
                              onClick={() => handleDelete(soul.id)}
                              className="p-1 hover:bg-error/20 rounded transition-colors"
                            >
                              <Trash2 className="w-3 h-3 text-error" />
                            </button>
                          </div>
                        </div>
                        <p className="text-xs text-text-muted mt-1">{soul.description}</p>
                      </div>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          {/* 右侧编辑区 */}
          <div className="w-1/2 overflow-y-auto">
            {showForm ? (
              <div className="p-4 space-y-4">
                <h3 className="font-medium">
                  {editingSoul ? '编辑自定义Soul' : '新建自定义Soul'}
                </h3>

                <div>
                  <label className="text-xs text-text-muted mb-1 block">名称</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full bg-bg-primary border border-border-primary rounded px-3 py-2 text-sm focus:border-border-focus focus:outline-none"
                    placeholder="Soul名称"
                  />
                </div>

                <div>
                  <label className="text-xs text-text-muted mb-1 block">描述</label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full bg-bg-primary border border-border-primary rounded px-3 py-2 text-sm focus:border-border-focus focus:outline-none"
                    placeholder="简短描述"
                  />
                </div>

                <div>
                  <label className="text-xs text-text-muted mb-1 block">难度</label>
                  <select
                    value={formData.difficulty}
                    onChange={(e) => setFormData({ ...formData, difficulty: e.target.value })}
                    className="w-full bg-bg-primary border border-border-primary rounded px-3 py-2 text-sm focus:border-border-focus focus:outline-none"
                  >
                    <option value="beginner">入门</option>
                    <option value="intermediate">中级</option>
                    <option value="advanced">高级</option>
                    <option value="expert">专家</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs text-text-muted mb-1 block">标签</label>
                  <div className="flex flex-wrap gap-1 mb-2">
                    {formData.tags.map((tag) => (
                      <span
                        key={tag}
                        className="text-xs bg-brand-primary/20 text-brand-primary px-2 py-1 rounded flex items-center gap-1"
                      >
                        {tag}
                        <button onClick={() => removeTag(tag)} className="hover:text-error">
                          <X className="w-3 h-3" />
                        </button>
                      </span>
                    ))}
                  </div>
                  <input
                    type="text"
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        addTag(e.target.value);
                        e.target.value = '';
                      }
                    }}
                    className="w-full bg-bg-primary border border-border-primary rounded px-3 py-2 text-sm focus:border-border-focus focus:outline-none"
                    placeholder="输入标签按回车添加"
                  />
                </div>

                <div>
                  <label className="text-xs text-text-muted mb-1 block">Soul内容</label>
                  <textarea
                    value={formData.soul}
                    onChange={(e) => setFormData({ ...formData, soul: e.target.value })}
                    className="w-full bg-bg-primary border border-border-primary rounded px-3 py-2 text-sm focus:border-border-focus focus:outline-none resize-none"
                    rows={10}
                    placeholder="详细描述角色的性格、思维方式、价值观、行为模式..."
                  />
                </div>

                <div className="flex gap-2">
                  <button
                    onClick={handleSave}
                    className="flex-1 flex items-center justify-center gap-2 bg-brand-primary hover:bg-brand-primary/90 text-white py-2 rounded-lg transition-colors"
                  >
                    <Save className="w-4 h-4" />
                    保存
                  </button>
                  <button
                    onClick={() => setShowForm(false)}
                    className="flex-1 bg-bg-tertiary hover:bg-bg-hover border border-border-primary text-text-secondary py-2 rounded-lg transition-colors"
                  >
                    取消
                  </button>
                </div>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-text-muted">
                <Sparkles className="w-12 h-12 mb-4 opacity-50" />
                <p>选择一个预设查看详情</p>
                <p className="text-sm mt-2">或点击"新建自定义"创建Soul</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
