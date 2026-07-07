import { useMemo, useState } from 'react';
import { useAuthStore, useUIStore, CURRENCIES } from '../store';
import { MODULES } from '../lib/modules';
import {
  BUSINESS_TYPES, BUSINESS_SIZES, TAX_SCHEMES, FISCAL_MONTHS, COUNTRIES,
  businessTypeById, detectTimezone, listTimezones,
} from '../lib/businessTypes';
import type { OrganizationInput } from '../types';

const STEPS = ['Your business', 'Region & finance', 'Contact details', 'Modules'] as const;

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function OnboardingPage() {
  const user = useAuthStore((s) => s.user);
  const createOrganization = useAuthStore((s) => s.createOrganization);
  const signOut = useAuthStore((s) => s.signOut);
  const addToast = useUIStore((s) => s.addToast);

  const timezones = useMemo(listTimezones, []);

  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  // Step 1 — identity
  const [name, setName] = useState('');
  const [businessType, setBusinessType] = useState('');
  const [industry, setIndustry] = useState('');
  // Step 2 — region & finance
  const [country, setCountry] = useState('');
  const [currency, setCurrency] = useState('USD');
  const [timezone, setTimezone] = useState(detectTimezone());
  const [fiscalStart, setFiscalStart] = useState(1);
  const [businessSize, setBusinessSize] = useState<string>(BUSINESS_SIZES[0]);
  const [taxScheme, setTaxScheme] = useState<'none' | 'gst' | 'vat'>('none');
  const [taxId, setTaxId] = useState('');
  // Step 3 — contact
  const [address, setAddress] = useState('');
  const [businessEmail, setBusinessEmail] = useState(user?.email ?? '');
  const [phone, setPhone] = useState('');
  const [logoUrl, setLogoUrl] = useState('');
  // Step 4 — modules
  const [modules, setModules] = useState<string[]>([]);
  const [modulesTouched, setModulesTouched] = useState(false);

  const selectType = (id: string) => {
    setBusinessType(id);
    if (!modulesTouched) setModules(businessTypeById(id).modules);
    // Sensible currency default for common cases; user can still change it.
    if (id && country === 'India' && currency === 'USD') setCurrency('INR');
  };

  const toggleModule = (id: string) => {
    setModulesTouched(true);
    setModules((m) => (m.includes(id) ? m.filter((x) => x !== id) : [...m, id]));
  };

  const validateStep = (): string => {
    if (step === 0) {
      if (!name.trim()) return 'Enter your business name.';
      if (!businessType) return 'Choose the business type that fits best.';
    }
    if (step === 1) {
      if (!country) return 'Select your country.';
      if ((taxScheme === 'gst' || taxScheme === 'vat') && !taxId.trim()) {
        return `Enter your ${taxScheme.toUpperCase()} registration number.`;
      }
    }
    if (step === 2) {
      if (businessEmail && !EMAIL_RE.test(businessEmail)) return 'Enter a valid business email.';
    }
    if (step === 3) {
      if (modules.length === 0) return 'Enable at least one module.';
    }
    return '';
  };

  const next = () => {
    const err = validateStep();
    if (err) { setError(err); return; }
    setError('');
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  const back = () => { setError(''); setStep((s) => Math.max(s - 1, 0)); };

  const finish = async () => {
    const err = validateStep();
    if (err) { setError(err); return; }
    setSubmitting(true);
    setError('');
    const input: OrganizationInput = {
      name: name.trim(),
      business_type: businessType,
      industry: industry.trim(),
      country,
      currency,
      timezone,
      fiscal_year_start: fiscalStart,
      business_size: businessSize,
      tax_scheme: taxScheme,
      tax_id: taxId.trim(),
      logo_url: logoUrl.trim() || null,
      address: address.trim(),
      business_email: businessEmail.trim(),
      phone: phone.trim(),
      enabled_modules: modules,
    };
    const { error: createError } = await createOrganization(input);
    if (createError) {
      setError(createError);
      setSubmitting(false);
      return;
    }
    addToast({ message: `${name.trim()} is ready — welcome to Erpixa! 🎉`, type: 'success' });
  };

  const field = (
    label: string,
    input: React.ReactNode,
    hint?: string
  ) => (
    <div className="input-wrap">
      <label className="input-label">{label}</label>
      {input}
      {hint && <span style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{hint}</span>}
    </div>
  );

  return (
    <div className="onboarding-page">
      <div className="login-bg-blob" style={{ top: -120, left: -100 }} aria-hidden="true" />
      <div className="login-bg-blob" style={{ bottom: -140, right: -120, animationDelay: '1.2s' }} aria-hidden="true" />

      <div className="onboarding-card">
        <div className="onboarding-header">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
            <div>
              <div style={{ fontFamily: "'Outfit',sans-serif", fontWeight: 800, fontSize: '1.35rem', color: 'var(--text-primary)' }}>
                Set up your workspace
              </div>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginTop: 4 }}>
                Step {step + 1} of {STEPS.length} — {STEPS[step]}
              </div>
            </div>
            <button
              type="button"
              className="btn btn-ghost btn-sm"
              onClick={signOut}
              title="Sign out"
            >
              Sign out
            </button>
          </div>
          <div className="onboarding-progress" aria-hidden="true">
            {STEPS.map((s, i) => <span key={s} className={i <= step ? 'done' : ''} />)}
          </div>
        </div>

        <div className="onboarding-body">
          {step === 0 && (
            <>
              {field('Business name *', (
                <input
                  className="tinput"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Sharma Electronics"
                  autoFocus
                />
              ))}
              <div className="input-wrap">
                <label className="input-label">Business type *</label>
                <div className="type-grid" role="radiogroup" aria-label="Business type">
                  {BUSINESS_TYPES.map((t) => (
                    <button
                      key={t.id}
                      type="button"
                      role="radio"
                      aria-checked={businessType === t.id}
                      className={`type-item${businessType === t.id ? ' selected' : ''}`}
                      onClick={() => selectType(t.id)}
                    >
                      <span className="type-icon" aria-hidden="true">{t.icon}</span>
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
              {field('Industry', (
                <input
                  className="tinput"
                  value={industry}
                  onChange={(e) => setIndustry(e.target.value)}
                  placeholder="e.g. Consumer Electronics"
                />
              ), 'Optional — helps tailor reports and terminology.')}
            </>
          )}

          {step === 1 && (
            <>
              <div className="grid-2" style={{ gap: 14 }}>
                {field('Country *', (
                  <select className="tinput select" value={country} onChange={(e) => setCountry(e.target.value)}>
                    <option value="">Select country…</option>
                    {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                ))}
                {field('Currency *', (
                  <select className="tinput select" value={currency} onChange={(e) => setCurrency(e.target.value)}>
                    {CURRENCIES.map((c) => <option key={c.code} value={c.code}>{c.flag} {c.code} — {c.name}</option>)}
                  </select>
                ))}
              </div>
              <div className="grid-2" style={{ gap: 14 }}>
                {field('Timezone *', (
                  <select className="tinput select" value={timezone} onChange={(e) => setTimezone(e.target.value)}>
                    {timezones.map((tz) => <option key={tz} value={tz}>{tz}</option>)}
                  </select>
                ))}
                {field('Financial year starts *', (
                  <select className="tinput select" value={fiscalStart} onChange={(e) => setFiscalStart(Number(e.target.value))}>
                    {FISCAL_MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
                  </select>
                ))}
              </div>
              <div className="grid-2" style={{ gap: 14 }}>
                {field('Business size *', (
                  <select className="tinput select" value={businessSize} onChange={(e) => setBusinessSize(e.target.value)}>
                    {BUSINESS_SIZES.map((s) => <option key={s} value={s}>{s} people</option>)}
                  </select>
                ))}
                {field('GST / VAT *', (
                  <select className="tinput select" value={taxScheme} onChange={(e) => setTaxScheme(e.target.value as 'none' | 'gst' | 'vat')}>
                    {TAX_SCHEMES.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
                  </select>
                ))}
              </div>
              {taxScheme !== 'none' && field(`${taxScheme.toUpperCase()} registration number *`, (
                <input
                  className="tinput"
                  value={taxId}
                  onChange={(e) => setTaxId(e.target.value)}
                  placeholder={taxScheme === 'gst' ? 'e.g. 22AAAAA0000A1Z5' : 'e.g. GB123456789'}
                />
              ))}
            </>
          )}

          {step === 2 && (
            <>
              {field('Business address', (
                <input
                  className="tinput"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder="Street, city, state, postal code"
                />
              ))}
              <div className="grid-2" style={{ gap: 14 }}>
                {field('Business email', (
                  <input
                    className="tinput"
                    type="email"
                    value={businessEmail}
                    onChange={(e) => setBusinessEmail(e.target.value)}
                    placeholder="billing@yourbusiness.com"
                  />
                ))}
                {field('Phone', (
                  <input
                    className="tinput"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+91 98765 43210"
                  />
                ))}
              </div>
              {field('Logo URL', (
                <input
                  className="tinput"
                  type="url"
                  value={logoUrl}
                  onChange={(e) => setLogoUrl(e.target.value)}
                  placeholder="https://…/logo.png"
                />
              ), 'Optional — shown in the sidebar and on documents.')}
            </>
          )}

          {step === 3 && (
            <>
              <div style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                Based on your business type
                {businessType && <strong> ({businessTypeById(businessType).label})</strong>},
                we picked the modules below. Toggle anything you like — you can change this
                any time in Settings.
              </div>
              <div className="module-grid">
                {MODULES.filter((m) => m.id !== 'dashboard').map((m) => {
                  const enabled = modules.includes(m.id);
                  return (
                    <label key={m.id} className={`module-toggle${enabled ? ' enabled' : ''}`}>
                      <input
                        type="checkbox"
                        checked={enabled}
                        onChange={() => toggleModule(m.id)}
                      />
                      <span aria-hidden="true">{m.icon}</span>
                      <span style={{ flex: 1 }}>{m.label}</span>
                    </label>
                  );
                })}
              </div>
            </>
          )}

          {error && (
            <div role="alert" style={{ padding: '10px 14px', background: 'var(--danger-bg)', border: '1px solid var(--danger-border)', borderRadius: 10, color: 'var(--danger)', fontSize: '0.85rem' }}>
              {error}
            </div>
          )}
        </div>

        <div className="onboarding-footer">
          <button type="button" className="btn btn-ghost" onClick={back} disabled={step === 0 || submitting}>
            ← Back
          </button>
          {step < STEPS.length - 1 ? (
            <button type="button" className="btn btn-primary" onClick={next}>
              Continue →
            </button>
          ) : (
            <button type="button" className="btn btn-primary" onClick={finish} disabled={submitting}>
              {submitting ? 'Creating workspace…' : 'Launch Erpixa 🚀'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
