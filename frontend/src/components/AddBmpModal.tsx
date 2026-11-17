import { Suspense, lazy, useEffect, useMemo, useState } from 'react';
import type { CSSProperties, ReactNode } from 'react';
import { X, MapPin } from 'lucide-react';
import {
  addBmp, ADD_BOUNDS, SF_NUMBER_PATTERN, TRACKING_NUMBER_PATTERN, type BmpRecord, type NewBmp,
} from '../data/bmps.ts';
import type { LatLon } from './LocationPicker.tsx';

const LocationPicker = lazy(() => import('./LocationPicker.tsx'));

type Props = { records: BmpRecord[]; onClose: () => void; onAdded: (record: BmpRecord) => void };

type Form = {
  trackingNumber: string; name: string; facilityType: string; sfNumber: string;
  outfallPoint: string; drainageArea: string; inService: string; lat: string; lon: string;
};
const EMPTY: Form = {
  trackingNumber: '', name: '', facilityType: '', sfNumber: '',
  outfallPoint: '', drainageArea: '', inService: '', lat: '', lon: '',
};

const inRange = (n: number, [lo, hi]: readonly [number, number]) => Number.isFinite(n) && n >= lo && n <= hi;

// Field-by-field problems, shown under each field once the admin has tried to save
function validate(f: Form, records: BmpRecord[]) {
  const errors: Partial<Record<keyof Form | 'location', string>> = {};
  const id = f.trackingNumber.trim().toUpperCase();
  if (!id) errors.trackingNumber = 'Enter the SWM Tracking Number.';
  else if (!TRACKING_NUMBER_PATTERN.test(id)) errors.trackingNumber = 'Use the format 24-SF-0101-01 (a letter may follow, as in 10-SF-0305-1C).';
  else if (records.some(r => r.trackingNumber === id)) errors.trackingNumber = `There's already a BMP with ID ${id}.`;
  if (!f.name.trim()) errors.name = 'Enter a name, such as "Lot 9 Rain Garden".';
  if (!f.facilityType.trim()) errors.facilityType = 'Choose or type a facility type.';
  if (f.sfNumber.trim() && !SF_NUMBER_PATTERN.test(f.sfNumber.trim().toUpperCase())) errors.sfNumber = 'Use the format 24-SF-0101.';
  if (!f.lat.trim() && !f.lon.trim()) errors.location = 'Click the map to place the BMP, or type its coordinates.';
  else if (!inRange(Number(f.lat), ADD_BOUNDS.lat) || !inRange(Number(f.lon), ADD_BOUNDS.lon)) {
    errors.location = 'That spot is off campus. Check the coordinates, or click the map instead.';
  }
  return errors;
}

