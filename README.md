# @payre/checkout

The official JavaScript/TypeScript SDK for embedding the **Payre Web3 Payment Gateway** directly into your web applications and e-commerce checkouts. 

Payre is a high-speed, direct-to-wallet non-custodial crypto payment gateway developed by **PAYRE INFRA LTD** ([payre.io](https://payre.io)).

---

## Installation

```bash
# npm
npm install @payre/checkout

# pnpm
pnpm add @payre/checkout

# yarn
yarn add @payre/checkout
```

---

## Quick Start

### 1. Modal Overlay Mode (Default)

Launch the Payre checkout interface in a sleek modal overlay with soft-warm surfaces, glassmorphic backdrop blur, and full mobile responsiveness.

```javascript
import { createCheckout } from '@payre/checkout';

// Initialize checkout modal
const checkout = createCheckout({
  invoiceId: 'INV_882190',
  theme: 'light', // 'light' | 'dark' | 'auto'
  onSuccess: (payload) => {
    console.log('Direct on-chain settlement confirmed:', payload.txHash);
    fulfillOrder(payload.invoiceId);
  },
  onExpired: (payload) => {
    console.warn('Invoice expired:', payload.invoiceId);
  },
  onClose: () => {
    console.log('Customer closed checkout modal');
  }
});
```

*Or use the traditional two-argument signature:*

```javascript
const checkout = createCheckout('INV_882190', {
  onSettled: (tx) => console.log('Payment confirmed:', tx)
});
```

---

### 2. Event-Driven Subscription

You can also use `.on()` to listen for lifecycle events:

```javascript
import { createCheckout } from '@payre/checkout';

const checkout = createCheckout('INV_882190');

// Fired when iframe loads and is ready
checkout.on('ready', (payload) => {
  console.log('Checkout interface loaded:', payload);
});

// Fired when on-chain deposit is detected and confirmed
checkout.on('success', (payload) => {
  console.log('Payment received:', payload);
  // payload: { invoiceId, status, txHash, chain, amount, currency }
});

// Fired if the invoice reaches its timeout before payment
checkout.on('expired', (payload) => {
  alert('Payment session expired. Please generate a new order.');
});

// Fired when modal is closed by user
checkout.on('close', () => {
  console.log('Modal dismissed');
});
```

---

### 3. Inline Embedded Mode

Embed the checkout widget directly inside a specific container element on your page:

```javascript
import { createCheckout } from '@payre/checkout';

const checkout = createCheckout({
  invoiceId: 'INV_882190',
  embed: true,
  target: '#payment-container' // CSS selector or HTMLElement
});

checkout.on('success', (data) => {
  window.location.href = '/order-confirmation';
});
```

---

### 4. React / Next.js Integration

```tsx
import React from 'react';
import { createCheckout } from '@payre/checkout';

export function PayButton({ invoiceId }: { invoiceId: string }) {
  const handlePay = () => {
    const checkout = createCheckout({
      invoiceId,
      onSuccess: (tx) => {
        alert(`Payment successful! TX: ${tx.txHash}`);
      },
      onClose: () => {
        console.log('Closed');
      }
    });
  };

  return (
    <button 
      onClick={handlePay}
      style={{
        padding: '12px 24px',
        borderRadius: '40px',
        backgroundColor: '#1a1a1a',
        color: '#ffffff',
        fontWeight: 600,
        cursor: 'pointer'
      }}
    >
      Pay with Crypto (USDT / USDC)
    </button>
  );
}
```

---

## Configuration Options

| Option | Type | Default | Description |
| :--- | :--- | :--- | :--- |
| `invoiceId` | `string` | **Required** | The Payre Invoice UUID or invoice reference string. |
| `origin` | `string` | `'https://payre.onrender.com'` | Payre server URL or self-hosted backend origin. |
| `embed` | `boolean` | `false` | When `true`, embeds as an iframe inside `target`. When `false`, displays in modal overlay. |
| `target` | `string \| HTMLElement` | `'body'` | Container element or selector to append checkout to. |
| `theme` | `'light' \| 'dark' \| 'auto'` | `'light'` | Theme styling matching Payre design system. |
| `zIndex` | `number \| string` | `999999` | CSS z-index for modal overlay. |
| `maxWidth` | `string` | `'480px'` | Maximum modal card width. |
| `maxHeight` | `string` | `'740px'` | Maximum modal card height. |
| `hideCloseButton` | `boolean` | `false` | Whether to hide floating '✕' close button. |
| `onReady` | `function` | `undefined` | Callback fired when checkout frame is ready. |
| `onSuccess` | `function` | `undefined` | Callback fired on payment settlement. |
| `onSettled` | `function` | `undefined` | Alias for `onSuccess`. |
| `onExpired` | `function` | `undefined` | Callback fired when invoice timer expires. |
| `onClose` | `function` | `undefined` | Callback fired when modal is dismissed. |

---

## Instance Methods

- `checkout.on(event, callback)`: Subscribe to checkout events.
- `checkout.off(event, callback)`: Unsubscribe from checkout events.
- `checkout.close()`: Programmatically close and remove the modal.
- `checkout.destroy()`: Clean up all event listeners and DOM elements.

---

## Supported Blockchains & Tokens

Payre supports fast direct-to-wallet settlement on:
- **Base** (`USDC`, `USDT`)
- **Polygon** (`USDC`, `USDT`)
- **BNB Smart Chain** (`USDT`, `USDC`)
- **Arbitrum** (`USDC`, `USDT`)
- **Solana** (`USDC`, `USDT`, `SOL`)
- **Ethereum Mainnet** (`USDT`, `USDC`)

---

## License

MIT © [PAYRE INFRA LTD](https://payre.io)
