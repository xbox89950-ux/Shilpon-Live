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

// Shared storage limits each image to 10 MB. Compress phone photos before upload.
export async function optimizeImageFile(file, maxSide = 1500) {
  if (!file?.type?.startsWith('image/')) throw new Error('Choose an image file.')
  if (file.size > 30 * 1024 * 1024) throw new Error('Choose an image smaller than 30 MB.')
  const bitmap = await createImageBitmap(file)
  let side = Math.min(maxSide, Math.max(bitmap.width, bitmap.height))
  let blob
  try {
    for (let attempt = 0; attempt < 5; attempt++) {
      const scale = Math.min(1, side / Math.max(bitmap.width, bitmap.height))
      const canvas = document.createElement('canvas')
      canvas.width = Math.max(1, Math.round(bitmap.width * scale))
      canvas.height = Math.max(1, Math.round(bitmap.height * scale))
      canvas.getContext('2d').drawImage(bitmap, 0, 0, canvas.width, canvas.height)
      blob = await new Promise(resolve => canvas.toBlob(resolve, 'image/webp', 0.74))
      if (!blob) throw new Error('Could not prepare this image. Try a JPG or PNG photo.')
      if (blob.size <= 8 * 1024 * 1024) break
      side = Math.round(side * 0.75)
    }
  } finally {
    bitmap.close()
  }
  if (blob.size > 8 * 1024 * 1024) throw new Error('This image is too large after compression. Choose a smaller photo.')
  const name = file.name.replace(/\.[^.]+$/, '') || 'product-photo'
  return new File([blob], `${name}.webp`, { type: 'image/webp', lastModified: Date.now() })
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
