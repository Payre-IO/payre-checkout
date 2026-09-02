/**
 * TypeScript Definitions for @payre/checkout SDK
 * PAYRE INFRA LTD (payre.io)
 */

export type CheckoutTheme = 'light' | 'dark' | 'auto';

export interface PaymentSettledPayload {
  invoiceId: string;
  status: 'paid' | 'completed' | 'swept';
  txHash?: string | null;
  chain?: string;
  amount?: string | number;
  currency?: string;
}

export interface PaymentExpiredPayload {
  invoiceId: string;
  status: 'expired';
}

export interface CheckoutReadyPayload {
  invoiceId: string;
  amount?: string | number;
  currency?: string;
}

export interface CheckoutOptions {
  /** The Payre Invoice UUID or invoice reference ID */
  invoiceId?: string;
  /** Custom Payre server origin (e.g. 'https://payre.io' or 'http://localhost:3000') */
  origin?: string;
  /** Whether to render as an inline embed iframe instead of a modal overlay */
  embed?: boolean;
  /** CSS selector or HTMLElement to mount the checkout into (default: 'body') */
  target?: string | HTMLElement;
  /** Checkout theme styling (default: 'light') */
  theme?: CheckoutTheme;
  /** Modal overlay z-index (default: 999999) */
  zIndex?: number | string;
  /** Maximum modal card width (default: '480px') */
  maxWidth?: string;
  /** Maximum modal card height (default: '740px') */
  maxHeight?: string;
  /** Hide the default floating close button in modal mode */
  hideCloseButton?: boolean;

  /** Callback fired when checkout interface is loaded and ready */
  onReady?: (payload: CheckoutReadyPayload) => void;
  /** Callback fired when customer successfully completes payment on-chain */
  onSuccess?: (payload: PaymentSettledPayload) => void;
  /** Alias for onSuccess callback */
  onSettled?: (payload: PaymentSettledPayload) => void;
  /** Alias for onSuccess callback */
  onPaid?: (payload: PaymentSettledPayload) => void;
  /** Callback fired when invoice expires before payment */
  onExpired?: (payload: PaymentExpiredPayload) => void;
  /** Callback fired when customer closes or dismisses the checkout modal */
  onClose?: () => void;
  /** Callback fired when checkout is cancelled */
  onCancel?: () => void;
}

export type CheckoutEventType = 'ready' | 'success' | 'settled' | 'paid' | 'expired' | 'close' | 'cancel';

export interface CheckoutInstance {
  /** The outer container element (modal overlay or embedded iframe) */
  element: HTMLElement | null;
  /** The modal card element (only in modal overlay mode) */
  card?: HTMLElement | null;
  /** The checkout iframe element */
  iframe: HTMLIFrameElement | null;
  /** The invoice ID associated with this checkout */
  invoiceId: string;

  /** Add an event listener */
  on(event: 'ready', callback: (payload: CheckoutReadyPayload) => void): this;
  on(event: 'success' | 'settled' | 'paid', callback: (payload: PaymentSettledPayload) => void): this;
  on(event: 'expired', callback: (payload: PaymentExpiredPayload) => void): this;
  on(event: 'close' | 'cancel', callback: () => void): this;
  on(event: CheckoutEventType, callback: (payload?: any) => void): this;

  /** Remove an event listener */
  off(event: CheckoutEventType, callback: (payload?: any) => void): this;

  /** Close and remove the checkout modal */
  close(): void;
  /** Destroy the checkout modal and clean up listeners */
  destroy(): void;
}

/**
 * Initialize and open a Payre Web3 Checkout modal or embed
 */
export function createCheckout(
  invoiceIdOrOptions: string | CheckoutOptions,
  maybeOptions?: CheckoutOptions
): CheckoutInstance;

/**
 * Convenient shortcut helper for createCheckout
 */
export function openCheckout(
  invoiceIdOrOptions: string | CheckoutOptions,
  maybeOptions?: CheckoutOptions
): CheckoutInstance;

/**
 * OOP Class wrapper for Payre Checkout
 */
export class PayreCheckout {
  instance: CheckoutInstance;
  constructor(invoiceIdOrOptions: string | CheckoutOptions, maybeOptions?: CheckoutOptions);
  on(event: CheckoutEventType, callback: (payload?: any) => void): this;
  off(event: CheckoutEventType, callback: (payload?: any) => void): this;
  close(): void;
  destroy(): void;
}

export const version: string;

export default createCheckout;
