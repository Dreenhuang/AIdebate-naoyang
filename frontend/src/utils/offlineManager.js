/**
 * 🔥 V2.2 新增：离线模式管理器
 *
 * 功能：
 * 1. 检测网络状态（在线/离线）
 * 2. 离线时自动缓存用户操作到 LocalStorage
 * 3. 网络恢复后自动重试缓存的操作
 * 4. 提供离线状态 UI 反馈
 */

import { useState, useEffect } from 'react';

const STORAGE_KEY = 'prd_debate_offline_queue';
const MAX_QUEUE_SIZE = 50;

class OfflineManager {
  constructor() {
    this.isOnline = navigator.onLine;
    this.queue = this.loadQueue();
    this.listeners = new Set();

    // 监听网络状态变化
    window.addEventListener('online', this.handleOnline.bind(this));
    window.addEventListener('offline', this.handleOffline.bind(this));

    console.log(`[OfflineManager] 初始化完成，当前状态: ${this.isOnline ? '在线' : '离线'}`);
    console.log(`[OfflineManager] 待处理队列: ${this.queue.length} 条`);
  }

  /**
   * 加载本地缓存的操作队列
   */
  loadQueue() {
    try {
      const data = localStorage.getItem(STORAGE_KEY);
      return data ? JSON.parse(data) : [];
    } catch (error) {
      console.error('[OfflineManager] 加载队列失败:', error);
      return [];
    }
  }

  /**
   * 保存操作队列到 LocalStorage
   */
  saveQueue() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.queue));
    } catch (error) {
      console.error('[OfflineManager] 保存队列失败:', error);
      // 存储空间不足时，清理旧数据
      if (error.name === 'QuotaExceededError') {
        this.queue = this.queue.slice(-10); // 只保留最近10条
        localStorage.setItem(STORAGE_KEY, JSON.stringify(this.queue));
      }
    }
  }

  /**
   * 添加操作到队列
   * @param {Object} operation - 要执行的操作 { type, payload, timestamp }
   */
  enqueue(operation) {
    if (this.isOnline) {
      // 在线时直接返回 false，表示不需要缓存
      return false;
    }

    const queuedOp = {
      ...operation,
      id: `offline_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date().toISOString(),
      retries: 0,
    };

    // 队列大小限制
    if (this.queue.length >= MAX_QUEUE_SIZE) {
      console.warn('[OfflineManager] 队列已满，移除最旧的操作');
      this.queue.shift();
    }

    this.queue.push(queuedOp);
    this.saveQueue();

    console.log(`[OfflineManager] 📥 操作已缓存: ${operation.type} (队列: ${this.queue.length})`);

    // 通知监听器
    this.notifyListeners({
      type: 'queue_updated',
      queueLength: this.queue.length,
      operation: queuedOp,
    });

    return true;
  }

  /**
   * 处理在线事件 - 重试队列中的操作
   */
  async handleOnline() {
    this.isOnline = true;
    console.log('[OfflineManager] 🌐 网络已恢复');

    this.notifyListeners({ type: 'online' });

    // 如果有缓存的操作，逐个重试
    if (this.queue.length > 0) {
      console.log(`[OfflineManager] 开始重试 ${this.queue.length} 个缓存操作...`);
      await this.retryQueue();
    }
  }

  /**
   * 处理离线事件
   */
  handleOffline() {
    this.isOnline = false;
    console.log('[OfflineManager] 📴 网络已断开，进入离线模式');

    this.notifyListeners({ type: 'offline' });
  }

  /**
   * 重试队列中的所有操作
   */
  async retryQueue() {
    const failedOps = [];

    for (let i = 0; i < this.queue.length; i++) {
      const op = this.queue[i];
      op.retries++;

      console.log(`[OfflineManager] 🔄 重试操作 [${i + 1}/${this.queue.length}]: ${op.type} (第${op.retries}次)`);

      try {
        // 通过自定义事件通知应用层重试
        const success = await this.notifyListeners({
          type: 'retry_operation',
          operation: op,
        });

        if (!success) {
          failedOps.push(op);
        }
      } catch (error) {
        console.error(`[OfflineManager] 重试失败:`, error);
        failedOps.push(op);
      }

      // 稍微延迟，避免请求过于密集
      await new Promise(resolve => setTimeout(resolve, 500));
    }

    // 更新队列（只保留失败的操作）
    this.queue = failedOps.filter(op => op.retries < 3); // 最多重试3次
    this.saveQueue();

    if (this.queue.length === 0) {
      console.log('[OfflineManager] ✅ 所有缓存操作已成功重试');
    } else {
      console.warn(`[OfflineManager] ⚠️ 仍有 ${this.queue.length} 个操作重试失败`);
    }

    this.notifyListeners({
      type: 'retry_complete',
      remainingCount: this.queue.length,
    });
  }

  /**
   * 清空队列
   */
  clearQueue() {
    this.queue = [];
    this.saveQueue();
    console.log('[OfflineManager] 🗑️ 队列已清空');
  }

  /**
   * 获取当前状态信息
   */
  getStatus() {
    return {
      isOnline: this.isOnline,
      queueLength: this.queue.length,
      queue: [...this.queue],
    };
  }

  /**
   * 添加状态变化监听器
   * @param {Function} listener - 回调函数 (event) => void
   * @returns {Function} 取消订阅的函数
   */
  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  /**
   * 通知所有监听器
   * @param {Object} event - 事件对象
   */
  notifyListeners(event) {
    let hasHandler = false;

    this.listeners.forEach(listener => {
      try {
        const result = listener(event);
        if (result !== undefined) {
          hasHandler = true;
          return result;
        }
      } catch (error) {
        console.error('[OfflineManager] 监听器错误:', error);
      }
    });

    return hasHandler;
  }

  /**
   * 销毁管理器（清理事件监听）
   */
  destroy() {
    window.removeEventListener('online', this.handleOnline.bind(this));
    window.removeEventListener('offline', this.handleOffline.bind(this));
    this.listeners.clear();
    console.log('[OfflineManager] 已销毁');
  }
}

// 单例模式
export const offlineManager = new OfflineManager();

export default OfflineManager;

/**
 * React Hook: useOfflineStatus
 * 方便在组件中使用离线状态
 */
export function useOfflineStatus() {
  const [status, setStatus] = useState(offlineManager.getStatus());

  useEffect(() => {
    const unsubscribe = offlineManager.subscribe((event) => {
      setStatus(offlineManager.getStatus());
    });
    return unsubscribe;
  }, []);

  return {
    ...status,
    isOffline: !status.isOnline,
    hasPendingOperations: status.queueLength > 0,
  };
}
