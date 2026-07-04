import { Router, type Request, type Response } from 'express';
import { z } from 'zod';
import { getSupabaseClient } from '../storage/database/supabase-client.js';

const router = Router();
const client = getSupabaseClient();

// ==================== 账单管理 ====================

/**
 * 获取用户账单列表
 * GET /api/v1/bill/list/:userId
 */
router.get('/list/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const limit = parseInt(req.query.limit as string) || 20;
    const offset = parseInt(req.query.offset as string) || 0;
    
    const { data: bills, error } = await client
      .from('bills')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit - 1);
    
    if (error) {
      return res.status(500).json({ error: 'Failed to get bills' });
    }
    
    // 获取总数
    const { count } = await client
      .from('bills')
      .select('*', { count: 'exact', head: true })
      .eq('user_id', userId);
    
    res.json({
      success: true,
      data: {
        bills: bills || [],
        total: count || 0,
        hasMore: (count || 0) > offset + limit,
      },
    });
  } catch (error) {
    console.error('Get bills error:', error);
    res.status(500).json({ error: 'Failed to get bills' });
  }
});

// ==================== 生成账单 ====================

const createBillSchema = z.object({
  userId: z.string(),
  orderNo: z.string(),
  type: z.enum(['payment', 'refund', 'deduct']),
  amount: z.number().int().positive(),
  title: z.string(),
  description: z.string().optional(),
});

/**
 * 生成账单（内部调用）
 * POST /api/v1/bill/create
 */
