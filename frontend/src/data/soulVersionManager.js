/**
 * Soul Version Manager - 提示词版本管理系统
 * 
 * 功能：
 * 1. 版本管理：保存多个版本的提示词
 * 2. 动态切换：在辩论过程中切换提示词
 * 3. 组合功能：混合不同提示词的特点
 * 4. 历史记录：追踪提示词变更历史
 * 5. 预设组合：保存常用的提示词组合
 */

import { soulPresets, getSoulPresetById } from './soulPresets';

// 本地存储键名
const STORAGE_KEYS = {
  versions: 'soul_versions',
  combinations: 'soul_combinations',
  history: 'soul_history',
  activeVersion: 'soul_active_version'
};

/**
 * 提示词版本类
 */
export class SoulVersion {
  constructor(config) {
    this.id = config.id || `version-${Date.now()}`;
    this.name = config.name || '未命名版本';
    this.description = config.description || '';
    this.createdAt = config.createdAt || new Date().toISOString();
    this.updatedAt = config.updatedAt || new Date().toISOString();
    // 存储每个角色的提示词配置
    this.roleConfigs = config.roleConfigs || {};
    // 版本标签
    this.tags = config.tags || [];
    // 是否为系统预设
    this.isSystem = config.isSystem || false;
  }

  // 更新角色配置
  updateRoleConfig(roleType, config) {
    this.roleConfigs[roleType] = {
      ...this.roleConfigs[roleType],
      ...config,
      updatedAt: new Date().toISOString()
    };
    this.updatedAt = new Date().toISOString();
  }

  // 获取角色配置
  getRoleConfig(roleType) {
    return this.roleConfigs[roleType] || null;
  }

  // 克隆版本
  clone(newName) {
    return new SoulVersion({
      name: newName || `${this.name} 副本`,
      description: this.description,
      roleConfigs: JSON.parse(JSON.stringify(this.roleConfigs)),
      tags: [...this.tags]
    });
  }

  // 导出为JSON
  toJSON() {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      roleConfigs: this.roleConfigs,
      tags: this.tags,
      isSystem: this.isSystem
    };
  }
}

/**
 * 提示词组合类
 * 允许混合不同提示词的特点
 */
export class SoulCombination {
  constructor(config) {
    this.id = config.id || `combo-${Date.now()}`;
    this.name = config.name || '未命名组合';
    this.description = config.description || '';
    this.createdAt = config.createdAt || new Date().toISOString();
    this.updatedAt = config.updatedAt || new Date().toISOString();
    
    // 组合规则：每个角色可以混合多个提示词的特点
    // 格式：{ roleType: [{ presetId, weight, aspects }] }
    this.mixRules = config.mixRules || {};
    
    this.tags = config.tags || [];
  }

  // 添加混合规则
  addMixRule(roleType, presetId, weight = 1.0, aspects = ['all']) {
    if (!this.mixRules[roleType]) {
      this.mixRules[roleType] = [];
    }
    
    // 检查是否已存在
    const existingIndex = this.mixRules[roleType].findIndex(r => r.presetId === presetId);
    if (existingIndex >= 0) {
      this.mixRules[roleType][existingIndex] = { presetId, weight, aspects };
    } else {
      this.mixRules[roleType].push({ presetId, weight, aspects });
    }
    
    this.updatedAt = new Date().toISOString();
  }

  // 移除混合规则
  removeMixRule(roleType, presetId) {
    if (this.mixRules[roleType]) {
      this.mixRules[roleType] = this.mixRules[roleType].filter(r => r.presetId !== presetId);
    }
    this.updatedAt = new Date().toISOString();
  }

  // 生成混合后的提示词
  generateMixedSoul(roleType) {
    const rules = this.mixRules[roleType] || [];
    if (rules.length === 0) return null;

    // 获取所有相关的预设
    const presets = rules.map(rule => ({
      preset: getSoulPresetById(roleType, rule.presetId),
      weight: rule.weight,
      aspects: rule.aspects
    })).filter(item => item.preset !== null);

    if (presets.length === 0) return null;

    // 如果只有一个预设且权重为1，直接返回
    if (presets.length === 1 && presets[0].weight === 1.0) {
      return presets[0].preset.soul;
    }

    // 混合多个预设的提示词
    return this.mixSouls(presets);
  }

