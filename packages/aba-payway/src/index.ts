import { createHmac, publicEncrypt, KeyLike, constants } from "crypto";
import { DateTime } from "luxon";

// TypeScript interfaces for checkout payment data
export interface CheckoutCustomerInfo {
  firstname: string;
  lastname: string;
  phone: string;
  email: string;
}

export interface CheckoutPaymentData {
  tranId: string;
  amount: string;
  customerInfo: CheckoutCustomerInfo;
  returnParams?: string;
}

export interface CheckoutFormData {
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

export interface CheckoutResponse {
  formData: CheckoutFormData;
  apiUrl: string;
}

class ABAPayWayClient {
  private base_url: string;
  private merchant_id: string;
  private api_key: string;
  private rsa_public_key: KeyLike;

  // PayWay checkout API URLs
  public static readonly SANDBOX_CHECKOUT_URL = 'https://checkout-sandbox.payway.com.kh/api/payment-gateway/v1/payments/purchase';
  public static readonly PRODUCTION_CHECKOUT_URL = 'https://checkout.payway.com.kh/api/payment-gateway/v1/payments/purchase';

  constructor(
    base_url: string,
    merchant_id: string,
    api_key: string,
    rsa_public_key: KeyLike
  ) {
    this.base_url = base_url;
    this.merchant_id = merchant_id;
    this.api_key = api_key;
    this.rsa_public_key = rsa_public_key;
  }

  private create_hash(values: string[]) {
    const data = values.join("");
    return createHmac("sha512", this.api_key).update(data).digest("base64");
  }

  /**
   * Creates a hash for checkout payment signature
   * @param values Array of values to hash in specific order
   * @returns Base64 encoded hash
   */
  public createCheckoutHash(values: string[]): string {
    const data = values.join("");
    const hmac = createHmac('sha512', this.api_key)
      .update(data)
      .digest();
    return Buffer.from(hmac).toString('base64');
  }

  /**
   * Generates checkout form data for PayWay payment
   * @param paymentData Payment and customer information
   * @param useSandbox Whether to use sandbox environment (default: true)
   * @returns Checkout response with form data and API URL
   */
  public createCheckoutPayment(paymentData: CheckoutPaymentData, useSandbox: boolean = true): CheckoutResponse {
    const now = DateTime.now().toUTC().toFormat('yyyyMMddHHmmss');
    const returnParams = paymentData.returnParams || '';

    // Build signature string exactly as PayWay expects
    const signatureValues = [
      now,
      this.merchant_id,
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
      merchant_id: this.merchant_id,
      req_time: now
    };

    const apiUrl = useSandbox ? ABAPayWayClient.SANDBOX_CHECKOUT_URL : ABAPayWayClient.PRODUCTION_CHECKOUT_URL;

    return {
      formData,
      apiUrl
    };
  }

  /**
   * Generates HTML form string for PayWay checkout
   * @param paymentData Payment and customer information
   * @param useSandbox Whether to use sandbox environment (default: true)
   * @returns HTML form string ready for submission
   */
  public generateCheckoutForm(paymentData: CheckoutPaymentData, useSandbox: boolean = true): string {
    const checkoutResponse = this.createCheckoutPayment(paymentData, useSandbox);
    const { formData, apiUrl } = checkoutResponse;

    return `
      <form id="aba_merchant_request" method="POST" target="aba_webservice" action="${apiUrl}">
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
    `;
  }

  public createPaymentLink(
    title: string,
    amount: number,
    currency: "KHR" | "USD",
    return_url: string,
    options?: {}
  ) {
    const merchant_authObj = {
      mc_id: this.merchant_id,
      title: title,
      amount: amount,
      currency: currency,
      expired_date: Math.round(
        DateTime.now().plus({ seconds: 120 }).toUTC().toSeconds()
      ),
      return_url: return_url,
    };

    const payload = {
      request_time: DateTime.now().toUTC().toFormat("yyyyMMddHHmmss"),
      merchant_id: this.merchant_id,
      merchant_auth: publicEncrypt(
        {
          key: this.rsa_public_key,
          padding: constants.RSA_PKCS1_PADDING,
        },
        JSON.stringify(merchant_authObj).substring(0, 117)
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
}

export default ABAPayWayClient;
export { ABAPayWayClient };
