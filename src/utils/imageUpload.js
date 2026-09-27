// Compress uploads before storing them in this browser's local content editor.
export async function imageFileToDataUrl(file, maxSide = 1000) {
  if (!file?.type?.startsWith('image/')) throw new Error('Choose an image file.')
  if (file.size > 15 * 1024 * 1024) throw new Error('Choose an image smaller than 15 MB.')
  const bitmap = await createImageBitmap(file)
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(bitmap.width * scale))
  canvas.height = Math.max(1, Math.round(bitmap.height * scale))
  const ctx = canvas.getContext('2d')
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  bitmap.close()
  return canvas.toDataURL('image/webp', 0.68)
}

// Shrink existing inline photos too, so the browser-only editor can fit more products in storage.
export async function optimizeImageDataUrl(source, maxSide = 900) {
  if (typeof source !== 'string' || !source.startsWith('data:image/')) return source
  const response = await fetch(source)
  const bitmap = await createImageBitmap(await response.blob())
  const scale = Math.min(1, maxSide / Math.max(bitmap.width, bitmap.height))
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(bitmap.width * scale))
  canvas.height = Math.max(1, Math.round(bitmap.height * scale))
  canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height)
  bitmap.close()
  return canvas.toDataURL('image/webp', 0.58)
}
