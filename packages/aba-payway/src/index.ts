import { createHmac, publicEncrypt, KeyLike, constants } from "crypto";
import { DateTime } from "luxon";

/**
 * PurchaseData represents user-specific purchase parameters that will be combined with library-specific parameters that is called into the downstream API.
 * It allows you to create purchases of the appropriate type, amount, etc.
 *
 * @interface PurchaseData
 * @property {string} tran_id - The transaction ID for the purchase.
 * @property {string} amount - The amount for the purchase.
 * @property {Object} payer - The payer's information.
 * @property {string} payer.firstname - The first name of the payer.
 * @property {string} payer.lastname - The last name of the payer.
 * @property {string} payer.phone - The phone number of the payer.
 * @property {string} payer.email - The email address of the payer.
 * @property {string} [return_params] - Optional return parameters for the transaction.
 * @property {string} [payment_option] - Optional payment option for the transaction (e
 */
export interface PurchaseData {
  tran_id: string;
  amount: string;
  payer?: {
    firstname?: string;
    lastname?: string;
    phone?: string;
    email?: string;
  };
  return_params?: string;
  payment_option?: string;
}

class ABAPayWayClient {
  private base_url: string;
  private merchant_id: string;
  private api_key: string;
  private rsa_public_key: KeyLike;

  constructor(
    merchant_id: string,
    api_key: string,
    rsa_public_key: KeyLike,
    base_url: string = "https://checkout-sandbox.payway.com.kh" // Default to sandbox URL
  ) {
    if (base_url.endsWith("/")) {
      base_url = base_url.slice(0, -1);
    }
    this.base_url = base_url;
    this.merchant_id = merchant_id;
    this.api_key = api_key;
    this.rsa_public_key = rsa_public_key;
  }

  private create_hash(values: (string | undefined)[]) {
    const data = values.join("");
    return createHmac("sha512", this.api_key).update(data).digest("base64");
  }

  public createTransaction(purchaseData: PurchaseData): string {
    const now = DateTime.now().toUTC().toFormat("yyyyMMddHHmmss");

    // Build signature string exactly as PayWay expects
    const signatureValues = [
      now,
      this.merchant_id,
      purchaseData.tran_id,
      purchaseData.amount,
      purchaseData.payer?.firstname || "",
      purchaseData.payer?.lastname || "",
      purchaseData.payer?.email || "",
      purchaseData.payer?.phone || "",
      purchaseData.payment_option || "",
      purchaseData.return_params || "",
    ];

    const hash = this.create_hash(signatureValues);

    const endpoint = "/api/payment-gateway/v1/payments/purchase";
    return `
      <form id="aba_merchant_request" method="POST" target="aba_webservice" action="${this.base_url}${endpoint}">
        <input type="hidden" name="hash" value="${hash}" />
        <input type="hidden" name="tran_id" value="${purchaseData.tran_id}" />
        <input type="hidden" name="amount" value="${purchaseData.amount}" />
        <input type="hidden" name="firstname" value="${purchaseData.payer?.firstname}" />
        <input type="hidden" name="lastname" value="${purchaseData.payer?.lastname}" />
        <input type="hidden" name="phone" value="${purchaseData.payer?.phone}" />
        <input type="hidden" name="email" value="${purchaseData.payer?.email}" />
        <input type="hidden" name="return_params" value="${purchaseData.return_params}" />
        <input type="hidden" name="merchant_id" value="${this.merchant_id}" />
        <input type="hidden" name="req_time" value="${now}" />
        <input type="hidden" name="payment_option" value="${purchaseData.payment_option}" />
      </form>
      <iframe name="aba_webservice"></iframe>
      <script>
        console.log("Submitting form to PayWay");
        document.getElementById("aba_merchant_request").submit();
      </script>
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
