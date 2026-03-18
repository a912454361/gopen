import { pgTable, serial, varchar, timestamp, integer, text, boolean, index, jsonb, numeric } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

// ==================== 系统表（保留） ====================

export const healthCheck = pgTable("health_check", {
	id: serial().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
});

// ==================== 用户与登录表 ====================

// 用户表
export const users = pgTable(
  "users",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    phone: varchar("phone", { length: 20 }),
    email: varchar("email", { length: 128 }),
    nickname: varchar("nickname", { length: 64 }),
    avatar: text("avatar"),
    isAdult: boolean("is_adult").default(false), // 是否成年（实名认证后设置）
    realName: varchar("real_name", { length: 64 }), // 实名姓名
    idCard: varchar("id_card", { length: 32 }), // 身份证号（加密存储）
    birthDate: timestamp("birth_date", { withTimezone: true }), // 出生日期
    memberLevel: varchar("member_level", { length: 20 }).default("free"), // free/member/super
    memberExpireAt: timestamp("member_expire_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }),
  },
  (table) => [
    index("users_phone_idx").on(table.phone),
    index("users_email_idx").on(table.email),
    index("users_member_level_idx").on(table.memberLevel),
  ]
);

// 第三方登录绑定表
export const oauthBindings = pgTable(
  "oauth_bindings",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    userId: varchar("user_id", { length: 36 }).notNull(),
    platform: varchar("platform", { length: 20 }).notNull(), // alipay/wechat/douyin
    openId: varchar("open_id", { length: 128 }).notNull(), // 平台用户ID
    unionId: varchar("union_id", { length: 128 }), // 开放平台统一ID
    nickname: varchar("nickname", { length: 64 }),
    avatar: text("avatar"),
    accessToken: text("access_token"), // 加密存储
    refreshToken: text("refresh_token"),
    expiresAt: timestamp("expires_at", { withTimezone: true }),
    rawData: jsonb("raw_data"), // 原始授权数据
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }),
  },
  (table) => [
    index("oauth_bindings_user_id_idx").on(table.userId),
    index("oauth_bindings_platform_idx").on(table.platform),
    index("oauth_bindings_open_id_idx").on(table.openId),
  ]
);

// ==================== 支付相关表 ====================

// 支付订单表
export const payOrders = pgTable(
  "pay_orders",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    orderNo: varchar("order_no", { length: 64 }).notNull().unique(),
    userId: varchar("user_id", { length: 128 }).notNull(),
    amount: integer("amount").notNull(), // 金额（单位：分）
    payType: varchar("pay_type", { length: 20 }).notNull(), // alipay / wechat / douyin
    status: varchar("status", { length: 20 }).notNull().default("pending"), // pending/paid/failed/cancelled
    qrCodeUrl: text("qr_code_url"),
    qrCodeData: text("qr_code_data"),
    productType: varchar("product_type", { length: 50 }).notNull(),
    productDetail: jsonb("product_detail"),
    paidAt: timestamp("paid_at", { withTimezone: true }),
    expiredAt: timestamp("expired_at", { withTimezone: true }),
    callbackData: jsonb("callback_data"),
    riskCheckPassed: boolean("risk_check_passed").default(false), // 风控检查通过
    riskCheckData: jsonb("risk_check_data"), // 风控检查数据
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }),
  },
  (table) => [
    index("pay_orders_order_no_idx").on(table.orderNo),
    index("pay_orders_user_id_idx").on(table.userId),
    index("pay_orders_status_idx").on(table.status),
  ]
);

// 代扣授权表
export const payAuths = pgTable(
  "pay_auths",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    userId: varchar("user_id", { length: 128 }).notNull(),
    authType: varchar("auth_type", { length: 20 }).notNull(),
    authNo: varchar("auth_no", { length: 128 }),
    agreementId: varchar("agreement_id", { length: 128 }),
    status: varchar("status", { length: 20 }).notNull().default("active"),
    deductAmount: integer("deduct_amount").notNull().default(2900),
    deductCycle: varchar("deduct_cycle", { length: 20 }).notNull().default("monthly"),
    cronExpression: varchar("cron_expression", { length: 100 }),
    nextDeductTime: timestamp("next_deduct_time", { withTimezone: true }),
    lastDeductTime: timestamp("last_deduct_time", { withTimezone: true }),
    retryCount: integer("retry_count").notNull().default(0),
    maxRetryCount: integer("max_retry_count").notNull().default(3),
    authData: jsonb("auth_data"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }),
  },
  (table) => [
    index("pay_auths_user_id_idx").on(table.userId),
    index("pay_auths_status_idx").on(table.status),
    index("pay_auths_next_deduct_idx").on(table.nextDeductTime),
  ]
);

