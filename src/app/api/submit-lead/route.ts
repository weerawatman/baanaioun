export const runtime = 'edge';

import { after } from 'next/server';
import { env } from '@/config/env';
import { isValidPhoneNumber, isLengthInRange, isEmpty } from '@/shared/utils';

async function verifyTurnstile(token: string, ip: string): Promise<boolean> {
  // Skip verification in development — Turnstile site keys are domain-locked
  // and will not render on localhost, so no token is ever submitted
  if (env.app.isDev) return true;

  const body = new URLSearchParams({
    secret: env.turnstile.secretKey,
    response: token,
    remoteip: ip,
  });

  try {
    const res = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: body.toString(),
    });
    const data = await res.json() as { success: boolean };
    return data.success === true;
  } catch {
    return false;
  }
}

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

    const html = `<!DOCTYPE html>
<html lang="th">
<head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f5f5f5;">
  <div style="font-family:sans-serif;max-width:480px;margin:24px auto;padding:24px;background:#fff;border-radius:12px;">
    <h2 style="margin-top:0;color:#1a1a1a;">&#128236; มีคนสนใจทรัพย์สิน</h2>
    <table style="width:100%;border-collapse:collapse;">
      <tr><td style="padding:8px 0;color:#555;width:120px;">&#127968; ทรัพย์สิน</td><td style="padding:8px 0;font-weight:600;">${params.assetName}</td></tr>
      <tr><td style="padding:8px 0;color:#555;">&#128100; ชื่อ</td><td style="padding:8px 0;">${params.customerName}</td></tr>
      ${params.customerPhone ? `<tr><td style="padding:8px 0;color:#555;">&#128222; เบอร์โทร</td><td style="padding:8px 0;">${params.customerPhone}</td></tr>` : ''}
      ${params.customerLineId ? `<tr><td style="padding:8px 0;color:#555;">&#128172; LINE ID</td><td style="padding:8px 0;">${params.customerLineId}</td></tr>` : ''}
      ${params.message ? `<tr><td style="padding:8px 0;color:#555;vertical-align:top;">&#128221; ข้อความ</td><td style="padding:8px 0;">${params.message}</td></tr>` : ''}
    </table>
    <a href="${listingUrl}" style="display:inline-block;margin-top:16px;padding:10px 20px;background:#e07b39;color:#fff;border-radius:8px;text-decoration:none;font-weight:600;">ดูประกาศ</a>
  </div>
</body>
</html>`;

    await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [notificationEmail],
        subject: `[Baanaioun] ${params.customerName} สนใจ: ${params.assetName}`,
        html,
      }),
    });
  } catch {
    // Notification failure must never break the form submission
  }
}

async function sendLineNotification(params: NotifyEmailParams): Promise<void> {
  try {
    const { channelAccessToken, adminUserId } = env.line;
    if (!channelAccessToken || !adminUserId) return;

    const listingUrl = `${env.app.url}/listings/${params.assetId}`;

    const lines = [
      '🏠 มีลูกค้าใหม่สนใจทรัพย์สิน!',
      '',
      `🏡 ทรัพย์สิน: ${params.assetName}`,
      `👤 ชื่อ: ${params.customerName}`,
      params.customerPhone  ? `📱 เบอร์โทร: ${params.customerPhone}`  : null,
      params.customerLineId ? `💬 LINE ID: ${params.customerLineId}`   : null,
      params.message        ? `📝 ข้อความ: ${params.message}`          : null,
      '',
      `🔗 ${listingUrl}`,
    ].filter((l): l is string => l !== null);

    await fetch('https://api.line.me/v2/bot/message/push', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${channelAccessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: adminUserId,
        messages: [{ type: 'text', text: lines.join('\n') }],
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

    // Verify Turnstile token before processing the form
    const turnstileToken = formData.get('cf-turnstile-response') as string | null;
    const ip = request.headers.get('CF-Connecting-IP') ?? request.headers.get('X-Forwarded-For') ?? '';
    if (!turnstileToken || !(await verifyTurnstile(turnstileToken, ip))) {
      return Response.json({ success: false, message: 'การยืนยันตัวตนล้มเหลว กรุณาลองใหม่อีกครั้ง' }, { status: 400 });
    }

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

    const notifyParams: NotifyEmailParams = {
      assetId: asset_id!,
      assetName,
      customerName: customer_name,
      customerPhone: customer_phone,
      customerLineId: customer_line_id,
      message,
    };

    // Fire notifications after the response is sent — does not block the user
    after(async () => {
      await Promise.all([
        sendEmailNotification(notifyParams),
        sendLineNotification(notifyParams),
      ]);
    });

    return Response.json({ success: true, message: 'ส่งข้อมูลสำเร็จ เราจะติดต่อกลับโดยเร็วที่สุด' });
  } catch {
    return Response.json({ success: false, message: 'เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง' });
  }
}
