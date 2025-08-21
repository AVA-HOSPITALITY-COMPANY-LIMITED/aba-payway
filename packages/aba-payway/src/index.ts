import { createHmac, publicEncrypt, KeyLike, constants } from "crypto";
import { DateTime } from "luxon";

export interface ABAPayWayConfig {
  baseUrl: string;
  merchantId: string;
  apiKey: string;
  rsaPublicKey?: KeyLike; // Optional - only required for payment link creation
  sandbox?: boolean; // defaults to true
}

export interface PaymentRequest {
  transactionId: string;
  amount: string;
  currency?: 'USD' | 'KHR'; // defaults to USD
  customer: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
  returnUrl?: string;
  returnParams?: string;
}

export interface PaymentResponse {
  success: boolean;
  transactionId: string;
  htmlForm: string;
  checkoutUrl: string;
  error?: string;
}

// Internal interfaces (not exported)
interface CheckoutCustomerInfo {
  firstname: string;
  lastname: string;
  phone: string;
  email: string;
}

interface CheckoutPaymentData {
  tranId: string;
  amount: string;
  customerInfo: CheckoutCustomerInfo;
  returnParams?: string;
}

interface CheckoutFormData {
  hash: string;
  tran_id: string;
  amount: string;
  firstname: string;
  lastname: string;
  phone: string;
  email: string;
  return_params: string;
  merchant_id: string;
  req_time: string;
}

interface CheckoutResponse {
  formData: CheckoutFormData;
  apiUrl: string;
}

// Internal ABA PayWay client class
class ABAPayWayClient {
  private readonly baseUrl: string;
  private readonly merchantId: string;
  private readonly apiKey: string;
  private readonly rsaPublicKey?: KeyLike;
  private readonly sandbox: boolean;



  constructor(config: ABAPayWayConfig) {
    this.baseUrl = config.baseUrl;
    this.merchantId = config.merchantId;
    this.apiKey = config.apiKey;
    this.rsaPublicKey = config.rsaPublicKey;
    this.sandbox = config.sandbox !== false; // Default to true
  }

  private create_hash(values: string[]) {
    const data = values.join("");
    return createHmac("sha512", this.apiKey).update(data).digest("base64");
  }

  /**
   * Creates a hash for checkout payment signature
   * @param values Array of values to hash in specific order
   * @returns Base64 encoded hash
   */
  private createCheckoutHash(values: string[]): string {
    const data = values.join("");
    const hmac = createHmac('sha512', this.apiKey)
      .update(data)
      .digest();
    return Buffer.from(hmac).toString('base64');
  }

  /**
   * Gets the appropriate checkout API URL based on configuration
   * Priority: 1) Environment variables, 2) baseUrl from config, 3) default URLs
   * @param useSandbox Whether to use sandbox environment
   * @returns The complete API URL for checkout
   */
  private getCheckoutApiUrl(useSandbox: boolean): string {
    // Check environment variables first
    const envUrl = useSandbox 
      ? process.env.ABA_SANDBOX_CHECKOUT_URL 
      : process.env.ABA_PRODUCTION_CHECKOUT_URL;
    
    if (envUrl) {
      return envUrl;
    }
    
    // If baseUrl is provided and looks like a complete URL, use it directly
    if (this.baseUrl && (this.baseUrl.startsWith('http://') || this.baseUrl.startsWith('https://'))) {
      // Remove trailing slash if present
      const cleanBaseUrl = this.baseUrl.replace(/\/$/, '');
      
      // If baseUrl already contains the full path, use it as-is
      if (cleanBaseUrl.includes('/api/payment-gateway/')) {
        return cleanBaseUrl;
      }
      
      // Otherwise, append the standard API path
      return `${cleanBaseUrl}/api/payment-gateway/v1/payments/purchase`;
    }
    
    // If baseUrl is a domain without protocol, construct the URL
    if (this.baseUrl && !this.baseUrl.startsWith('http')) {
      const protocol = 'https'; // Always use HTTPS for security
      const cleanBaseUrl = this.baseUrl.replace(/\/$/, '');
      
      // If baseUrl already contains the full path, use it with protocol
      if (cleanBaseUrl.includes('/api/payment-gateway/')) {
        return `${protocol}://${cleanBaseUrl}`;
      }
      
      // Otherwise, append the standard API path
      return `${protocol}://${cleanBaseUrl}/api/payment-gateway/v1/payments/purchase`;
    }
    
    // Fallback to default URLs if baseUrl is not provided or invalid
    return useSandbox 
      ? 'https://checkout-sandbox.payway.com.kh/api/payment-gateway/v1/payments/purchase'
      : 'https://checkout.payway.com.kh/api/payment-gateway/v1/payments/purchase';
  }