export default function AddBmpModal({ records, onClose, onAdded }: Props) {
  const [form, setForm] = useState<Form>(EMPTY);
  const [sfEdited, setSfEdited] = useState(false);
  const [showErrors, setShowErrors] = useState(false);
  const [saving, setSaving] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const facilityTypes = useMemo(
    () => [...new Set(records.map(r => r.facilityType).filter(Boolean) as string[])].sort(), [records]);
  const errors = validate(form, records);
  const dirty = Object.values(form).some(v => v.trim());
  const hasLocation = !errors.location;
  const location = useMemo<LatLon | null>(
    () => (hasLocation ? { lat: Number(form.lat), lon: Number(form.lon) } : null), [hasLocation, form.lat, form.lon]);

  const set = (key: keyof Form, value: string) => setForm(f => {
    const next = { ...f, [key]: value };
    // The SF number is the tracking number without its last part, until the admin types their own
    if (key === 'trackingNumber' && !sfEdited) {
      const match = value.trim().toUpperCase().match(/^(\d{2}-[A-Z]{2}-\d{4})-/);
      next.sfNumber = match ? match[1] : '';
    }
    return next;
  });

  const close = () => {
    if (saving) return;
    if (!dirty || window.confirm('Discard this BMP? What you entered will be lost.')) onClose();
  };
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') close(); };
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    document.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener('keydown', onKey);
    };
  });

  async function save(e: React.FormEvent) {
    e.preventDefault();
    setShowErrors(true);
    setServerError(null);
    if (Object.keys(errors).length) return;
    const optional = (v: string) => v.trim() || undefined;
    const bmp: NewBmp = {
      tracking_number: form.trackingNumber.trim().toUpperCase(),
      name: form.name.trim(),
      facility_type: form.facilityType.trim(),
      sf_number: optional(form.sfNumber.toUpperCase()),
      outfall_point: optional(form.outfallPoint),
      drainage_area: optional(form.drainageArea),
      in_service: optional(form.inService),
      lat: Number(form.lat),
      lon: Number(form.lon),
    };
    setSaving(true);
    try {
      onAdded(await addBmp(bmp));
    } catch (err) {
      setServerError(err instanceof TypeError ? 'Could not reach the server' : err instanceof Error ? err.message : 'Could not add the BMP');
    } finally {
      setSaving(false);
    }
  }

  const field = (key: keyof Form | 'location', label: string, input: ReactNode, hint?: string) => (
    <label style={addStyles.field}>
      <span style={addStyles.label}>{label}</span>
      {input}
      {showErrors && errors[key] ? <span style={addStyles.error}>{errors[key]}</span>
        : hint && <span style={addStyles.hint}>{hint}</span>}
    </label>
  );
  const input = (key: keyof Form, props: React.InputHTMLAttributes<HTMLInputElement> = {}) => (
    <input
      value={form[key]}
      onChange={e => set(key, e.target.value)}
      disabled={saving}
      aria-invalid={showErrors && !!errors[key]}
      style={{ ...addStyles.input, ...(showErrors && errors[key] ? addStyles.inputInvalid : {}) }}
      {...props}
    />
  );

  return (
    <div style={addStyles.backdrop}>
      <form role="dialog" aria-modal="true" aria-labelledby="add-bmp-title" style={addStyles.dialog} onSubmit={save} noValidate>
        <div style={addStyles.header}>
          <h2 id="add-bmp-title" style={addStyles.title}>Add a BMP</h2>
          <button type="button" onClick={close} style={addStyles.close} aria-label="Close"><X size={22} /></button>
        </div>

        <div style={addStyles.body}>
          <div style={addStyles.columns}>
            <div style={addStyles.fields}>
              {field('trackingNumber', 'BMP ID (SWM Tracking Number) *',
                input('trackingNumber', { placeholder: '24-SF-0101-01', autoFocus: true,
                  onBlur: () => set('trackingNumber', form.trackingNumber.trim().toUpperCase()) }))}
              {field('name', 'Name *', input('name', { placeholder: 'Lot 9 Rain Garden', maxLength: 200 }))}
              {field('facilityType', 'Facility type *', <>
                {input('facilityType', { list: 'facility-types', placeholder: 'Choose or type', maxLength: 100 })}
                <datalist id="facility-types">{facilityTypes.map(t => <option key={t} value={t} />)}</datalist>
              </>)}
              {field('sfNumber', 'MDE SF number',
                <input value={form.sfNumber} disabled={saving} placeholder="24-SF-0101"
                  aria-invalid={showErrors && !!errors.sfNumber}
                  onChange={e => { setSfEdited(true); setForm(f => ({ ...f, sfNumber: e.target.value })); }}
                  style={{ ...addStyles.input, ...(showErrors && errors.sfNumber ? addStyles.inputInvalid : {}) }} />,
                'Filled in from the BMP ID.')}
              <div style={addStyles.row}>
                {field('outfallPoint', 'Outfall point', input('outfallPoint', { placeholder: 'A', maxLength: 20 }))}
                {field('drainageArea', 'Drainage area', input('drainageArea', { placeholder: 'A1', maxLength: 20 }))}
              </div>
              {field('inService', 'Date placed into service', input('inService', { type: 'date' }),
                'Prefills the inspection checklist.')}
            </div>

            <div style={addStyles.mapColumn}>
              <span style={addStyles.label}>Location *</span>
              <div style={{ ...addStyles.map, ...(showErrors && errors.location ? addStyles.mapInvalid : {}) }}>
                <Suspense fallback={<div style={addStyles.mapLoading}>Loading map…</div>}>
                  <LocationPicker
                    value={location}
                    records={records}
                    onChange={p => setForm(f => ({ ...f, lat: String(p.lat), lon: String(p.lon) }))}
                  />
                </Suspense>
              </div>
              <span style={showErrors && errors.location ? addStyles.error : addStyles.hint}>
                {showErrors && errors.location ? errors.location
                  : <><MapPin size={14} style={{ verticalAlign: '-2px' }} /> Click the map where the BMP is. Yellow shapes are existing BMPs.</>}
              </span>
              <div style={addStyles.row}>
                {field('lat', 'Latitude', input('lat', { inputMode: 'decimal', placeholder: '39.2555' }))}
                {field('lon', 'Longitude', input('lon', { inputMode: 'decimal', placeholder: '-76.7115' }))}
              </div>
            </div>
          </div>
        </div>

        <div style={addStyles.footer}>
          {serverError && <p role="alert" style={addStyles.serverError}>{serverError}</p>}
          <button type="button" onClick={close} disabled={saving} style={addStyles.secondary}>Cancel</button>
          <button type="submit" disabled={saving} style={{ ...addStyles.primary, ...(saving ? { opacity: 0.6, cursor: 'wait' } : {}) }}>
            {saving ? 'Adding…' : 'Add BMP'}
          </button>
        </div>
      </form>
    </div>
  );
}