// 扣费记录表
export const payDeductRecords = pgTable(
  "pay_deduct_records",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    authId: varchar("auth_id", { length: 36 }).notNull(),
    userId: varchar("user_id", { length: 128 }).notNull(),
    orderNo: varchar("order_no", { length: 64 }),
    amount: integer("amount").notNull(),
    status: varchar("status", { length: 20 }).notNull().default("pending"),
    retryCount: integer("retry_count").notNull().default(0),
    errorMessage: text("error_message"),
    deductData: jsonb("deduct_data"),
    deductedAt: timestamp("deducted_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("pay_deduct_auth_id_idx").on(table.authId),
    index("pay_deduct_user_id_idx").on(table.userId),
    index("pay_deduct_status_idx").on(table.status),
  ]
);

// ==================== 支付风控表 ====================

// 用户支付限额配置
export const payLimits = pgTable(
  "pay_limits",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    userId: varchar("user_id", { length: 36 }).notNull().unique(),
    dailyLimit: integer("daily_limit").default(50000), // 每日限额（分），默认500元
    monthlyLimit: integer("monthly_limit").default(200000), // 每月限额（分），默认2000元
    singleLimit: integer("single_limit").default(10000), // 单笔限额（分），默认100元
    dailyUsed: integer("daily_used").default(0), // 今日已用
    monthlyUsed: integer("monthly_used").default(0), // 本月已用
    lastDailyReset: timestamp("last_daily_reset", { withTimezone: true }), // 上次日重置时间
    lastMonthlyReset: timestamp("last_monthly_reset", { withTimezone: true }), // 上次月重置时间
    isMinor: boolean("is_minor").default(false), // 是否未成年人
    minorDailyLimit: integer("minor_daily_limit").default(1000), // 未成年人每日限额（10元）
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }),
  },
  (table) => [
    index("pay_limits_user_id_idx").on(table.userId),
  ]
);

// 风控日志表
export const riskLogs = pgTable(
  "risk_logs",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    userId: varchar("user_id", { length: 36 }).notNull(),
    orderNo: varchar("order_no", { length: 64 }),
    riskType: varchar("risk_type", { length: 50 }).notNull(), // limit_exceeded/minor_payment/suspicious
    riskLevel: varchar("risk_level", { length: 20 }).notNull(), // low/medium/high
    action: varchar("action", { length: 50 }).notNull(), // block/warn/pass
    detail: jsonb("detail"), // 详细信息
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("risk_logs_user_id_idx").on(table.userId),
    index("risk_logs_order_no_idx").on(table.orderNo),
    index("risk_logs_created_at_idx").on(table.createdAt),
  ]
);

// ==================== 账单凭证表 ====================

// 账单表
export const bills = pgTable(
  "bills",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    billNo: varchar("bill_no", { length: 64 }).notNull().unique(),
    userId: varchar("user_id", { length: 36 }).notNull(),
    orderNo: varchar("order_no", { length: 64 }), // 关联订单
    type: varchar("type", { length: 20 }).notNull(), // payment/refund/deduct
    amount: integer("amount").notNull(),
    title: varchar("title", { length: 128 }).notNull(),
    description: text("description"),
    status: varchar("status", { length: 20 }).notNull().default("pending"), // pending/completed/cancelled
    receiptUrl: text("receipt_url"), // 电子回单URL
    invoiceUrl: text("invoice_url"), // 发票URL
    invoiceStatus: varchar("invoice_status", { length: 20 }).default("none"), // none/requested/issued
    billData: jsonb("bill_data"),
    issuedAt: timestamp("issued_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("bills_bill_no_idx").on(table.billNo),
    index("bills_user_id_idx").on(table.userId),
    index("bills_order_no_idx").on(table.orderNo),
  ]
);

