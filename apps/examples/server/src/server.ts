import express from "express";
import cors from "cors";
import { createABACheckout, ABAPayWayConfig, PaymentRequest } from "aba-payway";

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
      <title>ABA PayWay Simplified API Demo</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 40px; text-align: center; }
        .link { display: inline-block; padding: 15px 30px; background: #007bff; color: white; text-decoration: none; border-radius: 5px; margin: 10px; }
        .link:hover { background: #0056b3; }
        .info { background: #f8f9fa; padding: 20px; margin: 20px 0; border-radius: 5px; }
      </style>
    </head>
    <body>
      <h1>ABA PayWay Simplified API Demo</h1>
      <div class="info">
        <p><strong>Environment:</strong> Sandbox </p>
        <p>Demonstrating the <code>createABACheckout()</code> function</p>
      </div>
      <a href="/test-checkout" class="link">Checkout Demo</a>
    </body>
    </html>
  `);
});



// Initialize ABA PayWay configuration
if (!process.env.ABA_MERCHANT_ID || !process.env.ABA_API_KEY) {
  throw new Error('Missing required environment variables: ABA_MERCHANT_ID and ABA_API_KEY');
}

const abaConfig: ABAPayWayConfig = {
  baseUrl: process.env.ABA_BASE_URL || '',
  merchantId: process.env.ABA_MERCHANT_ID,
  apiKey: process.env.ABA_API_KEY,
  sandbox: true // Use sandbox for testing
};

console.log('ABA PayWay configured for merchant:', process.env.ABA_MERCHANT_ID);

// Test checkout endpoint using createABACheckout - Auto-submit
app.get("/test-checkout", async (req, res) => {
  try {
    const paymentRequest: PaymentRequest = {
      transactionId: Date.now().toString(),
      amount: "10.00",
      customer: {
        firstName: "Panhaboth",
        lastName: "K",
        phone: "0123456789",
        email: "panhabothk@outlook.com",
      },
      returnParams: ""
    };

    const result = await createABACheckout(abaConfig, paymentRequest);

    if (!result.success) {
      throw new Error(result.error || 'Failed to create checkout');
    }

    // createABACheckout handles auto-submit internally
    res.send(result.htmlForm);
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
// API endpoint demonstrating createABACheckout function
app.post("/create-transaction", async (req, res) => {
  try {
    const { amount, customerInfo, tranId } = req.body;

    if (!amount || !customerInfo?.firstname || !customerInfo?.lastname || !customerInfo?.email || !customerInfo?.phone) {
      return res.status(400).json({ error: "Missing required fields" });
    }

    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return res.status(400).json({ error: "Invalid amount" });
    }

    const paymentRequest: PaymentRequest = {
      transactionId: tranId || Date.now().toString(),
      amount: numAmount.toFixed(2),
      customer: {
        firstName: customerInfo.firstname.trim(),
        lastName: customerInfo.lastname.trim(),
        phone: customerInfo.phone.trim(),
        email: customerInfo.email.trim(),
      },
      returnParams: ""
    };

    const result = await createABACheckout(abaConfig, paymentRequest);

    if (!result.success) {
      return res.status(400).json({
        error: "Failed to create checkout",
        message: result.error
      });
    }

    res.json({
      success: true,
      transactionId: result.transactionId,
      checkoutUrl: result.checkoutUrl,
      htmlForm: result.htmlForm
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
