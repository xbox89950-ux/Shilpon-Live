/**
 * bKash integration boundary. Frontend must never hold bKash credentials.
 * Create payment via a trusted backend (which stores credentials securely), then
 * redirect to the provider. Mark orders paid only after backend verification of
 * the provider callback/status using the server-side secret. Never trust a client
 * success screen or a browser-supplied payment status.
 */
export async function initiateBkashPayment(order) {
  // TODO: POST order to your backend, e.g. POST /api/payments/bkash/create.
  // The backend validates the order and returns a provider checkout URL.
  if (!order) throw new Error('An order is required before starting payment.')
  throw new Error('bKash checkout is not connected yet. Please choose Cash on Delivery or contact us.')
}
