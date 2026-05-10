import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@clerk/clerk-react';
import toast from 'react-hot-toast';
import {
  ArrowLeft, ArrowRight, Upload, X, CheckCircle2,
  Info, ImagePlus, DollarSign, BarChart2
} from 'lucide-react';
import Footer from '../components/Footer';
import api from '../lib/api';

const PLATFORMS = ['youtube', 'instagram', 'tiktok', 'facebook', 'twitter', 'linkedin', 'pinterest', 'snapchat', 'twitch', 'discord'];
const NICHES = ['lifestyle', 'fitness', 'food', 'travel', 'tech', 'gaming', 'fashion', 'beauty', 'business', 'education', 'entertainment', 'music', 'art', 'sports', 'health', 'finance', 'other'];
const AGE_RANGES = ['13-17', '18-24', '18-34', '25-34', '25-44', '35-44', '35-54', '45-54', '45+', '55+'];

const STEPS = [
  { id: 1, label: 'Basic Info', icon: <Info size={16} /> },
  { id: 2, label: 'Statistics', icon: <BarChart2 size={16} /> },
  { id: 3, label: 'Pricing', icon: <DollarSign size={16} /> },
  { id: 4, label: 'Images', icon: <ImagePlus size={16} /> },
];

const defaultForm = {
  title: '',
  platform: '',
  username: '',
  niche: '',
  followers_count: '',
  engagement_rate: '',
  monthly_views: '',
  age_range: '',
  country: '',
  price: '',
  description: '',
  monetized: false,
  featured: false,
  images: [], // [{ url, isNew, file }]
};

