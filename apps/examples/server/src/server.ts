import express from "express";
import ABAPayWayClient from "aba-payway";

const app = express();

app.get("/", (req, res) => {
  res.send("Server is running");
});

app.listen(5000, () => {
  console.log("Server is listening on port 5000");
});

app.post("/create-transaction", (req, res) => {
  // Here you would typically handle the transaction creation logic
  // For example, using the ABAPayWayClient to create a transaction
  //   const client = new ABAPayWayClient(
  //   "https://checkout-sandbox.payway.com.kh",
  //   merchant_id,
  //   "api_key",
  //   `-----BEGIN PUBLIC KEY----- ... -----END PUBLIC KEY-----`
  // );
  // client.createPaymentLink("Test", 2000, "KHR", "https://example.com/return");

  res.send(`
    <form action="..." method="POST" target="aba_webservice>
      <input type="hidden" name="request_time" value="...">
      <input type="hidden" name="merchant_id" value="...">
      <input type="hidden" name="merchant_auth" value="...">
      <input type="hidden" name="hash" value="...">
      <button type="submit">Pay Now</button>
    </form>
    <iframe name="aba_webservice" style="display:none;"></iframe>
    ...
    `);
});