// 发票申请表
export const invoices = pgTable(
  "invoices",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    userId: varchar("user_id", { length: 36 }).notNull(),
    billId: varchar("bill_id", { length: 36 }).notNull(),
    invoiceType: varchar("invoice_type", { length: 20 }).notNull(), // electronic/paper
    title: varchar("title", { length: 128 }).notNull(), // 发票抬头
    taxNo: varchar("tax_no", { length: 32 }), // 税号
    companyAddress: text("company_address"), // 公司地址
    companyPhone: varchar("company_phone", { length: 32 }), // 公司电话
    bankName: varchar("bank_name", { length: 64 }), // 开户银行
    bankAccount: varchar("bank_account", { length: 32 }), // 银行账号
    email: varchar("email", { length: 128 }), // 接收邮箱
    status: varchar("status", { length: 20 }).notNull().default("pending"), // pending/issued/rejected
    invoiceUrl: text("invoice_url"),
    invoiceNo: varchar("invoice_no", { length: 64 }), // 发票号码
    rejectReason: text("reject_reason"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    issuedAt: timestamp("issued_at", { withTimezone: true }),
  },
  (table) => [
    index("invoices_user_id_idx").on(table.userId),
    index("invoices_bill_id_idx").on(table.billId),
    index("invoices_status_idx").on(table.status),
  ]
);

// ==================== 离线同步表 ====================

// 离线操作队列表
export const offlineQueue = pgTable(
  "offline_queue",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    userId: varchar("user_id", { length: 36 }).notNull(),
    operationType: varchar("operation_type", { length: 50 }).notNull(), // deduct/payment/refund
    operationData: jsonb("operation_data").notNull(), // 操作数据
    status: varchar("status", { length: 20 }).notNull().default("pending"), // pending/synced/failed
    syncAttempts: integer("sync_attempts").default(0), // 同步尝试次数
    lastSyncAttempt: timestamp("last_sync_attempt", { withTimezone: true }),
    syncResult: jsonb("sync_result"), // 同步结果
    errorMessage: text("error_message"),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    syncedAt: timestamp("synced_at", { withTimezone: true }),
  },
  (table) => [
    index("offline_queue_user_id_idx").on(table.userId),
    index("offline_queue_status_idx").on(table.status),
    index("offline_queue_created_at_idx").on(table.createdAt),
  ]
);

// ==================== 云存储配置表 ====================

// 云存储配置表
export const cloudStorageConfig = pgTable(
  "cloud_storage_config",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    userId: varchar("user_id", { length: 36 }).notNull().unique(),
    baiduEnabled: boolean("baidu_enabled").default(false), // 百度网盘启用
    baiduAccessToken: text("baidu_access_token"), // 加密存储
    baiduRefreshToken: text("baidu_refresh_token"),
    baiduExpiresAt: timestamp("baidu_expires_at", { withTimezone: true }),
    baiduSyncPath: varchar("baidu_sync_path", { length: 256 }).default("/GOpen"), // 同步目录
    aliyunEnabled: boolean("aliyun_enabled").default(false), // 阿里云盘启用
    aliyunAccessToken: text("aliyun_access_token"),
    aliyunRefreshToken: text("aliyun_refresh_token"),
    aliyunExpiresAt: timestamp("aliyun_expires_at", { withTimezone: true }),
    aliyunSyncPath: varchar("aliyun_sync_path", { length: 256 }).default("/GOpen"),
    autoSync: boolean("auto_sync").default(true), // 自动同步
    syncInterval: integer("sync_interval").default(30), // 同步间隔（分钟）
    lastSyncAt: timestamp("last_sync_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }),
  },
  (table) => [
    index("cloud_storage_user_id_idx").on(table.userId),
  ]
);

// 同步文件记录表
export const syncFiles = pgTable(
  "sync_files",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    userId: varchar("user_id", { length: 36 }).notNull(),
    fileName: varchar("file_name", { length: 256 }).notNull(),
    fileType: varchar("file_type", { length: 50 }).notNull(), // project/model/asset
    fileSize: integer("file_size").notNull(), // 文件大小（字节）
    localPath: text("local_path"), // 本地路径
    storage: varchar("storage", { length: 20 }).notNull(), // baidu/aliyun
    remotePath: text("remote_path"), // 云端路径
    remoteId: varchar("remote_id", { length: 128 }), // 云端文件ID
    md5: varchar("md5", { length: 32 }), // 文件MD5
    status: varchar("status", { length: 20 }).notNull().default("pending"), // pending/uploaded/synced/failed
    syncVersion: integer("sync_version").default(1), // 同步版本号
    lastModified: timestamp("last_modified", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }),
  },
  (table) => [
    index("sync_files_user_id_idx").on(table.userId),
    index("sync_files_storage_idx").on(table.storage),
    index("sync_files_status_idx").on(table.status),
  ]
);

// ==================== TypeScript 类型导出 ====================

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

export type OauthBinding = typeof oauthBindings.$inferSelect;
export type InsertOauthBinding = typeof oauthBindings.$inferInsert;

