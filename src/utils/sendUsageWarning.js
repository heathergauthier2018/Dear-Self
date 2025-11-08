import emailjs from '@emailjs/browser';

// 🔐 EmailJS configuration
const SERVICE_ID = 'service_y0cjwtg';
const TEMPLATE_ID_10 = 'template_0e6z2b9';
const TEMPLATE_ID_1 = 'template_9pkyoep';
const PUBLIC_KEY = 'vDwC5nrOnxrBvM-P2';
const TO_EMAIL = 'heathergauthier18@gmail.com';

function sendUsageWarning(remaining) {
  let templateId = null;

  if (remaining === 10) {
    templateId = TEMPLATE_ID_10;
  } else if (remaining === 1 || remaining === 0) {
    templateId = TEMPLATE_ID_1;
  } else {
    return; // only send for 10 or 1/0
  }

  const templateParams = {
    to_email: TO_EMAIL,
    remaining_count: remaining,
  };

  emailjs
    .send(SERVICE_ID, templateId, templateParams, PUBLIC_KEY)
    .then(result => {
      console.log('⚠️ Notification sent:', result.text);
    })
    .catch(error => {
      console.error('🚨 Failed to send usage alert:', error);
    });
}

export default sendUsageWarning;
