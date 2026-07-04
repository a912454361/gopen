/**
 * 公共请求封装
 * 跨平台小程序网络请求
 */

import { storage, platform } from './utils';

const API_BASE_URL = 'https://api.gopen.com/api/v1/ink';

/**
 * 统一请求方法
 */
export function request(options) {
  return new Promise((resolve, reject) => {
    const token = storage.get('token');
    const url = API_BASE_URL + options.url;
    const header = {
      'Content-Type': 'application/json',
      'Authorization': token ? `Bearer ${token}` : '',
      ...options.header
    };

    // 微信小程序
    if (platform.isWechat) {
      wx.request({
        url,
        method: options.method || 'GET',
        data: options.data || {},
        header,
        success: (res) => {
          if (res.statusCode === 200) {
            resolve(res.data);
          } else if (res.statusCode === 401) {
            // Token 过期
            storage.remove('token');
            reject(new Error('未授权'));
          } else {
            reject(new Error(res.data.message || '请求失败'));
          }
        },
        fail: reject
      });
    }
    
    // 支付宝小程序
    else if (platform.isAlipay) {
      my.request({
        url,
        method: options.method || 'GET',
        data: options.data || {},
        headers: header,
        success: (res) => {
          if (res.status === 200) {
            resolve(res.data);
          } else {
            reject(new Error(res.data.message || '请求失败'));
          }
        },
        fail: reject
      });
    }
    
    // 抖音小程序
    else if (platform.isDouyin) {
      tt.request({
        url,
        method: options.method || 'GET',
        data: options.data || {},
        header,
        success: (res) => {
          if (res.statusCode === 200) {
            resolve(res.data);
          } else {
            reject(new Error(res.data.message || '请求失败'));
          }
        },
        fail: reject
      });
    }
    
    else {
      reject(new Error('未知平台'));
    }
  });
}

/**
 * GET 请求
 */
export function get(url, data = {}) {
  return request({ url, method: 'GET', data });
}

/**
 * POST 请求
 */
export function post(url, data = {}) {
  return request({ url, method: 'POST', data });
}

/**
 * 上传文件
 */
export function upload(filePath, options = {}) {
  return new Promise((resolve, reject) => {
    const token = storage.get('token');
    
    // 微信
    if (platform.isWechat) {
      wx.uploadFile({
        url: API_BASE_URL + (options.url || '/upload'),
        filePath,
        name: options.name || 'file',
        header: {
          'Authorization': token ? `Bearer ${token}` : ''
        },
        success: (res) => {
          resolve(JSON.parse(res.data));
        },
        fail: reject
      });
    }
    
    // 支付宝
    else if (platform.isAlipay) {
      my.uploadFile({
        url: API_BASE_URL + (options.url || '/upload'),
        filePath,
        fileName: options.name || 'file',
        success: (res) => {
          resolve(JSON.parse(res.data));
        },
        fail: reject
      });
    }
    
    // 抖音
    else if (platform.isDouyin) {
      tt.uploadFile({
        url: API_BASE_URL + (options.url || '/upload'),
        filePath,
        name: options.name || 'file',
        header: {
          'Authorization': token ? `Bearer ${token}` : ''
        },
        success: (res) => {
          resolve(JSON.parse(res.data));
        },
        fail: reject
      });
    }
  });
}

export default { request, get, post, upload };
