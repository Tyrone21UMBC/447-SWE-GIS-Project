import { useEffect, useRef, useState } from 'react';
import type { CSSProperties, Dispatch, SetStateAction } from 'react';
import { Camera, ImagePlus, X, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import { preparePhoto, isImage, formatBytes, MAX_PHOTOS, MAX_PHOTO_BYTES, type Photo } from './photos.ts';

type Props = {
  photos: Photo[];
  setPhotos: Dispatch<SetStateAction<Photo[]>>;
  onBusyChange: (busy: boolean) => void;
  disabled?: boolean;
};

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;

// Photos section at the end of the checklist. Photos can be picked, taken with the
// camera (phones and tablets), dropped anywhere on the page, or pasted.
export default function PhotoAttachments({ photos, setPhotos, onBusyChange, disabled }: Props) {
  const [processing, setProcessing] = useState(0);
  const [errors, setErrors] = useState<string[]>([]);
  const [dragging, setDragging] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  const cameraInput = useRef<HTMLInputElement>(null);
  const [isTouch] = useState(() => window.matchMedia('(pointer: coarse)').matches);

  // Read by the async add and the unmount cleanup, which would otherwise see stale state
  const photosRef = useRef(photos);
  photosRef.current = photos;
  const processingRef = useRef(0);
  // Kept in step with every add and remove, so back-to-back adds see each other's sizes
  const bytesRef = useRef(0);

  const totalBytes = photos.reduce((n, p) => n + p.jpeg.length, 0);

  async function addFiles(files: File[]) {
    if (disabled || files.length === 0) return;
    const problems: string[] = [];
    const images = files.filter(f => isImage(f) || (problems.push(`${f.name} isn't an image.`), false));
    const room = MAX_PHOTOS - photosRef.current.length - processingRef.current;
    if (images.length > room) problems.push(`Only ${MAX_PHOTOS} photos fit in one report, so ${plural(images.length - Math.max(room, 0), 'photo')} weren't added.`);
    const accepted = images.slice(0, Math.max(room, 0));
    setErrors(problems);

    processingRef.current += accepted.length;
    setProcessing(n => n + accepted.length);
    // One at a time: decoding several 12 MP photos at once can run a phone out of memory
    for (const file of accepted) {
      try {
        const photo = await preparePhoto(file);
        if (bytesRef.current + photo.jpeg.length > MAX_PHOTO_BYTES) {
          URL.revokeObjectURL(photo.url);
          setErrors(e => [...e, `${file.name} wasn't added: the report would be too large to send. Remove a photo to make room.`]);
        } else {
          bytesRef.current += photo.jpeg.length;
          setPhotos(list => [...list, photo]);
        }
      } catch (err) {
        setErrors(e => [...e, err instanceof Error ? err.message : `Could not add ${file.name}.`]);
      } finally {
        processingRef.current--;
        setProcessing(n => n - 1);
      }
    }
  }
  const addRef = useRef(addFiles);
  addRef.current = addFiles;

  useEffect(() => onBusyChange(processing > 0), [processing, onBusyChange]);

  // The whole page is a drop target: a photo dropped beside the box would otherwise
  // make the browser open it and leave the half-filled checklist
  useEffect(() => {
    let depth = 0;
    const hasFiles = (e: DragEvent) => e.dataTransfer?.types.includes('Files') ?? false;
    const enter = (e: DragEvent) => { if (hasFiles(e)) { depth++; setDragging(true); } };
    const leave = (e: DragEvent) => { if (hasFiles(e) && --depth <= 0) { depth = 0; setDragging(false); } };
    const over = (e: DragEvent) => { if (hasFiles(e)) e.preventDefault(); };
    const drop = (e: DragEvent) => {
      if (!hasFiles(e)) return;
      e.preventDefault();
      depth = 0;
      setDragging(false);
      addRef.current([...e.dataTransfer!.files]);
    };
    // Pasting a screenshot; pasting text into a field is left alone
    const paste = (e: ClipboardEvent) => {
      const files = [...(e.clipboardData?.files ?? [])].filter(isImage);
      if (files.length) { e.preventDefault(); addRef.current(files); }
    };
    window.addEventListener('dragenter', enter);
    window.addEventListener('dragleave', leave);
    window.addEventListener('dragover', over);
    window.addEventListener('drop', drop);
    window.addEventListener('paste', paste);
    return () => {
      window.removeEventListener('dragenter', enter);
      window.removeEventListener('dragleave', leave);
      window.removeEventListener('dragover', over);
      window.removeEventListener('drop', drop);
      window.removeEventListener('paste', paste);
    };
  }, []);

  useEffect(() => () => photosRef.current.forEach(p => URL.revokeObjectURL(p.url)), []);

  const remove = (photo: Photo) => {
    URL.revokeObjectURL(photo.url);
    bytesRef.current -= photo.jpeg.length;
    setPhotos(list => list.filter(p => p.id !== photo.id));
  };
  const move = (from: number, to: number) => setPhotos(list => {
    const next = [...list];
    next.splice(to, 0, ...next.splice(from, 1));
    return next;
  });
  const setCaption = (photo: Photo, caption: string) =>
    setPhotos(list => list.map(p => (p.id === photo.id ? { ...p, caption } : p)));

  const onPicked = (e: React.ChangeEvent<HTMLInputElement>) => {
    addFiles([...(e.target.files ?? [])]);
    e.target.value = '';   // so picking the same photo again still fires
  };

  const full = photos.length + processing >= MAX_PHOTOS;
  const nearLimit = totalBytes > MAX_PHOTO_BYTES * 0.75;

  return (
    <section id="report-photos" style={photoStyles.section} aria-label="Photos">
      <div style={photoStyles.header}>
        <h2 style={photoStyles.title}>Photos</h2>
        <span style={{ ...photoStyles.meta, ...(nearLimit ? { color: '#92400e' } : {}) }}>
          {plural(photos.length, 'photo')}{photos.length > 0 && ` · ${formatBytes(totalBytes)} of ${formatBytes(MAX_PHOTO_BYTES)}`}
        </span>
      </div>
      <p style={photoStyles.hint}>Each photo is added as its own page at the end of the report, with its caption.</p>

      <div style={photoStyles.dropzone}>
        <ImagePlus size={30} color="#6b7280" />
        <p style={{ margin: 0 }}>
          {full ? `That's the most photos one report can hold (${MAX_PHOTOS}).`
            : isTouch ? 'Take a photo or choose some from your device.'
            : 'Drag photos anywhere onto this page, paste them, or choose them from your computer.'}
        </p>
        <div style={photoStyles.buttons}>
          {isTouch && (
            <button type="button" style={photoStyles.primary} disabled={disabled || full} onClick={() => cameraInput.current?.click()}>
              <Camera size={18} /> Take photo
            </button>
          )}
          <button type="button" style={isTouch ? photoStyles.secondary : photoStyles.primary} disabled={disabled || full}
            onClick={() => fileInput.current?.click()}>
            <ImagePlus size={18} /> Choose photos
          </button>
        </div>
        <input ref={fileInput} type="file" accept="image/*,.heic,.heif" multiple hidden onChange={onPicked} />
        <input ref={cameraInput} type="file" accept="image/*" capture="environment" hidden onChange={onPicked} />
      </div>

      {errors.length > 0 && (
        <div role="alert" style={photoStyles.errors}>
          <ul style={{ margin: 0, paddingLeft: '18px' }}>{errors.map((e, i) => <li key={i}>{e}</li>)}</ul>
          <button type="button" style={photoStyles.dismiss} onClick={() => setErrors([])} aria-label="Dismiss"><X size={16} /></button>
        </div>
      )}

      {(photos.length > 0 || processing > 0) && (
        <ol style={photoStyles.grid}>
          {photos.map((photo, i) => (
            <li key={photo.id} style={photoStyles.card}>
              <div style={photoStyles.thumbWrap}>
                <img src={photo.url} alt={photo.caption || photo.name} style={photoStyles.thumb} />
                <span style={photoStyles.badge}>{i + 1}</span>
                <button type="button" style={photoStyles.remove} disabled={disabled} onClick={() => remove(photo)}
                  aria-label={`Remove photo ${i + 1}`} title="Remove photo">
                  <X size={16} />
                </button>
              </div>
              <input
                value={photo.caption}
                onChange={e => setCaption(photo, e.target.value)}
                placeholder="Add a caption (optional)"
                maxLength={200}
                disabled={disabled}
                style={photoStyles.caption}
                aria-label={`Caption for photo ${i + 1}`}
              />
              <div style={photoStyles.cardFooter}>
                <span style={photoStyles.fileName} title={photo.name}>{photo.name}</span>
                <span style={{ display: 'flex', gap: '2px' }}>
                  <button type="button" style={photoStyles.arrow} disabled={disabled || i === 0} onClick={() => move(i, i - 1)}
                    aria-label={`Move photo ${i + 1} earlier`} title="Move earlier"><ChevronLeft size={16} /></button>
                  <button type="button" style={photoStyles.arrow} disabled={disabled || i === photos.length - 1} onClick={() => move(i, i + 1)}
                    aria-label={`Move photo ${i + 1} later`} title="Move later"><ChevronRight size={16} /></button>
                </span>
              </div>
            </li>
          ))}
          {Array.from({ length: processing }, (_, i) => (
            <li key={`processing-${i}`} style={{ ...photoStyles.card, ...photoStyles.processing }}>
              <Loader2 size={24} className="photo-spin" />
              <span>Adding photo…</span>
            </li>
          ))}
        </ol>
      )}
      <style>{'@keyframes photo-spin { to { transform: rotate(360deg) } } .photo-spin { animation: photo-spin 1s linear infinite }'}</style>

      {dragging && (
        <div style={photoStyles.dropOverlay}>
          <div style={photoStyles.dropMessage}><ImagePlus size={40} /> Drop photos to attach them to the report</div>
        </div>
      )}
    </section>
  );
}

const button: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  gap: '6px',
  padding: '10px 18px',
  borderRadius: '10px',
  font: 'inherit',
  fontWeight: 600,
  cursor: 'pointer',
};

