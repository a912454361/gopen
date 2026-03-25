import { pgTable, serial, varchar, timestamp, integer, text, boolean, index, jsonb, numeric } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

// ==================== 厂商管理系统表 ====================

// 用户角色表
export const userRoles = pgTable(
  "user_roles",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    userId: varchar("user_id", { length: 36 }).notNull().unique(),
    role: varchar("role", { length: 20 }).notNull().default("user"), // admin, vendor, user
    permissions: jsonb("permissions"), // 权限列表
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }),
  },
  (table) => [
    index("user_roles_user_id_idx").on(table.userId),
    index("user_roles_role_idx").on(table.role),
  ]
);

// 厂商信息表
export const vendors = pgTable(
  "vendors",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    userId: varchar("user_id", { length: 36 }).notNull().unique(), // 关联用户表
    companyName: varchar("company_name", { length: 128 }).notNull(), // 公司名称
    contactName: varchar("contact_name", { length: 64 }).notNull(), // 联系人
    contactPhone: varchar("contact_phone", { length: 20 }), // 联系电话
    contactEmail: varchar("contact_email", { length: 128 }), // 联系邮箱
    businessLicense: varchar("business_license", { length: 64 }), // 营业执照号
    businessLicenseUrl: text("business_license_url"), // 营业执照图片
    description: text("description"), // 公司简介
    logo: text("logo"), // 公司Logo
    website: varchar("website", { length: 256 }), // 公司网站
    address: text("address"), // 公司地址
    
    // 结算信息
    bankName: varchar("bank_name", { length: 64 }), // 开户银行
    bankAccount: varchar("bank_account", { length: 32 }), // 银行账号
    bankAccountName: varchar("bank_account_name", { length: 64 }), // 账户名
    
    // 状态
    status: varchar("status", { length: 20 }).default("pending"), // pending, approved, rejected, suspended
    verifiedAt: timestamp("verified_at", { withTimezone: true }), // 审核通过时间
    verifiedBy: varchar("verified_by", { length: 36 }), // 审核人
    rejectReason: text("reject_reason"), // 拒绝原因
    
    // 统计
    totalServices: integer("total_services").default(0), // 服务总数
    activeServices: integer("active_services").default(0), // 活跃服务数
    totalCalls: integer("total_calls").default(0), // 总调用次数
    totalRevenue: integer("total_revenue").default(0), // 总收入（分）
    
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }),
  },
  (table) => [
    index("vendors_user_id_idx").on(table.userId),
    index("vendors_status_idx").on(table.status),
  ]
);

// 厂商服务表（模型服务）
export const vendorServices = pgTable(
  "vendor_services",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    vendorId: varchar("vendor_id", { length: 36 }).notNull(), // 厂商ID
    
    // 服务基本信息
    serviceCode: varchar("service_code", { length: 64 }).notNull(), // 服务代码（唯一标识）
    serviceName: varchar("service_name", { length: 128 }).notNull(), // 服务名称
    serviceType: varchar("service_type", { length: 50 }).notNull(), // llm, image, video, audio, embedding
    category: varchar("category", { length: 50 }), // 分类标签
    
    // 服务描述
    description: text("description"), // 详细描述
    icon: varchar("icon", { length: 256 }), // 图标
    documentation: text("documentation"), // API文档
    examples: jsonb("examples"), // 示例
    
    // API配置
    apiEndpoint: text("api_endpoint").notNull(), // API地址
    apiProtocol: varchar("api_protocol", { length: 20 }).default("openai"), // openai, custom
    apiKeyEncrypted: text("api_key_encrypted"), // 加密的API Key
    apiKeyIV: text("api_key_iv"), // 加密IV
    apiHeaders: jsonb("api_headers"), // 自定义请求头
    apiParams: jsonb("api_params"), // 默认参数
    
    // 模型参数
    modelMapping: jsonb("model_mapping"), // 模型映射（如：gpt-4 -> vendor-model-xxx）
    maxTokens: integer("max_tokens"), // 最大token
    contextWindow: integer("context_window"), // 上下文窗口
    supportedFeatures: jsonb("supported_features"), // 支持的特性
    
    // 定价配置（厂商定价）
    pricingType: varchar("pricing_type", { length: 20 }).default("token"), // token, request, second
    inputPrice: integer("input_price").notNull(), // 输入价格（分/百万token）
    outputPrice: integer("output_price").notNull(), // 输出价格（分/百万token）
    requestPrice: integer("request_price"), // 单次请求价格（分）
    secondPrice: integer("second_price"), // 每秒价格（分）
    minimumCharge: integer("minimum_charge").default(0), // 最低收费（分）
    
    // 平台加价（管理员设置）
    platformMarkup: integer("platform_markup").default(30), // 平台加价百分比
    platformFixedFee: integer("platform_fixed_fee").default(0), // 平台固定费用（分）
    
    // 最终售价（自动计算）
    finalInputPrice: integer("final_input_price"), // 最终输入价格
    finalOutputPrice: integer("final_output_price"), // 最终输出价格
    
    // 配额与限制
    dailyQuota: integer("daily_quota"), // 每日配额（-1为无限）
    rateLimit: integer("rate_limit").default(60), // 每分钟请求限制
    timeout: integer("timeout").default(30000), // 超时时间（毫秒）
    
    // 状态
    status: varchar("status", { length: 20 }).default("draft"), // draft, pending, active, suspended, offline
    reviewedAt: timestamp("reviewed_at", { withTimezone: true }),
    reviewedBy: varchar("reviewed_by", { length: 36 }),
    rejectReason: text("reject_reason"),
    
    // 统计
    totalCalls: integer("total_calls").default(0), // 总调用次数
    successCalls: integer("success_calls").default(0), // 成功调用
    failedCalls: integer("failed_calls").default(0), // 失败调用
    totalTokens: integer("total_tokens").default(0), // 总token数
    totalRevenue: integer("total_revenue").default(0), // 总收入（分）
    avgLatency: integer("avg_latency").default(0), // 平均延迟（毫秒）
    
    // 健康检查
    lastHealthCheck: timestamp("last_health_check", { withTimezone: true }),
    healthStatus: varchar("health_status", { length: 20 }).default("unknown"), // healthy, unhealthy, unknown
    healthMessage: text("health_message"),
    
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }),
  },
  (table) => [
    index("vendor_services_vendor_id_idx").on(table.vendorId),
    index("vendor_services_service_code_idx").on(table.serviceCode),
    index("vendor_services_service_type_idx").on(table.serviceType),
    index("vendor_services_status_idx").on(table.status),
  ]
);

