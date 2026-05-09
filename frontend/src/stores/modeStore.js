/**
 * PRD辩论系统 - 讨论模式状态管理
 */
import { create } from 'zustand';
import { DISCUSSION_MODES, OUTPUT_DEPTH, getModeById, getModeCategories } from '../data/discussionModes';
import { getSoulsByRoleType, getRandomSoul, getSoulById } from '../data/soulPresets';

export const useModeStore = create((set, get) => ({
  // 当前选择的模式
  currentMode: DISCUSSION_MODES['specialized'], // 默认PRD评审模式

  // 输出深度
  outputDepth: 'normal',

  // 角色配置
  configuredRoles: [],

  // 所有模式列表
  allModes: Object.values(DISCUSSION_MODES),

  // 模式分类
  modeCategories: getModeCategories(),

  // 设置当前模式
  setMode: (modeId) => {
    const mode = getModeById(modeId);
    if (!mode) return;

    // 根据模式自动配置角色
    const roles = get().autoConfigureRoles(mode);

    set({
      currentMode: mode,
      configuredRoles: roles,
      outputDepth: mode.defaultDepth || 'normal',
    });
  },

  // 设置输出深度
  setOutputDepth: (depth) => {
    set({ outputDepth: depth });
  },

  // 自动配置角色
  autoConfigureRoles: (mode) => {
    const roles = [];
    const defaultRoles = mode.defaultRoles || [];

    defaultRoles.forEach((roleConfig, index) => {
      // 获取该角色类型的随机角色
      const randomSoul = getRandomSoul(roleConfig.roleType);

      roles.push({
        id: `role-${index}`,
        roleType: roleConfig.roleType,
        label: roleConfig.label,
        description: roleConfig.description,
        soul: randomSoul || null,
        customSoul: null, // 用户自定义soul
      });
    });

    return roles;
  },

  // 更新单个角色
  updateRole: (roleId, updates) => {
    set((state) => ({
      configuredRoles: state.configuredRoles.map((role) =>
        role.id === roleId ? { ...role, ...updates } : role
      ),
    }));
  },

  // 随机分配角色
  randomizeRoles: () => {
    set((state) => ({
      configuredRoles: state.configuredRoles.map((role) => {
        const randomSoul = getRandomSoul(role.roleType);
        return { ...role, soul: randomSoul, customSoul: null };
      }),
    }));
  },

  // 自定义角色Soul
  setCustomSoul: (roleId, soulText) => {
    set((state) => ({
      configuredRoles: state.configuredRoles.map((role) =>
        role.id === roleId
          ? { ...role, customSoul: soulText, soul: null }
          : role
      ),
    }));
  },

  // 添加可选角色
  addOptionalRole: (roleType) => {
    const newRole = {
      id: `role-${Date.now()}`,
      roleType: roleType,
      label: `额外角色`,
      description: '可选角色',
      soul: getRandomSoul(roleType),
      customSoul: null,
    };

    set((state) => ({
      configuredRoles: [...state.configuredRoles, newRole],
    }));
  },

  // 移除角色
  removeRole: (roleId) => {
    set((state) => {
      const newRoles = state.configuredRoles.filter((role) => role.id !== roleId);
      // 确保不会少于最小角色数
      if (newRoles.length < state.currentMode.minRoles) {
        return state;
      }
      return { configuredRoles: newRoles };
    });
  },

  // 获取当前模式的流程
  getCurrentFlow: () => {
    return get().currentMode?.flow || [];
  },

  // 获取当前深度的Prompt约束
  getDepthInstruction: () => {
    const depth = get().outputDepth;
    return OUTPUT_DEPTH[depth]?.instruction || OUTPUT_DEPTH.normal.instruction;
  },

  // 重置为默认配置
  resetToDefault: () => {
    const mode = get().currentMode;
    set({
      configuredRoles: get().autoConfigureRoles(mode),
      outputDepth: mode.defaultDepth || 'normal',
    });
  },

  // 获取角色速查信息
  getRoleSummary: () => {
    const { currentMode, configuredRoles } = get();
    return {
      modeName: currentMode?.name,
      modeId: currentMode?.id,
      totalRoles: configuredRoles.length,
      minRoles: currentMode?.minRoles,
      maxRoles: currentMode?.maxRoles,
      roles: configuredRoles.map((r) => ({
        label: r.label,
        soulName: r.soul?.name || (r.customSoul ? '自定义' : '未配置'),
      })),
    };
  },
}));

export default useModeStore;