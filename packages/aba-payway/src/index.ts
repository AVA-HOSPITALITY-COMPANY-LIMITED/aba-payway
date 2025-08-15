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
