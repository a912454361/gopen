import { relations } from "drizzle-orm/relations";
import { vendors, vendorStorageConfigs, vendorStorageFiles } from "./vendor-schema";

// 厂商与存储配置的关系（一对一）
export const vendorsToStorageConfigRelations = relations(vendors, ({ one }) => ({
  storageConfig: one(vendorStorageConfigs, {
    fields: [vendors.id],
    references: [vendorStorageConfigs.vendorId],
  }),
}));

// 存储配置与厂商的关系（一对一）
export const storageConfigToVendorRelations = relations(vendorStorageConfigs, ({ one, many }) => ({
  vendor: one(vendors, {
    fields: [vendorStorageConfigs.vendorId],
    references: [vendors.id],
  }),
  files: many(vendorStorageFiles),
}));

// 存储文件与存储配置的关系（多对一）
export const storageFileToConfigRelations = relations(vendorStorageFiles, ({ one }) => ({
  config: one(vendorStorageConfigs, {
    fields: [vendorStorageFiles.configId],
    references: [vendorStorageConfigs.id],
  }),
}));
