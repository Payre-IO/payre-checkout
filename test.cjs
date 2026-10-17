const assert = require('assert');

// 1. Test SSR mode (document is undefined)
const payreCjs = require('./index.cjs');
assert.strictEqual(payreCjs.version, '1.2.0', 'CJS version must be 1.2.0');
assert.strictEqual(typeof payreCjs.createCheckout, 'function', 'createCheckout must be a function');
assert.strictEqual(typeof payreCjs.openCheckout, 'function', 'openCheckout must be a function');
assert.strictEqual(typeof payreCjs.PayreCheckout, 'function', 'PayreCheckout must be a class/function');

// In SSR mode without DOM, createCheckout safely returns null
const ssrInstance = payreCjs.createCheckout('INV_SSR_123');
assert.strictEqual(ssrInstance, null, 'SSR createCheckout should safely return null');

// Test required parameter error
assert.throws(() => {
  payreCjs.createCheckout();
}, /"invoiceId" is required/, 'Should throw without invoiceId');

// 2. Set up minimal browser environment mock
const mockElement = () => ({
  style: {},
  setAttribute: () => {},
  appendChild: () => {},
  addEventListener: () => {},
  removeEventListener: () => {},
  parentNode: { removeChild: () => {} }
});

global.requestAnimationFrame = (cb) => setTimeout(cb, 0);

global.window = {
  location: { origin: 'https://payre.io' },
  addEventListener: () => {},
  removeEventListener: () => {}
};

global.document = {
  createElement: () => mockElement(),
  body: mockElement(),
  querySelector: () => mockElement()
};

// 3. Test Browser Modal Mode
const modalCheckout = payreCjs.createCheckout('INV_MODAL_123', {
  origin: 'https://payre.io'
});

assert.ok(modalCheckout, 'Modal checkout instance should be created');
assert.strictEqual(typeof modalCheckout.close, 'function');
assert.strictEqual(typeof modalCheckout.destroy, 'function');
assert.strictEqual(typeof modalCheckout.on, 'function');
assert.strictEqual(typeof modalCheckout.off, 'function');

// Test method chaining on .on() in modal mode
const chainedModal = modalCheckout.on('ready', () => {}).on('success', () => {});
assert.strictEqual(chainedModal, modalCheckout, 'Modal .on() must return instance for chaining');

// 4. Test Browser Embed Mode
const embedCheckout = payreCjs.createCheckout('INV_EMBED_123', {
  embed: true,
  origin: 'https://payre.io'
});

assert.ok(embedCheckout, 'Embed checkout instance should be created');
assert.strictEqual(typeof embedCheckout.on, 'function');
assert.strictEqual(typeof embedCheckout.off, 'function');
assert.strictEqual(typeof embedCheckout.close, 'function');
assert.strictEqual(typeof embedCheckout.destroy, 'function');

// Test method chaining on .on() in embed mode (the previous bug)
const chainedEmbed = embedCheckout.on('ready', () => {}).on('success', () => {});
assert.strictEqual(chainedEmbed, embedCheckout, 'Embed .on() must return instance for chaining');

// 5. Test PayreCheckout OOP class
const oopCheckout = new payreCjs.PayreCheckout('INV_OOP_123');
assert.strictEqual(oopCheckout.on('ready', () => {}), oopCheckout, 'PayreCheckout .on() must chain');
assert.strictEqual(oopCheckout.off('ready', () => {}), oopCheckout, 'PayreCheckout .off() must chain');

console.log('CommonJS tests passed!');

// 6. Test ESM Module
async function testEsm() {
  const esm = await import('./index.js');
  assert.strictEqual(esm.version, '1.2.0', 'ESM version must be 1.2.0');
  assert.strictEqual(typeof esm.createCheckout, 'function', 'createCheckout must be a function');
  assert.strictEqual(typeof esm.openCheckout, 'function', 'openCheckout must be a function');
  assert.strictEqual(typeof esm.PayreCheckout, 'function', 'PayreCheckout must be a class/function');
  
  const esmModal = esm.createCheckout('INV_ESM_MODAL');
  assert.strictEqual(esmModal.on('ready', () => {}), esmModal, 'ESM modal .on() chaining failed');

  const esmEmbed = esm.createCheckout('INV_ESM_EMBED', { embed: true });
  assert.strictEqual(esmEmbed.on('ready', () => {}), esmEmbed, 'ESM embed .on() chaining failed');

  const esmOop = new esm.PayreCheckout('INV_ESM_OOP');
  assert.strictEqual(esmOop.on('ready', () => {}), esmOop, 'ESM PayreCheckout .on() chaining failed');
  
  console.log('ESM tests passed!');
}

testEsm().then(() => {
  console.log('All payre-checkout tests passed successfully!');
}).catch((err) => {
  console.error('Test failed:', err);
  process.exit(1);
});