// 服务调用日志表
export const serviceCallLogs = pgTable(
  "service_call_logs",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    serviceId: varchar("service_id", { length: 36 }).notNull(),
    vendorId: varchar("vendor_id", { length: 36 }).notNull(),
    userId: varchar("user_id", { length: 36 }).notNull(),
    
    // 请求信息
    requestId: varchar("request_id", { length: 64 }), // 请求ID
    requestType: varchar("request_type", { length: 20 }), // chat, completion, embed, image
    inputTokens: integer("input_tokens").default(0),
    outputTokens: integer("output_tokens").default(0),
    
    // 响应信息
    statusCode: integer("status_code"), // HTTP状态码
    latency: integer("latency"), // 响应时间（毫秒）
    success: boolean("success").default(false),
    errorMessage: text("error_message"),
    
    // 计费
    inputCost: integer("input_cost").default(0), // 输入成本（分）
    outputCost: integer("output_cost").default(0), // 输出成本（分）
    platformFee: integer("platform_fee").default(0), // 平台费用（分）
    totalCost: integer("total_cost").default(0), // 总费用（分）
    
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("service_call_logs_service_id_idx").on(table.serviceId),
    index("service_call_logs_vendor_id_idx").on(table.vendorId),
    index("service_call_logs_user_id_idx").on(table.userId),
    index("service_call_logs_created_at_idx").on(table.createdAt),
  ]
);

// 厂商结算记录表
export const vendorSettlements = pgTable(
  "vendor_settlements",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    vendorId: varchar("vendor_id", { length: 36 }).notNull(),
    
    // 结算周期
    periodStart: timestamp("period_start", { withTimezone: true }).notNull(),
    periodEnd: timestamp("period_end", { withTimezone: true }).notNull(),
    
    // 结算金额
    totalCalls: integer("total_calls").default(0), // 总调用次数
    totalTokens: integer("total_tokens").default(0), // 总token数
    grossRevenue: integer("gross_revenue").default(0), // 总收入（分）
    platformFee: integer("platform_fee").default(0), // 平台费用（分）
    netRevenue: integer("net_revenue").default(0), // 净收入（分）
    
    // 状态
    status: varchar("status", { length: 20 }).default("pending"), // pending, processing, paid, failed
    paidAt: timestamp("paid_at", { withTimezone: true }),
    paidBy: varchar("paid_by", { length: 36 }),
    transactionNo: varchar("transaction_no", { length: 64 }), // 交易流水号
    remark: text("remark"),
    
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp("updated_at", { withTimezone: true }),
  },
  (table) => [
    index("vendor_settlements_vendor_id_idx").on(table.vendorId),
    index("vendor_settlements_status_idx").on(table.status),
  ]
);

// 管理员操作日志表
export const adminLogs = pgTable(
  "admin_logs",
  {
    id: varchar("id", { length: 36 })
      .primaryKey()
      .default(sql`gen_random_uuid()`),
    operatorId: varchar("operator_id", { length: 36 }), // 操作人ID
    operatorRole: varchar("operator_role", { length: 20 }), // admin, vendor
    action: varchar("action", { length: 100 }).notNull(), // 操作类型
    targetType: varchar("target_type", { length: 50 }), // 目标类型
    targetId: varchar("target_id", { length: 36 }), // 目标ID
    details: text("details"), // 详情
    ip: varchar("ip", { length: 64 }), // 操作IP
    userAgent: text("user_agent"), // 用户代理
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("admin_logs_operator_id_idx").on(table.operatorId),
    index("admin_logs_action_idx").on(table.action),
    index("admin_logs_created_at_idx").on(table.createdAt),
  ]
);

// ==================== 类型导出 ====================

export type UserRole = typeof userRoles.$inferSelect;
export type InsertUserRole = typeof userRoles.$inferInsert;

export type Vendor = typeof vendors.$inferSelect;
export type InsertVendor = typeof vendors.$inferInsert;

export type VendorService = typeof vendorServices.$inferSelect;
export type InsertVendorService = typeof vendorServices.$inferInsert;

export type ServiceCallLog = typeof serviceCallLogs.$inferSelect;
export type InsertServiceCallLog = typeof serviceCallLogs.$inferInsert;

export type VendorSettlement = typeof vendorSettlements.$inferSelect;
export type InsertVendorSettlement = typeof vendorSettlements.$inferInsert;

export type AdminLog = typeof adminLogs.$inferSelect;
export type InsertAdminLog = typeof adminLogs.$inferInsert;
