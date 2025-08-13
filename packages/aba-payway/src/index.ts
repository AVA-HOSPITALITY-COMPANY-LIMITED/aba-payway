import { createHmac, publicEncrypt, KeyLike, constants } from "crypto";
import { DateTime } from "luxon";

class ABAPayWayClient {
  private base_url: string;
  private merchant_id: string;
  private api_key: string;
  private rsa_public_key: KeyLike;

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

  public createPaymentLink(
    title: string,
    amount: number,
    currency: "KHR" | "USD",
    return_url: string,
    options?: {}
  ) {
    const payload = Object.fromEntries(
      Object.entries({
        request_time: DateTime.now().toUTC().toFormat("yyyyMMddHHmmss"),
        merchant_id: this.merchant_id,
        merchant_auth: publicEncrypt(
          {
            key: this.rsa_public_key,
            padding: constants.RSA_PKCS1_PADDING,
          },
          JSON.stringify({
            mc_id: this.merchant_id,
            title: title,
            amount: amount,
            currency: currency,
            expired_date: null,
            return_url: return_url,
          }).substring(0, 117)
        ).toString(),
      }).filter(([k, v]) => v != null)
    );
    console.log({
      ...payload,
      hash: this.create_hash(Object.values(payload)),
    });
  }
}

const client = new ABAPayWayClient(
  "https://checkout-sandbox.payway.com.kh",
  "ec461403",
  "7561d98442d36c2259663b7cbdf22abf2dcf8c96",
  `-----BEGIN PUBLIC KEY-----
MIGfMA0GCSqGSIb3DQEBAQUAA4GNADCBiQKBgQDa4NkNVTZbFPmfXOco+mGufIKr
YIogDiptE0u6P/G+fe7iNtHgH5/Iz+aI79awI7dUEQ0PFdBrH9tzEvm366G+RE6X
KiHd03D+zs5ZMQaSHukIf6h0SMNDuJ3I0t/BEIQzEwz+rpkQ/gfZ7gNvLMEdDWqD
3S+TzCDVRgJ8jCI3jwIDAQAB
-----END PUBLIC KEY-----`
);

client.createPaymentLink(
  "Test Payment",
  1000,
  "KHR",
  "https://example.com/return"
);
