'use server';

import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

interface SubmitLeadResult {
  success: boolean;
  errors?: Record<string, string>;
  message?: string;
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const THAI_PHONE_REGEX = /^0\d{8,9}$/;

export async function submitLead(formData: FormData): Promise<SubmitLeadResult> {
  const asset_id = formData.get('asset_id') as string | null;
  const customer_name = (formData.get('customer_name') as string | null)?.trim() ?? '';
  const customer_phone = (formData.get('customer_phone') as string | null)?.trim() ?? '';
  const customer_line_id = (formData.get('customer_line_id') as string | null)?.trim() ?? '';
  const message = (formData.get('message') as string | null)?.trim() ?? '';

  // Validation
  const errors: Record<string, string> = {};

  if (!asset_id || !UUID_REGEX.test(asset_id)) {
    errors.asset_id = 'รหัสทรัพย์สินไม่ถูกต้อง';
  }

  if (!customer_name) {
    errors.customer_name = 'กรุณากรอกชื่อ';
  } else if (customer_name.length < 2) {
    errors.customer_name = 'ชื่อต้องมีอย่างน้อย 2 ตัวอักษร';
  } else if (customer_name.length > 100) {
    errors.customer_name = 'ชื่อต้องไม่เกิน 100 ตัวอักษร';
  }

  if (customer_phone) {
    const digitsOnly = customer_phone.replace(/[-\s]/g, '');
    if (!THAI_PHONE_REGEX.test(digitsOnly)) {
      errors.customer_phone = 'รูปแบบเบอร์โทรไม่ถูกต้อง (เช่น 0812345678)';
    }
  }

  if (customer_line_id && customer_line_id.length > 50) {
    errors.customer_line_id = 'LINE ID ต้องไม่เกิน 50 ตัวอักษร';
  }

  if (message && message.length > 1000) {
    errors.message = 'ข้อความต้องไม่เกิน 1,000 ตัวอักษร';
  }

  if (!customer_phone && !customer_line_id) {
    errors.customer_phone = 'กรุณากรอกเบอร์โทรหรือ LINE ID อย่างน้อย 1 ช่องทาง';
    errors.customer_line_id = 'กรุณากรอกเบอร์โทรหรือ LINE ID อย่างน้อย 1 ช่องทาง';
  }

  if (Object.keys(errors).length > 0) {
    return { success: false, errors };
  }

  // Insert into leads table
  try {
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

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
