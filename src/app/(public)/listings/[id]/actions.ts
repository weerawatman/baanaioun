'use server';

export const runtime = 'edge';

import { createClient } from '@supabase/supabase-js';
import { env } from '@/config/env';
import { isValidPhoneNumber, isLengthInRange, isEmpty } from '@/shared/utils';

interface SubmitLeadResult {
  success: boolean;
  errors?: Record<string, string>;
  message?: string;
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function submitLead(formData: FormData): Promise<SubmitLeadResult> {
  const asset_id = formData.get('asset_id') as string | null;
  const customer_name = (formData.get('customer_name') as string | null)?.trim() ?? '';
  const customer_phone = (formData.get('customer_phone') as string | null)?.trim() ?? '';
  const customer_line_id = (formData.get('customer_line_id') as string | null)?.trim() ?? '';
  const message = (formData.get('message') as string | null)?.trim() ?? '';

  const errors: Record<string, string> = {};

  if (!asset_id || !UUID_REGEX.test(asset_id)) {
    errors.asset_id = 'รหัสทรัพย์สินไม่ถูกต้อง';
  }

  if (isEmpty(customer_name)) {
    errors.customer_name = 'กรุณากรอกชื่อ';
  } else if (!isLengthInRange(customer_name, 2, 100)) {
    errors.customer_name = 'ชื่อต้องมี 2–100 ตัวอักษร';
  }

  if (customer_phone && !isValidPhoneNumber(customer_phone)) {
    errors.customer_phone = 'รูปแบบเบอร์โทรไม่ถูกต้อง (เช่น 0812345678)';
  }

  if (customer_line_id && !isLengthInRange(customer_line_id, 1, 50)) {
    errors.customer_line_id = 'LINE ID ต้องไม่เกิน 50 ตัวอักษร';
  }

  if (message && !isLengthInRange(message, 1, 1000)) {
    errors.message = 'ข้อความต้องไม่เกิน 1,000 ตัวอักษร';
  }

  if (!customer_phone && !customer_line_id) {
    errors.customer_phone = 'กรุณากรอกเบอร์โทรหรือ LINE ID อย่างน้อย 1 ช่องทาง';
    errors.customer_line_id = 'กรุณากรอกเบอร์โทรหรือ LINE ID อย่างน้อย 1 ช่องทาง';
  }

  if (Object.keys(errors).length > 0) {
    return { success: false, errors };
  }

  try {
    // Use anon client for public lead submission (no session required)
    const supabase = createClient(env.supabase.url, env.supabase.anonKey);

    const { error } = await supabase.from('leads').insert({
      asset_id,
      customer_name,
      customer_phone: customer_phone || null,
      customer_line_id: customer_line_id || null,
      message: message || null,
    });

    if (error) {
      return { success: false, message: 'เกิดข้อผิดพลาดในการบันทึกข้อมูล กรุณาลองใหม่' };
    }

    return { success: true, message: 'ส่งข้อมูลสำเร็จ เราจะติดต่อกลับโดยเร็วที่สุด' };
  } catch {
    return { success: false, message: 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง' };
  }
}
