/**
 * ToastService - 全局Toast访问服务
 * 解决无法在组件外使用Context的问题
 */

import React from 'react';
import { ToastContextValue } from './index';

let toastService: ToastContextValue | null = null;

export function setToastService(service: ToastContextValue) {
  toastService = service;
}

export function getToast(): ToastContextValue | null {
  return toastService;
}

// 便捷方法
export const toast = {
  success: (message: string) => toastService?.showToast('success', message),
  error: (message: string) => toastService?.showToast('error', message),
  warning: (message: string) => toastService?.showToast('warning', message),
  info: (message: string) => toastService?.showToast('info', message),
};