  // 混合提示词的核心算法
  mixSouls(presets) {
    // 按权重排序
    presets.sort((a, b) => b.weight - a.weight);

    // 提取主要预设（权重最高的）
    const primary = presets[0];
    const secondaries = presets.slice(1);

    let mixedSoul = primary.preset.soul;

    // 如果有次要预设，添加其特色
    if (secondaries.length > 0) {
      mixedSoul += '\n\n【混合特质】\n';
      secondaries.forEach(sec => {
        const weightPercent = Math.round(sec.weight * 100);
        mixedSoul += `\n// 融合 ${sec.preset.name} 的特点（${weightPercent}% 强度）\n`;
        
        // 根据 aspects 选择融合哪些部分
        if (sec.aspects.includes('all') || sec.aspects.includes('personality')) {
          const personalityMatch = sec.preset.soul.match(/【性格特质】[\s\S]*?(?=【|$)/);
          if (personalityMatch) {
            mixedSoul += `\n${personalityMatch[0]}\n`;
          }
        }
        
        if (sec.aspects.includes('all') || sec.aspects.includes('thinking')) {
          const thinkingMatch = sec.preset.soul.match(/【思维方式】[\s\S]*?(?=【|$)/);
          if (thinkingMatch) {
            mixedSoul += `\n${thinkingMatch[0]}\n`;
          }
        }
        
        if (sec.aspects.includes('all') || sec.aspects.includes('values')) {
          const valuesMatch = sec.preset.soul.match(/【价值观】[\s\S]*?(?=【|$)/);
          if (valuesMatch) {
            mixedSoul += `\n${valuesMatch[0]}\n`;
          }
        }
      });
    }

    return mixedSoul;
  }

  toJSON() {
    return {
      id: this.id,
      name: this.name,
      description: this.description,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
      mixRules: this.mixRules,
      tags: this.tags
    };
  }
}

/**
 * 版本管理器主类
 */
export class SoulVersionManager {
  constructor() {
    this.versions = [];
    this.combinations = [];
    this.history = [];
    this.activeVersionId = null;
    this.initialized = false;
  }

  // 初始化（在浏览器环境中调用）
  init() {
    if (this.initialized) return;
    if (typeof window === 'undefined' || !window.localStorage) {
      console.warn('[SoulVersionManager] localStorage not available, using memory-only mode');
      this.initialized = true;
      return;
    }

    try {
      this.versions = this.loadVersions();
      this.combinations = this.loadCombinations();
      this.history = this.loadHistory();
      this.activeVersionId = this.loadActiveVersion();
      
      // 如果没有版本，创建默认版本
      if (this.versions.length === 0) {
        this.createDefaultVersion();
      }
      
      this.initialized = true;
    } catch (e) {
      console.error('[SoulVersionManager] 初始化失败:', e);
      this.initialized = true;
    }
  }

