// Photos attached to a report. Each one is shrunk to a JPEG in the browser
// before it goes into the PDF, so a 12 MP phone photo becomes a few hundred KB.

export type Photo = {
  id: string;
  name: string;            // original file name
  caption: string;
  jpeg: Uint8Array;
  width: number;
  height: number;
  url: string;             // object URL for the thumbnail; revoke when the photo is removed
};

let nextId = 0;
const MAX_SIDE = 1600;     // px; plenty for a full page at print quality
const QUALITY = 0.82;
export const MAX_PHOTOS = 20;
// The server takes reports up to ~10 MB; leave room for the checklist itself
export const MAX_PHOTO_BYTES = 9_000_000;

async function decode(file: File): Promise<ImageBitmap | HTMLImageElement> {
  try {
    // Honors the EXIF rotation, so phone photos aren't sideways
    return await createImageBitmap(file, { imageOrientation: 'from-image' });
  } catch {
    // Older browsers: an <img> also applies the EXIF rotation
    const url = URL.createObjectURL(file);
    try {
      const img = new Image();
      img.src = url;
      await img.decode();
      return img;
    } finally {
      URL.revokeObjectURL(url);
    }
  }
}

export async function preparePhoto(file: File): Promise<Photo> {
  let image: ImageBitmap | HTMLImageElement;
  try {
    image = await decode(file);
  } catch {
    // Chrome and Firefox can't read iPhone HEIC photos
    throw new Error(/\.hei[cf]$/i.test(file.name) || /hei[cf]/i.test(file.type)
      ? `${file.name} is a HEIC photo, which this browser can't open. Use a JPEG or PNG instead (on iPhone: Settings → Camera → Formats → Most Compatible).`
      : `${file.name} isn't an image this browser can open.`);
  }
  const scale = Math.min(1, MAX_SIDE / Math.max(image.width, image.height));
  const width = Math.round(image.width * scale), height = Math.round(image.height * scale);
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#fff';                 // transparent PNGs get a white background, not black
  ctx.fillRect(0, 0, width, height);
  ctx.drawImage(image, 0, 0, width, height);
  if ('close' in image) image.close();

  const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/jpeg', QUALITY));
  if (!blob) throw new Error(`Could not process ${file.name}.`);
  return {
    id: `photo-${++nextId}`,   // not crypto.randomUUID: it's missing on plain-http LAN addresses
    name: file.name,
    caption: '',
    jpeg: new Uint8Array(await blob.arrayBuffer()),
    width,
    height,
    url: URL.createObjectURL(blob),
  };
}

export const isImage = (file: File) => file.type.startsWith('image/') || /\.(hei[cf]|jpe?g|png|webp|gif)$/i.test(file.name);

export const formatBytes = (bytes: number) =>
  bytes < 1e6 ? `${Math.max(1, Math.round(bytes / 1e3))} KB` : `${(bytes / 1e6).toFixed(1)} MB`;
