import { useState, useEffect, useMemo, useRef } from 'react';

import { Card, CardContent } from '../ui/card.jsx';
import { Button } from '../ui/button.jsx';
import { Input } from '../ui/input.jsx';
import { Badge } from '../ui/badge.jsx';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs.jsx';
import { toast } from 'sonner';
import { 
  User, 
  Building2, 
  ArrowRight, 
  Linkedin, 
  Globe, 
  Mail, 
  Rocket,
  Info,
  Loader2,
  FileText,
  Briefcase,
  Trophy,
  Users,
  Twitter,
  Facebook,
  Phone,
  Layout,
  Star,
  CheckCircle,
  ShieldCheck,
  Image as ImageIcon,
  Search,
  ChevronDown,
  Check,
  Plus,
  X
} from 'lucide-react';

import PublicRichEditor from './PublicRichEditor.jsx';
import Turnstile from './Turnstile.jsx';
import publicAPI from '../../lib/publicApi.js';
import { useAuth } from '../../lib/auth.jsx';

const SearchableSelect = ({
  options = [],
  value = '',
  onChange,
  placeholder = 'Select option...',
  customLabel = '+ Add Custom / New',
  allowCustom = true
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [isCustomMode, setIsCustomMode] = useState(false);
  const containerRef = useRef(null);

  const formattedOptions = useMemo(() => {
    return options.map(opt => {
      if (typeof opt === 'object' && opt !== null) {
        const label = opt.name || opt.title || opt.id;
        const key = opt.id || label;
        return { key: String(key), label: String(label) };
      }
      return { key: String(opt), label: String(opt) };
    });
  }, [options]);

  const filteredOptions = useMemo(() => {
    if (!search.trim()) return formattedOptions;
    const q = search.toLowerCase();
    return formattedOptions.filter(opt => opt.label.toLowerCase().includes(q));
  }, [formattedOptions, search]);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (labelVal) => {
    if (labelVal === '__custom__') {
      setIsCustomMode(true);
      onChange('');
    } else {
      setIsCustomMode(false);
      onChange(labelVal);
    }
    setIsOpen(false);
    setSearch('');
  };

  return (
    <div className={`relative w-full ${isOpen ? 'z-40' : 'z-10'}`} ref={containerRef}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 h-12 sm:h-14 text-sm font-medium text-left flex items-center justify-between focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none transition-all hover:bg-stone-100/70"
      >
        <span className={value ? "text-stone-900 font-semibold truncate" : "text-stone-400"}>
          {value || placeholder}
        </span>
        <ChevronDown className={`w-4 h-4 text-stone-400 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute z-50 left-0 right-0 mt-2 bg-white border border-stone-200 rounded-2xl shadow-2xl p-2 animate-in fade-in-50 zoom-in-95 duration-150">
          <div className="p-2 border-b border-stone-100 flex items-center gap-2 mb-1">
            <Search className="w-4 h-4 text-stone-400 flex-shrink-0" />
            <input
              type="text"
              autoFocus
              className="w-full text-sm font-medium bg-transparent focus:outline-none placeholder:text-stone-400"
              placeholder={`Search...`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            {search && (
              <button type="button" onClick={() => setSearch('')} className="text-stone-400 hover:text-stone-600">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          <div className="max-h-56 overflow-y-auto space-y-0.5 pr-1" style={{ scrollbarWidth: 'thin' }}>
            {filteredOptions.length > 0 ? (
              filteredOptions.map((opt) => (
                <button
                  key={opt.key}
                  type="button"
                  onClick={() => handleSelect(opt.label)}
                  className={`w-full text-left px-3 py-2.5 rounded-xl text-sm font-medium transition-colors flex items-center justify-between ${
                    value === opt.label ? 'bg-emerald-50 text-emerald-900 font-bold' : 'text-stone-700 hover:bg-stone-100'
                  }`}
                >
                  <span className="truncate">{opt.label}</span>
                  {value === opt.label && <Check className="w-4 h-4 text-emerald-600 flex-shrink-0" />}
                </button>
              ))
            ) : (
              <div className="p-3 text-xs text-stone-400 text-center font-medium">No matching items found</div>
            )}

            {allowCustom && (
              <button
                type="button"
                onClick={() => handleSelect('__custom__')}
                className="w-full text-left px-3 py-2.5 rounded-xl text-sm font-bold text-emerald-700 hover:bg-emerald-50 transition-colors border-t border-stone-100 mt-1 flex items-center gap-2"
              >
                <Plus className="w-4 h-4" />
                {customLabel}
              </button>
            )}
          </div>
        </div>
      )}

      {isCustomMode && (
        <div className="mt-2">
          <Input
            placeholder={`Type custom ${placeholder.toLowerCase()}...`}
            className="bg-stone-50 border-emerald-500 border-2 h-12 sm:h-14 rounded-xl"
            value={value}
            onChange={(e) => onChange(e.target.value)}
          />
        </div>
      )}
    </div>
  );
};

const TURNSTILE_SITE_KEY = import.meta.env.PUBLIC_TURNSTILE_SITE_KEY || import.meta.env.REACT_APP_TURNSTILE_SITE_KEY || '1x00000000000000000000AA';

const SubmissionPage = ({ initialMetadata }) => {
  let user = null;
  try {
    const auth = useAuth();
    user = auth?.user || null;
  } catch (e) {
    // AuthProvider fallback
  }
  const [activeTab, setActiveTab] = useState('entrepreneur');
  const [loading, setLoading] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState('');

  const hasInitialData = initialMetadata && (
    (initialMetadata.industries?.length > 0) ||
    (initialMetadata.cities?.length > 0) ||
    (initialMetadata.categories?.length > 0)
  );

  const [metadata, setMetadata] = useState(
    hasInitialData ? initialMetadata : {
      categories: [],
      industries: [],
      listing_types: [],
      startup_stages: [],
      cities: [],
      employee_sizes: []
    }
  );
  const [metadataLoading, setMetadataLoading] = useState(!hasInitialData);

  // Form States
  const [pData, setPData] = useState({
    name: '',
    designation: '',
    company_name: '',
    industry: '', 
    category: '', 
    startup_stage: '',
    city: '',
    expertise: '',
    education: '',
    founded_year: '',
    excerpt: '', 
    content: '', 
    email: '',
    social_linkedin: '',
    social_twitter: '',
    social_facebook: '',
    photo: '',
    contact_email: '', 
    contact_phone: ''  
  });

  const [lData, setLData] = useState({
    business_name: '',
    category: '', 
    industry: '', 
    headquarters: '',
    city: '',
    country: '',
    listing_type: '',
    website: '',
    employee_size: '',
    founded_year: '',
    expertise: '',
    ceo_name: '',
    founder_name: '',
    excerpt: '', 
    content: '', 
    life_at_company: '',
    logo: '',
    cover_image: '',
    email: '',
    phone: '',
    social_linkedin: '',
    social_twitter: '',
    social_facebook: '',
    contact_email: '', 
    contact_phone: ''  
  });

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const typeParam = params.get('type') || params.get('tab');
      if (typeParam === 'directory' || typeParam === 'business' || typeParam === 'listing') {
        setActiveTab('listing');
      } else if (typeParam === 'entrepreneur' || typeParam === 'profile' || typeParam === 'founder') {
        setActiveTab('entrepreneur');
      }
    }
  }, []);

  useEffect(() => {
    if (user?.email) {
      setPData(prev => ({
        ...prev,
        email: prev.email || user.email,
        contact_email: prev.contact_email || user.email,
        name: prev.name || user.name || ''
      }));
      setLData(prev => ({
        ...prev,
        email: prev.email || user.email,
        contact_email: prev.contact_email || user.email
      }));
    }
  }, [user]);

  useEffect(() => {
    // Skip client-side fetch if metadata was already SSR pre-loaded
    if (hasInitialData) {
      setMetadataLoading(false);
      return;
    }
    const loadMetadata = async () => {
      try {
        const res = await publicAPI.listMetadata(turnstileToken || TURNSTILE_SITE_KEY);
        const metaObj = res?.data || res || {};
        setMetadata({
          categories: metaObj.categories || [],
          industries: metaObj.industries || [],
          listing_types: metaObj.listing_types || [],
          startup_stages: metaObj.startup_stages || [],
          employee_sizes: metaObj.employee_sizes || [],
          cities: metaObj.cities || []
        });
      } catch (err) {
        console.warn('Metadata fetch failed, form will still work:', err);
      } finally {
        setMetadataLoading(false);
      }
    };
    loadMetadata();
  }, []);


  const handlePSubmit = async (e) => {
    e.preventDefault();
    if (!turnstileToken) return toast.error('Please complete the Captcha');
    if (!pData.name || !pData.email) return toast.error('Name and Display Email are required');
    if (!pData.photo) return toast.error('Profile Photo URL is required');
    if (!pData.contact_email) return toast.error('Private Contact Email is required for moderation');

    setLoading(true);
    try {
      await publicAPI.submitEntrepreneur(pData, turnstileToken);
      window.location.href = `/submit/success?name=${encodeURIComponent(pData.name)}&type=entrepreneur`;
    } catch (err) {
      toast.error(err.message);
      setLoading(false);
    }
  };

  const handleLSubmit = async (e) => {
    e.preventDefault();
    if (!turnstileToken) return toast.error('Please complete the Captcha');
    if (!lData.business_name) return toast.error('Business Name is required');
    if (!lData.logo) return toast.error('Company Logo URL is required');
    if (!lData.contact_email) return toast.error('Private Contact Email is required for moderation');

    setLoading(true);
    try {
      await publicAPI.submitListing(lData, turnstileToken);
      window.location.href = `/submit/success?name=${encodeURIComponent(lData.business_name)}&type=listing`;
    } catch (err) {
      toast.error(err.message);
      setLoading(false);
    }
  };

  const handleASubmit = async (e) => {
    e.preventDefault();
    if (!turnstileToken) return toast.error('Please complete the Captcha');
    if (!aData.title) return toast.error('Article Title is required');
    if (!aData.content) return toast.error('Article Content is required');
    if (!aData.contact_email) return toast.error('Private Contact Email is required for moderation');

    setLoading(true);
    try {
      await publicAPI.submitArticle(aData, turnstileToken);
      window.location.href = `/submit/success?name=${encodeURIComponent(aData.title)}&type=article`;
    } catch (err) {
      toast.error(err.message);
      setLoading(false);
    }
  };

  const SectionTitle = ({ icon: Icon, title, subtitle }) => (
    <div className="flex items-center gap-4 mb-6 sm:mb-8">
      <div className="w-10 h-10 sm:w-12 sm:h-12 bg-emerald-100 rounded-xl sm:rounded-2xl flex items-center justify-center text-emerald-700 shadow-sm shrink-0">
        <Icon size={20} className="sm:size-6" />
      </div>
      <div>
        <h3 className="text-base sm:text-lg font-bold text-stone-900 leading-none mb-1">{title}</h3>
        <p className="text-sm sm:text-sm text-stone-500">{subtitle}</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-stone-50 py-10 sm:py-16 px-4">


      <div className="max-w-5xl mx-auto overflow-x-hidden">
        <div className="text-center mb-10 sm:mb-16">
          <Badge className="bg-emerald-100 text-emerald-900 border-none mb-4 sm:mb-6 px-4 sm:px-6 py-2 uppercase tracking-[0.2em] text-[9px] sm:text-[10px] font-black shadow-sm">
            Community Ecosystem
          </Badge>
          <h1 className="text-3xl sm:text-4xl lg:text-6xl font-black text-stone-900 mb-6 sm:mb-8 tracking-tight">
            Apply to be <span className="text-emerald-900">Listed</span>
          </h1>
          <p className="text-base sm:text-xl text-stone-600 max-w-2xl mx-auto leading-relaxed font-medium">
            Join the most comprehensive directory of startups and visionaries in Bangladesh.
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-8 sm:space-y-12">
          <div className="flex justify-center w-full">
            <TabsList className="bg-stone-200/50 p-1 rounded-xl sm:rounded-2xl h-auto flex gap-1 w-full max-w-lg border border-stone-200/50">
              <TabsTrigger 
                value="entrepreneur" 
                className="flex-1 rounded-lg sm:rounded-xl px-2 sm:px-10 py-3 sm:py-4 data-[state=active]:bg-white data-[state=active]:text-emerald-900 data-[state=active]:shadow-lg text-stone-500 font-bold text-sm sm:text-sm transition-all"
              >
                <User className="hidden sm:inline w-4 h-4 mr-2" />
                Founder Spotlight
              </TabsTrigger>
              <TabsTrigger 
                value="listing" 
                className="flex-1 rounded-lg sm:rounded-xl px-2 sm:px-10 py-3 sm:py-4 data-[state=active]:bg-white data-[state=active]:text-emerald-900 data-[state=active]:shadow-lg text-stone-500 font-bold text-sm sm:text-sm transition-all"
              >
                <Building2 className="hidden sm:inline w-4 h-4 mr-2" />
                Directory
              </TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="entrepreneur" className="animate-in fade-in slide-in-from-bottom-8 duration-700 ease-out">
            <div className="grid lg:grid-cols-4 gap-8">
              {/* Sidebar Info */}
              <div className="hidden lg:block space-y-6">
                <Card className="bg-emerald-900 text-white border-none rounded-[2.5rem] p-10 shadow-2xl shadow-emerald-900/40">
                  <Rocket className="w-12 h-12 text-emerald-400 mb-8" />
                  <h2 className="text-3xl font-black mb-6">Forge Your Legend</h2>
                  <p className="text-emerald-100/70 text-sm leading-relaxed mb-10 font-medium">
                    Your personal growth inspires thousands. Tell us the story behind the founder.
                  </p>
                  <div className="space-y-6">
                    {[
                      { icon: Star, text: 'Personal Branding' },
                      { icon: Users, text: 'Network Growth' },
                      { icon: Trophy, text: 'Investor Visibility' }
                    ].map((item, i) => (
                      <div key={i} className="flex items-center gap-4 text-emerald-100/90 text-sm">
                        <div className="w-8 h-8 rounded-full bg-emerald-800/50 flex items-center justify-center">
                          <item.icon className="w-4 h-4 text-emerald-400" />
                        </div>
                        <span className="font-bold">{item.text}</span>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>

              {/* Main Form */}
              <div className="lg:col-span-3">
                <form onSubmit={handlePSubmit} className="space-y-6 sm:space-y-8">
                  <Card className="rounded-[1.5rem] sm:rounded-[2.5rem] border-none shadow-xl shadow-stone-200/50">
                    <CardContent className="p-6 sm:p-12 space-y-8 sm:space-y-10">
                      <SectionTitle 
                        icon={Briefcase} 
                        title="Identity & Role" 
                        subtitle="How should the community know you?" 
                      />
                      
                      <div className="grid sm:grid-cols-2 gap-6 sm:gap-8">
                        <div className="space-y-3">
                          <label className="text-sm sm:text-sm font-bold text-stone-700 ml-1 uppercase tracking-wider">Full Name *</label>
                          <p className="text-[10px] text-stone-500 ml-1 mb-1 font-medium leading-tight">Your legal name or the name you are professionally known as.</p>
                          <Input 
                            placeholder="e.g. Nasir Uddin" 
                            className="bg-stone-50 border-stone-200 h-12 sm:h-14 rounded-xl focus:ring-emerald-500"
                            value={pData.name}
                            onChange={(e) => setPData({...pData, name: e.target.value})}
                            required
                          />
                        </div>
                        <div className="space-y-3">
                          <label className="text-sm sm:text-sm font-bold text-stone-700 ml-1 uppercase tracking-wider">Designation *</label>
                          <p className="text-[10px] text-stone-500 ml-1 mb-1 font-medium leading-tight">Your official title or primary role (e.g., Founder, CEO).</p>
                          <Input 
                            placeholder="e.g. Managing Director" 
                            className="bg-stone-50 border-stone-200 h-12 sm:h-14 rounded-xl"
                            value={pData.designation}
                            onChange={(e) => setPData({...pData, designation: e.target.value})}
                            required
                          />
                        </div>
                      </div>

                      <div className="space-y-3">
                        <label className="text-sm sm:text-sm font-bold text-stone-700 ml-1 uppercase tracking-wider">Company Name *</label>
                        <Input 
                          placeholder="Your organization" 
                          className="bg-stone-50 border-stone-200 h-12 sm:h-14 rounded-xl"
                          value={pData.company_name}
                          onChange={(e) => setPData({...pData, company_name: e.target.value})}
                          required
                        />
                      </div>

                      <div className="grid sm:grid-cols-2 gap-6 sm:gap-8">
                        <div className="space-y-3">
                          <label className="text-sm sm:text-sm font-bold text-stone-700 ml-1 uppercase tracking-wider">Category</label>
                          <p className="text-[10px] text-stone-500 ml-1 mb-1 font-medium leading-tight">The specific niche or sector you focus on.</p>
                          <SearchableSelect 
                            options={metadata.categories}
                            value={pData.category}
                            onChange={(val) => setPData({...pData, category: val})}
                            placeholder="Select Category"
                            customLabel="+ Add Custom / New Category"
                          />
                        </div>
                        <div className="space-y-3">
                          <label className="text-sm sm:text-sm font-bold text-stone-700 ml-1 uppercase tracking-wider">Industry</label>
                          <p className="text-[10px] text-stone-500 ml-1 mb-1 font-medium leading-tight">The broader market industry you operate in.</p>
                          <SearchableSelect 
                            options={metadata.industries}
                            value={pData.industry}
                            onChange={(val) => setPData({...pData, industry: val})}
                            placeholder="Select Industry"
                            customLabel="+ Add Custom / New Industry"
                          />
                        </div>
                      </div>

                      <div className="grid sm:grid-cols-2 gap-6 sm:gap-8">
                        <div className="space-y-3">
                          <label className="text-sm sm:text-sm font-bold text-stone-700 ml-1 uppercase tracking-wider">Startup Stage</label>
                          <SearchableSelect 
                            options={metadata.startup_stages?.length > 0 ? metadata.startup_stages : ['Idea Stage', 'Seed Stage', 'Early Growth', 'Scaling', 'Established']}
                            value={pData.startup_stage}
                            onChange={(val) => setPData({...pData, startup_stage: val})}
                            placeholder="Select Startup Stage"
                            customLabel="+ Add Custom Stage"
                          />
                        </div>
                        <div className="space-y-3">
                          <label className="text-sm sm:text-sm font-bold text-stone-700 ml-1 uppercase tracking-wider">City</label>
                          <SearchableSelect 
                            options={metadata.cities}
                            value={pData.city}
                            onChange={(val) => setPData({...pData, city: val})}
                            placeholder="Select City"
                            customLabel="+ Add Custom City"
                          />
                        </div>
                      </div>

                      <div className="grid sm:grid-cols-3 gap-6 sm:gap-8">
                        <div className="space-y-3">
                          <label className="text-sm sm:text-sm font-bold text-stone-700 ml-1 uppercase tracking-wider">Expertise</label>
                          <Input 
                            placeholder="e.g. AI, Product Strategy" 
                            className="bg-stone-50 border-stone-200 h-12 sm:h-14 rounded-xl"
                            value={pData.expertise}
                            onChange={(e) => setPData({...pData, expertise: e.target.value})}
                          />
                        </div>
                        <div className="space-y-3">
                          <label className="text-sm sm:text-sm font-bold text-stone-700 ml-1 uppercase tracking-wider">Education</label>
                          <Input 
                            placeholder="e.g. B.Sc in CSE, BUET" 
                            className="bg-stone-50 border-stone-200 h-12 sm:h-14 rounded-xl"
                            value={pData.education}
                            onChange={(e) => setPData({...pData, education: e.target.value})}
                          />
                        </div>
                        <div className="space-y-3">
                          <label className="text-sm sm:text-sm font-bold text-stone-700 ml-1 uppercase tracking-wider">Founded Year</label>
                          <Input 
                            placeholder="e.g. 2021" 
                            className="bg-stone-50 border-stone-200 h-12 sm:h-14 rounded-xl"
                            value={pData.founded_year}
                            onChange={(e) => setPData({...pData, founded_year: e.target.value})}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="rounded-[1.5rem] sm:rounded-[2.5rem] border-none shadow-xl shadow-stone-200/50 overflow-hidden">
                    <CardContent className="p-6 sm:p-12 space-y-8 sm:space-y-10">
                      <SectionTitle 
                        icon={FileText} 
                        title="Your Narrative" 
                        subtitle="The story behind the success." 
                      />

                      <div className="space-y-3">
                        <label className="text-sm sm:text-sm font-bold text-stone-700 ml-1 flex items-center gap-2 uppercase tracking-wider">
                          <ImageIcon size={14} className="text-stone-400" /> Profile Photo URL <span className="text-red-500">*</span>
                        </label>
                        <Input 
                          placeholder="https://example.com/your-photo.jpg" 
                          className="bg-stone-50 border-stone-200 h-12 sm:h-14 rounded-xl shadow-inner"
                          value={pData.photo}
                          onChange={(e) => setPData({...pData, photo: e.target.value})}
                        />
                        <p className="text-[10px] text-amber-600 font-bold uppercase tracking-tighter mt-2">Preferred: Square 400x400</p>
                      </div>

                      <div className="space-y-3">
                        <label className="text-sm sm:text-sm font-bold text-stone-700 ml-1 uppercase tracking-wider">Short Bio (Max 400 chars)</label>
                        <p className="text-[10px] text-stone-500 ml-1 mb-1 font-medium leading-tight">A punchy, concise summary of who you are and your top achievements. This will appear on preview cards.</p>
                        <textarea 
                          className="w-full bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none transition-all min-h-[100px] p-4 text-sm"
                          placeholder="A quick summary for list views..."
                          value={pData.excerpt}
                          onChange={(e) => {
                            if (e.target.value.length <= 400) setPData({...pData, excerpt: e.target.value});
                          }}
                        />
                        <div className="flex justify-end text-[10px] font-bold text-stone-400">
                          {pData.excerpt.length}/400
                        </div>
                      </div>

                      <div className="space-y-6">
                        <div className="flex flex-col gap-1 mb-2">
                          <label className="text-sm sm:text-sm font-bold text-stone-700 ml-1 uppercase tracking-wider">Detailed Journey (Content)</label>
                          <p className="text-sm text-stone-500 ml-1">Share the full story of your entrepreneurial journey. Mention early struggles, major milestones, key pivots, and what drives you. Use headings (H2, H3) to structure your story.</p>
                        </div>
                        <PublicRichEditor 
                          value={pData.content}
                          onChange={(html) => setPData({...pData, content: html})}
                          placeholder="Tell your life story, the challenges you faced, and your vision for the future..."
                        />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="rounded-[1.5rem] sm:rounded-[2.5rem] border-none shadow-xl shadow-stone-200/50 overflow-hidden">
                    <CardContent className="p-6 sm:p-12 space-y-8 sm:space-y-10">
                      <SectionTitle 
                        icon={Globe} 
                        title="Display Socials" 
                        subtitle="Publicly visible links on your profile." 
                      />

                      <div className="grid sm:grid-cols-2 gap-6 sm:gap-8">
                        <div className="space-y-3">
                          <label className="text-sm sm:text-sm font-bold text-stone-700 ml-1 flex items-center gap-2 uppercase tracking-wider">
                            <Mail size={14} className="text-stone-400" /> Display Email *
                          </label>
                          <Input 
                            type="email"
                            placeholder="public@example.com" 
                            className="bg-stone-50 border-stone-200 h-12 sm:h-14 rounded-xl"
                            value={pData.email}
                            onChange={(e) => setPData({...pData, email: e.target.value})}
                            required
                          />
                        </div>
                        <div className="space-y-3">
                          <label className="text-sm sm:text-sm font-bold text-stone-700 ml-1 flex items-center gap-2 uppercase tracking-wider">
                            <Linkedin size={14} className="text-blue-600" /> LinkedIn Profile
                          </label>
                          <Input 
                            placeholder="linkedin.com/in/username" 
                            className="bg-stone-50 border-stone-200 h-12 sm:h-14 rounded-xl"
                            value={pData.social_linkedin}
                            onChange={(e) => setPData({...pData, social_linkedin: e.target.value})}
                          />
                        </div>
                      </div>

                      <div className="grid sm:grid-cols-2 gap-6 sm:gap-8">
                        <div className="space-y-3">
                          <label className="text-sm sm:text-sm font-bold text-stone-700 ml-1 flex items-center gap-2 uppercase tracking-wider">
                            <Twitter size={14} className="text-sky-500" /> Twitter URL
                          </label>
                          <Input 
                            placeholder="twitter.com/username" 
                            className="bg-stone-50 border-stone-200 h-12 sm:h-14 rounded-xl"
                            value={pData.social_twitter}
                            onChange={(e) => setPData({...pData, social_twitter: e.target.value})}
                          />
                        </div>
                        <div className="space-y-3">
                          <label className="text-sm sm:text-sm font-bold text-stone-700 ml-1 flex items-center gap-2 uppercase tracking-wider">
                            <Facebook size={14} className="text-blue-700" /> Facebook URL
                          </label>
                          <Input 
                            placeholder="facebook.com/username" 
                            className="bg-stone-50 border-stone-200 h-12 sm:h-14 rounded-xl"
                            value={pData.social_facebook}
                            onChange={(e) => setPData({...pData, social_facebook: e.target.value})}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="rounded-[1.5rem] sm:rounded-[2.5rem] border-stone-100 bg-stone-100/50 shadow-inner overflow-hidden">
                    <CardContent className="p-6 sm:p-12 space-y-8 sm:space-y-10">
                      <SectionTitle 
                        icon={ShieldCheck} 
                        title="Moderation Contact" 
                        subtitle="Private information for our editorial team only. Please provide accurate details so editors can reach out if content polishing is needed." 
                      />

                      <div className="grid sm:grid-cols-2 gap-6 sm:gap-8">
                        <div className="space-y-3">
                          <label className="text-sm sm:text-sm font-bold text-stone-700 ml-1 uppercase tracking-wider">Private Email *</label>
                          <Input 
                            type="email"
                            placeholder="We will contact you here" 
                            className="bg-white border-stone-200 h-12 sm:h-14 rounded-xl"
                            value={pData.contact_email}
                            onChange={(e) => setPData({...pData, contact_email: e.target.value})}
                            required
                          />
                        </div>
                        <div className="space-y-3">
                          <label className="text-sm sm:text-sm font-bold text-stone-700 ml-1 uppercase tracking-wider">Contact Phone</label>
                          <Input 
                            placeholder="+880 xxxxxxxxxx" 
                            className="bg-white border-stone-200 h-12 sm:h-14 rounded-xl"
                            value={pData.contact_phone}
                            onChange={(e) => setPData({...pData, contact_phone: e.target.value})}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <div className="flex flex-col items-center gap-6 sm:gap-8 py-4 px-2">
                    <Turnstile siteKey={TURNSTILE_SITE_KEY} onSuccess={setTurnstileToken} />
                    <Button 
                      type="submit" 
                      disabled={loading || !turnstileToken}
                      className="w-full max-w-md bg-emerald-900 hover:bg-emerald-800 text-white h-14 sm:h-16 rounded-xl sm:rounded-2xl font-black text-base sm:text-lg transition-all shadow-xl shadow-emerald-900/40 hover:scale-[1.01] active:scale-95 flex items-center justify-center gap-3"
                    >
                      {loading ? <><Loader2 className="w-6 h-6 animate-spin" /> Submitting...</> : <>Submit Application <ArrowRight size={20} /></>}
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="listing" className="animate-in fade-in slide-in-from-bottom-8 duration-700 ease-out">
             <div className="grid lg:grid-cols-4 gap-8">
              {/* Sidebar Info */}
              <div className="hidden lg:block space-y-6">
                <Card className="bg-[#121c17] text-white border-none rounded-[2.5rem] p-10 shadow-2xl shadow-stone-900/40">
                  <Building2 className="w-12 h-12 text-emerald-400 mb-8" />
                  <h2 className="text-3xl font-black mb-6">Scale Higher</h2>
                  <p className="text-emerald-100/70 text-sm leading-relaxed mb-10 font-medium">
                    List your company in Bangladesh&apos;s digital phonebook for the new generation.
                  </p>
                  <div className="space-y-6">
                    {[
                      { icon: Globe, text: 'Digital Presence' },
                      { icon: CheckCircle, text: 'Verified Status' },
                      { icon: Mail, text: 'Direct Leads' }
                    ].map((item, i) => (
                      <div key={i} className="flex items-center gap-4 text-emerald-100/90 text-sm">
                        <div className="w-8 h-8 rounded-full bg-stone-800/50 flex items-center justify-center">
                          <item.icon className="w-4 h-4 text-emerald-400" />
                        </div>
                        <span className="font-bold">{item.text}</span>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>

              {/* Main Form */}
              <div className="lg:col-span-3">
                <form onSubmit={handleLSubmit} className="space-y-6 sm:space-y-8">
                  <Card className="rounded-[1.5rem] sm:rounded-[2.5rem] border-none shadow-xl shadow-stone-200/50">
                    <CardContent className="p-6 sm:p-12 space-y-8 sm:space-y-10">
                      <SectionTitle 
                        icon={Building2} 
                        title="Company Basics" 
                        subtitle="Essential identity for your business listing." 
                      />
                      
                      <div className="space-y-3">
                        <label className="text-sm sm:text-sm font-bold text-stone-700 ml-1 uppercase tracking-wider">Business Name *</label>
                        <p className="text-[10px] text-stone-500 ml-1 mb-1 font-medium leading-tight">The legally registered or commonly known public name of your company.</p>
                        <Input 
                          placeholder="e.g. NextGen BD" 
                          className="bg-stone-50 border-stone-200 h-12 sm:h-14 rounded-xl"
                          value={lData.business_name}
                          onChange={(e) => setLData({...lData, business_name: e.target.value})}
                          required
                        />
                      </div>

                      <div className="grid sm:grid-cols-2 gap-6 sm:gap-8">
                        <div className="space-y-3">
                          <label className="text-sm sm:text-sm font-bold text-stone-700 ml-1 uppercase tracking-wider">Category</label>
                          <p className="text-[10px] text-stone-500 ml-1 mb-1 font-medium leading-tight">The specific niche your business serves.</p>
                          <SearchableSelect 
                            options={metadata.categories}
                            value={lData.category}
                            onChange={(val) => setLData({...lData, category: val})}
                            placeholder="Select Category"
                            customLabel="+ Add Custom / New Category"
                          />
                        </div>
                        <div className="space-y-3">
                          <label className="text-sm sm:text-sm font-bold text-stone-700 ml-1 uppercase tracking-wider">Industry</label>
                          <p className="text-[10px] text-stone-500 ml-1 mb-1 font-medium leading-tight">Your broader market sector.</p>
                          <SearchableSelect 
                            options={metadata.industries}
                            value={lData.industry}
                            onChange={(val) => setLData({...lData, industry: val})}
                            placeholder="Select Industry"
                            customLabel="+ Add Custom / New Industry"
                          />
                        </div>
                      </div>

                      <div className="grid sm:grid-cols-2 gap-6 sm:gap-8">
                        <div className="space-y-3">
                          <label className="text-sm sm:text-sm font-bold text-stone-700 ml-1 uppercase tracking-wider">Headquarters</label>
                          <p className="text-[10px] text-stone-500 ml-1 mb-1 font-medium leading-tight">Primary location of your operations (e.g., Banani, Dhaka).</p>
                          <Input 
                            placeholder="e.g. Gulshan, Dhaka" 
                            className="bg-stone-50 border-stone-200 h-12 sm:h-14 rounded-xl"
                            value={lData.headquarters}
                            onChange={(e) => setLData({...lData, headquarters: e.target.value})}
                          />
                        </div>
                        <div className="space-y-3">
                          <label className="text-sm sm:text-sm font-bold text-stone-700 ml-1 uppercase tracking-wider">Website URL</label>
                          <p className="text-[10px] text-stone-500 ml-1 mb-1 font-medium leading-tight">Link to your official company website.</p>
                          <Input 
                            placeholder="https://nextgen.bd" 
                            className="bg-stone-50 border-stone-200 h-12 sm:h-14 rounded-xl"
                            value={lData.website}
                            onChange={(e) => setLData({...lData, website: e.target.value})}
                          />
                        </div>
                      </div>

                      <div className="grid sm:grid-cols-3 gap-6 sm:gap-8">
                        <div className="space-y-3">
                          <label className="text-sm sm:text-sm font-bold text-stone-700 ml-1 uppercase tracking-wider">City</label>
                          <SearchableSelect 
                            options={metadata.cities}
                            value={lData.city}
                            onChange={(val) => setLData({...lData, city: val})}
                            placeholder="Select City"
                            customLabel="+ Add Custom City"
                          />
                        </div>
                        <div className="space-y-3">
                          <label className="text-sm sm:text-sm font-bold text-stone-700 ml-1 uppercase tracking-wider">Country</label>
                          <Input 
                            placeholder="e.g. Bangladesh" 
                            className="bg-stone-50 border-stone-200 h-12 sm:h-14 rounded-xl"
                            value={lData.country}
                            onChange={(e) => setLData({...lData, country: e.target.value})}
                          />
                        </div>
                        <div className="space-y-3">
                          <label className="text-sm sm:text-sm font-bold text-stone-700 ml-1 uppercase tracking-wider">Listing Type</label>
                          <SearchableSelect 
                            options={metadata.listing_types}
                            value={lData.listing_type}
                            onChange={(val) => setLData({...lData, listing_type: val, listing_type_name: val})}
                            placeholder="Select Listing Type"
                            customLabel="+ Add Custom Listing Type"
                          />
                        </div>
                      </div>

                      <div className="grid sm:grid-cols-3 gap-6 sm:gap-8">
                         <div className="space-y-3">
                          <label className="text-sm sm:text-sm font-bold text-stone-700 ml-1 uppercase tracking-wider">Employee Size</label>
                          <SearchableSelect 
                            options={metadata.employee_sizes}
                            value={lData.employee_size}
                            onChange={(val) => setLData({...lData, employee_size: val})}
                            placeholder="Select Employee Size"
                            customLabel="+ Add Custom Size"
                          />
                        </div>
                        <div className="space-y-3">
                          <label className="text-sm sm:text-sm font-bold text-stone-700 ml-1 uppercase tracking-wider">Founded Year</label>
                          <Input 
                            placeholder="e.g. 2020" 
                            className="bg-stone-50 border-stone-200 h-12 sm:h-14 rounded-xl"
                            value={lData.founded_year}
                            onChange={(e) => setLData({...lData, founded_year: e.target.value})}
                          />
                        </div>
                        <div className="space-y-3">
                          <label className="text-sm sm:text-sm font-bold text-stone-700 ml-1 uppercase tracking-wider">Expertise / Products</label>
                          <Input 
                            placeholder="e.g. SaaS, E-commerce Logistics" 
                            className="bg-stone-50 border-stone-200 h-12 sm:h-14 rounded-xl"
                            value={lData.expertise}
                            onChange={(e) => setLData({...lData, expertise: e.target.value})}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="rounded-[1.5rem] sm:rounded-[2.5rem] border-none shadow-xl shadow-stone-200/50 overflow-hidden">
                    <CardContent className="p-6 sm:p-12 space-y-8 sm:space-y-10">
                      <SectionTitle 
                        icon={Users} 
                        title="Leadership" 
                        subtitle="Key people behind the company." 
                      />

                      <div className="grid sm:grid-cols-2 gap-6 sm:gap-8">
                        <div className="space-y-3">
                          <label className="text-sm sm:text-sm font-bold text-stone-700 ml-1 uppercase tracking-wider">CEO Name</label>
                          <Input 
                            placeholder="Current CEO" 
                            className="bg-stone-50 border-stone-200 h-12 sm:h-14 rounded-xl"
                            value={lData.ceo_name}
                            onChange={(e) => setLData({...lData, ceo_name: e.target.value})}
                          />
                        </div>
                        <div className="space-y-3">
                          <label className="text-sm sm:text-sm font-bold text-stone-700 ml-1 uppercase tracking-wider">Founder Name</label>
                          <Input 
                            placeholder="Original Founder" 
                            className="bg-stone-50 border-stone-200 h-12 sm:h-14 rounded-xl"
                            value={lData.founder_name}
                            onChange={(e) => setLData({...lData, founder_name: e.target.value})}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="rounded-[1.5rem] sm:rounded-[2.5rem] border-none shadow-xl shadow-stone-200/50 overflow-hidden">
                    <CardContent className="p-6 sm:p-12 space-y-8 sm:space-y-10">
                      <SectionTitle 
                        icon={Layout} 
                        title="Brand Assets" 
                        subtitle="Visual elements for your profile." 
                      />

                      <div className="grid sm:grid-cols-2 gap-6 sm:gap-10">
                        <div className="space-y-3">
                          <label className="text-sm sm:text-sm font-bold text-stone-700 ml-1 flex items-center gap-2 uppercase tracking-wider">
                           <ImageIcon size={14} className="text-stone-400" /> Logo URL <span className="text-red-500">*</span>
                          </label>
                          <Input 
                            placeholder="https://example.com/logo.png" 
                            className="bg-stone-50 border-stone-200 h-12 sm:h-14 rounded-xl"
                            value={lData.logo}
                            onChange={(e) => setLData({...lData, logo: e.target.value})}
                          />
                          <p className="text-[10px] text-amber-600 font-bold uppercase tracking-tighter mt-2">Preferred: Square 400x400 (Max 20kb)</p>
                        </div>
                        <div className="space-y-3">
                          <label className="text-sm sm:text-sm font-bold text-stone-700 ml-1 flex items-center gap-2 uppercase tracking-wider">
                            <ImageIcon size={14} className="text-stone-400" /> Cover Image URL
                          </label>
                          <Input 
                            placeholder="https://example.com/cover.jpg" 
                            className="bg-stone-50 border-stone-200 h-12 sm:h-14 rounded-xl"
                            value={lData.cover_image}
                            onChange={(e) => setLData({...lData, cover_image: e.target.value})}
                          />
                          <p className="text-[10px] text-amber-600 font-bold uppercase tracking-tighter mt-2">Preferred: Landscape 1220x320 (Max 50kb)</p>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <label className="text-sm sm:text-sm font-bold text-stone-700 ml-1 uppercase tracking-wider">Short Pitch (Excerpt)</label>
                        <p className="text-[10px] text-stone-500 ml-1 mb-1 font-medium leading-tight">A powerful 1-2 sentence pitch describing exactly what your business does and its core value proposition. Shown on directory cards.</p>
                        <textarea 
                          className="w-full bg-stone-50 border border-stone-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 focus:outline-none transition-all min-h-[100px] p-4 text-sm"
                          placeholder="A quick 1-2 sentence pitch..."
                          value={lData.excerpt}
                          onChange={(e) => setLData({...lData, excerpt: e.target.value})}
                        />
                      </div>

                      <div className="space-y-6">
                        <div className="flex flex-col gap-1 mb-2">
                          <label className="text-sm sm:text-sm font-bold text-stone-700 ml-1 uppercase tracking-wider">Detailed About (Content)</label>
                          <p className="text-sm text-stone-500 ml-1">Provide a comprehensive overview of your business. Include your mission, the problem you solve, core products/services, and major achievements. Structure with Headings (H2, H3) for readability.</p>
                        </div>
                        <PublicRichEditor 
                          value={lData.content}
                          onChange={(html) => setLData({...lData, content: html})}
                          placeholder="Provide a comprehensive overview of your business, services, and achievements..."
                        />
                      </div>

                      <div className="space-y-6 pt-4 border-t border-stone-100">
                        <div className="flex flex-col gap-1 mb-2">
                          <label className="text-sm sm:text-sm font-bold text-stone-700 ml-1 uppercase tracking-wider">Life at Company (Culture & Environment)</label>
                          <p className="text-sm text-stone-500 ml-1">Describe your company culture, team values, office environment, perks, and life at work.</p>
                        </div>
                        <PublicRichEditor 
                          value={lData.life_at_company}
                          onChange={(html) => setLData({...lData, life_at_company: html})}
                          placeholder="Tell future team members and partners what it is like working at your company..."
                        />
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="rounded-[1.5rem] sm:rounded-[2.5rem] border-none shadow-xl shadow-stone-200/50 overflow-hidden">
                    <CardContent className="p-6 sm:p-12 space-y-8 sm:space-y-10">
                      <SectionTitle 
                        icon={Globe} 
                        title="Business Socials" 
                        subtitle="Public contact info for potential leads." 
                      />

                      <div className="grid sm:grid-cols-2 gap-6 sm:gap-8">
                        <div className="space-y-3">
                          <label className="text-sm sm:text-sm font-bold text-stone-700 ml-1 flex items-center gap-2 uppercase tracking-wider">
                            <Mail size={14} /> Public Email
                          </label>
                          <Input 
                            type="email"
                            placeholder="info@business.bd" 
                            className="bg-stone-50 border-stone-200 h-12 sm:h-14 rounded-xl"
                            value={lData.email}
                            onChange={(e) => setLData({...lData, email: e.target.value})}
                          />
                        </div>
                        <div className="space-y-3">
                          <label className="text-sm sm:text-sm font-bold text-stone-700 ml-1 flex items-center gap-2 uppercase tracking-wider">
                            <Phone size={14} /> Display Phone
                          </label>
                          <Input 
                            placeholder="+880 1xxxxxxxxx" 
                            className="bg-stone-50 border-stone-200 h-12 sm:h-14 rounded-xl"
                            value={lData.phone}
                            onChange={(e) => setLData({...lData, phone: e.target.value})}
                          />
                        </div>
                      </div>

                      <div className="grid sm:grid-cols-3 gap-6 sm:gap-8">
                         <div className="space-y-3">
                          <label className="text-sm sm:text-sm font-bold text-stone-700 ml-1 flex items-center gap-2 uppercase tracking-wider">
                            <Linkedin size={14} className="text-blue-600" /> LinkedIn
                          </label>
                          <Input 
                            placeholder="url" 
                            className="bg-stone-50 border-stone-200 h-12 sm:h-14 rounded-xl text-sm"
                            value={lData.social_linkedin}
                            onChange={(e) => setLData({...lData, social_linkedin: e.target.value})}
                          />
                        </div>
                        <div className="space-y-3">
                          <label className="text-sm sm:text-sm font-bold text-stone-700 ml-1 flex items-center gap-2 uppercase tracking-wider">
                            <Twitter size={14} className="text-sky-500" /> Twitter
                          </label>
                          <Input 
                            placeholder="url" 
                            className="bg-stone-50 border-stone-200 h-12 sm:h-14 rounded-xl text-sm"
                            value={lData.social_twitter}
                            onChange={(e) => setLData({...lData, social_twitter: e.target.value})}
                          />
                        </div>
                        <div className="space-y-3">
                          <label className="text-sm sm:text-sm font-bold text-stone-700 ml-1 flex items-center gap-2 uppercase tracking-wider">
                            <Facebook size={14} className="text-blue-700" /> Facebook
                          </label>
                          <Input 
                            placeholder="url" 
                            className="bg-stone-50 border-stone-200 h-12 sm:h-14 rounded-xl text-sm"
                            value={lData.social_facebook}
                            onChange={(e) => setLData({...lData, social_facebook: e.target.value})}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="rounded-[1.5rem] sm:rounded-[2.5rem] border-stone-100 bg-stone-100/50 shadow-inner overflow-hidden">
                    <CardContent className="p-6 sm:p-12 space-y-8 sm:space-y-10">
                      <SectionTitle 
                        icon={ShieldCheck} 
                        title="Moderation Contact" 
                        subtitle="Private information for our editorial team only. Please provide accurate details so editors can reach out if content polishing is needed." 
                      />

                      <div className="grid sm:grid-cols-2 gap-6 sm:gap-8">
                        <div className="space-y-3">
                          <label className="text-sm sm:text-sm font-bold text-stone-700 ml-1 uppercase tracking-wider">Private Email *</label>
                          <Input 
                            type="email"
                            placeholder="We will contact you here" 
                            className="bg-white border-stone-200 h-12 sm:h-14 rounded-xl"
                            value={lData.contact_email}
                            onChange={(e) => setLData({...lData, contact_email: e.target.value})}
                            required
                          />
                        </div>
                        <div className="space-y-3">
                          <label className="text-sm sm:text-sm font-bold text-stone-700 ml-1 uppercase tracking-wider">Contact Phone</label>
                          <Input 
                            placeholder="+880 xxxxxxxxxx" 
                            className="bg-white border-stone-200 h-12 sm:h-14 rounded-xl"
                            value={lData.contact_phone}
                            onChange={(e) => setLData({...lData, contact_phone: e.target.value})}
                          />
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <div className="flex flex-col items-center gap-6 sm:gap-8 py-4 px-2">
                    <Turnstile siteKey={TURNSTILE_SITE_KEY} onSuccess={setTurnstileToken} />
                    <Button 
                      type="submit" 
                      disabled={loading || !turnstileToken}
                      className="w-full max-w-md bg-emerald-900 hover:bg-emerald-800 text-white h-14 sm:h-16 rounded-xl sm:rounded-2xl font-black text-base sm:text-lg transition-all shadow-xl shadow-emerald-900/40 hover:scale-[1.01] active:scale-95 flex items-center justify-center gap-3"
                    >
                      {loading ? <><Loader2 className="w-6 h-6 animate-spin" /> Submitting...</> : <>Submit Listing <ArrowRight size={20} /></>}
                    </Button>
                  </div>
                </form>
              </div>
            </div>
          </TabsContent>
        </Tabs>

        <div className="mt-16 sm:mt-20 bg-white rounded-[1.5rem] sm:rounded-3xl p-6 sm:p-12 border border-stone-200/50 shadow-xl shadow-stone-200/20 flex flex-col md:flex-row items-center md:items-start gap-6 sm:gap-8">
          <div className="w-16 h-16 sm:w-20 sm:h-20 bg-amber-50 rounded-2xl sm:rounded-3xl flex items-center justify-center text-amber-600 shrink-0">
            <Info size={28} className="sm:size-8" />
          </div>
          <div className="text-center md:text-left">
            <h4 className="text-xl sm:text-2xl font-black text-stone-900 mb-3 tracking-tight">Curation Guidelines</h4>
            <p className="text-sm sm:text-base text-stone-500 leading-relaxed mb-6">
              To maintain the highest quality standards, every submission is manually vetted by our editorial team. 
              Profiles with blurry images, generic descriptions, or missing contact info will be deprioritized.
            </p>
            <div className="flex flex-wrap justify-center md:justify-start gap-3">
               <Badge className="bg-stone-100 text-stone-600 hover:bg-stone-200 hover:text-stone-700 transition-colors border-none font-bold py-1.5 px-4 rounded-full">Manual Review</Badge>
               <Badge className="bg-stone-100 text-stone-600 hover:bg-stone-200 hover:text-stone-700 transition-colors border-none font-bold py-1.5 px-4 rounded-full">24-48h Response</Badge>
               <Badge className="bg-stone-100 text-stone-600 hover:bg-stone-200 hover:text-stone-700 transition-colors border-none font-bold py-1.5 px-4 rounded-full">High Quality Only</Badge>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SubmissionPage;
