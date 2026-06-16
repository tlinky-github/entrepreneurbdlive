import { getFirestore, env, isClientDb, getServerTimestamp } from '../../lib/firebaseAdmin.js';

export const ALL = async ({ request }) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'POST,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    'Content-Type': 'application/json'
  };

  if (request.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  if (request.method !== 'POST') {
    return new Response(JSON.stringify({ success: false, error: 'Method not allowed' }), { status: 405, headers: corsHeaders });
  }

  try {
    const body = await request.json();
    const { token, commentData } = body;
    const secretKey = env('TURNSTILE_SECRET_KEY');

    if (!token) {
      return new Response(JSON.stringify({ success: false, error: 'Captcha token is missing' }), { status: 400, headers: corsHeaders });
    }

    if (!secretKey) {
      console.error('Missing TURNSTILE_SECRET_KEY environment variable');
      return new Response(JSON.stringify({ success: false, error: 'Server configuration error' }), { status: 500, headers: corsHeaders });
    }

    // Verify Turnstile Token with Cloudflare
    const verifyUrl = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
    const verifyRes = await fetch(verifyUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `secret=${encodeURIComponent(secretKey)}&response=${encodeURIComponent(token)}`
    });

    const verification = await verifyRes.json();

    if (!verification.success) {
      console.error('Turnstile verification failed:', verification['error-codes']);
      return new Response(JSON.stringify({ 
        success: false, 
        error: 'Captcha verification failed',
        details: verification['error-codes']
      }), { status: 400, headers: corsHeaders });
    }

    const db = getFirestore();

    const docRef = await db.collection('comments').add({
      ...commentData,
      created_at: getServerTimestamp(),
    });

    return new Response(JSON.stringify({ 
      success: true, 
      id: docRef.id,
      message: 'Comment posted successfully'
    }), { status: 200, headers: corsHeaders });

  } catch (error) {
    console.error('Error processing comment:', error);
    return new Response(JSON.stringify({ success: false, error: 'Internal server error' }), { status: 500, headers: corsHeaders });
  }
};
