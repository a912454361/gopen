// ============================================
// G open 智能创作助手 - PM2 配置
// ============================================

module.exports = {
  apps: [
    {
      name: 'gopen-api',
      script: 'pnpm',
      args: 'run start',
      cwd: '/app/server',
      instances: 'max',
      exec_mode: 'cluster',
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 9091,
      },
      env_production: {
        NODE_ENV: 'production',
      },
      // 日志配置
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      error_file: '/var/log/gopen/error.log',
      out_file: '/var/log/gopen/out.log',
      merge_logs: true,
      // 重启策略
      exp_backoff_restart_delay: 100,
      max_restarts: 10,
      min_uptime: '10s',
      // 健康检查
      instance_var: 'NODE_APP_INSTANCE',
      // 信号处理
      kill_timeout: 5000,
      wait_ready: true,
      listen_timeout: 3000,
    },
  ],
};
