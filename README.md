# ABA PayWay

[![npm version](https://badge.fury.io/js/aba-payway.svg)]
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

A simple, TypeScript-first Node.js library for integrating with the ABA PayWay payment gateway.

## ✨ Features

- 🚀 **Simple & Synchronous** - One function call, instant response
- 📘 **TypeScript Support** - Full type safety and IntelliSense
- 🌐 **Universal** - Works in Node.js, React, Vue, Next.js, and browsers
- 🔒 **Secure** - Built-in HMAC-SHA512 signature generation
- 📦 **Lightweight** - Minimal dependencies

## 📦 Installation

```bash
npm install aba-payway
```

## 🚀 Quick Start

```javascript
import { createABACheckout } from "aba-payway";

// 1. Configure your merchant details
const abaConfig = {
  baseUrl: process.env.ABA_BASE_URL, // API endpoints
  checkoutUrl:
    process.env.ABA_CHECKOUT_URL ||
    "https://checkout-sandbox.payway.com.kh/api/payment-gateway/v1/payments/purchase",
  merchantId: process.env.ABA_MERCHANT_ID,
  apiKey: process.env.ABA_API_KEY,
};

// 2. Create payment request
const paymentRequest = {
  transactionId: "TXN_001",
  amount: "10.50",
  customer: {
    firstName: "John",
    lastName: "Doe",
    email: "john@example.com",
    phone: "+855123456789",
  },
  returnParams: "order_id=123&user_id=456",
};

// 3. Generate checkout (synchronous - no await needed!)
const payment = createABACheckout(abaConfig, paymentRequest);

// 4. Use the HTML form or redirect to checkout URL
if (payment.success) {
  // Option 1: Use auto-submit HTML form
  document.body.innerHTML = payment.htmlForm;

  // Option 2: Or redirect directly
  window.location.href = payment.checkoutUrl;
} else {
  console.error("Payment creation failed:", payment.error);
}
```

## 🔧 Environment Setup

Create a `.env` file:

```bash
ABA_CHECKOUT_URL=https://checkout-sandbox.payway.com.kh/api/payment-gateway/v1/payments/purchase  # For sandbox
# ABA_CHECKOUT_URL=https://checkout.payway.com.kh/api/payment-gateway/v1/payments/purchase  # For production
ABA_MERCHANT_ID=your_merchant_id_here
ABA_API_KEY=your_api_key_here
```

## 📖 API Reference

### `createABACheckout(config, paymentRequest)`

**Parameters:**

- `config.checkoutUrl` - **Required** - Checkout API endpoint URL
- `config.merchantId` - Your ABA PayWay merchant ID
- `config.apiKey` - Your ABA PayWay API key
- `paymentRequest.transactionId` - Unique transaction ID (string)
- `paymentRequest.amount` - Payment amount (string)
- `paymentRequest.customer` - Customer information object
- `paymentRequest.customer.firstName` - Customer first name
- `paymentRequest.customer.lastName` - Customer last name
- `paymentRequest.customer.email` - Customer email
- `paymentRequest.customer.phone` - Customer phone number
- `paymentRequest.returnParams` - Optional return parameters

**Returns:**

- `success` - Boolean indicating if checkout creation was successful
- `checkoutUrl` - Direct payment URL for user redirection
- `htmlForm` - Auto-submit HTML form for seamless checkout
- `transactionId` - Transaction ID from request
- `amount` - Payment amount
- `error` - Error message if creation failed

## 🛠️ Framework Integration

For detailed examples with specific frameworks:

📋 **[View Integration Examples →](./INTEGRATION_EXAMPLE.md)**

- **Backend:** Express.js (JavaScript & TypeScript)
- **Frontend:** React, Vue.js, Next.js, Vanilla JavaScript
- **Security:** Best practices and environment setup
- **Testing:** Development and production guidelines

## ⚡ TypeScript Support

```typescript
import { createABACheckout, ABAPayWayConfig, PaymentRequest } from "aba-payway";

const abaConfig: ABAPayWayConfig = {
  checkoutUrl:
    process.env.ABA_CHECKOUT_URL ||
    "https://checkout-sandbox.payway.com.kh/api/payment-gateway/v1/payments/purchase",
  merchantId: process.env.ABA_MERCHANT_ID!,
  apiKey: process.env.ABA_API_KEY!,
};

const request: PaymentRequest = {
  transactionId: `TXN_${Date.now()}`,
  amount: "25.99",
  customer: {
    firstName: "John",
    lastName: "Doe",
    email: "john@example.com",
    phone: "+855123456789",
  },
  returnParams: "order_id=123",
};

const payment = createABACheckout(abaConfig, request);
if (payment.success) {
  // Use payment.checkoutUrl or payment.htmlForm
}
```

## 🔒 Security Best Practices

- ✅ Keep API keys on server-side only
- ✅ Use HTTPS for all payment endpoints
- ✅ Validate payments on your backend
- ✅ Never expose credentials in frontend code

## 📞 Support

- 📖 [Integration Examples](./INTEGRATION_EXAMPLE.md)
- 🐛 [Report Issues](https://github.com/AVA-HOSPITALITY-COMPANY-LIMITED/aba-payway/issues)
- 📧 Contact: [support@ava-hospitality.com](mailto:support@ava-hospitality.com)

## Authors

- **Panhaboth Kun**
- **Sovichea Socheat**

---

**Made with ❤️ by [AVA Hospitality Company Limited](https://ava-hospitality.com)**
