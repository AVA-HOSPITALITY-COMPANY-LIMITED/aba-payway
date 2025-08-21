# ABA PayWay Integration Examples

This guide shows you how to integrate the ABA PayWay library into both backend (Express.js) and frontend applications. The library provides a simple, synchronous API that works seamlessly across different environments.

## Installation

```bash
npm install aba-payway
```

## Express Backend Integration

### Basic Express Setup

```javascript
const express = require('express');
const { createABACheckout } = require('aba-payway');

const app = express();
app.use(express.json());

const abaConfig = {
  baseUrl: process.env.ABA_BASE_URL || '',
  merchantId: process.env.ABA_MERCHANT_ID,
  apiKey: process.env.ABA_API_KEY,
  sandbox: true // Use sandbox for testing
};

// Create payment endpoint
app.post('/create-payment', (req, res) => {
  try {
    const { amount, orderId, currency = 'USD' } = req.body;
    
    const paymentRequest = {
      amount,
      orderId,
      currency,
      returnUrl: 'https://yoursite.com/payment/success',
      cancelUrl: 'https://yoursite.com/payment/cancel'
    };


    const paymentResponse = createABACheckout(abaConfig, paymentRequest);
    
    res.json({
      success: true,
      checkoutUrl: paymentResponse.checkoutUrl,
      orderId: paymentResponse.orderId
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});

// Test endpoint to generate payment form
app.get('/test-payment', (req, res) => {
  const paymentRequest = {
    amount: 10.50,
    orderId: `ORDER_${Date.now()}`,
    currency: 'USD',
    returnUrl: 'https://yoursite.com/payment/success',
    cancelUrl: 'https://yoursite.com/payment/cancel'
  };

  const paymentResponse = createABACheckout(abaConfig, paymentRequest);
  
  // Send HTML form directly to browser
  res.send(paymentResponse.form);
});

app.listen(3000, () => {
  console.log('Server running on http://localhost:3000');
});
```

### Express with TypeScript

```typescript
import express, { Request, Response } from 'express';
import { createABACheckout, ABAPayWayConfig, PaymentRequest } from 'aba-payway';

const app = express();
app.use(express.json());

const abaConfig: ABAPayWayConfig = {
  baseUrl: process.env.ABA_BASE_URL || '',
  merchantId: process.env.ABA_MERCHANT_ID!,
  apiKey: process.env.ABA_API_KEY!,
  sandbox: true
};

interface CreatePaymentBody {
  amount: number;
  orderId: string;
  currency?: string;
}

app.post('/create-payment', (req: Request<{}, {}, CreatePaymentBody>, res: Response) => {
  try {
    const { amount, orderId, currency = 'USD' } = req.body;
    
    const paymentRequest: PaymentRequest = {
      amount,
      orderId,
      currency,
      returnUrl: 'https://yoursite.com/payment/success',
      cancelUrl: 'https://yoursite.com/payment/cancel'
    };

    const paymentResponse = createABACheckout(abaConfig, paymentRequest);
    
    res.json({
      success: true,
      checkoutUrl: paymentResponse.checkoutUrl,
      orderId: paymentResponse.orderId
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});
```

## Frontend Integration

### Basic Usage

```javascript
import { createABACheckout } from 'aba-payway';

const abaConfig = {
  baseUrl: process.env.ABA_BASE_URL || '',
  merchantId: process.env.ABA_MERCHANT_ID,
  apiKey: process.env.ABA_API_KEY,
  sandbox: true // Use sandbox for testing
};

const paymentRequest = {
  amount: 10.50,
  orderId: 'ORDER_001',
  currency: 'USD',
  returnUrl: 'https://yoursite.com/payment/success',
  cancelUrl: 'https://yoursite.com/payment/cancel'
};

const paymentResponse = createABACheckout(abaConfig, paymentRequest);
console.log(paymentResponse.checkoutUrl); // Direct access to checkout URL
```

## Frontend Integration Examples

### 1. React Component