router.post('/create', async (req: Request, res: Response) => {
  try {
    const body = createBillSchema.parse(req.body);
    
    const billNo = `BILL${Date.now()}${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
    
    const { data: bill, error } = await client
      .from('bills')
      .insert([{
        bill_no: billNo,
        user_id: body.userId,
        order_no: body.orderNo,
        type: body.type,
        amount: body.amount,
        title: body.title,
        description: body.description,
        status: 'completed',
        issued_at: new Date().toISOString(),
      }])
      .select()
      .single();
    
    if (error) {
      return res.status(500).json({ error: 'Failed to create bill' });
    }
    
    res.json({
      success: true,
      data: bill,
    });
  } catch (error) {
    console.error('Create bill error:', error);
    res.status(400).json({ error: error instanceof Error ? error.message : 'Invalid request' });
  }
});

// ==================== 获取账单详情 ====================

/**
 * 获取账单详情
 * GET /api/v1/bill/:billNo
 */
router.get('/:billNo', async (req: Request, res: Response) => {
  try {
    const { billNo } = req.params;
    
    const { data: bill, error } = await client
      .from('bills')
      .select('*')
      .eq('bill_no', billNo)
      .single();
    
    if (error || !bill) {
      return res.status(404).json({ error: 'Bill not found' });
    }
    
    res.json({
      success: true,
      data: bill,
    });
  } catch (error) {
    console.error('Get bill error:', error);
    res.status(500).json({ error: 'Failed to get bill' });
  }
});

// ==================== 申请发票 ====================

const applyInvoiceSchema = z.object({
  userId: z.string(),
  billId: z.string(),
  invoiceType: z.enum(['electronic', 'paper']),
  title: z.string(), // 发票抬头
  taxNo: z.string().optional(), // 税号
  companyAddress: z.string().optional(),
  companyPhone: z.string().optional(),
  bankName: z.string().optional(),
  bankAccount: z.string().optional(),
  email: z.string().email().optional(),
});

/**
 * 申请发票
 * POST /api/v1/bill/invoice/apply
 */
router.post('/invoice/apply', async (req: Request, res: Response) => {
  try {
    const body = applyInvoiceSchema.parse(req.body);
    
    // 检查账单是否存在
    const { data: bill, error: billError } = await client
      .from('bills')
      .select('*')
      .eq('id', body.billId)
      .eq('user_id', body.userId)
      .single();
    
    if (billError || !bill) {
      return res.status(404).json({ error: 'Bill not found' });
    }
    
    // 检查是否已申请
    const { data: existingInvoice } = await client
      .from('invoices')
      .select('*')
      .eq('bill_id', body.billId)
      .eq('user_id', body.userId)
      .single();
    
    if (existingInvoice) {
      return res.status(400).json({ 
        error: 'Invoice already applied',
        data: existingInvoice,
      });
    }
    
    // 创建发票申请
    const { data: invoice, error } = await client
      .from('invoices')
      .insert([{
        user_id: body.userId,
        bill_id: body.billId,
        invoice_type: body.invoiceType,
        title: body.title,
        tax_no: body.taxNo,
        company_address: body.companyAddress,
        company_phone: body.companyPhone,
        bank_name: body.bankName,
        bank_account: body.bankAccount,
        email: body.email,
        status: 'pending',
      }])
      .select()
      .single();
    
    if (error) {
      return res.status(500).json({ error: 'Failed to apply invoice' });
    }
    
    // 更新账单发票状态
    await client
      .from('bills')
      .update({ invoice_status: 'requested' })
      .eq('id', body.billId);
    
    res.json({
      success: true,
      message: '发票申请已提交，预计1-3个工作日处理',
      data: invoice,
    });
  } catch (error) {
    console.error('Apply invoice error:', error);
    res.status(400).json({ error: error instanceof Error ? error.message : 'Invalid request' });
  }
});

// ==================== 获取发票列表 ====================

/**
 * 获取用户发票列表
 * GET /api/v1/bill/invoices/:userId
 */
router.get('/invoices/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    
    const { data: invoices, error } = await client
      .from('invoices')
      .select('*, bills(*)')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (error) {
      return res.status(500).json({ error: 'Failed to get invoices' });
    }
    
    res.json({
      success: true,
      data: invoices || [],
    });
  } catch (error) {
    console.error('Get invoices error:', error);
    res.status(500).json({ error: 'Failed to get invoices' });
  }
});

// ==================== 下载回单 ====================

/**
 * 生成/获取电子回单
 * POST /api/v1/bill/receipt/:billNo
 */
router.post('/receipt/:billNo', async (req: Request, res: Response) => {
  try {
    const { billNo } = req.params;
    
    const { data: bill, error } = await client
      .from('bills')
      .select('*')
      .eq('bill_no', billNo)
      .single();
    
    if (error || !bill) {
      return res.status(404).json({ error: 'Bill not found' });
    }
    
    // 模拟生成回单URL（实际应调用支付平台API）
    const receiptUrl = `https://receipt.gopen.com/${billNo}.pdf`;
    
    // 更新账单回单URL
    await client
      .from('bills')
      .update({ receipt_url: receiptUrl })
      .eq('id', bill.id);
    
    res.json({
      success: true,
      data: {
        billNo,
        receiptUrl,
        generatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Generate receipt error:', error);
    res.status(500).json({ error: 'Failed to generate receipt' });
  }
});

// ==================== 账单统计 ====================

/**
 * 获取账单统计
 * GET /api/v1/bill/stats/:userId
 */
router.get('/stats/:userId', async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { startDate, endDate } = req.query;
    
    let query = client
      .from('bills')
      .select('type, amount, created_at')
      .eq('user_id', userId)
      .eq('status', 'completed');
    
    if (startDate) {
      query = query.gte('created_at', startDate as string);
    }
    if (endDate) {
      query = query.lte('created_at', endDate as string);
    }
    
    const { data: bills, error } = await query;
    
    if (error) {
      return res.status(500).json({ error: 'Failed to get stats' });
    }
    
    const stats = {
      totalPayment: 0,
      totalRefund: 0,
      totalDeduct: 0,
      count: bills?.length || 0,
    };
    
    bills?.forEach(bill => {
      if (bill.type === 'payment') {
        stats.totalPayment += bill.amount;
      } else if (bill.type === 'refund') {
        stats.totalRefund += bill.amount;
      } else if (bill.type === 'deduct') {
        stats.totalDeduct += bill.amount;
      }
    });
    
    res.json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ error: 'Failed to get stats' });
  }
});

export default router;
