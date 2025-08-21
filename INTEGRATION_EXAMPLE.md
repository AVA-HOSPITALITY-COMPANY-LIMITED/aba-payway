# ABA PayWay Integration Examples

This guide shows you how to integrate the ABA PayWay library into both backend (Express.js) and frontend applications. The library provides a simple, synchronous API that works seamlessly across different environments.

## Installation

```bash
npm install aba-payway
```

## Environment Variables Setup

Create a `.env` file in your project root:

```bash
# Backend Configuration (Node.js/Express)
ABA_BASE_URL=https://checkout-sandbox.payway.com.kh
ABA_CHECKOUT_URL=https://checkout-sandbox.payway.com.kh/api/payment-gateway/v1/payments/purchase
ABA_MERCHANT_ID=your_merchant_id_here
ABA_API_KEY=your_api_key_here

# Frontend Configuration (Next.js)
NEXT_PUBLIC_ABA_BASE_URL=https://checkout-sandbox.payway.com.kh
NEXT_PUBLIC_ABA_CHECKOUT_URL=https://checkout-sandbox.payway.com.kh/api/payment-gateway/v1/payments/purchase
NEXT_PUBLIC_ABA_MERCHANT_ID=your_merchant_id_here
NEXT_PUBLIC_ABA_API_KEY=your_api_key_here

# Frontend Configuration (React)
REACT_APP_ABA_BASE_URL=https://checkout-sandbox.payway.com.kh
REACT_APP_ABA_CHECKOUT_URL=https://checkout-sandbox.payway.com.kh/api/payment-gateway/v1/payments/purchase
REACT_APP_ABA_MERCHANT_ID=your_merchant_id_here
REACT_APP_ABA_API_KEY=your_api_key_here

# Frontend Configuration (Vue.js)
VUE_APP_ABA_BASE_URL=https://checkout-sandbox.payway.com.kh
VUE_APP_ABA_CHECKOUT_URL=https://checkout-sandbox.payway.com.kh/api/payment-gateway/v1/payments/purchase
VUE_APP_ABA_MERCHANT_ID=your_merchant_id_here
VUE_APP_ABA_API_KEY=your_api_key_here

# Production URLs (replace sandbox URLs when going live)
# ABA_CHECKOUT_URL=https://checkout.payway.com.kh/api/payment-gateway/v1/payments/purchase
# ABA_BASE_URL=https://checkout.payway.com.kh

```

## Express Backend Integration

### Express with TypeScript

```typescript
import express, { Request, Response } from "express";
import { createABACheckout, ABAPayWayConfig, PaymentRequest } from "aba-payway";

const app = express();
app.use(express.json());

const abaConfig: ABAPayWayConfig = {
  baseUrl: process.env.ABA_BASE_URL,
  checkoutUrl:
    process.env.ABA_CHECKOUT_URL ||
    "https://checkout-sandbox.payway.com.kh/api/payment-gateway/v1/payments/purchase",
  merchantId: process.env.ABA_MERCHANT_ID!,
  apiKey: process.env.ABA_API_KEY!,
};

interface CreatePaymentBody {
  amount: string;
  transactionId: string;
  customer: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
  returnParams?: string;
}

app.post(
  "/create-payment",
  (req: Request<{}, {}, CreatePaymentBody>, res: Response) => {
    try {
      const { amount, transactionId, customer, returnParams } = req.body;

      const paymentRequest: PaymentRequest = {
        transactionId,
        amount,
        customer,
        returnParams,
      };

      const paymentResponse = createABACheckout(abaConfig, paymentRequest);

      if (paymentResponse.success) {
        res.json({
          success: true,
          checkoutUrl: paymentResponse.checkoutUrl,
          htmlForm: paymentResponse.htmlForm,
          transactionId: paymentResponse.transactionId,
        });
      } else {
        res.status(400).json({
          success: false,
          error: paymentResponse.error,
        });
      }
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  }
);
```

## Frontend Integration

### Basic Usage

```javascript
import { createABACheckout } from "aba-payway";

const abaConfig = {
  baseUrl: process.env.ABA_BASE_URL,
  checkoutUrl:
    process.env.ABA_CHECKOUT_URL ||
    "https://checkout-sandbox.payway.com.kh/api/payment-gateway/v1/payments/purchase",
  merchantId: process.env.ABA_MERCHANT_ID,
  apiKey: process.env.ABA_API_KEY,
};

const paymentRequest = {
  transactionId: "TXN_001",
  amount: "10.50",
  customer: {
    firstName: "John",
    lastName: "Doe",
    email: "john@example.com",
    phone: "+855123456789",
  },
  returnParams: "order_id=123",
};

const paymentResponse = createABACheckout(abaConfig, paymentRequest);
if (paymentResponse.success) {
  console.log(paymentResponse.checkoutUrl); // Direct access to checkout URL
  // Or use the HTML form: document.body.innerHTML = paymentResponse.htmlForm;
}
```

## Frontend Integration Examples

### 1. React Component

