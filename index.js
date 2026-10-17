/**
 * Payre Web3 Checkout Widget SDK (ESM Module)
 * PAYRE INFRA LTD (payre.io)
 * Universal, non-custodial crypto checkout modal and embedded iframe SDK.
 */

export const version = '1.2.0';

/**
 * Creates and initializes a Payre Checkout instance.
 * Supports both createCheckout('INV_123', options) and createCheckout({ invoiceId: 'INV_123', ...options })
 *
 * @param {string | object} invoiceIdOrOptions - Invoice ID or configuration object
 * @param {object} [maybeOptions] - Options if first argument was invoice ID string
 * @returns {object} Payre checkout instance controller
 */
export function createCheckout(invoiceIdOrOptions, maybeOptions = {}) {
  const options = typeof invoiceIdOrOptions === 'string'
    ? { invoiceId: invoiceIdOrOptions, ...maybeOptions }
    : { ...(invoiceIdOrOptions || {}), ...maybeOptions };

  const invoiceId = options.invoiceId;
  if (!invoiceId) {
    console.error('[Payre Checkout] Error: "invoiceId" is required to initialize checkout.');
    throw new Error('[Payre Checkout] "invoiceId" is required.');
  }

  // Resolve origin
  const defaultOrigin = (typeof window !== 'undefined' && (window.location.origin.includes('payre') || window.location.origin.includes('localhost') || window.location.origin.includes('127.0.0.1')))
    ? window.location.origin
    : 'https://payre.onrender.com';

  const origin = (options.origin || defaultOrigin).replace(/\/+$/, '');
  const embed = Boolean(options.embed);
  const theme = options.theme || 'light';
  const target = options.target || 'body';
  const zIndex = options.zIndex !== undefined ? String(options.zIndex) : '999999';
  const maxWidth = options.maxWidth || '480px';
  const maxHeight = options.maxHeight || '740px';
  const hideCloseButton = Boolean(options.hideCloseButton);

  const iframeUrl = `${origin}/checkout/${encodeURIComponent(invoiceId)}?embed=true${theme === 'dark' ? '&theme=dark' : ''}`;

  const listeners = {
    ready: [],
    success: [],
    settled: [],
    paid: [],
    expired: [],
    close: [],
    cancel: []
  };

  // Register initial option callbacks if provided
  if (typeof options.onReady === 'function') listeners.ready.push(options.onReady);
  if (typeof options.onSuccess === 'function') listeners.success.push(options.onSuccess);
  if (typeof options.onSettled === 'function') listeners.settled.push(options.onSettled);
  if (typeof options.onPaid === 'function') listeners.paid.push(options.onPaid);
  if (typeof options.onExpired === 'function') listeners.expired.push(options.onExpired);
  if (typeof options.onClose === 'function') listeners.close.push(options.onClose);
  if (typeof options.onCancel === 'function') listeners.cancel.push(options.onCancel);

  const emit = (event, payload) => {
    if (listeners[event]) {
      listeners[event].forEach(cb => {
        try {
          cb(payload);
        } catch (err) {
          console.error(`[Payre Checkout] Error in '${event}' event listener:`, err);
        }
      });
    }
  };

  let modalOverlay = null;
  let modalContainer = null;
  let iframe = null;
  let isDestroyed = false;

  // Handle postMessage communication from the checkout iframe
  const handleMessage = (e) => {
    try {
      // Validate origin if possible
      if (origin && !origin.includes('localhost') && !origin.includes('127.0.0.1')) {
        const expectedOrigin = new URL(origin).origin;
        if (e.origin !== expectedOrigin && !e.origin.includes('payre')) return;
      }

      const { source, event: payreEvent, payload } = e.data || {};
      if (source !== 'payre-checkout' && source !== 'budapay-checkout') return;

      if (payreEvent === 'checkout.ready') {
        emit('ready', payload || { invoiceId });
      } else if (payreEvent === 'invoice.paid' || payreEvent === 'invoice.settled') {
        emit('success', payload || { invoiceId, status: 'paid' });
        emit('settled', payload || { invoiceId, status: 'paid' });
        emit('paid', payload || { invoiceId, status: 'paid' });
      } else if (payreEvent === 'invoice.expired') {
        emit('expired', payload || { invoiceId, status: 'expired' });
      } else if (payreEvent === 'checkout.close') {
        destroy();
      }
    } catch (_) {}
  };

  // Keyboard ESC listener
  const handleKeyDown = (e) => {
    if (e.key === 'Escape' && !embed && modalOverlay) {
      destroy();
    }
  };

  if (typeof window !== 'undefined') {
    window.addEventListener('message', handleMessage);
    if (!embed) {
      window.addEventListener('keydown', handleKeyDown);
    }
  }

  const destroy = () => {
    if (isDestroyed) return;
    isDestroyed = true;

    if (typeof window !== 'undefined') {
      window.removeEventListener('message', handleMessage);
      window.removeEventListener('keydown', handleKeyDown);
    }

    if (modalOverlay) {
      modalOverlay.style.opacity = '0';
      if (modalContainer) {
        modalContainer.style.transform = 'translateY(16px) scale(0.98)';
        modalContainer.style.opacity = '0';
      }
      setTimeout(() => {
        if (modalOverlay && modalOverlay.parentNode) {
          modalOverlay.parentNode.removeChild(modalOverlay);
        }
        modalOverlay = null;
        modalContainer = null;
      }, 220);
    }

    emit('close');
    emit('cancel');
  };

  // ─── EMBEDDED MODE ────────────────────────────────────────────────────────
  if (embed) {
    if (typeof document === 'undefined') return null;

    iframe = document.createElement('iframe');
    iframe.src = iframeUrl;
    iframe.title = `Payre Checkout - ${invoiceId}`;
    iframe.setAttribute('allow', 'clipboard-read; clipboard-write; payment');
    iframe.setAttribute('loading', 'lazy');
    Object.assign(iframe.style, {
      width: '100%',
      height: '100%',
      minHeight: '600px',
      border: 'none',
      borderRadius: '24px',
      background: 'transparent',
      boxShadow: 'none',
      colorScheme: theme === 'dark' ? 'dark' : 'light'
    });

    const targetEl = typeof target === 'string' ? document.querySelector(target) : target;
    if (targetEl && targetEl !== document.body) {
      targetEl.appendChild(iframe);
    }

    const instance = {
      element: iframe,
      iframe,
      invoiceId,
      on: (event, callback) => {
        if (listeners[event]) listeners[event].push(callback);
        return instance;
      },
      off: (event, callback) => {
        if (listeners[event]) {
          listeners[event] = listeners[event].filter(cb => cb !== callback);
        }
        return instance;
      },
      close: () => {
        if (typeof window !== 'undefined') {
          window.removeEventListener('message', handleMessage);
        }
        if (iframe && iframe.parentNode) {
          iframe.parentNode.removeChild(iframe);
        }
        emit('close');
      },
      destroy: () => {
        if (typeof window !== 'undefined') {
          window.removeEventListener('message', handleMessage);
        }
        if (iframe && iframe.parentNode) {
          iframe.parentNode.removeChild(iframe);
        }
        emit('close');
      }
    };
    return instance;
  }

  // ─── MODAL OVERLAY MODE ───────────────────────────────────────────────────
  if (typeof document === 'undefined') return null;

  // Create Modal Overlay Background
  modalOverlay = document.createElement('div');
  modalOverlay.id = 'payre-checkout-overlay';
  modalOverlay.setAttribute('role', 'dialog');
  modalOverlay.setAttribute('aria-modal', 'true');
  modalOverlay.setAttribute('aria-label', `Payre Checkout Invoice ${invoiceId}`);

  Object.assign(modalOverlay.style, {
    position: 'fixed',
    top: '0',
    left: '0',
    width: '100vw',
    height: '100vh',
    backgroundColor: theme === 'dark' ? 'rgba(3, 7, 18, 0.72)' : 'rgba(26, 26, 26, 0.48)',
    backdropFilter: 'blur(8px)',
    webkitBackdropFilter: 'blur(8px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '16px',
    boxSizing: 'border-box',
    zIndex: zIndex,
    opacity: '0',
    transition: 'opacity 0.22s cubic-bezier(0.16, 1, 0.3, 1)',
    fontFamily: "'Manrope', system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif"
  });

  // Create Modal Card Container
  modalContainer = document.createElement('div');
  modalContainer.id = 'payre-checkout-card';
  Object.assign(modalContainer.style, {
    position: 'relative',
    width: '100%',
    maxWidth: maxWidth,
    height: '92vh',
    maxHeight: maxHeight,
    backgroundColor: theme === 'dark' ? '#0c0f17' : '#fbfbf9',
    borderRadius: '24px',
    border: theme === 'dark' ? '1px solid rgba(255, 255, 255, 0.08)' : '1px solid #e9e7e2',
    boxShadow: theme === 'dark' ? '0 25px 60px -15px rgba(0, 0, 0, 0.75)' : '0 20px 50px -10px rgba(0, 0, 0, 0.18)',
    display: 'flex',
    flexDirection: 'column',
    overflow: 'hidden',
    transform: 'translateY(16px) scale(0.98)',
    opacity: '0',
    transition: 'transform 0.25s cubic-bezier(0.16, 1, 0.3, 1), opacity 0.22s cubic-bezier(0.16, 1, 0.3, 1)'
  });

  // Close Button
  if (!hideCloseButton) {
    const closeBtn = document.createElement('button');
    closeBtn.setAttribute('type', 'button');
    closeBtn.setAttribute('aria-label', 'Close Payre Checkout');
    closeBtn.innerHTML = `
      <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg" style="pointer-events: none;">
        <path d="M13 1L1 13M1 1L13 13" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    `;

    Object.assign(closeBtn.style, {
      position: 'absolute',
      top: '16px',
      right: '16px',
      background: theme === 'dark' ? 'rgba(255, 255, 255, 0.06)' : '#f5f4ef',
      border: theme === 'dark' ? '1px solid rgba(255, 255, 255, 0.1)' : '1px solid #e9e7e2',
      color: theme === 'dark' ? '#9ca3af' : '#2d2d2d',
      width: '32px',
      height: '32px',
      borderRadius: '50%',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: '20',
      padding: '0',
      outline: 'none',
      transition: 'all 0.15s ease'
    });

    closeBtn.addEventListener('mouseenter', () => {
      closeBtn.style.color = theme === 'dark' ? '#ffffff' : '#1a1a1a';
      closeBtn.style.backgroundColor = theme === 'dark' ? 'rgba(255, 255, 255, 0.14)' : '#eae8e3';
      closeBtn.style.transform = 'scale(1.05)';
    });

    closeBtn.addEventListener('mouseleave', () => {
      closeBtn.style.color = theme === 'dark' ? '#9ca3af' : '#2d2d2d';
      closeBtn.style.backgroundColor = theme === 'dark' ? 'rgba(255, 255, 255, 0.06)' : '#f5f4ef';
      closeBtn.style.transform = 'scale(1)';
    });

    closeBtn.addEventListener('click', (e) => {
      e.stopPropagation();
      destroy();
    });

    modalContainer.appendChild(closeBtn);
  }

  // Checkout Iframe
  iframe = document.createElement('iframe');
  iframe.src = iframeUrl;
  iframe.title = `Payre Checkout - ${invoiceId}`;
  iframe.setAttribute('allow', 'clipboard-read; clipboard-write; payment');
  Object.assign(iframe.style, {
    width: '100%',
    height: '100%',
    border: 'none',
    background: 'transparent',
    colorScheme: theme === 'dark' ? 'dark' : 'light'
  });

  // Clicking backdrop outside card closes modal
  modalOverlay.addEventListener('click', (e) => {
    if (e.target === modalOverlay) {
      destroy();
    }
  });

  modalContainer.appendChild(iframe);
  modalOverlay.appendChild(modalContainer);

  const targetEl = typeof target === 'string' ? document.querySelector(target) : target;
  (targetEl || document.body).appendChild(modalOverlay);

  // Trigger smooth enter animation
  requestAnimationFrame(() => {
    setTimeout(() => {
      if (modalOverlay && modalContainer) {
        modalOverlay.style.opacity = '1';
        modalContainer.style.opacity = '1';
        modalContainer.style.transform = 'translateY(0) scale(1)';
      }
    }, 15);
  });

  const instance = {
    element: modalOverlay,
    card: modalContainer,
    iframe,
    invoiceId,
    on: (event, callback) => {
      if (listeners[event]) listeners[event].push(callback);
      return instance;
    },
    off: (event, callback) => {
      if (listeners[event]) {
        listeners[event] = listeners[event].filter(cb => cb !== callback);
      }
      return instance;
    },
    close: destroy,
    destroy: destroy
  };

  return instance;
}

/**
 * Convenient shortcut to open a modal checkout
 */
export function openCheckout(invoiceIdOrOptions, maybeOptions) {
  return createCheckout(invoiceIdOrOptions, maybeOptions);
}

/**
 * Class wrapper for Object-Oriented patterns
 */
export class PayreCheckout {
  constructor(invoiceIdOrOptions, maybeOptions) {
    this.instance = createCheckout(invoiceIdOrOptions, maybeOptions);
  }

  on(event, callback) {
    this.instance.on(event, callback);
    return this;
  }

  off(event, callback) {
    this.instance.off(event, callback);
    return this;
  }

  close() {
    this.instance.close();
  }

  destroy() {
    this.instance.destroy();
  }
}

export default createCheckout;
