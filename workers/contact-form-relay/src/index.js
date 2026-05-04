const TURNSTILE_SITEVERIFY_URL = 'https://challenges.cloudflare.com/turnstile/v0/siteverify';
const DEFAULT_ALLOWED_ORIGINS = [
  'https://artisthegame.com',
  'https://www.artisthegame.com',
  'https://runstop.github.io',
];
const URL_LIKE_PATTERN = /\b(?:https?:\/\/|www\.|href\s*=|\[\/?url\b)/i;
const MAX_FIELD_LENGTH = 10000;

export default {
  async fetch(request, env) {
    const origin = request.headers.get('Origin') || '';
    const allowedOrigins = getAllowedOrigins(env);
    const corsOrigin = allowedOrigins.has(origin) ? origin : [...allowedOrigins][0];

    if (request.method === 'OPTIONS') {
      return new Response(null, {
        status: 204,
        headers: corsHeaders(corsOrigin),
      });
    }

    if (request.method !== 'POST') {
      return json({ ok: false, error: 'Method not allowed' }, 405, corsOrigin);
    }

    if (!allowedOrigins.has(origin)) {
      return json({ ok: false, error: 'Forbidden origin' }, 403, corsOrigin);
    }

    let formData;
    try {
      formData = await request.formData();
    } catch (_error) {
      return json({ ok: false, error: 'Invalid form data' }, 400, corsOrigin);
    }

    const formType = getString(formData, 'form_type');
    if (!['contact', 'feedback', 'newsletter'].includes(formType)) {
      return json({ ok: false, error: 'Unknown form type' }, 400, corsOrigin);
    }

    if (hasFilledHoneypot(formData) || hasBlockedContent(formData, env)) {
      return json({ ok: true }, 200, corsOrigin);
    }

    const token = getString(formData, 'cf-turnstile-response');
    if (!token) {
      return json({ ok: false, error: 'Missing Turnstile token' }, 400, corsOrigin);
    }

    const turnstileResult = await verifyTurnstileToken(token, request, env);
    if (!turnstileResult.success) {
      return json(
        {
          ok: false,
          error: 'Turnstile validation failed',
          details: turnstileResult['error-codes'] || [],
        },
        403,
        corsOrigin
      );
    }

    const formSubmitUrl = env.FORM_SUBMIT_ENDPOINT;
    if (!formSubmitUrl) {
      return json({ ok: false, error: 'Email relay is not configured' }, 500, corsOrigin);
    }

    const relayData = buildFormSubmitPayload(formData, formType);
    const formSubmitResponse = await fetch(formSubmitUrl, {
      method: 'POST',
      body: relayData,
      headers: {
        Accept: 'application/json',
      },
    });

    if (!formSubmitResponse.ok) {
      return json({ ok: false, error: 'Email relay failed' }, 502, corsOrigin);
    }

    return json({ ok: true }, 200, corsOrigin);
  },
};

function getAllowedOrigins(env) {
  const configuredOrigins = (env.ALLOWED_ORIGINS || '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  return new Set(configuredOrigins.length > 0 ? configuredOrigins : DEFAULT_ALLOWED_ORIGINS);
}

function getString(formData, fieldName) {
  const value = formData.get(fieldName);
  return typeof value === 'string' ? value.trim() : '';
}

function hasFilledHoneypot(formData) {
  return Boolean(getString(formData, '_honey') || getString(formData, 'website'));
}

function hasBlockedContent(formData, env) {
  const blockedPhrases = getBlockedPhrases(env);

  for (const [fieldName, fieldValue] of formData.entries()) {
    if (fieldName.startsWith('_') || fieldName === 'cf-turnstile-response') continue;
    if (typeof fieldValue !== 'string') continue;

    const normalizedValue = fieldValue.trim().toLowerCase();
    if (normalizedValue.length > MAX_FIELD_LENGTH) return true;
    if (URL_LIKE_PATTERN.test(normalizedValue)) return true;
    if (blockedPhrases.some((phrase) => normalizedValue.includes(phrase))) return true;
  }

  return false;
}

function getBlockedPhrases(env) {
  return (env.CONTENT_BLOCKLIST || '')
    .split(',')
    .map((phrase) => phrase.trim().toLowerCase())
    .filter(Boolean);
}

async function verifyTurnstileToken(token, request, env) {
  const verifyData = new FormData();
  verifyData.append('secret', env.TURNSTILE_SECRET_KEY);
  verifyData.append('response', token);

  const ip = request.headers.get('CF-Connecting-IP');
  if (ip) {
    verifyData.append('remoteip', ip);
  }

  const response = await fetch(TURNSTILE_SITEVERIFY_URL, {
    method: 'POST',
    body: verifyData,
  });

  if (!response.ok) {
    return {
      success: false,
      'error-codes': ['siteverify-request-failed'],
    };
  }

  return response.json();
}

function buildFormSubmitPayload(formData, formType) {
  const payload = new FormData();

  for (const [fieldName, fieldValue] of formData.entries()) {
    if (
      fieldName === 'cf-turnstile-response' ||
      fieldName === 'form_type' ||
      fieldName === 'website' ||
      fieldName === '_honey' ||
      fieldName === '_subject' ||
      fieldName === '_captcha' ||
      fieldName === '_template'
    ) {
      continue;
    }

    if (typeof fieldValue === 'string') {
      payload.append(fieldName, fieldValue.slice(0, MAX_FIELD_LENGTH));
    }
  }

  payload.append('_subject', getSubjectForFormType(formType));
  payload.append('_captcha', 'false');
  payload.append('_template', 'table');
  payload.append('submission_relay', 'cloudflare-worker');

  return payload;
}

function getSubjectForFormType(formType) {
  if (formType === 'feedback') return 'Headzone Feedback Survey';
  if (formType === 'newsletter') return 'Artisthegame Newsletter Signup';
  return 'Artisthegame Support Form';
}

function corsHeaders(origin) {
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    Vary: 'Origin',
  };
}

function json(body, status, origin) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...corsHeaders(origin),
    },
  });
}
