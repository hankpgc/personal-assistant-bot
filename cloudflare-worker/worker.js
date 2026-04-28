/**
 * Discord Bot Verification Worker
 *
 * 接收 Discord Interactions Endpoint 的請求，
 * 驗證 Ed25519 簽名，
 * 通過後轉發到 n8n Webhook。
 *
 * 環境變數：
 * - DISCORD_PUBLIC_KEY: Discord Application 的 Public Key
 * - N8N_WEBHOOK_URL: n8n 的 Webhook URL
 */

function hexToUint8Array(hex) {
  const arr = new Uint8Array(hex.length / 2);
  for (let i = 0; i < hex.length; i += 2) {
    arr[i / 2] = parseInt(hex.substring(i, i + 2), 16);
  }
  return arr;
}

async function verifyDiscordSignature(body, signature, timestamp, publicKey) {
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    'raw',
    hexToUint8Array(publicKey),
    { name: 'Ed25519', namedCurve: 'Ed25519' },
    false,
    ['verify']
  );

  return await crypto.subtle.verify(
    'Ed25519',
    key,
    hexToUint8Array(signature),
    encoder.encode(timestamp + body)
  );
}

export default {
  async fetch(request, env) {
    // 健康檢查
    if (request.method !== 'POST') {
      return new Response('Discord Bot Verify Worker is running', { status: 200 });
    }

    const signature = request.headers.get('x-signature-ed25519');
    const timestamp = request.headers.get('x-signature-timestamp');
    const body = await request.text();

    if (!signature || !timestamp) {
      return new Response('Missing required headers', { status: 401 });
    }

    // 驗證 Discord 簽名
    const isValid = await verifyDiscordSignature(
      body,
      signature,
      timestamp,
      env.DISCORD_PUBLIC_KEY
    );

    if (!isValid) {
      return new Response('Invalid signature', { status: 401 });
    }

    const parsed = JSON.parse(body);

    // Discord Ping 驗證（type: 1）
    if (parsed.type === 1) {
      return new Response(JSON.stringify({ type: 1 }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // 轉發到 n8n
    try {
      const n8nResponse = await fetch(env.N8N_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed)
      });

      const result = await n8nResponse.json();

      return new Response(JSON.stringify(result), {
        status: n8nResponse.status,
        headers: { 'Content-Type': 'application/json' }
      });
    } catch (error) {
      // n8n 連線失敗時回傳 Defer，避免 Discord 顯示錯誤
      return new Response(JSON.stringify({ type: 5 }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      });
    }
  }
};