export type PayOrder = typeof payOrders.$inferSelect;
export type InsertPayOrder = typeof payOrders.$inferInsert;

export type PayAuth = typeof payAuths.$inferSelect;
export type InsertPayAuth = typeof payAuths.$inferInsert;

export type PayDeductRecord = typeof payDeductRecords.$inferSelect;
export type InsertPayDeductRecord = typeof payDeductRecords.$inferInsert;

export type PayLimit = typeof payLimits.$inferSelect;
export type InsertPayLimit = typeof payLimits.$inferInsert;

export type RiskLog = typeof riskLogs.$inferSelect;
export type InsertRiskLog = typeof riskLogs.$inferInsert;

export type Bill = typeof bills.$inferSelect;
export type InsertBill = typeof bills.$inferInsert;

export type Invoice = typeof invoices.$inferSelect;
export type InsertInvoice = typeof invoices.$inferInsert;

export type OfflineQueue = typeof offlineQueue.$inferSelect;
export type InsertOfflineQueue = typeof offlineQueue.$inferInsert;

export type CloudStorageConfig = typeof cloudStorageConfig.$inferSelect;
export type InsertCloudStorageConfig = typeof cloudStorageConfig.$inferInsert;

export type SyncFile = typeof syncFiles.$inferSelect;
export type InsertSyncFile = typeof syncFiles.$inferInsert;

// ==================== AI模型与计费表 ====================

// AI模型配置表（后台管理）
export const aiModels = pgTable(
  "ai_models",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    code: varchar("code", { length: 64 }).notNull().unique(), // doubao-pro, gpt-4, ollama-llama3
    name: varchar("name", { length: 128 }).notNull(), // 显示名称
    provider: varchar("provider", { length: 50 }).notNull(), // openai, anthropic, doubao, ollama
    category: varchar("category", { length: 50 }).notNull(), // chat, image, video, audio
    
    // 成本价（后台可见，用户不可见）
    costInputPrice: integer("cost_input_price").notNull(), // 输入token成本价（分/百万token）
    costOutputPrice: integer("cost_output_price").notNull(), // 输出token成本价（分/百万token）
    costGpuHour: integer("cost_gpu_hour"), // GPU小时成本（分/小时）
    
    // 用户售价（加价后）
    sellInputPrice: integer("sell_input_price").notNull(), // 输入token售价（分/百万token）
    sellOutputPrice: integer("sell_output_price").notNull(), // 输出token售价（分/百万token）
    sellGpuHour: integer("sell_gpu_hour"), // GPU小时售价（分/小时）
    
    // 加价策略
    markupType: varchar("markup_type", { length: 20 }).default("percentage"), // percentage/fixed
    markupValue: integer("markup_value").default(30), // 加价百分比或固定值
    
    // 模型参数
    maxTokens: integer("max_tokens").default(4096),
    contextWindow: integer("context_window").default(8192),
    
    // 服务配置
    apiEndpoint: text("api_endpoint"), // API地址
    apiKeyEncrypted: text("api_key_encrypted"), // 加密的API Key
    modelParams: jsonb("model_params"), // 模型参数配置
    
    // Ollama专用
    isOllama: boolean("is_ollama").default(false),
    ollamaHost: varchar("ollama_host", { length: 256 }), // Ollama服务地址
    ollamaModel: varchar("ollama_model", { length: 128 }), // Ollama模型名
    
    // 状态
    isFree: boolean("is_free").default(false), // 是否免费模型
    isPublic: boolean("is_public").default(true), // 是否对公众开放
    memberOnly: boolean("member_only").default(false), // 仅会员可用
    superMemberOnly: boolean("super_member_only").default(false), // 仅超级会员可用
    status: varchar("status", { length: 20 }).default("active"), // active/disabled
    
    // 排序和描述
    sortOrder: integer("sort_order").default(0),
    description: text("description"),
    icon: varchar("icon", { length: 256 }),
    
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }),
  },
  (table) => [
    index("ai_models_code_idx").on(table.code),
    index("ai_models_provider_idx").on(table.provider),
    index("ai_models_category_idx").on(table.category),
    index("ai_models_status_idx").on(table.status),
  ]
);

