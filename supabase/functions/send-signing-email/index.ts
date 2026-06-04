import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface SignerEmailPayload {
  signerName: string;
  signerEmail: string;
  signerCode: string;
  documentName: string;
  ownerName: string;
  appUrl: string;
}

function buildEmailHtml(payload: SignerEmailPayload): string {
  const { signerName, documentName, ownerName, signerCode, appUrl } = payload;
  const signingUrl = `${appUrl}/sign?code=${signerCode}`;

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Documento para firmar</title>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="560" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">

          <!-- Header -->
          <tr>
            <td style="background:#0f172a;padding:28px 40px;">
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background:#3b6ef5;border-radius:8px;padding:8px 12px;margin-right:10px;">
                    <span style="color:#fff;font-size:18px;font-weight:800;letter-spacing:-0.5px;">S</span>
                  </td>
                  <td style="padding-left:10px;">
                    <span style="color:#ffffff;font-size:20px;font-weight:700;">Sign</span><span style="color:#3b6ef5;font-size:20px;font-weight:700;">Flow</span>
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:40px 40px 32px;">
              <p style="margin:0 0 8px;color:#64748b;font-size:14px;font-weight:500;text-transform:uppercase;letter-spacing:0.5px;">Firma requerida</p>
              <h1 style="margin:0 0 20px;color:#0f172a;font-size:24px;font-weight:700;line-height:1.3;">
                Hola, ${signerName} 👋
              </h1>
              <p style="margin:0 0 24px;color:#475569;font-size:16px;line-height:1.6;">
                <strong style="color:#0f172a;">${ownerName}</strong> te ha enviado un documento para que lo firmes digitalmente.
              </p>

              <!-- Document Card -->
              <table width="100%" cellpadding="0" cellspacing="0" style="background:#f8fafc;border:1px solid #e2e8f0;border-radius:8px;margin-bottom:28px;">
                <tr>
                  <td style="padding:16px 20px;">
                    <table cellpadding="0" cellspacing="0">
                      <tr>
                        <td style="padding-right:14px;">
                          <div style="width:40px;height:40px;background:#eff6ff;border-radius:8px;display:flex;align-items:center;justify-content:center;">
                            <span style="font-size:20px;">📄</span>
                          </div>
                        </td>
                        <td>
                          <p style="margin:0 0 2px;color:#0f172a;font-weight:600;font-size:15px;">${documentName}</p>
                          <p style="margin:0;color:#64748b;font-size:13px;">Pendiente de firma</p>
                        </td>
                      </tr>
                    </table>
                  </td>
                </tr>
              </table>

              <!-- CTA Button -->
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center">
                    <a href="${signingUrl}"
                       style="display:inline-block;background:#2563eb;color:#ffffff;text-decoration:none;font-size:16px;font-weight:600;padding:14px 36px;border-radius:8px;letter-spacing:0.2px;">
                      ✍️ &nbsp; Firmar documento
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:28px 0 0;color:#94a3b8;font-size:13px;text-align:center;line-height:1.5;">
                O copia y pega este enlace en tu navegador:<br>
                <a href="${signingUrl}" style="color:#2563eb;word-break:break-all;">${signingUrl}</a>
              </p>
            </td>
          </tr>

          <!-- Divider -->
          <tr>
            <td style="padding:0 40px;">
              <div style="border-top:1px solid #e2e8f0;"></div>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:24px 40px;">
              <p style="margin:0 0 6px;color:#94a3b8;font-size:12px;line-height:1.5;">
                🔒 Este enlace es único y personal. No lo compartas con nadie.
              </p>
              <p style="margin:0;color:#94a3b8;font-size:12px;">
                Enviado por SignFlow · Firma digital segura
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const resendApiKey = Deno.env.get('RESEND_API_KEY');
    if (!resendApiKey) {
      return new Response(
        JSON.stringify({ error: 'RESEND_API_KEY not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const body = await req.json() as { signers: SignerEmailPayload[] };
    const { signers } = body;

    if (!signers || signers.length === 0) {
      return new Response(
        JSON.stringify({ error: 'No signers provided' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const results = await Promise.allSettled(
      signers
        .filter(s => s.signerEmail && s.signerEmail.trim() !== '')
        .map(async (signer) => {
          const html = buildEmailHtml(signer);

          const res = await fetch('https://api.resend.com/emails', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${resendApiKey}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              from: 'SignFlow <noreply@signflow.app>',
              to: signer.signerEmail,
              subject: `✍️ ${signer.ownerName} te envió un documento para firmar`,
              html,
            }),
          });

          if (!res.ok) {
            const err = await res.text();
            throw new Error(`Email to ${signer.signerEmail} failed: ${err}`);
          }

          console.log(`Email sent to ${signer.signerEmail} (code: ${signer.signerCode})`);
          return { email: signer.signerEmail, sent: true };
        })
    );

    const sent = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    return new Response(
      JSON.stringify({ sent, failed, results }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error sending emails:', error);
    return new Response(
      JSON.stringify({ error: String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
