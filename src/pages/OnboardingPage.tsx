import { useMemo, useState } from 'react';
import { useAuthStore, useUIStore, CURRENCIES } from '../store';
import { MODULES } from '../lib/modules';
import Icon from '../components/ui/Icon';
import Logo from '../components/ui/Logo';
import { SplitWords } from '../components/ui/crud';
import { stagger } from '../lib/motion';
import {
  BUSINESS_TYPES, BUSINESS_SIZES, TAX_SCHEMES, FISCAL_MONTHS, COUNTRIES,
  businessTypeById, detectTimezone, listTimezones,
} from '../lib/businessTypes';
import type { OrganizationInput } from '../types';

const STEPS = ['Your business', 'Region & finance', 'Contact details', 'Modules'] as const;
const STEP_NOTES = ['Name and type', 'Currency, tax and fiscal year', 'How customers reach you', 'What to switch on'];
const STEP_TITLES = ['Tell us about the business', 'Where you trade and how you account', 'How people reach you', 'Choose your modules'];
const STEP_LEDES = [
  'Your business type decides which modules we switch on first — you can change them any time.',
  'Money is shown in this currency, and reports follow your financial year.',
  'Used on invoices and documents. All optional — skip what you don’t have yet.',
  'We picked these from your business type. Toggle anything; Settings can change it later.',
];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export default function OnboardingPage() {
  const user = useAuthStore((s) => s.user);
  const createOrganization = useAuthStore((s) => s.createOrganization);
  const signOut = useAuthStore((s) => s.signOut);
  const addToast = useUIStore((s) => s.addToast);

  const timezones = useMemo(listTimezones, []);

  const [step, setStep] = useState(0);
  const [dir, setDir] = useState<'fwd' | 'back'>('fwd');
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
    setDir('fwd');
    setStep((s) => Math.min(s + 1, STEPS.length - 1));
  };

  const back = () => { setError(''); setDir('back'); setStep((s) => Math.max(s - 1, 0)); };

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
    addToast({ message: `${name.trim()} is ready — welcome to Erpixa!`, type: 'success' });
  };

  const field = (
    label: string,
    input: React.ReactNode,
    hint?: string,
    htmlFor?: string,
  ) => (
    <div className="field">
      <label className="field-label" htmlFor={htmlFor}>{label}</label>
      {input}
      {hint && <span className="field-hint">{hint}</span>}
    </div>
  );

  return (
    <div className="onb">
      <aside className="onb-rail" aria-label="Setup progress">
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, position: 'relative' }}>
          <Logo size={34} animate />
          <span className="auth-brand-name">Erpixa</span>
        </div>
        <div>
          <div className="eyebrow" style={{ color: 'var(--cover-ink-2)', marginBottom: 18, position: 'relative' }}>Workspace setup</div>
          <div className="onb-steps">
            <span className="onb-fill" aria-hidden="true" style={{ height: `calc((100% - 36px) * ${step / (STEPS.length - 1)})` }} />
            <ol style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 4 }}>
            {STEPS.map((label, i) => (
              <li key={label} className={`onb-step${i === step ? ' current' : ''}${i < step ? ' done' : ''}`} aria-current={i === step ? 'step' : undefined}>
                <span className="onb-node">
                  {i < step ? <Icon name="check" size={15} strokeWidth={2.4} /> : i + 1}
                </span>
                <span>
                  <span className="onb-step-name" style={{ display: 'block' }}>{label}</span>
                  <span className="onb-step-sub" style={{ display: 'block' }}>{STEP_NOTES[i]}</span>
                </span>
              </li>
            ))}
            </ol>
          </div>
        </div>
        <p className="onb-rail-foot">
          Signed in as <span style={{ color: 'var(--cover-ink)' }}>{user?.email}</span>
        </p>
      </aside>

      <main className="onb-main">
        <div className="onb-top">
          <span className="eyebrow">Step {step + 1} of {STEPS.length}</span>
          <button type="button" className="btn btn-ghost btn-sm" onClick={signOut}>
            <Icon name="logout" size={14} /> Sign out
          </button>
        </div>
        <div className="onb-progress" aria-hidden="true">
          {STEPS.map((s, i) => <i key={s} className={i <= step ? 'on' : ''} />)}
        </div>

        <div className="onb-content">
          <div key={step} className={`step-pane${dir === 'back' ? ' back' : ''}`}>
            <h1 aria-label={STEP_TITLES[step]}><span aria-hidden="true"><SplitWords text={STEP_TITLES[step]} /></span></h1>
            <p className="onb-lede">{STEP_LEDES[step]}</p>
            <div className="onb-fields">
              {step === 0 && (
                <>
                  {field('Business name', (
                    <input
                      id="onb-name"
                      className="tinput tinput-lg"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="e.g. Sharma Electronics"
                      autoFocus
                    />
                  ), undefined, 'onb-name')}
                  <div className="field">
                    <span className="field-label" id="onb-type-label">Business type</span>
                    <div className="type-grid" role="radiogroup" aria-labelledby="onb-type-label">
                      {BUSINESS_TYPES.map((t, i) => {
                        const selected = businessType === t.id;
                        return (
                          <button
                            key={t.id}
                            type="button"
                            role="radio"
                            aria-checked={selected}
                            className="type-item"
                            style={stagger(i, 24)}
                            onClick={() => selectType(t.id)}
                          >
                            <span className="type-icon"><Icon name={t.icon} size={22} /></span>
                            {t.label}
                            {selected && <span className="type-check" aria-hidden="true"><Icon name="check" size={12} strokeWidth={3} /></span>}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                  {field('Industry', (
                    <input
                      id="onb-industry"
                      className="tinput"
                      value={industry}
                      onChange={(e) => setIndustry(e.target.value)}
                      placeholder="e.g. Consumer electronics"
                    />
                  ), 'Optional — helps tailor reports and terminology.', 'onb-industry')}
                </>
              )}

              {step === 1 && (
                <>
                  <div className="grid-2">
                    {field('Country', (
                      <select id="onb-country" className="tinput select" value={country} onChange={(e) => setCountry(e.target.value)}>
                        <option value="">Select country…</option>
                        {COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
                      </select>
                    ), undefined, 'onb-country')}
                    {field('Currency', (
                      <select id="onb-currency" className="tinput select" value={currency} onChange={(e) => setCurrency(e.target.value)}>
                        {CURRENCIES.map((c) => <option key={c.code} value={c.code}>{c.flag} {c.code} — {c.name}</option>)}
                      </select>
                    ), undefined, 'onb-currency')}
                  </div>
                  <div className="grid-2">
                    {field('Timezone', (
                      <select id="onb-tz" className="tinput select" value={timezone} onChange={(e) => setTimezone(e.target.value)}>
                        {timezones.map((tz) => <option key={tz} value={tz}>{tz}</option>)}
                      </select>
                    ), undefined, 'onb-tz')}
                    {field('Financial year starts', (
                      <select id="onb-fy" className="tinput select" value={fiscalStart} onChange={(e) => setFiscalStart(Number(e.target.value))}>
                        {FISCAL_MONTHS.map((m, i) => <option key={m} value={i + 1}>{m}</option>)}
                      </select>
                    ), undefined, 'onb-fy')}
                  </div>
                  <div className="grid-2">
                    {field('Business size', (
                      <select id="onb-size" className="tinput select" value={businessSize} onChange={(e) => setBusinessSize(e.target.value)}>
                        {BUSINESS_SIZES.map((sz) => <option key={sz} value={sz}>{sz} people</option>)}
                      </select>
                    ), undefined, 'onb-size')}
                    {field('GST / VAT', (
                      <select id="onb-tax" className="tinput select" value={taxScheme} onChange={(e) => setTaxScheme(e.target.value as 'none' | 'gst' | 'vat')}>
                        {TAX_SCHEMES.map((t) => <option key={t.id} value={t.id}>{t.label}</option>)}
                      </select>
                    ), undefined, 'onb-tax')}
                  </div>
                  {taxScheme !== 'none' && field(`${taxScheme.toUpperCase()} registration number`, (
                    <input
                      id="onb-taxid"
                      className="tinput"
                      value={taxId}
                      onChange={(e) => setTaxId(e.target.value)}
                      placeholder={taxScheme === 'gst' ? 'e.g. 22AAAAA0000A1Z5' : 'e.g. GB123456789'}
                      style={{ fontFamily: 'var(--font-mono)' }}
                    />
                  ), undefined, 'onb-taxid')}
                </>
              )}

              {step === 2 && (
                <>
                  {field('Business address', (
                    <input
                      id="onb-address"
                      className="tinput"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      placeholder="Street, city, state, postal code"
                    />
                  ), undefined, 'onb-address')}
                  <div className="grid-2">
                    {field('Business email', (
                      <input
                        id="onb-email"
                        className="tinput"
                        type="email"
                        value={businessEmail}
                        onChange={(e) => setBusinessEmail(e.target.value)}
                        placeholder="billing@yourbusiness.com"
                      />
                    ), undefined, 'onb-email')}
                    {field('Phone', (
                      <input
                        id="onb-phone"
                        className="tinput"
                        type="tel"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+91 98765 43210"
                      />
                    ), undefined, 'onb-phone')}
                  </div>
                  {field('Logo URL', (
                    <input
                      id="onb-logo"
                      className="tinput"
                      type="url"
                      value={logoUrl}
                      onChange={(e) => setLogoUrl(e.target.value)}
                      placeholder="https://…/logo.png"
                    />
                  ), 'Optional — shown in the sidebar and on documents.', 'onb-logo')}
                </>
              )}

              {step === 3 && (
                <>
                  {businessType && (
                    <div className="notice notice-info">
                      <Icon name="info" size={16} />
                      <span className="notice-text">Pre-selected for a <strong>{businessTypeById(businessType).label.toLowerCase()}</strong>. {modules.length} of {MODULES.length - 1} modules on.</span>
                    </div>
                  )}
                  <div className="module-grid">
                    {MODULES.filter((m) => m.id !== 'dashboard').map((m, i) => {
                      const enabled = modules.includes(m.id);
                      return (
                        <label key={m.id} className={`module-toggle${enabled ? ' enabled' : ''}`} style={stagger(i)}>
                          <span className="module-icon" aria-hidden="true"><Icon name={m.icon} size={17} /></span>
                          <span style={{ flex: 1, minWidth: 0 }}>
                            <span className="module-name" style={{ display: 'block' }}>{m.label}</span>
                            <span className="field-hint" style={{ display: 'block' }}>{m.blurb}</span>
                          </span>
                          <span className="switch">
                            <input type="checkbox" checked={enabled} onChange={() => toggleModule(m.id)} aria-label={m.label} />
                            <span className="switch-track" />
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </>
              )}

              {error && (
                <div role="alert" className="notice notice-danger">
                  <Icon name="alert" size={16} /><span className="notice-text">{error}</span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="onb-foot">
          <div className="onb-foot-inner">
            <button type="button" className="btn btn-ghost btn-arrow btn-back" onClick={back} disabled={step === 0 || submitting}>
              <Icon name="arrow-left" size={16} /> Back
            </button>
            {step < STEPS.length - 1 ? (
              <button type="button" className="btn btn-primary btn-lg btn-arrow" onClick={next}>
                Continue <Icon name="arrow-right" size={16} />
              </button>
            ) : (
              <button type="button" className="btn btn-primary btn-lg btn-arrow" onClick={finish} disabled={submitting}>
                {submitting ? <><Icon name="spark" size={16} className="spin" /> Creating workspace…</> : <>Open my workspace <Icon name="arrow-right" size={16} /></>}
              </button>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
