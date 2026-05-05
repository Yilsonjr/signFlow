

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

async function verifySignature(payload: string, signature: string, secret: string): Promise<boolean> {
  const encoder = new TextEncoder();
  const keyData = encoder.encode(secret);
  const payloadData = encoder.encode(payload);

  const cryptoKey = await crypto.subtle.importKey(
    'raw',
    keyData,
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  );

  const sig = await crypto.subtle.sign('HMAC', cryptoKey, payloadData);
  const sigArray = Array.from(new Uint8Array(sig));
  const sigHex = sigArray.map((b: number) => b.toString(16).padStart(2, '0')).join('');

  return sigHex === signature.toLowerCase();
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const payload = await req.text();
    const signature = req.headers.get('x-signature') || '';
    const eventName = req.headers.get('x-event-name') || '';

    const supabaseUrl = Deno.env.get('SUPABASE_URL') ?? '';
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '';
    const webhookSecret = Deno.env.get('LEMONSQUEEZY_WEBHOOK_SECRET') ?? '';

    if (!supabaseUrl || !supabaseKey) {
      return new Response(
        JSON.stringify({ error: 'Missing Supabase credentials' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    if (webhookSecret) {
      const isValid = await verifySignature(payload, signature, webhookSecret);
      if (!isValid) {
        return new Response(
          JSON.stringify({ error: 'Invalid signature' }),
          { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    const supabase = createClient(supabaseUrl, supabaseKey);
    const body = JSON.parse(payload);
    const data = body.data;
    const attributes = data?.attributes || {};
    const customData = attributes.custom_data || {};
    const userId = customData.user_id || '';
    const plan = customData.plan || '';

    console.log(`Webhook received: ${eventName}, user: ${userId}, plan: ${plan}`);

    switch (eventName) {
      case 'subscription_created': {
        const subscriptionId = String(data.id);
        const endsAt = attributes.ends_at || attributes.renews_at;
        const planFromMeta = plan || (attributes.variant_name?.toLowerCase().includes('business') ? 'business' : 'pro');

        let findQuery = supabase.from('users').select('id');

        if (userId) {
          findQuery = findQuery.eq('user_id', userId);
        } else if (attributes.user_email) {
          findQuery = findQuery.eq('email', attributes.user_email);
        } else {
          break;
        }

        const { data: user } = await findQuery.single();

        if (user) {
          const endDate = endsAt ? new Date(endsAt) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

          await supabase
            .from('users')
            .update({
              plan: planFromMeta,
              lemon_subscription_id: subscriptionId,
              subscription_status: 'active',
              subscription_end_date: endDate.toISOString(),
              docs_used: 0
            })
            .eq('id', user.id);

          console.log(`Subscription activated for user ${user.id}, plan: ${planFromMeta}`);
        }
        break;
      }

      case 'subscription_payment_success': {
        const subscriptionId = String(data.id);
        const endsAt = attributes.ends_at || attributes.renews_at;

        const { data: user } = await supabase
          .from('users')
          .select('id')
          .eq('lemon_subscription_id', subscriptionId)
          .single();

        if (user) {
          const endDate = endsAt ? new Date(endsAt) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

          await supabase
            .from('users')
            .update({
              subscription_status: 'active',
              subscription_end_date: endDate.toISOString(),
              docs_used: 0
            })
            .eq('id', user.id);

          console.log(`Payment success for subscription ${subscriptionId}`);
        }
        break;
      }

      case 'subscription_cancelled': {
        const subscriptionId = String(data.id);

        const { data: user } = await supabase
          .from('users')
          .select('id')
          .eq('lemon_subscription_id', subscriptionId)
          .single();

        if (user) {
          await supabase
            .from('users')
            .update({ subscription_status: 'cancelled' })
            .eq('id', user.id);

          console.log(`Subscription cancelled for ${subscriptionId}`);
        }
        break;
      }

      case 'subscription_expired': {
        const subscriptionId = String(data.id);

        const { data: user } = await supabase
          .from('users')
          .select('id')
          .eq('lemon_subscription_id', subscriptionId)
          .single();

        if (user) {
          await supabase
            .from('users')
            .update({
              plan: 'free',
              lemon_subscription_id: null,
              subscription_status: 'expired',
              subscription_end_date: null
            })
            .eq('id', user.id);

          console.log(`Subscription expired for ${subscriptionId}`);
        }
        break;
      }

      case 'subscription_payment_failed': {
        const subscriptionId = String(data.id);

        const { data: user } = await supabase
          .from('users')
          .select('id')
          .eq('lemon_subscription_id', subscriptionId)
          .single();

        if (user) {
          await supabase
            .from('users')
            .update({ subscription_status: 'past_due' })
            .eq('id', user.id);

          console.log(`Payment failed for subscription ${subscriptionId}`);
        }
        break;
      }

      case 'subscription_paused': {
        const subscriptionId = String(data.id);

        const { data: user } = await supabase
          .from('users')
          .select('id')
          .eq('lemon_subscription_id', subscriptionId)
          .single();

        if (user) {
          await supabase
            .from('users')
            .update({ subscription_status: 'paused' })
            .eq('id', user.id);

          console.log(`Subscription paused for ${subscriptionId}`);
        }
        break;
      }

      case 'subscription_resumed': {
        const subscriptionId = String(data.id);

        const { data: user } = await supabase
          .from('users')
          .select('id')
          .eq('lemon_subscription_id', subscriptionId)
          .single();

        if (user) {
          await supabase
            .from('users')
            .update({ subscription_status: 'active' })
            .eq('id', user.id);

          console.log(`Subscription resumed for ${subscriptionId}`);
        }
        break;
      }

      case 'order_created': {
        const checkoutData = typeof attributes.checkout_data === 'string'
          ? JSON.parse(attributes.checkout_data)
          : attributes.checkout_data || {};

        const userIdFromOrder = checkoutData?.custom_data?.user_id || customData.user_id;

        if (userIdFromOrder) {
          const { data: user } = await supabase
            .from('users')
            .select('id, pay_per_use_credits')
            .eq('user_id', userIdFromOrder)
            .single();

          if (user) {
            const total = attributes.total || 0;
            const creditsAmount = total / 100;

            await supabase
              .from('users')
              .update({
                plan: 'payperuse',
                pay_per_use_credits: (user.pay_per_use_credits || 0) + creditsAmount
              })
              .eq('id', user.id);

            console.log(`Credits added: $${creditsAmount} for user ${user.id}`);
          }
        }
        break;
      }

      default:
        console.log(`Unhandled event: ${eventName}`);
    }

    return new Response(
      JSON.stringify({ received: true, event: eventName }),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Webhook error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