const ManageListing = () => {
  const { listingId } = useParams();
  const navigate = useNavigate();
  const { isSignedIn, isLoaded } = useAuth();
  const isEdit = Boolean(listingId);
  const currency = import.meta.env.VITE_CURRENCY || '$';

  const [step, setStep] = useState(1);
  const [form, setForm] = useState(defaultForm);
  const [errors, setErrors] = useState({});
  const [loadingExisting, setLoadingExisting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const fileInputRef = useRef();

  // Pre-fill form on edit
  useEffect(() => {
    const fetchListing = async () => {
      if (!isEdit) return;
      try {
        setLoadingExisting(true);
        const { data } = await api.get(`/listings/${listingId}`);
        setForm({
          title: data.title || '',
          platform: data.platform || '',
          username: data.username || '',
          niche: data.niche || '',
          followers_count: data.followers_count || '',
          engagement_rate: data.engagement_rate || '',
          monthly_views: data.monthly_views || '',
          age_range: data.age_range || '',
          country: data.country || '',
          price: data.price || '',
          description: data.description || '',
          monetized: data.monetized || false,
          featured: data.featured || false,
          images: (data.images || []).map((url) => ({ url, isNew: false })),
        });
      } catch (err) {
        toast.error(err.message);
        navigate('/my-listings');
      } finally {
        setLoadingExisting(false);
      }
    };

    fetchListing();
  }, [isEdit, listingId, navigate]);

  useEffect(() => {
    if (isLoaded && !isSignedIn) navigate('/');
  }, [isLoaded, isSignedIn, navigate]);

  useEffect(() => {
    return () => {
      form.images.forEach((img) => {
        if (img.isNew && img.url?.startsWith('blob:')) {
          URL.revokeObjectURL(img.url);
        }
      });
    };
  }, [form.images]);

  const set = (key, val) => {
    setForm(prev => ({ ...prev, [key]: val }));
    if (errors[key]) setErrors(prev => ({ ...prev, [key]: undefined }));
  };

  const validateStep = () => {
    const e = {};
    if (step === 1) {
      if (!form.title.trim()) e.title = 'Title is required';
      if (!form.platform) e.platform = 'Select a platform';
      if (!form.username.trim()) e.username = 'Username is required';
      if (!form.niche) e.niche = 'Select a niche';
    }
    if (step === 2) {
      if (!form.followers_count) e.followers_count = 'Follower count is required';
      if (!form.age_range) e.age_range = 'Age range is required';
    }
    if (step === 3) {
      if (!form.price) e.price = 'Price is required';
    }
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const nextStep = () => {
    if (validateStep()) setStep(s => Math.min(s + 1, 4));
  };
  const prevStep = () => setStep(s => Math.max(s - 1, 1));

  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    if (form.images.length + files.length > 4) {
      toast.error('Maximum 4 images allowed');
      return;
    }
    const next = files.map((file) => ({
      file,
      isNew: true,
      url: URL.createObjectURL(file),
    }));
    setForm((prev) => ({ ...prev, images: [...prev.images, ...next] }));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const removeImage = (index) => {
    setForm((prev) => {
      const img = prev.images[index];
      if (img?.isNew && img.url?.startsWith('blob:')) {
        URL.revokeObjectURL(img.url);
      }
      return { ...prev, images: prev.images.filter((_, i) => i !== index) };
    });
  };

  const handleSubmit = async () => {
    if (!validateStep()) return;
    try {
      setSubmitting(true);

      const payload = new FormData();
      payload.append('title', form.title.trim());
      payload.append('platform', form.platform);
      payload.append('username', form.username.trim());
      payload.append('niche', form.niche);
      payload.append('followers_count', String(form.followers_count));
      if (form.engagement_rate !== '') payload.append('engagement_rate', String(form.engagement_rate));
      if (form.monthly_views !== '') payload.append('monthly_views', String(form.monthly_views));
      payload.append('age_range', form.age_range);
      if (form.country.trim()) payload.append('country', form.country.trim());
      payload.append('price', String(form.price));
      if (form.description.trim()) payload.append('description', form.description.trim());
      payload.append('monetized', String(form.monetized));
      payload.append('featured', String(form.featured));

      const existingImages = form.images.filter((img) => !img.isNew).map((img) => img.url);
      if (isEdit) payload.append('existingImages', JSON.stringify(existingImages));

      form.images
        .filter((img) => img.isNew && img.file)
        .forEach((img) => payload.append('images', img.file));

      if (isEdit) {
        await api.put(`/listings/${listingId}`, payload);
      } else {
        await api.post('/listings', payload);
      }

      toast.success(isEdit ? 'Listing updated successfully!' : 'Listing created successfully!');
      navigate('/my-listings');
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (loadingExisting) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 md:px-16 lg:px-24 xl:px-32 py-6">
        <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-sm text-gray-500 hover:text-indigo-600 transition mb-4">
          <ArrowLeft size={16} /> Back
        </button>
        <h1 className="text-2xl font-semibold text-gray-800">{isEdit ? 'Edit Listing' : 'Create New Listing'}</h1>
        <p className="text-sm text-gray-500 mt-1">{isEdit ? 'Update your account details.' : 'Fill in the details to list your social media account for sale.'}</p>
      </div>

      <div className="px-6 md:px-16 lg:px-24 xl:px-32 py-8">
        <div className="max-w-2xl mx-auto">
          {/* Step Progress */}
          <div className="flex items-center mb-8">
            {STEPS.map((s, i) => (
              <React.Fragment key={s.id}>
                <div className="flex flex-col items-center">
                  <div className={`w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all ${
                    step > s.id ? 'bg-indigo-600 border-indigo-600 text-white' :
                    step === s.id ? 'border-indigo-600 text-indigo-600 bg-white' :
                    'border-gray-200 text-gray-400 bg-white'
                  }`}>
                    {step > s.id ? <CheckCircle2 size={16} /> : s.icon}
                  </div>
                  <p className={`text-xs mt-1.5 font-medium ${step >= s.id ? 'text-indigo-600' : 'text-gray-400'}`}>{s.label}</p>
                </div>
                {i < STEPS.length - 1 && (
                  <div className={`flex-1 h-0.5 mx-2 mb-5 transition-all ${step > s.id ? 'bg-indigo-600' : 'bg-gray-200'}`} />
                )}
              </React.Fragment>
            ))}
          </div>

          {/* Form Card */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 md:p-8">

            {/* Step 1: Basic Info */}
            {step === 1 && (
              <div className="space-y-5">
                <SectionTitle>Basic Information</SectionTitle>
                <Field label="Listing Title" error={errors.title} required>
                  <input
                    type="text"
                    value={form.title}
                    onChange={e => set('title', e.target.value)}
                    placeholder="e.g. Tech YouTube Channel with 120k Subscribers"
                    className={inputCls(errors.title)}
                  />
                </Field>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <Field label="Platform" error={errors.platform} required>
                    <select value={form.platform} onChange={e => set('platform', e.target.value)} className={inputCls(errors.platform)}>
                      <option value="">Select platform</option>
                      {PLATFORMS.map(p => <option key={p} value={p} className="capitalize">{p.charAt(0).toUpperCase() + p.slice(1)}</option>)}
                    </select>
                  </Field>
                  <Field label="Username / Handle" error={errors.username} required>
                    <div className="relative">
                      <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">@</span>
                      <input
                        type="text"
                        value={form.username}
                        onChange={e => set('username', e.target.value)}
                        placeholder="yourhandle"
                        className={`${inputCls(errors.username)} pl-7`}
                      />
                    </div>
                  </Field>
                </div>
                <Field label="Niche / Category" error={errors.niche} required>
                  <select value={form.niche} onChange={e => set('niche', e.target.value)} className={inputCls(errors.niche)}>
                    <option value="">Select niche</option>
                    {NICHES.map(n => <option key={n} value={n} className="capitalize">{n.charAt(0).toUpperCase() + n.slice(1)}</option>)}
                  </select>
                </Field>
              </div>
            )}

            {/* Step 2: Statistics */}
            {step === 2 && (
              <div className="space-y-5">
                <SectionTitle>Account Statistics</SectionTitle>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <Field label="Followers / Subscribers" error={errors.followers_count} required>
                    <input
                      type="number"
                      value={form.followers_count}
                      onChange={e => set('followers_count', e.target.value)}
                      placeholder="e.g. 120000"
                      className={inputCls(errors.followers_count)}
                    />
                  </Field>
                  <Field label="Engagement Rate (%)" hint="Optional">
                    <input
                      type="number"
                      step="0.1"
                      value={form.engagement_rate}
                      onChange={e => set('engagement_rate', e.target.value)}
                      placeholder="e.g. 4.5"
                      className={inputCls()}
                    />
                  </Field>
                  <Field label="Monthly Views / Impressions" hint="Optional">
                    <input
                      type="number"
                      value={form.monthly_views}
                      onChange={e => set('monthly_views', e.target.value)}
                      placeholder="e.g. 850000"
                      className={inputCls()}
                    />
                  </Field>
                  <Field label="Primary Age Range" error={errors.age_range} required>
                    <select value={form.age_range} onChange={e => set('age_range', e.target.value)} className={inputCls(errors.age_range)}>
                      <option value="">Select age range</option>
                      {AGE_RANGES.map(a => <option key={a} value={a}>{a}</option>)}
                    </select>
                  </Field>
                  <Field label="Country" hint="Optional">
                    <input
                      type="text"
                      value={form.country}
                      onChange={e => set('country', e.target.value)}
                      placeholder="e.g. USA"
                      className={inputCls()}
                    />
                  </Field>
                </div>
              </div>
            )}

            {/* Step 3: Pricing & Details */}
            {step === 3 && (
              <div className="space-y-5">
                <SectionTitle>Pricing & Details</SectionTitle>
                <Field label="Asking Price" error={errors.price} required>
                  <div className="relative">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">{currency}</span>
                    <input
                      type="number"
                      value={form.price}
                      onChange={e => set('price', e.target.value)}
                      placeholder="e.g. 7500"
                      className={`${inputCls(errors.price)} pl-7`}
                    />
                  </div>
                </Field>
                <Field label="Description" hint="Describe what's included, why it's valuable, any brand deals, etc.">
                  <textarea
                    value={form.description}
                    onChange={e => set('description', e.target.value)}
                    rows={4}
                    placeholder="Tell buyers what makes this account great..."
                    className={`${inputCls()} resize-none`}
                  />
                </Field>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <ToggleField
                    label="Monetized"
                    description="Account earns revenue from ads / subscriptions"
                    checked={form.monetized}
                    onChange={v => set('monetized', v)}
                  />
                  <ToggleField
                    label="Feature this listing"
                    description="Appear at the top of search results"
                    checked={form.featured}
                    onChange={v => set('featured', v)}
                  />
                </div>
              </div>
            )}

            {/* Step 4: Images */}
            {step === 4 && (
              <div className="space-y-5">
                <SectionTitle>Upload Screenshots / Media</SectionTitle>
                <p className="text-sm text-gray-500">Upload up to 4 screenshots of your analytics, channel art, or account dashboard. Buyers love seeing proof.</p>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="image/*"
                  multiple
                  className="hidden"
                  onChange={handleImageUpload}
                />
                {form.images.length < 4 && (
                  <button
                    type="button"
                    onClick={() => fileInputRef.current.click()}
                    className="w-full border-2 border-dashed border-gray-200 rounded-xl p-8 flex flex-col items-center gap-3 text-gray-400 hover:border-indigo-400 hover:text-indigo-500 transition"
                  >
                    <Upload size={28} />
                    <span className="text-sm font-medium">Click to upload images</span>
                    <span className="text-xs">{form.images.length}/4 uploaded</span>
                  </button>
                )}
                {form.images.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    {form.images.map((img, i) => (
                      <div key={i} className="relative group rounded-xl overflow-hidden aspect-square border border-gray-200">
                        <img src={img.url} alt="" className="w-full h-full object-cover" />
                        <button
                          type="button"
                          onClick={() => removeImage(i)}
                          className="absolute top-1 right-1 bg-black/60 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition"
                        >
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Navigation Buttons */}
            <div className="flex items-center justify-between mt-8 pt-6 border-t border-gray-100">
              {step > 1 ? (
                <button
                  onClick={prevStep}
                  className="flex items-center gap-2 px-4 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-medium hover:border-gray-300 transition"
                >
                  <ArrowLeft size={15} /> Previous
                </button>
              ) : <div />}

              {step < 4 ? (
                <button
                  onClick={nextStep}
                  className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 active:scale-95 transition-all"
                >
                  Next <ArrowRight size={15} />
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={submitting}
                  className="flex items-center gap-2 px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-semibold hover:bg-indigo-700 active:scale-95 transition-all disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  {submitting ? (
                    <>
                      <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                      </svg>
                      {isEdit ? 'Saving...' : 'Creating...'}
                    </>
                  ) : (
                    <><CheckCircle2 size={15} /> {isEdit ? 'Save Changes' : 'Create Listing'}</>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

/* ------ Helper sub-components ------ */

const SectionTitle = ({ children }) => (
  <h2 className="text-base font-semibold text-gray-800 mb-1">{children}</h2>
);

const inputCls = (hasError) =>
  `w-full px-3 py-2.5 border rounded-xl text-sm text-gray-700 outline-none transition bg-white ${
    hasError ? 'border-red-300 focus:border-red-400 focus:ring-2 focus:ring-red-100' : 'border-gray-200 focus:border-indigo-400 focus:ring-2 focus:ring-indigo-50'
  }`;

const Field = ({ label, children, error, hint, required }) => (
  <div className="space-y-1.5">
    <label className="flex items-center gap-1 text-sm font-medium text-gray-700">
      {label} {required && <span className="text-red-400">*</span>}
      {hint && <span className="text-xs text-gray-400 font-normal ml-1">({hint})</span>}
    </label>
    {children}
    {error && <p className="text-xs text-red-500">{error}</p>}
  </div>
);

const ToggleField = ({ label, description, checked, onChange }) => (
  <div className="flex items-start justify-between gap-3 border border-gray-100 rounded-xl p-4 bg-gray-50">
    <div>
      <p className="text-sm font-medium text-gray-700">{label}</p>
      <p className="text-xs text-gray-400 mt-0.5">{description}</p>
    </div>
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative flex-shrink-0 w-10 h-6 rounded-full transition-colors ${checked ? 'bg-indigo-600' : 'bg-gray-200'}`}
    >
      <span className={`absolute top-1 left-1 w-4 h-4 bg-white rounded-full shadow transition-transform ${checked ? 'translate-x-4' : ''}`} />
    </button>
  </div>
);

export default ManageListing;
