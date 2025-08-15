import express from "express";
import ABAPayWayClient from "aba-payway";

const app = express();

app.get("/", (req, res) => {
  res.send("Server is running");
});

app.listen(5000, () => {
  console.log("Server is listening on port 5000");
});

const client = new ABAPayWayClient(
  process.env.ABA_MERCHANT_ID,
  process.env.ABA_API_KEY,
  process.env.ABA_RSA_PUBLIC_KEY
);

app.get("/create-transaction", (req, res) => {
  // Here you would typically handle the transaction creation logic
  // For example, using the ABAPayWayClient to create a transaction
  //   const client = new ABAPayWayClient(
  //   "https://checkout-sandbox.payway.com.kh",
  //   merchant_id,
  //   "api_key",
  //   `-----BEGIN PUBLIC KEY----- ... -----END PUBLIC KEY-----`
  // );
  // client.createPaymentLink("Test", 2000, "KHR", "https://example.com/return");

  const htmlString = client.createTransaction({
    tran_id: "tran1234",
    amount: "20",
    payer: {
      firstname: "John",
      lastname: "Doe",
      phone: "0123456789",
      email: "panhabothk@outlook.com",
    },
    return_params: "param1=value1&param2=value2",
    payment_option: "cards",
  });

  res.send(htmlString); // Send the HTML string as the response
});