const button: CSSProperties = {
  padding: '10px 18px',
  borderRadius: '10px',
  font: 'inherit',
  fontWeight: 600,
  cursor: 'pointer',
};

const addStyles: Record<string, CSSProperties> = {
  backdrop: {
    position: 'fixed',
    inset: 0,
    zIndex: 10001,                  // above the header
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '16px',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    fontFamily: "system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif",
    color: '#111827',
  },
  dialog: {
    boxSizing: 'border-box',
    display: 'flex',
    flexDirection: 'column',
    width: '100%',
    maxWidth: '980px',
    maxHeight: 'calc(100vh - 32px)',
    borderRadius: '12px',
    borderTop: '4px solid #f7cc0d',
    backgroundColor: '#fff',
    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '18px 24px 10px',
    borderBottom: '1px solid #e5e7eb',
  },
  title: {
    margin: 0,
    fontSize: '22px',
  },
  close: {
    display: 'flex',
    padding: '6px',
    border: 'none',
    borderRadius: '8px',
    background: 'none',
    cursor: 'pointer',
  },
  body: {
    overflowY: 'auto',
    padding: '18px 24px',
  },
  columns: {
    display: 'flex',
    flexWrap: 'wrap',
    gap: '24px',
  },
  fields: {
    flex: '1 1 300px',
    display: 'flex',
    flexDirection: 'column',
    gap: '14px',
  },
  mapColumn: {
    flex: '1.3 1 340px',
    display: 'flex',
    flexDirection: 'column',
    gap: '6px',
  },
  row: {
    display: 'flex',
    gap: '12px',
  },
  field: {
    flex: 1,
    minWidth: 0,
    display: 'flex',
    flexDirection: 'column',
    gap: '5px',
  },
  label: {
    fontSize: '14px',
    fontWeight: 600,
  },
  input: {
    boxSizing: 'border-box',
    width: '100%',
    padding: '9px 11px',
    border: '1px solid #d1d5db',
    borderRadius: '8px',
    font: 'inherit',
    fontSize: '15px',
  },
  inputInvalid: {
    borderColor: '#dc2626',
    boxShadow: '0 0 0 1px #dc2626',
  },
  hint: {
    color: '#6b7280',
    fontSize: '13px',
  },
  error: {
    color: '#b91c1c',
    fontSize: '13px',
  },
  map: {
    height: '330px',
    borderRadius: '10px',
    overflow: 'hidden',
    border: '1px solid #d1d5db',
  },
  mapInvalid: {
    borderColor: '#dc2626',
    boxShadow: '0 0 0 1px #dc2626',
  },
  mapLoading: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: '100%',
    backgroundColor: '#f3f4f6',
    color: '#6b7280',
  },
  footer: {
    display: 'flex',
    flexWrap: 'wrap',
    alignItems: 'center',
    justifyContent: 'flex-end',
    gap: '10px',
    padding: '14px 24px',
    borderTop: '1px solid #e5e7eb',
  },
  serverError: {
    flex: '1 1 100%',
    margin: 0,
    padding: '8px 12px',
    borderRadius: '8px',
    backgroundColor: '#fee2e2',
    color: '#991b1b',
    fontSize: '14px',
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
};