const photoStyles: Record<string, CSSProperties> = {
  section: {
    boxSizing: 'border-box',
    margin: '24px 0 140px',          // clear of the floating submit button
    padding: '20px 24px',
    borderRadius: '12px',
    borderTop: '4px solid #f7cc0d',
    backgroundColor: '#fff',
    boxShadow: '0 1px 3px rgba(0, 0, 0, 0.15)',
    fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
    color: '#111827',
  },
  header: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'baseline',
    justifyContent: 'space-between',
    gap: '8px',
  },
  title: {
    margin: 0,
    fontSize: '20px',
  },
  meta: {
    color: '#4b5563',
    fontSize: '14px',
  },
  hint: {
    margin: '6px 0 16px',
    color: '#4b5563',
    fontSize: '14px',
  },
  dropzone: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '10px',
    padding: '24px 16px',
    border: '2px dashed #d1d5db',
    borderRadius: '12px',
    backgroundColor: '#f9fafb',
    textAlign: 'center',
    color: '#374151',
  },
  buttons: {
    display: 'flex',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: '10px',
  },
  primary: {
    ...button,
    border: 'none',
    backgroundColor: '#000',
    color: '#f7cc0d',
  },
  secondary: {
    ...button,
    border: '2px solid #000',
    backgroundColor: '#fff',
    color: '#000',
  },
  errors: {
    display: 'flex',
    alignItems: 'flex-start',
    gap: '8px',
    marginTop: '12px',
    padding: '10px 12px',
    borderRadius: '8px',
    backgroundColor: '#fee2e2',
    color: '#991b1b',
    fontSize: '14px',
  },
  dismiss: {
    marginLeft: 'auto',
    padding: '2px',
    border: 'none',
    background: 'none',
    color: 'inherit',
    cursor: 'pointer',
  },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
    gap: '16px',
    listStyle: 'none',
    padding: 0,
    margin: '16px 0 0',
  },
  card: {
    display: 'flex',
    flexDirection: 'column',
    gap: '8px',
    minWidth: 0,
  },
  thumbWrap: {
    position: 'relative',
    aspectRatio: '4 / 3',
    borderRadius: '8px',
    overflow: 'hidden',
    backgroundColor: '#f3f4f6',
  },
  thumb: {
    width: '100%',
    height: '100%',
    objectFit: 'cover',
    display: 'block',
  },
  badge: {
    position: 'absolute',
    top: '6px',
    left: '6px',
    minWidth: '22px',
    padding: '1px 6px',
    borderRadius: '9999px',
    backgroundColor: '#000',
    color: '#f7cc0d',
    fontSize: '13px',
    fontWeight: 700,
    textAlign: 'center',
    boxSizing: 'border-box',
  },
  remove: {
    position: 'absolute',
    top: '6px',
    right: '6px',
    display: 'flex',
    padding: '5px',
    border: 'none',
    borderRadius: '9999px',
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    color: '#fff',
    cursor: 'pointer',
  },
  caption: {
    boxSizing: 'border-box',
    width: '100%',
    padding: '7px 9px',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    font: 'inherit',
    fontSize: '14px',
  },
  cardFooter: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: '6px',
  },
  fileName: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    color: '#6b7280',
    fontSize: '12px',
  },
  arrow: {
    display: 'flex',
    padding: '4px',
    border: '1px solid #d1d5db',
    borderRadius: '6px',
    backgroundColor: '#fff',
    cursor: 'pointer',
  },
  processing: {
    alignItems: 'center',
    justifyContent: 'center',
    aspectRatio: '4 / 3',
    borderRadius: '8px',
    backgroundColor: '#f3f4f6',
    color: '#4b5563',
    fontSize: '14px',
  },
  dropOverlay: {
    position: 'fixed',
    inset: 0,
    zIndex: 10002,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '24px',
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    pointerEvents: 'none',       // the drop lands on the page underneath
  },
  dropMessage: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    gap: '12px',
    padding: '40px 56px',
    border: '3px dashed #f7cc0d',
    borderRadius: '16px',
    backgroundColor: '#000',
    color: '#f7cc0d',
    fontSize: '20px',
    fontWeight: 600,
    textAlign: 'center',
  },
};