  // 从本地存储加载
  loadVersions() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.versions);
      if (data) {
        const parsed = JSON.parse(data);
        return parsed.map(v => new SoulVersion(v));
      }
    } catch (e) {
      console.error('加载版本失败:', e);
    }
    return [];
  }

  loadCombinations() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.combinations);
      if (data) {
        const parsed = JSON.parse(data);
        return parsed.map(c => new SoulCombination(c));
      }
    } catch (e) {
      console.error('加载组合失败:', e);
    }
    return [];
  }

  loadHistory() {
    try {
      const data = localStorage.getItem(STORAGE_KEYS.history);
      if (data) {
        return JSON.parse(data);
      }
    } catch (e) {
      console.error('加载历史失败:', e);
    }
    return [];
  }

  loadActiveVersion() {
    try {
      return localStorage.getItem(STORAGE_KEYS.activeVersion);
    } catch (e) {
      return null;
    }
  }

  // 保存到本地存储
  saveVersions() {
    localStorage.setItem(STORAGE_KEYS.versions, JSON.stringify(this.versions.map(v => v.toJSON())));
  }

  saveCombinations() {
    localStorage.setItem(STORAGE_KEYS.combinations, JSON.stringify(this.combinations.map(c => c.toJSON())));
  }

  saveHistory() {
    // 只保留最近100条历史
    const trimmed = this.history.slice(-100);
    localStorage.setItem(STORAGE_KEYS.history, JSON.stringify(trimmed));
  }

  saveActiveVersion() {
    localStorage.setItem(STORAGE_KEYS.activeVersion, this.activeVersionId);
  }

  // 创建默认版本（基于系统预设）
  createDefaultVersion() {
    const defaultVersion = new SoulVersion({
      name: '默认版本',
      description: '系统默认的提示词配置',
      isSystem: true,
      roleConfigs: {
        host: {
          presetId: soulPresets.host[0].id,
          soul: soulPresets.host[0].soul,
          name: soulPresets.host[0].name
        },
        proposer: {
          presetId: soulPresets.proposer[0].id,
          soul: soulPresets.proposer[0].soul,
          name: soulPresets.proposer[0].name
        },
        reviewer: {
          presetId: soulPresets.reviewer[0].id,
          soul: soulPresets.reviewer[0].soul,
          name: soulPresets.reviewer[0].name
        }
      },
      tags: ['系统', '默认']
    });

    this.versions.push(defaultVersion);
    this.activeVersionId = defaultVersion.id;
    this.saveVersions();
    this.saveActiveVersion();
    
    return defaultVersion;
  }

  // 创建新版本
  createVersion(name, description, baseVersionId = null) {
    let baseConfig = {};
    
    if (baseVersionId) {
      const base = this.versions.find(v => v.id === baseVersionId);
      if (base) {
        baseConfig = JSON.parse(JSON.stringify(base.toJSON()));
      }
    }

    const newVersion = new SoulVersion({
      name,
      description,
      roleConfigs: baseConfig.roleConfigs || {}
    });

    this.versions.push(newVersion);
    this.saveVersions();
    this.addHistory('create', `创建版本: ${name}`);
    
    return newVersion;
  }

  // 删除版本
  deleteVersion(versionId) {
    const version = this.versions.find(v => v.id === versionId);
    if (version && version.isSystem) {
      throw new Error('不能删除系统预设版本');
    }

    this.versions = this.versions.filter(v => v.id !== versionId);
    
    // 如果删除的是当前激活版本，切换到默认版本
    if (this.activeVersionId === versionId) {
      const defaultVersion = this.versions.find(v => v.isSystem);
      this.activeVersionId = defaultVersion ? defaultVersion.id : null;
      this.saveActiveVersion();
    }

    this.saveVersions();
    this.addHistory('delete', `删除版本: ${version?.name || versionId}`);
  }

  // 切换激活版本
  switchVersion(versionId) {
    const version = this.versions.find(v => v.id === versionId);
    if (!version) {
      throw new Error('版本不存在');
    }

    this.activeVersionId = versionId;
    this.saveActiveVersion();
    this.addHistory('switch', `切换到版本: ${version.name}`);
    
    return version;
  }

  // 获取当前激活版本
  getActiveVersion() {
    return this.versions.find(v => v.id === this.activeVersionId) || this.versions[0];
  }

  // 获取版本列表
  getVersions() {
    return this.versions;
  }

  // 获取版本详情
  getVersion(versionId) {
    return this.versions.find(v => v.id === versionId);
  }

  // 更新版本
  updateVersion(versionId, updates) {
    const version = this.versions.find(v => v.id === versionId);
    if (!version) return null;

    Object.assign(version, updates);
    version.updatedAt = new Date().toISOString();
    
    this.saveVersions();
    this.addHistory('update', `更新版本: ${version.name}`);
    
    return version;
  }

  // 为角色设置提示词
  setRoleSoul(versionId, roleType, presetId) {
    const version = this.versions.find(v => v.id === versionId);
    if (!version) return null;

    const preset = getSoulPresetById(roleType, presetId);
    if (!preset) return null;

    version.updateRoleConfig(roleType, {
      presetId: preset.id,
      soul: preset.soul,
      name: preset.name
    });

    this.saveVersions();
    this.addHistory('update_role', `更新 ${roleType} 的提示词为: ${preset.name}`);
    
    return version;
  }

  // 创建组合
  createCombination(name, description) {
    const combo = new SoulCombination({ name, description });
    this.combinations.push(combo);
    this.saveCombinations();
    this.addHistory('create_combo', `创建组合: ${name}`);
    
    return combo;
  }

  // 删除组合
  deleteCombination(comboId) {
    this.combinations = this.combinations.filter(c => c.id !== comboId);
    this.saveCombinations();
    this.addHistory('delete_combo', `删除组合: ${comboId}`);
  }

  // 获取所有组合
  getCombinations() {
    return this.combinations;
  }

  // 获取组合详情
  getCombination(comboId) {
    return this.combinations.find(c => c.id === comboId);
  }

  // 应用组合到版本
  applyCombinationToVersion(versionId, comboId) {
    const version = this.versions.find(v => v.id === versionId);
    const combo = this.combinations.find(c => c.id === comboId);
    
    if (!version || !combo) return null;

    // 为每个角色生成混合提示词
    Object.keys(combo.mixRules).forEach(roleType => {
      const mixedSoul = combo.generateMixedSoul(roleType);
      if (mixedSoul) {
        version.updateRoleConfig(roleType, {
          soul: mixedSoul,
          combinationId: combo.id
        });
      }
    });

    this.saveVersions();
    this.addHistory('apply_combo', `应用组合 ${combo.name} 到版本 ${version.name}`);
    
    return version;
  }

  // 添加历史记录
  addHistory(action, description) {
    this.history.push({
      id: `history-${Date.now()}`,
      action,
      description,
      timestamp: new Date().toISOString()
    });
    this.saveHistory();
  }

  // 获取历史记录
  getHistory(limit = 50) {
    return this.history.slice(-limit);
  }

  // 导出版本
  exportVersion(versionId) {
    const version = this.versions.find(v => v.id === versionId);
    if (!version) return null;
    
    return JSON.stringify(version.toJSON(), null, 2);
  }

  // 导入版本
  importVersion(jsonString) {
    try {
      const data = JSON.parse(jsonString);
      const newVersion = new SoulVersion(data);
      newVersion.id = `imported-${Date.now()}`;
      newVersion.name = `${newVersion.name} (导入)`;
      newVersion.isSystem = false;
      
      this.versions.push(newVersion);
      this.saveVersions();
      this.addHistory('import', `导入版本: ${newVersion.name}`);
      
      return newVersion;
    } catch (e) {
      console.error('导入版本失败:', e);
      return null;
    }
  }

  // 获取角色的当前提示词
  getRoleSoul(roleType) {
    const version = this.getActiveVersion();
    if (!version) return null;
    
    const config = version.getRoleConfig(roleType);
    return config ? config.soul : null;
  }

  // 重置为默认
  resetToDefault() {
    const defaultVersion = this.versions.find(v => v.isSystem);
    if (defaultVersion) {
      this.activeVersionId = defaultVersion.id;
      this.saveActiveVersion();
      this.addHistory('reset', '重置为默认版本');
    }
  }
}

// 创建单例实例
let instance = null;

export function getSoulVersionManager() {
  if (!instance) {
    instance = new SoulVersionManager();
    instance.init(); // 延迟初始化，确保在浏览器环境中执行
  }
  return instance;
}

// 重置单例（用于测试）
export function resetSoulVersionManager() {
  instance = null;
}

export default SoulVersionManager;