// 存储费用配置表
export const storagePricing = pgTable(
  "storage_pricing",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    storageType: varchar("storage_type", { length: 50 }).notNull(), // local, oss, baidu, aliyun
    
    // 成本价
    costPerGb: integer("cost_per_gb").notNull(), // 每GB成本（分/月）
    costPerRequest: integer("cost_per_request").default(0), // 每次请求成本（分）
    costTraffic: integer("cost_traffic").default(0), // 流量成本（分/GB）
    
    // 售价
    sellPerGb: integer("sell_per_gb").notNull(), // 每GB售价（分/月）
    sellPerRequest: integer("sell_per_request").default(0), // 每次请求售价（分）
    sellTraffic: integer("sell_traffic").default(0), // 流量售价（分/GB）
    
    // 免费额度
    freeQuotaGb: integer("free_quota_gb").default(1), // 免费存储额度（GB）
    freeQuotaRequests: integer("free_quota_requests").default(10000), // 免费请求次数
    
    markupValue: integer("markup_value").default(50), // 加价比例
    
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }),
  }
);

// 用户余额表
export const userBalances = pgTable(
  "user_balances",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    userId: varchar("user_id", { length: 36 }).notNull().unique(),
    
    balance: integer("balance").default(0), // 余额（分）
    frozenBalance: integer("frozen_balance").default(0), // 冻结金额（分）
    
    // 累计统计
    totalRecharged: integer("total_recharged").default(0), // 累计充值
    totalConsumed: integer("total_consumed").default(0), // 累计消费
    totalStorageUsed: integer("total_storage_used").default(0), // 累计存储使用（字节）
    totalComputeUsed: integer("total_compute_used").default(0), // 累计计算使用（token）
    totalGpuUsed: integer("total_gpu_used").default(0), // 累计GPU使用（秒）
    
    // 本月统计
    monthlyConsumed: integer("monthly_consumed").default(0), // 本月消费
    monthlyStorageUsed: integer("monthly_storage_used").default(0), // 本月存储使用
    monthlyComputeUsed: integer("monthly_compute_used").default(0), // 本月计算使用
    monthlyGpuUsed: integer("monthly_gpu_used").default(0), // 本月GPU使用
    
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }),
  },
  (table) => [
    index("user_balances_user_id_idx").on(table.userId),
  ]
);

// 消费记录表
export const consumptionRecords = pgTable(
  "consumption_records",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    userId: varchar("user_id", { length: 36 }).notNull(),
    
    consumptionType: varchar("consumption_type", { length: 50 }).notNull(), // model/storage/gpu/ollama
    
    // 关联资源
    resourceId: varchar("resource_id", { length: 36 }), // 模型ID/存储ID
    resourceName: varchar("resource_name", { length: 128 }), // 资源名称
    
    // 用量明细
    inputTokens: integer("input_tokens").default(0),
    outputTokens: integer("output_tokens").default(0),
    storageBytes: integer("storage_bytes").default(0),
    gpuSeconds: integer("gpu_seconds").default(0),
    requestCount: integer("request_count").default(1),
    
    // 费用明细（后台可见）
    costInputFee: integer("cost_input_fee").default(0), // 输入成本（分）
    costOutputFee: integer("cost_output_fee").default(0), // 输出成本（分）
    costStorageFee: integer("cost_storage_fee").default(0), // 存储成本（分）
    costGpuFee: integer("cost_gpu_fee").default(0), // GPU成本（分）
    costTotal: integer("cost_total").default(0), // 总成本（分）
    
    // 收费明细（用户可见）
    sellInputFee: integer("sell_input_fee").default(0), // 输入收费（分）
    sellOutputFee: integer("sell_output_fee").default(0), // 输出收费（分）
    sellStorageFee: integer("sell_storage_fee").default(0), // 存储收费（分）
    sellGpuFee: integer("sell_gpu_fee").default(0), // GPU收费（分）
    sellTotal: integer("sell_total").default(0), // 总收费（分）
    
    // 利润
    profit: integer("profit").default(0), // 利润（分）
    
    // 关联任务
    taskId: varchar("task_id", { length: 36 }), // 关联的创作任务ID
    projectId: varchar("project_id", { length: 36 }), // 关联项目ID
    
    status: varchar("status", { length: 20 }).default("completed"), // pending/completed/refunded
    remark: text("remark"),
    
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("consumption_records_user_id_idx").on(table.userId),
    index("consumption_records_type_idx").on(table.consumptionType),
    index("consumption_records_created_at_idx").on(table.createdAt),
  ]
);