  /**
   * Generates checkout form data for PayWay payment
   * @param paymentData Payment and customer information
   * @param useSandbox Whether to use sandbox environment (default: true)
   * @returns Checkout response with form data and API URL
   */
  private createCheckoutPayment(paymentData: CheckoutPaymentData, useSandbox: boolean = true): CheckoutResponse {
    const now = DateTime.now().toUTC().toFormat('yyyyMMddHHmmss');
    const returnParams = paymentData.returnParams || '';

    // Build signature string exactly as PayWay expects
    const signatureValues = [
      now,
      this.merchantId,
      paymentData.tranId,
      paymentData.amount,
      paymentData.customerInfo.firstname,
      paymentData.customerInfo.lastname,
      paymentData.customerInfo.email,
      paymentData.customerInfo.phone,
      returnParams
    ];

    const hash = this.createCheckoutHash(signatureValues);

    const formData: CheckoutFormData = {
      hash,
      tran_id: paymentData.tranId,
      amount: paymentData.amount,
      firstname: paymentData.customerInfo.firstname,
      lastname: paymentData.customerInfo.lastname,
      phone: paymentData.customerInfo.phone,
      email: paymentData.customerInfo.email,
      return_params: returnParams,
      merchant_id: this.merchantId,
      req_time: now
    };

    const apiUrl = this.getCheckoutApiUrl(useSandbox);

    return {
      formData,
      apiUrl
    };
  }

