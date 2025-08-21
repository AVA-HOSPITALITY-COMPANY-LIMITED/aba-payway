# ABA PayWay

[![npm version](https://badge.fury.io/js/aba-payway.svg)](https://badge.fury.io/js/aba-payway)
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
import { createABACheckout } from 'aba-payway';

// 1. Configure your merchant details
const abaConfig = {
  baseUrl: process.env.ABA_BASE_URL || '',
  merchantId: process.env.ABA_MERCHANT_ID,
  apiKey: process.env.ABA_API_KEY,
  sandbox: true // Use sandbox for testing
};

// 2. Create payment request
const paymentRequest = {
  amount: 10.50,
  orderId: 'ORDER_001',
  currency: 'USD',
  returnUrl: 'https://yoursite.com/success',
  cancelUrl: 'https://yoursite.com/cancel'
};

// 3. Generate checkout (synchronous - no await needed!)
const payment = createABACheckout(abaConfig, paymentRequest);

// 4. Redirect user to payment page
window.location.href = payment.checkoutUrl;
```

## 🔧 Environment Setup

Create a `.env` file:

```bash
ABA_BASE_URL=https://checkout-sandbox.payway.com.kh
ABA_MERCHANT_ID=your_merchant_id_here
ABA_API_KEY=your_api_key_here
```

## 📖 API Reference

### `createABACheckout(config, paymentRequest)`

**Parameters:**
- `config.baseUrl` - ABA PayWay API base URL
- `config.merchantId` - Your ABA PayWay merchant ID
- `config.apiKey` - Your ABA PayWay API key
- `config.sandbox` - Enable sandbox mode for testing
- `paymentRequest.amount` - Payment amount (number)
- `paymentRequest.orderId` - Unique order ID (string)
- `paymentRequest.currency` - Currency code ('USD', 'KHR')
- `paymentRequest.returnUrl` - Success redirect URL
- `paymentRequest.cancelUrl` - Cancel redirect URL

**Returns:**
- `checkoutUrl` - Direct payment URL for user redirection
- `form` - HTML form for embedding payment page
- `orderId` - Order ID from request
- `amount` - Payment amount
- `currency` - Payment currency

## 🛠️ Framework Integration

For detailed examples with specific frameworks:

📋 **[View Integration Examples →](./INTEGRATION_EXAMPLE.md)**

- **Backend:** Express.js (JavaScript & TypeScript)
- **Frontend:** React, Vue.js, Next.js, Vanilla JavaScript
- **Security:** Best practices and environment setup
- **Testing:** Development and production guidelines

## ⚡ TypeScript Support

```typescript
import { createABACheckout, ABAPayWayConfig, PaymentRequest } from 'aba-payway';

const abaConfig: ABAPayWayConfig = {
  baseUrl: process.env.ABA_BASE_URL || '',
  merchantId: process.env.ABA_MERCHANT_ID!,
  apiKey: process.env.ABA_API_KEY!,
  sandbox: true
};

const request: PaymentRequest = {
  amount: 25.99,
  orderId: `ORDER_${Date.now()}`,
  currency: 'USD',
  returnUrl: 'https://mystore.com/success',
  cancelUrl: 'https://mystore.com/cancel'
};

const payment = createABACheckout(abaConfig, request);
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