// GPU实例配置表
export const gpuInstances = pgTable(
  "gpu_instances",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    code: varchar("code", { length: 64 }).notNull().unique(), // rtx-4090, a100-80g
    name: varchar("name", { length: 128 }).notNull(),
    gpuModel: varchar("gpu_model", { length: 128 }).notNull(), // RTX 4090, A100
    vramGb: integer("vram_gb").notNull(), // 显存大小（GB）
    
    // 成本与售价
    costPerHour: integer("cost_per_hour").notNull(), // 每小时成本（分）
    sellPerHour: integer("sell_per_hour").notNull(), // 每小时售价（分）
    markupValue: integer("markup_value").default(50),
    
    // 性能参数
    cudaCores: integer("cuda_cores"),
    tensorCores: integer("tensor_cores"),
    bandwidth: integer("bandwidth"), // 带宽（GB/s）
    
    // 状态
    totalInstances: integer("total_instances").default(0), // 总实例数
    availableInstances: integer("available_instances").default(0), // 可用实例数
    status: varchar("status", { length: 20 }).default("active"),
    
    sortOrder: integer("sort_order").default(0),
    description: text("description"),
    icon: varchar("icon", { length: 256 }),
    
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }),
  },
  (table) => [
    index("gpu_instances_code_idx").on(table.code),
    index("gpu_instances_status_idx").on(table.status),
  ]
);

// GPU任务记录表
export const gpuTasks = pgTable(
  "gpu_tasks",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    userId: varchar("user_id", { length: 36 }).notNull(),
    gpuInstanceId: varchar("gpu_instance_id", { length: 36 }).notNull(),
    
    taskType: varchar("task_type", { length: 50 }).notNull(), // render, train, inference
    taskName: varchar("task_name", { length: 128 }).notNull(),
    
    // 执行信息
    startTime: timestamp("start_time", { withTimezone: true }),
    endTime: timestamp("end_time", { withTimezone: true }),
    duration: integer("duration").default(0), // 实际执行时长（秒）
    
    // 资源配置
    inputParams: jsonb("input_params"), // 输入参数
    inputData: jsonb("input_data"), // 输入数据引用
    outputData: jsonb("output_data"), // 输出数据引用
    
    // 费用
    estimatedCost: integer("estimated_cost"), // 预估费用（分）
    actualCost: integer("actual_cost"), // 实际费用（分）
    estimatedSell: integer("estimated_sell"), // 预估收费（分）
    actualSell: integer("actual_sell"), // 实际收费（分）
    
    status: varchar("status", { length: 20 }).default("pending"), // pending/running/completed/failed
    errorMessage: text("error_message"),
    
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }),
  },
  (table) => [
    index("gpu_tasks_user_id_idx").on(table.userId),
    index("gpu_tasks_status_idx").on(table.status),
    index("gpu_tasks_created_at_idx").on(table.createdAt),
  ]
);

// Ollama服务配置表
export const ollamaServices = pgTable(
  "ollama_services",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    name: varchar("name", { length: 128 }).notNull(),
    host: varchar("host", { length: 256 }).notNull(), // 服务地址
    port: integer("port").default(11434),
    
    // 资源限制
    maxConcurrent: integer("max_concurrent").default(10), // 最大并发
    maxQueueSize: integer("max_queue_size").default(100), // 最大队列
    
    // 计费配置
    isFree: boolean("is_free").default(false), // 是否免费
    pricePerRequest: integer("price_per_request").default(0), // 每次请求价格（分）
    pricePerToken: integer("price_per_token").default(0), // 每token价格（分/千）
    
    // 状态
    status: varchar("status", { length: 20 }).default("active"),
    healthCheckUrl: varchar("health_check_url", { length: 256 }),
    lastHealthCheck: timestamp("last_health_check", { withTimezone: true }),
    
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }),
  }
);

// 模型类型导出
export type AiModel = typeof aiModels.$inferSelect;
export type InsertAiModel = typeof aiModels.$inferInsert;

export type StoragePricing = typeof storagePricing.$inferSelect;
export type InsertStoragePricing = typeof storagePricing.$inferInsert;

export type UserBalance = typeof userBalances.$inferSelect;
export type InsertUserBalance = typeof userBalances.$inferInsert;

export type ConsumptionRecord = typeof consumptionRecords.$inferSelect;
export type InsertConsumptionRecord = typeof consumptionRecords.$inferInsert;

export type GpuInstance = typeof gpuInstances.$inferSelect;
export type InsertGpuInstance = typeof gpuInstances.$inferInsert;

export type GpuTask = typeof gpuTasks.$inferSelect;
export type InsertGpuTask = typeof gpuTasks.$inferInsert;

export type OllamaService = typeof ollamaServices.$inferSelect;
export type InsertOllamaService = typeof ollamaServices.$inferInsert;
