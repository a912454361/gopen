import { pgTable, serial, varchar, timestamp, integer, text, boolean, index, jsonb } from "drizzle-orm/pg-core"
import { sql } from "drizzle-orm"

// ==================== 系统表（保留） ====================

export const healthCheck = pgTable("health_check", {
	id: serial().notNull(),
	updatedAt: timestamp("updated_at", { withTimezone: true, mode: 'string' }).defaultNow(),
});

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
    payType: varchar("pay_type", { length: 20 }).notNull(), // alipay / wechat
    status: varchar("status", { length: 20 }).notNull().default("pending"), // pending/paid/failed/cancelled
    qrCodeUrl: text("qr_code_url"),
    qrCodeData: text("qr_code_data"), // 二维码原始数据
    productType: varchar("product_type", { length: 50 }).notNull(), // membership / super_member
    productDetail: jsonb("product_detail"), // 产品详情JSON
    paidAt: timestamp("paid_at", { withTimezone: true }),
    expiredAt: timestamp("expired_at", { withTimezone: true }),
    callbackData: jsonb("callback_data"), // 支付回调数据
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
    authType: varchar("auth_type", { length: 20 }).notNull(), // alipay / wechat
    authNo: varchar("auth_no", { length: 128 }), // 授权号
    agreementId: varchar("agreement_id", { length: 128 }), // 协议ID
    status: varchar("status", { length: 20 }).notNull().default("active"), // active/cancelled/expired
    deductAmount: integer("deduct_amount").notNull().default(2900), // 扣费金额（分），默认29元
    deductCycle: varchar("deduct_cycle", { length: 20 }).notNull().default("monthly"), // monthly/daily
    cronExpression: varchar("cron_expression", { length: 100 }), // Cron表达式
    nextDeductTime: timestamp("next_deduct_time", { withTimezone: true }),
    lastDeductTime: timestamp("last_deduct_time", { withTimezone: true }),
    retryCount: integer("retry_count").notNull().default(0),
    maxRetryCount: integer("max_retry_count").notNull().default(3),
    authData: jsonb("auth_data"), // 授权详情
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
    orderNo: varchar("order_no", { length: 64 }), // 关联的支付订单
    amount: integer("amount").notNull(), // 扣费金额（分）
    status: varchar("status", { length: 20 }).notNull().default("pending"), // pending/success/failed
    retryCount: integer("retry_count").notNull().default(0),
    errorMessage: text("error_message"),
    deductData: jsonb("deduct_data"), // 扣费详情
    deductedAt: timestamp("deducted_at", { withTimezone: true }),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
  },
  (table) => [
    index("pay_deduct_auth_id_idx").on(table.authId),
    index("pay_deduct_user_id_idx").on(table.userId),
    index("pay_deduct_status_idx").on(table.status),
  ]
);

// ==================== TypeScript 类型导出 ====================

export type PayOrder = typeof payOrders.$inferSelect;
export type InsertPayOrder = typeof payOrders.$inferInsert;

export type PayAuth = typeof payAuths.$inferSelect;
export type InsertPayAuth = typeof payAuths.$inferInsert;

export type PayDeductRecord = typeof payDeductRecords.$inferSelect;
export type InsertPayDeductRecord = typeof payDeductRecords.$inferInsert;
