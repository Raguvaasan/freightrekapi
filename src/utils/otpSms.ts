import axios from 'axios';

export interface SmsResult {
  success: boolean;
  message?: string;
}

export const generateOtp = (): string =>
  Math.floor(100000 + Math.random() * 900000).toString();

/** OTPs are valid for 5 minutes */
export const otpExpiry = (): Date => new Date(Date.now() + 5 * 60 * 1000);

/**
 * Send a login OTP over Ping4SMS.
 *
 * A stalled gateway must not hold the request until the serverless function is
 * killed — a killed function returns no CORS headers, which the browser reports
 * as a failed/CORS error instead of a timeout. Hence the explicit timeout.
 */
export const sendOtpSms = async (
  phone: string,
  countryCode: string,
  otp: string
): Promise<SmsResult> => {
  try {
    const apiKey = process.env.PING4SMS_API_KEY;
    const sender = process.env.PING4SMS_SENDER;
    const templateId = process.env.PING4SMS_TEMPLATE_ID;
    const route = process.env.PING4SMS_ROUTE || '2';
    const fullPhone = `${(countryCode || '').replace('+', '')}${phone}`;
    const message = `Your OTP for login is ${otp}. Do not share it with anyone. - FREIGHTREK`;
    const url = `https://site.ping4sms.com/api/smsapi?key=${apiKey}&route=${route}&sender=${sender}&number=${fullPhone}&sms=${encodeURIComponent(
      message
    )}&templateid=${templateId}`;

    const response = await axios.get(url, { timeout: 10000 });
    const body =
      typeof response.data === 'string' ? response.data : JSON.stringify(response.data);

    if (
      body.includes('-1') ||
      body.includes('-2') ||
      body.toLowerCase().includes('error') ||
      body.includes('INVALID')
    ) {
      return { success: false, message: `SMS sending failed: ${body}` };
    }

    return { success: true };
  } catch (error: any) {
    console.error('[Ping4SMS] OTP send failed:', {
      code: error?.code,
      status: error?.response?.status,
      message: error?.message,
    });

    // A timeout/refusal means the gateway was unreachable from the server, not
    // a problem with the caller's input — don't leak axios internals to the
    // login screen
    const isNetworkFailure =
      error?.code === 'ECONNABORTED' ||
      error?.code === 'ETIMEDOUT' ||
      error?.code === 'ECONNREFUSED' ||
      error?.code === 'ENOTFOUND' ||
      /timeout/i.test(error?.message || '');

    return {
      success: false,
      message: isNetworkFailure
        ? 'Unable to reach the SMS service right now. Please try again in a moment.'
        : error.message || 'Error sending OTP',
    };
  }
};
