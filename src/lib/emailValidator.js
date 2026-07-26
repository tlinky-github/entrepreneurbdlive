/**
 * emailValidator.js — 100% Free Email Syntax, Disposable & DNS MX Record Verification
 */

const DISPOSABLE_DOMAINS = new Set([
  'mailinator.com', 'tempmail.com', 'temp-mail.org', '10minutemail.com',
  'guerrillamail.com', 'trashmail.com', 'yopmail.com', 'dispostable.com',
  'getairmail.com', 'throwawaymail.com', 'sharklasers.com', 'maildrop.cc',
  '0815.ru', '10minutemail.co.uk', '20minutemail.com', 'dropmail.me'
]);

export async function validateEmailAddress(email) {
  const cleanEmail = (email || '').trim().toLowerCase();

  // 1. Syntax & Format Validation
  const emailRegex = /^[a-zA-Z0-9._%+-]+@([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})$/;
  const match = cleanEmail.match(emailRegex);

  if (!cleanEmail || !match) {
    return {
      valid: false,
      reason: 'Please enter a valid email format (e.g. name@domain.com).'
    };
  }

  const domain = match[1];

  // 2. Disposable Email Check
  if (DISPOSABLE_DOMAINS.has(domain)) {
    return {
      valid: false,
      reason: 'Disposable/temporary email addresses are not accepted. Please use a permanent email address.',
      domain
    };
  }

  // 3. DNS MX Record Verification via Google Public DNS
  try {
    const googleDnsUrl = `https://dns.google/resolve?name=${encodeURIComponent(domain)}&type=MX`;
    const response = await fetch(googleDnsUrl);
    
    if (response.ok) {
      const data = await response.json();
      
      if (data.Status === 0 && data.Answer && data.Answer.length > 0) {
        return { valid: true, domain };
      }
      
      const aRecordUrl = `https://dns.google/resolve?name=${encodeURIComponent(domain)}&type=A`;
      const aResponse = await fetch(aRecordUrl);
      if (aResponse.ok) {
        const aData = await aResponse.json();
        if (aData.Status === 0 && aData.Answer && aData.Answer.length > 0) {
          return { valid: true, domain };
        }
      }

      return {
        valid: false,
        reason: `The email domain "${domain}" does not appear to have an active mail server (no MX records). Please check for typos.`,
        domain
      };
    }
  } catch (error) {
    console.warn('[emailValidator] DNS MX check error:', error);
  }

  return { valid: true, domain };
}
