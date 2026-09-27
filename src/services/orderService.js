/** Replace with POST /api/orders when a backend is available. */
export async function submitOrder(order) {
  if (!order?.customer?.name || !order?.customer?.phone || !order?.items?.length) throw new Error('Please complete your contact details and add a product.')
  if (order.paymentMethod === 'bkash') throw new Error('bKash is not connected yet. Choose Cash on Delivery or contact us on WhatsApp.')
  // Demo COD flow: intentionally labels confirmation as local-only, not a real server order.
  return { id: `DEMO-${Date.now().toString().slice(-7)}`, status: 'pending-backend', order }
}
