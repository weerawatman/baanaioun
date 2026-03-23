export const runtime = 'edge';

import { env } from '@/config/env';
import { isValidPhoneNumber, isLengthInRange, isEmpty } from '@/shared/utils';

interface NotifyEmailParams {
  assetId: string;
  assetName: string;
  customerName: string;
  customerPhone: string;
  customerLineId: string;
  message: string;
}

async function sendEmailNotification(params: NotifyEmailParams): Promise<void> {
  try {
    const { resendApiKey, notificationEmail, fromEmail } = env.notification;
    if (!resendApiKey || !notificationEmail || !fromEmail) return;

    const listingUrl = `${env.app.url}/listings/${params.assetId}`;

    const html = `
      <div style="font-family:sans-serif;max-width:480px;margin:0 auto;padding:24px;">
        <h2 style="margin-top:0;color:#1a1a1a;">📬 มีคนสนใจทรัพย์สิน</h2>
        <table style="width:100%;border-collapse:collapse;">
          <tr><td style="padding:8px 0;color:#555;width:120px;">🏠 ทรัพย์สิน</td><td style="padding:8px 0;font-weight:600;">${params.assetName}</td></tr>
          <tr><td style="padding:8px 0;color:#555;">👤 ชื่อ</td><td style="padding:8px 0;">${params.customerName}</td></tr>
          ${params.customerPhone ? `<tr><td style="padding:8px 0;color:#555;">📞 เบอร์โทร</td><td style="padding:8px 0;">${params.customerPhone}</td></tr>` : ''}
          ${params.customerLineId ? `<tr><td style="padding:8px 0;color:#555;">💬 LINE ID</td><td style="padding:8px 0;">${params.customerLineId}</td></tr>` : ''}
          ${params.message ? `<tr><td style="padding:8px 0;color:#555;vertical-align:top;">📝 ข้อความ</td><td style="padding:8px 0;">${params.message}</td></tr>` : ''}
        </table>
        <a href="${listingUrl}" style="display:inline-block;margin-top:16px;padding:10px 20px;background:#e07b39;color:#fff;border-radius:8px;text-decoration:none;font-weight:600;">ดูประกาศ</a>
      </div>
    `;

    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [notificationEmail],
        subject: `📬 ${params.customerName} สนใจ: ${params.assetName}`,
        html,
      }),
    });
  } catch {
    // Notification failure must never break the form submission
  }
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export async function POST(request: Request): Promise<Response> {
  try {
    const formData = await request.formData();

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
      return Response.json({ success: false, errors });
    }

    const [insertRes, assetRes] = await Promise.all([
      fetch(`${env.supabase.url}/rest/v1/leads`, {
        method: 'POST',
        headers: {
          'apikey': env.supabase.anonKey,
          'Authorization': `Bearer ${env.supabase.anonKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal',
        },
        body: JSON.stringify({
          asset_id,
          customer_name,
          customer_phone: customer_phone || null,
          customer_line_id: customer_line_id || null,
          message: message || null,
        }),
      }),
      fetch(`${env.supabase.url}/rest/v1/public_assets?id=eq.${asset_id}&select=name&limit=1`, {
        headers: {
          'apikey': env.supabase.anonKey,
          'Authorization': `Bearer ${env.supabase.anonKey}`,
        },
      }),
    ]);

    if (!insertRes.ok) {
      return Response.json({ success: false, message: 'เกิดข้อผิดพลาดในการบันทึกข้อมูล กรุณาลองใหม่' });
    }

    const assetData = assetRes.ok ? (await assetRes.json() as { name: string }[]) : [];
    const assetName = assetData[0]?.name ?? 'ทรัพย์สิน';

    await sendEmailNotification({
      assetId: asset_id!,
      assetName,
      customerName: customer_name,
      customerPhone: customer_phone,
      customerLineId: customer_line_id,
      message,
    });

    return Response.json({ success: true, message: 'ส่งข้อมูลสำเร็จ เราจะติดต่อกลับโดยเร็วที่สุด' });
  } catch {
    return Response.json({ success: false, message: 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง' });
  }
}