```jsx
import React, { useState } from "react";
import { createABACheckout } from "aba-payway";

function CheckoutButton({ amount, transactionId, customer }) {
  const [loading, setLoading] = useState(false);

  const handleCheckout = () => {
    setLoading(true);

    try {
      const abaConfig = {
        baseUrl: process.env.REACT_APP_ABA_BASE_URL,
        checkoutUrl:
          process.env.REACT_APP_ABA_CHECKOUT_URL ||
          "https://checkout-sandbox.payway.com.kh/api/payment-gateway/v1/payments/purchase",
        merchantId: process.env.REACT_APP_ABA_MERCHANT_ID,
        apiKey: process.env.REACT_APP_ABA_API_KEY,
      };

      const paymentRequest = {
        transactionId: transactionId || `TXN_${Date.now()}`,
        amount: amount.toString(),
        customer,
        returnParams: `return_url=${encodeURIComponent(
          window.location.origin + "/payment/success"
        )}`,
      };

      const paymentResponse = createABACheckout(abaConfig, paymentRequest);

      if (paymentResponse.success) {
        // Option 1: Redirect to checkout page
        window.location.href = paymentResponse.checkoutUrl;

        // Option 2: Use auto-submit form (uncomment to use)
        // document.body.innerHTML = paymentResponse.htmlForm;
      } else {
        alert("Payment Error: " + paymentResponse.error);
      }
    } catch (error) {
      alert("Payment Error: " + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button onClick={handleCheckout} disabled={loading}>
      {loading ? "Processing..." : `Pay $${amount}`}
    </button>
  );
}

// Usage
<CheckoutButton
  amount={25.99}
  transactionId="TXN_123"
  customer={{
    firstName: "John",
    lastName: "Doe",
    email: "john@example.com",
    phone: "+855123456789",
  }}
/>;
```

### 2. Vue.js Component

```vue
<template>
  <button @click="handleCheckout" :disabled="loading">
    {{ loading ? "Processing..." : `Pay $${amount}` }}
  </button>
</template>

<script>
import { createABACheckout } from "aba-payway";

export default {
  props: ["amount", "transactionId", "customer"],
  data() {
    return {
      loading: false,
    };
  },
  methods: {
    handleCheckout() {
      this.loading = true;

      try {
        const abaConfig = {
          baseUrl: process.env.VUE_APP_ABA_BASE_URL || "",
          checkoutUrl:
            process.env.VUE_APP_ABA_CHECKOUT_URL ||
            "https://checkout-sandbox.payway.com.kh/api/payment-gateway/v1/payments/purchase",
          merchantId: process.env.VUE_APP_ABA_MERCHANT_ID,
          apiKey: process.env.VUE_APP_ABA_API_KEY,
        };

        const paymentRequest = {
          transactionId: this.transactionId || `TXN_${Date.now()}`,
          amount: this.amount.toString(),
          customer: this.customer,
          returnParams: `return_url=${encodeURIComponent(
            window.location.origin + "/payment/success"
          )}`,
        };

        const paymentResponse = createABACheckout(abaConfig, paymentRequest);

        if (paymentResponse.success) {
          // Option 1: Redirect to checkout page
          window.location.href = paymentResponse.checkoutUrl;

          // Option 2: Use auto-submit form (uncomment to use)
          // document.body.innerHTML = paymentResponse.htmlForm;
        } else {
          alert("Payment Error: " + paymentResponse.error);
        }
      } catch (error) {
        alert("Payment Error: " + error.message);
      } finally {
        this.loading = false;
      }
    },
  },
};
</script>

<!-- Usage -->
<!-- 
<CheckoutButton 
  :amount="25.99" 
  transactionId="TXN_123"
  :customer="{
    firstName: 'John',
    lastName: 'Doe',
    email: 'john@example.com',
    phone: '+855123456789'
  }"
/> 
-->
```

### 3. Next.js Component

```tsx
"use client";

import { useState } from "react";
import { createABACheckout } from "aba-payway";

interface CheckoutButtonProps {
  amount: number;
  transactionId?: string;
  customer: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
}

export default function CheckoutButton({
  amount,
  transactionId,
  customer,
}: CheckoutButtonProps) {
  const [loading, setLoading] = useState(false);

  const handleCheckout = () => {
    setLoading(true);

    try {
      const abaConfig = {
        baseUrl: process.env.NEXT_PUBLIC_ABA_BASE_URL || "",
        checkoutUrl:
          process.env.NEXT_PUBLIC_ABA_CHECKOUT_URL ||
          "https://checkout-sandbox.payway.com.kh/api/payment-gateway/v1/payments/purchase",
        merchantId: process.env.NEXT_PUBLIC_ABA_MERCHANT_ID!,
        apiKey: process.env.NEXT_PUBLIC_ABA_API_KEY!,
      };

      const paymentRequest = {
        transactionId: transactionId || `TXN_${Date.now()}`,
        amount: amount.toString(),
        customer,
        returnParams: `return_url=${encodeURIComponent(
          window.location.origin + "/payment/success"
        )}`,
      };

      const paymentResponse = createABACheckout(abaConfig, paymentRequest);

      if (paymentResponse.success) {
        // Option 1: Redirect to checkout page
        window.location.href = paymentResponse.checkoutUrl;

        // Option 2: Use auto-submit form (uncomment to use)
        // const formContainer = document.createElement('div');
        // formContainer.innerHTML = paymentResponse.htmlForm;
        // document.body.appendChild(formContainer);
      } else {
        alert("Payment Error: " + paymentResponse.error);
      }
    } catch (error) {
      alert("Payment Error: " + (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button
      onClick={handleCheckout}
      disabled={loading}
      className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
    >
      {loading ? "Processing..." : `Pay $${amount}`}
    </button>
  );
}

// Usage in a page or component:
// <CheckoutButton
//   amount={25.99}
//   transactionId="TXN_123"
//   customer={{
//     firstName: 'John',
//     lastName: 'Doe',
//     email: 'john@example.com',
//     phone: '+855123456789'
//   }}
// />
```

## Key Benefits

✅ **Simple** - One function call, no complex setup  
✅ **Synchronous** - No async/await needed, instant response  
✅ **Universal** - Works in Node.js, React, Vue, vanilla JS, and more  
✅ **Type-safe** - Full TypeScript support with proper interfaces  
✅ **Error handling** - Built-in validation and clear error messages  
✅ **Lightweight** - Minimal dependencies, small bundle size
