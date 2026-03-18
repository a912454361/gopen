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
    isAdult: boolean("is_adult").default(null), // 是否成年（实名认证后设置）
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
