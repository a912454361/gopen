import { getSupabaseClient } from './storage/database/supabase-client';

// 使用Supabase客户端进行数据库操作
const db = getSupabaseClient();

export default db;
