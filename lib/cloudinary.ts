import { v2 as cloudinary } from 'cloudinary'

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
})

export interface UploadResult {
  public_id: string
  secure_url: string
  width: number
  height: number
  format: string
  resource_type: string
  bytes: number
}

/**
 * Generate signed upload URL for client-side uploads
 */
export function generateUploadSignature(
  folder: string = 'sintra',
  resourceType: 'image' | 'video' | 'raw' = 'image'
): {
  signature: string
  timestamp: number
  cloudName: string
  apiKey: string
  folder: string
} {
  const timestamp = Math.round(new Date().getTime() / 1000)
  
  const params = {
    timestamp,
    folder,
    resource_type: resourceType,
  }

  const signature = cloudinary.utils.api_sign_request(
    params,
    process.env.CLOUDINARY_API_SECRET!
  )

  return {
    signature,
    timestamp,
    cloudName: process.env.CLOUDINARY_CLOUD_NAME!,
    apiKey: process.env.CLOUDINARY_API_KEY!,
    folder,
  }
}

/**
 * Upload image from buffer or file path
 */
export async function uploadImage(
  file: string | Buffer,
  options: {
    folder?: string
    transformation?: any[]
    format?: string
    quality?: string
  } = {}
): Promise<UploadResult> {
  try {
    const result = await cloudinary.uploader.upload(file.toString(), {
      folder: options.folder || 'sintra',
      resource_type: 'image',
      transformation: options.transformation,
      format: options.format,
      quality: options.quality || 'auto',
    })

    return {
      public_id: result.public_id,
      secure_url: result.secure_url,
      width: result.width,
      height: result.height,
      format: result.format,
      resource_type: result.resource_type,
      bytes: result.bytes,
    }
  } catch (error) {
    console.error('Error uploading image to Cloudinary:', error)
    throw new Error('Failed to upload image')
  }
}

/**
 * Delete image by public ID
 */
export async function deleteImage(publicId: string): Promise<boolean> {
  try {
    const result = await cloudinary.uploader.destroy(publicId)
    return result.result === 'ok'
  } catch (error) {
    console.error('Error deleting image from Cloudinary:', error)
    return false
  }
}

/**
 * Generate optimized image URL with transformations
 */
export function generateImageUrl(
  publicId: string,
  transformations?: {
    width?: number
    height?: number
    crop?: string
    quality?: string
    format?: string
    effect?: string
  }
): string {
  const baseUrl = `https://res.cloudinary.com/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload`
  
  if (!transformations) {
    return `${baseUrl}/${publicId}`
  }

  const transformationParams: string[] = []

  if (transformations.width) transformationParams.push(`w_${transformations.width}`)
  if (transformations.height) transformationParams.push(`h_${transformations.height}`)
  if (transformations.crop) transformationParams.push(`c_${transformations.crop}`)
  if (transformations.quality) transformationParams.push(`q_${transformations.quality}`)
  if (transformations.format) transformationParams.push(`f_${transformations.format}`)
  if (transformations.effect) transformationParams.push(`e_${transformations.effect}`)

  const transformationString = transformationParams.join(',')
  
  return transformationString
    ? `${baseUrl}/${transformationString}/${publicId}`
    : `${baseUrl}/${publicId}`
}

/**
 * Get image metadata
 */
export async function getImageMetadata(publicId: string): Promise<any> {
  try {
    const result = await cloudinary.api.resource(publicId)
    return result
  } catch (error) {
    console.error('Error getting image metadata from Cloudinary:', error)
    return null
  }
}

/**
 * Generate social media optimized images
 */
export function generateSocialMediaImages(publicId: string): {
  linkedin: string
  facebook: string
  instagram: string
  twitter: string
} {
  const baseTransformations = {
    quality: 'auto',
    format: 'jpg',
  }

  return {
    linkedin: generateImageUrl(publicId, {
      ...baseTransformations,
      width: 1200,
      height: 627,
      crop: 'fill',
    }),
    facebook: generateImageUrl(publicId, {
      ...baseTransformations,
      width: 1200,
      height: 630,
      crop: 'fill',
    }),
    instagram: generateImageUrl(publicId, {
      ...baseTransformations,
      width: 1080,
      height: 1080,
      crop: 'fill',
    }),
    twitter: generateImageUrl(publicId, {
      ...baseTransformations,
      width: 1200,
      height: 675,
      crop: 'fill',
    }),
  }
}

export { cloudinary }