```jsx
import React, { useState } from 'react';
import { createABACheckout } from 'aba-payway';

function CheckoutButton({ amount, orderId }) {
  const [loading, setLoading] = useState(false);

  const handleCheckout = () => {
    setLoading(true);
    
    try {
      const abaConfig = {
        baseUrl: process.env.REACT_APP_ABA_BASE_URL || '',
        merchantId: process.env.REACT_APP_ABA_MERCHANT_ID,
        apiKey: process.env.REACT_APP_ABA_API_KEY,
        sandbox: true
      };

      const paymentRequest = {
        amount: amount,
        orderId: orderId || `ORDER_${Date.now()}`,
        currency: 'USD',
        returnUrl: `${window.location.origin}/payment/success`,
        cancelUrl: `${window.location.origin}/payment/cancel`
      };

      const paymentResponse = createABACheckout(abaConfig, paymentRequest);
      
      // Redirect to checkout page
      window.location.href = paymentResponse.checkoutUrl;
      
    } catch (error) {
      alert('Payment Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <button onClick={handleCheckout} disabled={loading}>
      {loading ? 'Processing...' : `Pay $${amount}`}
    </button>
  );
}

// Usage
<CheckoutButton amount={25.99} orderId="ORDER_123" />
```

### 2. Vue.js Component

```vue
<template>
  <button @click="handleCheckout" :disabled="loading">
    {{ loading ? 'Processing...' : `Pay $${amount}` }}
  </button>
</template>

<script>
import { createABACheckout } from 'aba-payway';

export default {
  props: ['amount', 'orderId'],
  data() {
    return {
      loading: false
    };
  },
  methods: {
    handleCheckout() {
      this.loading = true;
      
      try {
        const abaConfig = {
          baseUrl: process.env.VUE_APP_ABA_BASE_URL || '',
          merchantId: process.env.VUE_APP_ABA_MERCHANT_ID,
          apiKey: process.env.VUE_APP_ABA_API_KEY,
          sandbox: true
        };

        const paymentRequest = {
          amount: this.amount,
          orderId: this.orderId || `ORDER_${Date.now()}`,
          currency: 'USD',
          returnUrl: `${window.location.origin}/payment/success`,
          cancelUrl: `${window.location.origin}/payment/cancel`
        };
     
        const paymentResponse = createABACheckout(abaConfig, paymentRequest);
        
        // Redirect to checkout page
        window.location.href = paymentResponse.checkoutUrl;
        
      } catch (error) {
        alert('Payment Error: ' + error.message);
      } finally {
        this.loading = false;
      }
    }
  }
};
</script>

<!-- Usage -->
<!-- <CheckoutButton :amount="25.99" orderId="ORDER_123" /> -->
```

### 3. Vanilla JavaScript

```html
<!DOCTYPE html>
<html>
<head>
    <title>ABA PayWay Checkout</title>
</head>
<body>
    <button id="payButton">Pay $25.00</button>
    
    <script type="module">
        import { createABACheckout } from 'aba-payway';
        
        document.getElementById('payButton').addEventListener('click', () => {
            try {
                const abaConfig = {
                    baseUrl: process.env.ABA_BASE_URL || '',
                    merchantId: process.env.ABA_MERCHANT_ID,
                    apiKey: process.env.ABA_API_KEY,
                    sandbox: true
                };

                const paymentRequest = {
                    amount: 25.00,
                    orderId: `ORDER_${Date.now()}`,
                    currency: 'USD',
                    returnUrl: `${window.location.origin}/payment/success`,
                    cancelUrl: `${window.location.origin}/payment/cancel`
                };
        
                const paymentResponse = createABACheckout(abaConfig, paymentRequest);
                
                // Redirect to checkout page
                window.location.href = paymentResponse.checkoutUrl;
                
            } catch (error) {
                alert('Payment Error: ' + error.message);
            }
        });
    </script>
</body>
</html>
```

### 4. Next.js API Route + Frontend

