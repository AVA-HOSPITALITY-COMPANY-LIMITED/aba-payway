import express from "express";
import cors from "cors";
import ABAPayWayClient from "aba-payway";

const app = express();

// Enable CORS for all origins
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Origin', 'X-Requested-With', 'Content-Type', 'Accept', 'Authorization']
}));

app.use(express.json());


app.get("/", (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>ABA PayWay Test</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 40px; text-align: center; }
        .link { display: inline-block; padding: 15px 30px; background: #007bff; color: white; text-decoration: none; border-radius: 5px; margin: 10px; }
        .link:hover { background: #0056b3; }
      </style>
    </head>
    <body>
      <h1>ABA PayWay Test Server</h1>
      <p>Environment: Sandbox | Port: 3000</p>
      <a href="/test-checkout" class="link">Test Checkout</a>
    </body>
    </html>
  `);
});



// Initialize ABA PayWay client
if (!process.env.ABA_MERCHANT_ID || !process.env.ABA_API_KEY) {
  throw new Error('Missing required environment variables: ABA_MERCHANT_ID and ABA_API_KEY');
}

const client = new ABAPayWayClient(
  process.env.ABA_BASE_URL,
  process.env.ABA_MERCHANT_ID,
  process.env.ABA_API_KEY,
  process.env.ABA_RSA_PUBLIC_KEY
);

// console.log('ABA PayWay initialized:', process.env.ABA_MERCHANT_ID);

// Test checkout endpoint
app.get("/test-checkout", (req, res) => {
  try {
    const paymentData = {
      tranId: Date.now().toString(),
      amount: "10.00",
      customerInfo: {
        firstname: "Panhaboth",
        lastname: "K",
        phone: "0123456789",
        email: "panhabothk@outlook.com",
      },
      returnParams: ""
    };

    const checkoutResponse = client.createCheckoutPayment(paymentData, true);
    const { formData, apiUrl } = checkoutResponse;

    res.send(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>ABA PayWay Checkout</title>
        <script src="https://ajax.googleapis.com/ajax/libs/jquery/2.2.4/jquery.min.js"></script>
        <style>
          body { font-family: Arial, sans-serif; margin: 40px; text-align: center; }
          button { background: #007bff; color: white; padding: 15px 30px; border: none; border-radius: 5px; cursor: pointer; font-size: 16px; }
          button:hover { background: #0056b3; }
          #aba_webservice { position: fixed; top: 10%; left: 10%; width: 80%; height: 80%; border: 1px solid #ccc; display: none; z-index: 9999; }
          .info { background: #f8f9fa; padding: 15px; margin: 20px 0; border-radius: 5px; }
        </style>
      </head>
      <body>
        <h1>ABA PayWay Checkout</h1>
        <div class="info">
          <p><strong>Amount:</strong> $${paymentData.amount}</p>
          <p><strong>Transaction:</strong> ${paymentData.tranId}</p>
        </div>
        
        <button id="checkout_button">Pay Now</button>
        <p><a href="/">← Back</a></p>
        
        <div style="display: none">
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
        </div>
        <iframe id="aba_webservice" name="aba_webservice"></iframe>
        
        <script>
          $("#checkout_button").click(function() {
            $("#aba_merchant_request").submit();
            $("#aba_webservice").show();
          });
        </script>
      </body>
      </html>
    `);
  } catch (error) {
    res.status(500).send(`<h1>Error</h1><p>${error.message}</p><a href="/">← Back</a>`);
  }
});

// Payment callbacks
app.get("/payment-success", (req, res) => {
  res.send(`<h1>Payment Successful!</h1><p><a href="/">← Back</a></p>`);
});

app.get("/payment-cancel", (req, res) => {
  res.send(`<h1>Payment Cancelled</h1><p><a href="/">← Back</a></p>`);
});

// API endpoint for creating transactions
app.post("/create-transaction", (req, res) => {
  try {
    const { amount, customerInfo, tranId } = req.body;

    if (!amount || !customerInfo?.firstname || !customerInfo?.lastname || !customerInfo?.email || !customerInfo?.phone) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return res.status(400).json({ error: "Invalid amount" });
    }

    const paymentData = {
      tranId: tranId || Date.now().toString(),
      amount: numAmount.toFixed(2),
      customerInfo: {
        firstname: customerInfo.firstname.trim(),
        lastname: customerInfo.lastname.trim(),
        phone: customerInfo.phone.trim(),
        email: customerInfo.email.trim(),
      },
      returnParams: ""
    };

    const checkoutResponse = client.createCheckoutPayment(paymentData, true);

    res.json({
      success: true,
      transactionId: paymentData.tranId,
      checkoutResponse,
      htmlForm: client.generateCheckoutForm(paymentData, true)
    });

  } catch (error) {
    console.error("Transaction error:", error.message);
    res.status(500).json({ error: "Failed to create transaction", message: error.message });
  }
});



app.listen(3000, () => {
  console.log("Server is listening on port 3000");
  console.log("Visit http://localhost:3000 to test the ABA PayWay integration");
});