  /**
   * Generates HTML form string for PayWay checkout
   * @param formData Pre-generated checkout form data
   * @param apiUrl Target API URL for form submission
   * @returns HTML form string with auto-submission enabled
   */
  private generateCheckoutForm(formData: CheckoutFormData, apiUrl: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Redirecting to ABA PayWay...</title>
        <style>
          body { font-family: Arial, sans-serif; text-align: center; padding: 50px; }
          .loading { font-size: 18px; color: #666; }
        </style>
      </head>
      <body>
        <div class="loading">Redirecting to ABA PayWay checkout...</div>
        <form id="aba_merchant_request" method="POST" action="${apiUrl}">
          <input type="hidden" name="hash" value="${formData.hash}" />
          <input type="hidden" name="tran_id" value="${formData.tran_id}" />
          <input type="hidden" name="amount" value="${formData.amount}" />
          <input type="hidden" name="firstname" value="${formData.firstname}" />
          <input type="hidden" name="lastname" value="${formData.lastname}" />
          <input type="hidden" name="phone" value="${formData.phone}" />
          <input type="hidden" name="email" value="${formData.email}" />
          <input type="hidden" name="return_params" value="${formData.return_params}" />
          <input type="hidden" name="merchant_id" value="${formData.merchant_id}" />
          <input type="hidden" name="req_time" value="${formData.req_time}" />
        </form>
        <script>
          document.addEventListener('DOMContentLoaded', function() {
            document.getElementById('aba_merchant_request').submit();
          });
        </script>
      </body>
      </html>
    `;
  }

  private createPaymentLink(
    title: string,
    amount: number,
    currency: "KHR" | "USD",
    return_url: string,
    options?: {}
  ) {
    const merchant_authObj = {
      mc_id: this.merchantId,
      title: title,
      amount: amount,
      currency: currency,
      expired_date: Math.round(
        DateTime.now().plus({ seconds: 120 }).toUTC().toSeconds()
      ),
      return_url: return_url,
    };

    if (!this.rsaPublicKey) {
      throw new Error('RSA public key is required for payment creation');
    }

    const payload = {
      request_time: DateTime.now().toUTC().toFormat("yyyyMMddHHmmss"),
      merchant_id: this.merchantId,
      merchant_auth: publicEncrypt(
        {
          key: this.rsaPublicKey,
          padding: constants.RSA_PKCS1_PADDING,
        },
        Buffer.from(JSON.stringify(merchant_authObj))
      ).toString("base64"),
    };

    const hash = this.create_hash([
      payload.request_time,
      payload.merchant_id,
      payload.merchant_auth,
    ]);

    const myHeaders = new Headers();
    myHeaders.append("Content-Type", "multipart/form-data");

    const formdata = new FormData();
    formdata.append("request_time", payload.request_time);
    formdata.append("merchant_id", payload.merchant_id);
    formdata.append("merchant_auth", payload.merchant_auth);
    formdata.append("hash", hash);

    const requestOptions = {
      method: "POST",
      headers: myHeaders,
      body: formdata,
      //  redirect: 'follow'
    };

    fetch(
      "https://checkout-sandbox.payway.com.kh/api/merchant-portal/merchant-access/payment-link/create",
      requestOptions
    )
      .then((response) => response.text())
      .then((result) => console.log(result))
      .catch((error) => console.log("error", error));
  }

  /**
   * Public method to create checkout payment and generate HTML form
   * This is the main entry point for external applications
   * @param paymentData Payment and customer information
   * @param useSandbox Whether to use sandbox environment (default: true)
   * @returns Object containing HTML form and checkout URL
   */
  public createCheckout(paymentData: CheckoutPaymentData, useSandbox: boolean = true): { htmlForm: string; checkoutUrl: string } {
    const checkoutResponse = this.createCheckoutPayment(paymentData, useSandbox);
    const htmlForm = this.generateCheckoutForm(checkoutResponse.formData, checkoutResponse.apiUrl);

    return {
      htmlForm,
      checkoutUrl: checkoutResponse.apiUrl
    };
  }
}

/**
 * Creates an ABA PayWay checkout form with auto-submission
 * @param config ABA PayWay configuration
 * @param payment Payment request details
 * @returns Payment response with HTML form for checkout
 */
export function createABACheckout(
  config: ABAPayWayConfig,
  payment: PaymentRequest
): PaymentResponse {
  try {
    // Validate required configuration for checkout
    if (!config.baseUrl || !config.merchantId || !config.apiKey) {
      throw new Error('Missing required ABA PayWay configuration: baseUrl, merchantId, and apiKey are required');
    }

    // Validate payment request
    if (!payment.transactionId || !payment.amount || !payment.customer) {
      throw new Error('Missing required payment data: transactionId, amount, and customer are required');
    }

    if (!payment.customer.firstName || !payment.customer.lastName || !payment.customer.email || !payment.customer.phone) {
      throw new Error('Missing required customer data: firstName, lastName, email, and phone are required');
    }

    // Create ABA PayWay client instance
    const client = new ABAPayWayClient(config);

    // Transform public API to internal format
    const checkoutData: CheckoutPaymentData = {
      tranId: payment.transactionId,
      amount: payment.amount,
      customerInfo: {
        firstname: payment.customer.firstName,
        lastname: payment.customer.lastName,
        email: payment.customer.email,
        phone: payment.customer.phone
      },
      returnParams: payment.returnParams || ''
    };

    // Use sandbox by default
    const useSandbox = config.sandbox !== false;

    // Generate checkout response and HTML form
    const checkoutResult = client.createCheckout(checkoutData, useSandbox);

    return {
      success: true,
      transactionId: payment.transactionId,
      htmlForm: checkoutResult.htmlForm,
      checkoutUrl: checkoutResult.checkoutUrl
    };
  } catch (error) {
    return {
      success: false,
      transactionId: payment.transactionId,
      htmlForm: '',
      checkoutUrl: '',
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

/**
 * Legacy class export for backward compatibility
 * @deprecated Use createABACheckout function instead
 */
export { ABAPayWayClient };

/**
 * Default export points to the simplified API function
 */
export default createABACheckout;