**API Route (`app/api/checkout/route.js`):**
```javascript
import { createABACheckout } from 'aba-payway';
import { NextResponse } from 'next/server';

export async function POST(request) {
  try {
    const { amount, orderId, currency = 'USD' } = await request.json();

    const abaConfig = {
      baseUrl: process.env.ABA_BASE_URL || '',
      merchantId: process.env.ABA_MERCHANT_ID,
      apiKey: process.env.ABA_API_KEY,
      sandbox: true
    };

    const paymentRequest = {
      amount,
      orderId: orderId || `ORDER_${Date.now()}`,
      currency,
      returnUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/payment/success`,
      cancelUrl: `${process.env.NEXT_PUBLIC_BASE_URL}/payment/cancel`
    };

    const paymentResponse = createABACheckout(abaConfig, paymentRequest);
    
    return NextResponse.json({
      success: true,
      checkoutUrl: paymentResponse.checkoutUrl,
      orderId: paymentResponse.orderId
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, error: error.message },
      { status: 400 }
    );
  }
}
```

**Frontend Component:**
```jsx
'use client';

import { useState } from 'react';

function CheckoutForm() {
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const formData = new FormData(e.target);
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          amount: parseFloat(formData.get('amount')),
          orderId: formData.get('orderId'),
          currency: 'USD'
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        // Redirect to checkout page
        window.location.href = result.checkoutUrl;
      } else {
        alert('Error: ' + result.error);
      }
    } catch (error) {
      alert('Payment Error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <form onSubmit={handleSubmit}>
      <input name="amount" type="number" step="0.01" placeholder="Amount" required />
      <input name="orderId" type="text" placeholder="Order ID (optional)" />
      <button type="submit" disabled={loading}>
        {loading ? 'Processing...' : 'Pay Now'}
      </button>
    </form>
  );
}
```

## Key Benefits

✅ **Simple** - One function call, no complex setup  
✅ **Synchronous** - No async/await needed, instant response  
✅ **Universal** - Works in Node.js, React, Vue, vanilla JS, and more  
✅ **Type-safe** - Full TypeScript support with proper interfaces  
✅ **Error handling** - Built-in validation and clear error messages  
✅ **Lightweight** - Minimal dependencies, small bundle size  

## Environment Variables Setup

Create a `.env` file in your project root:

```bash
# ABA PayWay Configuration
ABA_BASE_URL=https://checkout-sandbox.payway.com.kh
ABA_MERCHANT_ID=your_merchant_id_here
ABA_API_KEY=your_api_key_here

# Optional: Override default API URLs
ABA_SANDBOX_CHECKOUT_URL=https://checkout-sandbox.payway.com.kh/api/payment-gateway/v1/payments/purchase
ABA_PRODUCTION_CHECKOUT_URL=https://checkout.payway.com.kh/api/payment-gateway/v1/payments/purchase

# For Next.js frontend access
NEXT_PUBLIC_BASE_URL=https://yoursite.com

# For React apps
REACT_APP_ABA_BASE_URL=https://checkout-sandbox.payway.com.kh
REACT_APP_ABA_MERCHANT_ID=your_merchant_id_here
REACT_APP_ABA_API_KEY=your_api_key_here

# For Vue apps
VUE_APP_ABA_BASE_URL=https://checkout-sandbox.payway.com.kh
VUE_APP_ABA_MERCHANT_ID=your_merchant_id_here
VUE_APP_ABA_API_KEY=your_api_key_here
```

## Security Best Practices

🔒 **Backend Integration (Recommended)**
- Keep API keys on the server side only
- Validate all payments on your backend
- Never expose sensitive credentials in frontend code
- Use HTTPS for all payment-related endpoints

🔒 **Frontend Integration**
- Only use for development/testing purposes
- Store credentials in environment variables
- Implement proper input validation
- Use CORS policies appropriately

## Return URLs Setup

Configure these URLs in your ABA PayWay merchant dashboard:

```bash
# Success URL - where users go after successful payment
https://yoursite.com/payment/success

# Cancel URL - where users go if they cancel payment
https://yoursite.com/payment/cancel

# Callback URL - for server-to-server payment notifications
https://yoursite.com/api/payment/callback
```

## Testing

For development and testing:

1. Use sandbox credentials from ABA PayWay
2. Test with small amounts (e.g., $0.01)
3. Verify return URL handling
4. Test error scenarios (invalid amounts, missing fields)

## Need Help?

- Check the [ABA PayWay documentation](https://payway.ababank.com)
- Review the example server in this repository
- Ensure your merchant account is properly configured
- Verify your API credentials are correct