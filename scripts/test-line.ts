/**
 * Quick LINE Push Message test
 * Usage: npx tsx --env-file .env.local scripts/test-line.ts
 */

const token  = process.env.LINE_CHANNEL_ACCESS_TOKEN;
const userId = process.env.LINE_ADMIN_USER_ID;

if (!token || !userId) {
  console.error('❌  กรุณาตั้งค่า LINE_CHANNEL_ACCESS_TOKEN และ LINE_ADMIN_USER_ID ใน .env.local');
  process.exit(1);
}

const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

const text = [
  '🏠 มีลูกค้าใหม่สนใจทรัพย์สิน!',
  '',
  '🏡 ทรัพย์สิน: [TEST] บ้านทดสอบระบบ',
  '👤 ชื่อ: ทดสอบ ระบบแจ้งเตือน',
  '📱 เบอร์โทร: 0800000000',
  '💬 LINE ID: test_user',
  '📝 ข้อความ: นี่คือข้อความทดสอบจาก Baanaioun',
  '',
  `🔗 ${appUrl}/listings/00000000-0000-0000-0000-000000000000`,
].join('\n');

async function main() {
  console.log('📤 กำลังส่งข้อความทดสอบไปยัง LINE...\n');
  console.log('─'.repeat(50));
  console.log(text);
  console.log('─'.repeat(50) + '\n');

  const res = await fetch('https://api.line.me/v2/bot/message/push', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      to: userId,
      messages: [{ type: 'text', text }],
    }),
  });

  if (res.ok) {
    console.log('✅  ส่งสำเร็จ! ตรวจสอบ LINE ของคุณได้เลย');
  } else {
    const body = await res.text();
    console.error(`❌  LINE API ตอบกลับ ${res.status}: ${body}`);
    process.exit(1);
  }
}

main();
