import React, { useState, useEffect, useMemo } from 'react';
import * as Dialog from '@radix-ui/react-dialog';
import {
  X, Eye, Settings, Code, Share2, CheckCircle2, AlertTriangle,
  XCircle, ArrowRight, Wand2, Sparkles, Loader2, Info, Copy,
  ExternalLink, Laptop, Smartphone, HelpCircle, Plus, Trash2, Check
} from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../ui/tabs';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Badge } from '../ui/badge';
import { Checkbox } from '../ui/checkbox';
import { Label } from '../ui/label';
import { Progress } from '../ui/progress';
import { ScrollArea } from '../ui/scroll-area';
import aiAPI from '../../lib/aiApi';
import { toast } from 'sonner';
import ImageUploader from '../common/ImageUploader';

// Helper to interpolate title/description variables
export const interpolateVariables = (template, titleVal, excerptVal, siteName = "Entrepreneurs BD") => {
  if (!template) return '';
  const currentYear = new Date().getFullYear().toString();
  return template
    .replace(/%title%/g, titleVal || '')
    .replace(/%excerpt%/g, excerptVal || '')
    .replace(/%sitename%/g, siteName)
    .replace(/%sep%/g, '|')
    .replace(/%currentyear%/g, currentYear);
};

// Helper to convert a tree representation back to a standard schema object
export const treeToSchemaObj = (tree) => {
  const obj = {};
  if (!Array.isArray(tree)) return obj;

  tree.forEach(node => {
    if (!node.key || !node.key.trim()) return;
    const key = node.key.trim();
    if (node.type === 'group') {
      obj[key] = treeToSchemaObj(node.children || []);
    } else {
      let val = node.value || '';
      // Try parsing numeric or boolean strings if appropriate, or keep as string
      if (val === 'true') val = true;
      else if (val === 'false') val = false;
      obj[key] = val;
    }
  });
  return obj;
};

// Helper to convert a schema object to a tree representation
export const schemaObjToTree = (obj, prefix = '') => {
  if (!obj || typeof obj !== 'object') return [];
  
  return Object.entries(obj).map(([key, val], idx) => {
    const id = `${prefix}node-${Math.random().toString(36).substr(2, 9)}-${idx}-${Date.now()}`;
    if (val && typeof val === 'object' && !Array.isArray(val)) {
      return {
        id,
        key,
        type: 'group',
        children: schemaObjToTree(val, `${id}-`)
      };
    } else {
      let valueStr = '';
      if (typeof val === 'object' && Array.isArray(val)) {
        valueStr = JSON.stringify(val);
      } else if (val !== null && val !== undefined) {
        valueStr = String(val);
      }
      return {
        id,
        key,
        value: valueStr,
        type: 'text'
      };
    }
  });
};

// Helper to pre-fill schema types with relevant content-based variables to avoid missing field warnings
export const getPrefilledTemplate = (type, docTitle = '', docExcerpt = '', contentType = '', defaultShareImage = '') => {
  const baseUrl = 'https://entrepreneurs.bd';
  const logoUrl = `${baseUrl}/logo.png`;
  const shareImg = defaultShareImage || logoUrl;

  const baseSchema = {
    "@context": "https://schema.org",
    "@type": type
  };

  switch (type) {
    case 'Article':
      return {
        ...baseSchema,
        "mainEntityOfPage": {
          "@type": "WebPage",
          "@id": baseUrl
        },
        "headline": docTitle || "Post Headline Title",
        "description": docExcerpt || "Brief description of the post...",
        "image": shareImg,
        "author": {
          "@type": "Person",
          "name": "Admin"
        },
        "publisher": {
          "@type": "Organization",
          "name": "Entrepreneurs BD",
          "logo": {
            "@type": "ImageObject",
            "url": logoUrl
          }
        }
      };
    case 'Person':
      return {
        ...baseSchema,
        "mainEntityOfPage": {
          "@type": "ProfilePage",
          "@id": baseUrl
        },
        "name": docTitle || "Entrepreneur Name",
        "jobTitle": "Founder",
        "worksFor": {
          "@type": "Organization",
          "name": "Startup Company"
        },
        "image": shareImg,
        "url": baseUrl
      };
    case 'LocalBusiness':
      return {
        ...baseSchema,
        "mainEntityOfPage": {
          "@type": "WebPage",
          "@id": baseUrl
        },
        "name": docTitle || "Business Name",
        "description": docExcerpt || "Brief business description...",
        "image": shareImg,
        "address": {
          "@type": "PostalAddress",
          "streetAddress": "Dhaka, Bangladesh",
          "addressLocality": "Dhaka",
          "addressCountry": "BD"
        },
        "telephone": "+8801700000055",
        "url": baseUrl
      };
    case 'Organization':
      return {
        ...baseSchema,
        "mainEntityOfPage": {
          "@type": "WebPage",
          "@id": baseUrl
        },
        "name": docTitle || "Organization Name",
        "url": baseUrl,
        "logo": shareImg,
        "sameAs": []
      };
    default:
      return baseSchema;
  }
};

// Recursive row component for editing schema tree nodes
export const SchemaNodeRow = ({ node, onUpdate, onDelete }) => {
  const handleKeyChange = (e) => {
    onUpdate({ ...node, key: e.target.value });
  };

  const handleValueChange = (e) => {
    onUpdate({ ...node, value: e.target.value });
  };

  const handleChildUpdate = (childId, updatedChild) => {
    const updatedChildren = (node.children || []).map(c => c.id === childId ? updatedChild : c);
    onUpdate({ ...node, children: updatedChildren });
  };

  const handleChildDelete = (childId) => {
    const updatedChildren = (node.children || []).filter(c => c.id !== childId);
    onUpdate({ ...node, children: updatedChildren });
  };

  const handleAddChild = (type) => {
    const newChild = {
      id: `node-${Math.random().toString(36).substr(2, 9)}-${Date.now()}`,
      key: '',
      value: '',
      type
    };
    if (type === 'group') {
      newChild.children = [];
      delete newChild.value;
    }
    onUpdate({ ...node, children: [...(node.children || []), newChild] });
  };

  return (
    <div className="pl-4 border-l-2 border-stone-100 py-2.5 my-1.5 space-y-2">
      <div className="flex items-center gap-2">
        {/* Node Type Indicator */}
        <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-stone-100 text-stone-500">
          {node.type}
        </span>

        {/* Node Key Input */}
        <input
          type="text"
          value={node.key}
          onChange={handleKeyChange}
          placeholder="Property Key (e.g. name, headline)"
          className="h-8 text-xs font-semibold border border-stone-200 rounded px-2.5 bg-white focus:outline-none focus:ring-1 focus:ring-emerald-800 flex-1"
        />

        {/* Node Value Input (Only for non-group text/value properties) */}
        {node.type === 'text' && (
          <input
            type="text"
            value={node.value}
            onChange={handleValueChange}
            placeholder="Property Value"
            className="h-8 text-xs border border-stone-200 rounded px-2.5 bg-stone-50/55 focus:outline-none focus:ring-1 focus:ring-emerald-800 flex-1"
          />
        )}

        {/* Delete Row Button */}
        <button
          type="button"
          onClick={() => onDelete(node.id)}
          className="p-1.5 text-stone-400 hover:text-red-650 hover:bg-stone-50 rounded transition-colors"
          title="Delete Property"
        >
          <Trash2 size={14} />
        </button>
      </div>

      {/* Node children and nested elements if group */}
      {node.type === 'group' && (
        <div className="ml-2 space-y-2">
          {node.children && node.children.map(child => (
            <SchemaNodeRow
              key={child.id}
              node={child}
              onUpdate={(updated) => handleChildUpdate(child.id, updated)}
              onDelete={handleChildDelete}
            />
          ))}

          {/* Add actions within group */}
          <div className="flex gap-2 pl-4 pt-1">
            <button
              type="button"
              onClick={() => handleAddChild('text')}
              className="text-[10px] font-bold text-emerald-800 hover:text-emerald-950 flex items-center gap-1 bg-emerald-50/30 px-2 py-1 rounded border border-emerald-100 hover:border-emerald-205 transition-all"
            >
              <Plus size={10} /> Add Property
            </button>
            <button
              type="button"
              onClick={() => handleAddChild('group')}
              className="text-[10px] font-bold text-stone-500 hover:text-stone-700 flex items-center gap-1 bg-stone-50 px-2 py-1 rounded border border-stone-200 transition-all"
            >
              <Plus size={10} /> Add Property Group
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

const SEOModal = ({
  isOpen,
  onClose,
  seoData,
  onChange,
  documentContent = '',
  documentTitle = '',
  documentExcerpt = '',
  contentType = 'blog',
  defaultShareImage = ''
}) => {
  // Local states representing RankMath fields
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDescription, setSeoDescription] = useState('');
  const [seoKeywords, setSeoKeywords] = useState('');
  const [focusKeyword, setFocusKeyword] = useState('');
  const [isPillarContent, setIsPillarContent] = useState(false);
  const [canonicalUrl, setCanonicalUrl] = useState('');
  const [breadcrumbTitle, setBreadcrumbTitle] = useState('');

  const [robotsMeta, setRobotsMeta] = useState({
    noindex: false,
    nofollow: false,
    noarchive: false,
    noimageindex: false,
    nosnippet: false
  });

  const [advancedRobots, setAdvancedRobots] = useState({
    maxSnippet: -1,
    maxVideo: -1,
    maxImage: 'large'
  });

  const [redirection, setRedirection] = useState({
    enable: false,
    type: '301',
    url: ''
  });

  const [socialMeta, setSocialMeta] = useState({
    ogTitle: '',
    ogDescription: '',
    ogImage: '',
    twitterTitle: '',
    twitterDescription: '',
    twitterImage: '',
    twitterCard: 'summary_large_image'
  });

  const [customSchema, setCustomSchema] = useState('');
  const [activeEditingSchemaIndex, setActiveEditingSchemaIndex] = useState(null);

  const getParsedCustomSchemas = () => {
    if (!customSchema.trim()) return [];
    try {
      const parsed = JSON.parse(customSchema);
      return Array.isArray(parsed) ? parsed : [parsed];
    } catch (e) {
      return [];
    }
  };
  const displayOgImage = socialMeta.ogImage || defaultShareImage;
  const displayTwitterImage = socialMeta.twitterImage || socialMeta.ogImage || defaultShareImage;

  // Internal visual state
  const [previewDevice, setPreviewDevice] = useState('desktop'); // desktop | mobile
  const [activeSchemaTab, setActiveSchemaTab] = useState('templates'); // templates | import | custom
  const [isGeneratingSchema, setIsGeneratingSchema] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Tree-based Schema Builder and custom templates state
  const [isBuilderOpen, setIsBuilderOpen] = useState(false);
  const [activeBuilderSchema, setActiveBuilderSchema] = useState([]);
  const [builderTab, setBuilderTab] = useState('edit'); // 'edit' | 'code'
  const [userTemplates, setUserTemplates] = useState([]);
  const [schemaFilterTab, setSchemaFilterTab] = useState('catalog'); // 'catalog' | 'user'
  const [schemaSearchQuery, setSchemaSearchQuery] = useState('');
  const [templateName, setTemplateName] = useState('');
  const [isNamingTemplate, setIsNamingTemplate] = useState(false);

  // AI Profile Selection states for Schema Generation
  const [providers, setProviders] = useState({});
  const [selectedProvider, setSelectedProvider] = useState('openai');
  const [selectedProfileIndex, setSelectedProfileIndex] = useState(0);
  const [isLoadingProviders, setIsLoadingProviders] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const loadProviders = async () => {
        try {
          setIsLoadingProviders(true);
          const config = await aiAPI.getProvidersConfig();
          const enabled = Object.entries(config.providers || {})
            .filter(([, p]) => p.enabled)
            .reduce((acc, [name, p]) => {
              acc[name] = p;
              return acc;
            }, {});
          setProviders(enabled);
          if (Object.keys(enabled).length > 0) {
            const firstProv = Object.keys(enabled)[0];
            setSelectedProvider(firstProv);
            setSelectedProfileIndex(0);
          }
        } catch (error) {
          console.error('Failed to load AI providers config in SEOModal:', error);
        } finally {
          setIsLoadingProviders(false);
        }
      };
      loadProviders();

      // Load user templates
      try {
        const stored = localStorage.getItem('seo_user_templates');
        if (stored) {
          setUserTemplates(JSON.parse(stored));
        }
      } catch (e) {
        console.error('Failed to load user schema templates:', e);
      }
    }
  }, [isOpen]);

  // Sync incoming props to local state
  useEffect(() => {
    if (isOpen && seoData) {
      setSeoTitle(seoData.seo_title || '');
      setSeoDescription(seoData.seo_description || '');
      setSeoKeywords(seoData.seo_keywords || '');
      setFocusKeyword(seoData.focus_keyword || '');
      setIsPillarContent(!!seoData.is_pillar_content);
      setCanonicalUrl(seoData.canonical_url || '');
      setBreadcrumbTitle(seoData.breadcrumb_title || '');
      setCustomSchema(seoData.custom_schema || '');

      if (seoData.robots_meta) {
        setRobotsMeta({
          noindex: !!seoData.robots_meta.noindex,
          nofollow: !!seoData.robots_meta.nofollow,
          noarchive: !!seoData.robots_meta.noarchive,
          noimageindex: !!seoData.robots_meta.noimageindex,
          nosnippet: !!seoData.robots_meta.nosnippet
        });
      } else {
        setRobotsMeta({ noindex: false, nofollow: false, noarchive: false, noimageindex: false, nosnippet: false });
      }

      if (seoData.advanced_robots) {
        setAdvancedRobots({
          maxSnippet: seoData.advanced_robots.maxSnippet ?? -1,
          maxVideo: seoData.advanced_robots.maxVideo ?? -1,
          maxImage: seoData.advanced_robots.maxImage || 'large'
        });
      } else {
        setAdvancedRobots({ maxSnippet: -1, maxVideo: -1, maxImage: 'large' });
      }

      if (seoData.redirection) {
        setRedirection({
          enable: !!seoData.redirection.enable,
          type: seoData.redirection.type || '301',
          url: seoData.redirection.url || ''
        });
      } else {
        setRedirection({ enable: false, type: '301', url: '' });
      }

      if (seoData.social_meta) {
        setSocialMeta({
          ogTitle: seoData.social_meta.ogTitle || '',
          ogDescription: seoData.social_meta.ogDescription || '',
          ogImage: seoData.social_meta.ogImage || '',
          twitterTitle: seoData.social_meta.twitterTitle || '',
          twitterDescription: seoData.social_meta.twitterDescription || '',
          twitterImage: seoData.social_meta.twitterImage || '',
          twitterCard: seoData.social_meta.twitterCard || 'summary_large_image'
        });
      } else {
        setSocialMeta({
          ogTitle: '', ogDescription: '', ogImage: '',
          twitterTitle: '', twitterDescription: '', twitterImage: '',
          twitterCard: 'summary_large_image'
        });
      }

      // Custom schema state has already been initialized via setCustomSchema
    }
  }, [isOpen, seoData, documentTitle, documentExcerpt, contentType]);

  // Strip HTML tag helper
  const stripHtml = (html) => {
    return (html || '').replace(/<[^>]*>/g, '').trim();
  };

  // Compile calculations for focus keyword & content scoring
  const seoAnalysis = useMemo(() => {
    const rawContentText = stripHtml(documentContent);
    const contentWordCount = rawContentText.split(/\s+/).filter(Boolean).length;
    const activeKeyword = focusKeyword.trim().toLowerCase();

    const finalTitle = seoTitle || documentTitle;
    const finalDesc = seoDescription || documentExcerpt;
    const finalSlug = (seoTitle || documentTitle).toLowerCase().replace(/\s+/g, '-'); // Mock slug matching logic

    const checks = {
      keywordInTitle: activeKeyword ? finalTitle.toLowerCase().includes(activeKeyword) : false,
      keywordInDescription: activeKeyword ? finalDesc.toLowerCase().includes(activeKeyword) : false,
      keywordInSlug: activeKeyword ? finalSlug.toLowerCase().includes(activeKeyword) : false,
      keywordInContentBeginning: false,
      keywordInContent: activeKeyword ? rawContentText.toLowerCase().includes(activeKeyword) : false,
      keywordInHeadings: false,
      titleLengthOk: finalTitle.length >= 40 && finalTitle.length <= 65,
      descLengthOk: finalDesc.length >= 120 && finalDesc.length <= 160,
      contentLengthOk: contentWordCount >= 600
    };

    if (activeKeyword && rawContentText) {
      const beginningSlice = rawContentText.toLowerCase().slice(0, 500);
      checks.keywordInContentBeginning = beginningSlice.includes(activeKeyword);

      // Basic heading check in raw HTML string
      const headingRegex = /<h[23][^>]*>(.*?)<\/h[23]>/gi;
      let match;
      let headingTextMerged = '';
      while ((match = headingRegex.exec(documentContent)) !== null) {
        headingTextMerged += ' ' + match[1];
      }
      checks.keywordInHeadings = headingTextMerged.toLowerCase().includes(activeKeyword);
    }

    // Score calculations
    let score = 0;
    if (!activeKeyword) {
      // General title/description length check score if no keyword
      if (checks.titleLengthOk) score += 20;
      if (checks.descLengthOk) score += 20;
      if (contentWordCount > 100) score += Math.min(60, Math.floor(contentWordCount / 10));
      return { score, checks, wordCount: contentWordCount };
    }

    // Focus keyword analysis points
    if (checks.keywordInTitle) score += 15;
    if (checks.keywordInDescription) score += 15;
    if (checks.keywordInSlug) score += 10;
    if (checks.keywordInContentBeginning) score += 10;
    if (checks.keywordInContent) score += 10;
    if (checks.keywordInHeadings) score += 10;
    if (checks.titleLengthOk) score += 10;
    if (checks.descLengthOk) score += 10;
    if (checks.contentLengthOk) score += 10;
    else if (contentWordCount > 200) score += 5;

    return {
      score: Math.min(100, score),
      checks,
      wordCount: contentWordCount
    };
  }, [seoTitle, seoDescription, focusKeyword, documentContent, documentTitle, documentExcerpt]);

  // Color mapping based on score
  const scoreColor = (score) => {
    if (score < 50) return 'text-red-500 bg-red-50 border-red-200';
    if (score < 80) return 'text-amber-500 bg-amber-50 border-amber-200';
    return 'text-emerald-600 bg-emerald-50 border-emerald-200';
  };

  const scoreProgressColor = (score) => {
    if (score < 50) return 'bg-red-500';
    if (score < 80) return 'bg-amber-500';
    return 'bg-emerald-500';
  };

  // Pre-compiled variable title & description
  const interpolatedTitle = useMemo(() => {
    const defaultTemplate = seoTitle || "%title% %sep% %sitename%";
    return interpolateVariables(defaultTemplate, documentTitle, documentExcerpt);
  }, [seoTitle, documentTitle, documentExcerpt]);

  const interpolatedDesc = useMemo(() => {
    const defaultTemplate = seoDescription || "%excerpt%";
    return interpolateVariables(defaultTemplate, documentTitle, documentExcerpt);
  }, [seoDescription, documentTitle, documentExcerpt]);

  // Generate customized Schema JSON-LD structure
  const handleGenerateAISchema = async () => {
    setIsGeneratingSchema(true);
    try {
      const prompt = `Generate a standard, 100% compliant Schema.org JSON-LD structured markup snippet for a website content type.
Page Content Type: ${contentType}
Page Title: ${interpolatedTitle || documentTitle}
Page Description: ${interpolatedDesc || documentExcerpt}
Return ONLY a valid raw JSON object. Do not include markdown styling or block formatting. Start with '{' and end with '}'.`;

      const providerConfig = providers[selectedProvider];
      const profile = providerConfig?.profiles?.[selectedProfileIndex];
      const model = profile?.selectedModel || 'gpt-4-turbo';

      const res = await aiAPI.copilotAction({
        action: 'custom',
        prompt: prompt,
        text: interpolatedDesc || documentTitle,
        provider: selectedProvider,
        profileIndex: parseInt(selectedProfileIndex) || 0,
        model: model
      });

      if (!res || !res.success || !res.text) {
        throw new Error(res?.error || 'Failed to generate schema content from AI');
      }

      let schemaStr = res.text.trim();
      if (schemaStr.startsWith('```json')) {
        schemaStr = schemaStr.replace(/```json/i, '').replace(/```/g, '').trim();
      } else if (schemaStr.startsWith('```')) {
        schemaStr = schemaStr.replace(/```/g, '').trim();
      }

      // Try formatting/prettifying JSON
      try {
        const parsed = JSON.parse(schemaStr);
        schemaStr = JSON.stringify(parsed, null, 2);
      } catch (e) {
        console.warn('Parsing schema response failed, using raw response.', e);
      }

      setCustomSchema(schemaStr);
      toast.success('AI custom schema generated successfully');
    } catch (e) {
      console.error(e);
      toast.error('AI schema generation failed: ' + (e.message || 'Unknown error'));
    } finally {
      setIsGeneratingSchema(false);
    }
  };

  // Compile visual builder into JSON-LD
  const handleSaveVisualSchema = () => {
    let schemaObj = {
      "@context": "https://schema.org"
    };

    if (selectedSchemaType === 'Article') {
      schemaObj = {
        ...schemaObj,
        "@type": "Article",
        "headline": schemaFields.article.headline,
        "description": schemaFields.article.description,
        "author": {
          "@type": schemaFields.article.authorType,
          "name": schemaFields.article.authorName
        },
        "publisher": {
          "@type": "Organization",
          "name": schemaFields.article.publisherName,
          "logo": {
            "@type": "ImageObject",
            "url": "https://entrepreneurs.bd/logo.png"
          }
        }
      };
    } else if (selectedSchemaType === 'Person') {
      schemaObj = {
        ...schemaObj,
        "@type": "Person",
        "name": schemaFields.person.name,
        "jobTitle": schemaFields.person.jobTitle,
        "worksFor": {
          "@type": "Organization",
          "name": schemaFields.person.companyName
        },
        "email": schemaFields.person.email,
        "sameAs": schemaFields.person.linkedin ? [schemaFields.person.linkedin] : []
      };
    } else if (selectedSchemaType === 'LocalBusiness') {
      schemaObj = {
        ...schemaObj,
        "@type": "LocalBusiness",
        "name": schemaFields.localBusiness.name,
        "description": schemaFields.localBusiness.description,
        "address": {
          "@type": "PostalAddress",
          "streetAddress": schemaFields.localBusiness.address
        },
        "telephone": schemaFields.localBusiness.phone,
        "email": schemaFields.localBusiness.email,
        "url": schemaFields.localBusiness.website
      };
    } else if (selectedSchemaType === 'FAQPage') {
      schemaObj = {
        ...schemaObj,
        "@type": "FAQPage",
        "mainEntity": schemaFields.faq.filter(f => f.q && f.a).map(f => ({
          "@type": "Question",
          "name": f.q,
          "acceptedAnswer": {
            "@type": "Answer",
            "text": f.a
          }
        }))
      };
    }

    setCustomSchema(JSON.stringify(schemaObj, null, 2));
    setActiveSchemaTab('list');
    toast.success('Schema saved to overrides list');
  };

  // Check Schema validity
  const isSchemaValid = useMemo(() => {
    if (!customSchema.trim()) return true;
    try {
      JSON.parse(customSchema);
      return true;
    } catch (e) {
      return false;
    }
  }, [customSchema]);

  // Submit all modified SEO configurations
  const handleSave = () => {
    onChange({
      seo_title: seoTitle,
      seo_description: seoDescription,
      seo_keywords: seoKeywords,
      focus_keyword: focusKeyword,
      is_pillar_content: isPillarContent,
      canonical_url: canonicalUrl,
      breadcrumb_title: breadcrumbTitle,
      custom_schema: customSchema,
      robots_meta: robotsMeta,
      advanced_robots: advancedRobots,
      redirection: redirection,
      social_meta: socialMeta
    });
    onClose();
    toast.success('SEO metadata overrides saved to draft payload');
  };

  return (
    <Dialog.Root open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <Dialog.Portal>
        <Dialog.Overlay className="fixed inset-0 z-[9999] bg-black/60 backdrop-blur-sm animate-in fade-in duration-300" />
        <Dialog.Content className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 max-w-4xl w-[92vw] h-[85vh] bg-stone-50 border border-stone-200 rounded-2xl shadow-2xl z-[9999] outline-none flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">

          {/* Header */}
          <div className="flex justify-between items-center px-6 py-4 bg-white border-b border-stone-200">
            <div className="flex items-center gap-3">
              <div className="w-12 h-10 bg-emerald-900 rounded-lg flex items-center justify-center shadow-md px-2">
                <span className="text-white font-extrabold text-sm uppercase tracking-wider">SEO</span>
              </div>
              <div>
                <Dialog.Title className="text-xl font-bold text-stone-900 tracking-tight">SEO Settings Suite</Dialog.Title>
                <Dialog.Description className="text-xs text-stone-500 font-medium">Configure snippet index details, canonical, and structured schemas.</Dialog.Description>
              </div>
            </div>

            {/* Score Analyzer Indicator */}
            <div className="flex items-center gap-4">
              <div className={`flex items-center gap-2 px-3 py-1.5 border rounded-full font-bold text-sm shadow-sm transition-all duration-300 ${scoreColor(seoAnalysis.score)}`}>
                <span className="text-xs uppercase tracking-wider font-extrabold">SEO Score</span>
                <span className="text-base">{seoAnalysis.score}</span>
                <span className="text-xs opacity-75">/ 100</span>
              </div>
              <Dialog.Close asChild>
                <button className="p-1 rounded-lg text-stone-400 hover:bg-stone-100 hover:text-stone-700 transition-colors">
                  <X size={20} />
                </button>
              </Dialog.Close>
            </div>
          </div>

          {/* Body Flex Row */}
          <div className="flex-1 flex overflow-hidden">

            {/* Sidebar Tabs triggers */}
            <Tabs defaultValue="general" className="flex-1 flex overflow-hidden">
              <div className="w-[180px] bg-white border-r border-stone-200 flex flex-col p-2 gap-1.5">
                <TabsList className="flex flex-col bg-transparent gap-1.5 h-auto p-0 w-full justify-start items-stretch">
                  <TabsTrigger
                    value="general"
                    className="flex items-center gap-2 justify-start px-3 py-2.5 rounded-xl border border-transparent font-bold text-sm text-stone-600 data-[state=active]:bg-emerald-950 data-[state=active]:text-white data-[state=active]:border-emerald-950 hover:bg-stone-50 transition-all duration-200"
                  >
                    <Settings size={16} />
                    <span>General</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="advanced"
                    className="flex items-center gap-2 justify-start px-3 py-2.5 rounded-xl border border-transparent font-bold text-sm text-stone-600 data-[state=active]:bg-emerald-950 data-[state=active]:text-white data-[state=active]:border-emerald-950 hover:bg-stone-50 transition-all duration-200"
                  >
                    <Eye size={16} />
                    <span>Advanced</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="schema"
                    className="flex items-center gap-2 justify-start px-3 py-2.5 rounded-xl border border-transparent font-bold text-sm text-stone-600 data-[state=active]:bg-emerald-950 data-[state=active]:text-white data-[state=active]:border-emerald-950 hover:bg-stone-50 transition-all duration-200"
                  >
                    <Code size={16} />
                    <span>Schema</span>
                  </TabsTrigger>
                  <TabsTrigger
                    value="social"
                    className="flex items-center gap-2 justify-start px-3 py-2.5 rounded-xl border border-transparent font-bold text-sm text-stone-600 data-[state=active]:bg-emerald-950 data-[state=active]:text-white data-[state=active]:border-emerald-950 hover:bg-stone-50 transition-all duration-200"
                  >
                    <Share2 size={16} />
                    <span>Social</span>
                  </TabsTrigger>
                </TabsList>

                {/* Score breakdown visual indicator */}
                <div className="mt-auto p-3 border border-stone-200 bg-stone-50/50 rounded-xl space-y-2">
                  <div className="flex justify-between items-center text-[10px] font-bold text-stone-400 uppercase">
                    <span>Performance</span>
                    <span>{seoAnalysis.score}%</span>
                  </div>
                  <Progress value={seoAnalysis.score} className={`h-1.5 ${scoreProgressColor(seoAnalysis.score)}`} />
                  <p className="text-[10px] text-stone-500 font-medium">Add focus keywords and structure heading tags to increase rating.</p>
                </div>
              </div>

              {/* Tab panels (scrollable body) */}
              <div className="flex-1 overflow-hidden bg-stone-50">
                <ScrollArea className="h-full">
                  <div className="p-6 max-w-2xl mx-auto space-y-6">

                    {/* GENERAL TAB */}
                    <TabsContent value="general" className="m-0 space-y-6">

                      {/* Search Engine Preview Box */}
                      <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm">
                        <div className="flex justify-between items-center border-b border-stone-100 pb-4 mb-4">
                          <h4 className="text-sm font-bold text-stone-700 uppercase tracking-wider flex items-center gap-2">
                            <Eye size={16} className="text-emerald-700" /> Search Snippet Preview
                          </h4>
                          <div className="flex bg-stone-100 border border-stone-200 rounded-lg p-0.5">
                            <button
                              type="button"
                              onClick={() => setPreviewDevice('desktop')}
                              className={`p-1 px-2 rounded-md flex items-center gap-1.5 text-xs font-semibold ${previewDevice === 'desktop' ? 'bg-white text-emerald-950 shadow-sm' : 'text-stone-400'}`}
                            >
                              <Laptop size={12} /> Desktop
                            </button>
                            <button
                              type="button"
                              onClick={() => setPreviewDevice('mobile')}
                              className={`p-1 px-2 rounded-md flex items-center gap-1.5 text-xs font-semibold ${previewDevice === 'mobile' ? 'bg-white text-emerald-950 shadow-sm' : 'text-stone-400'}`}
                            >
                              <Smartphone size={12} /> Mobile
                            </button>
                          </div>
                        </div>

                        {/* Snippet Card */}
                        {previewDevice === 'desktop' ? (
                          <div className="font-sans text-left space-y-1">
                            <p className="text-xs text-stone-400 font-medium flex items-center gap-1">
                              https://entrepreneurs.bd <span className="opacity-50">›</span> {contentType} <span className="opacity-50">›</span> <span className="text-stone-600 font-semibold">{documentTitle.toLowerCase().replace(/\s+/g, '-')}</span>
                            </p>
                            <h3 className="text-xl text-[#1a0dab] hover:underline font-normal leading-tight cursor-pointer">
                              {interpolatedTitle || documentTitle || 'Enter SEO Title'}
                            </h3>
                            <p className="text-sm text-[#4d5156] leading-relaxed">
                              {interpolatedDesc || documentExcerpt || 'Add a meta description to summarize page content details.'}
                            </p>
                          </div>
                        ) : (
                          <div className="border border-stone-100 p-4 rounded-xl font-sans text-left space-y-1.5 bg-stone-50/50">
                            <div className="flex items-center gap-2">
                              <div className="w-5 h-5 rounded-full bg-stone-200 flex items-center justify-center text-[10px] font-bold text-stone-600">e</div>
                              <div>
                                <p className="text-xs text-stone-800 font-semibold">Entrepreneurs BD</p>
                                <p className="text-[10px] text-stone-400 leading-none">https://entrepreneurs.bd › {contentType}</p>
                              </div>
                            </div>
                            <h3 className="text-lg text-[#1a0dab] font-normal leading-snug cursor-pointer">
                              {interpolatedTitle || documentTitle || 'Enter SEO Title'}
                            </h3>
                            <p className="text-xs text-[#4d5156] leading-normal">
                              {interpolatedDesc || documentExcerpt || 'Add a meta description to summarize page content details.'}
                            </p>
                          </div>
                        )}
                      </div>

                      {/* Title & Description Inputs */}
                      <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm space-y-4">
                        <h4 className="text-sm font-bold text-stone-700 uppercase tracking-wider">Snippet Editor</h4>

                        <div className="space-y-1.5">
                          <div className="flex justify-between items-center">
                            <Label className="text-stone-700 font-bold">SEO Title</Label>
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${seoTitle.length >= 40 && seoTitle.length <= 65 ? 'text-emerald-700 bg-emerald-50' : 'text-stone-400 bg-stone-50'}`}>{seoTitle.length}/60 chars</span>
                          </div>
                          <Input
                            value={seoTitle}
                            onChange={(e) => setSeoTitle(e.target.value)}
                            placeholder="%title% %sep% %sitename%"
                            className="bg-white border-stone-200"
                          />
                          <p className="text-[10px] text-stone-400">Variables supported: <code>%title%</code>, <code>%sitename%</code>, <code>%excerpt%</code>, <code>%sep%</code></p>
                        </div>

                        <div className="space-y-1.5">
                          <div className="flex justify-between items-center">
                            <Label className="text-stone-700 font-bold">Meta Description</Label>
                            <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${seoDescription.length >= 120 && seoDescription.length <= 160 ? 'text-emerald-700 bg-emerald-50' : 'text-stone-400 bg-stone-50'}`}>{seoDescription.length}/160 chars</span>
                          </div>
                          <textarea
                            value={seoDescription}
                            onChange={(e) => setSeoDescription(e.target.value)}
                            placeholder="%excerpt%"
                            rows={3}
                            className="w-full p-3 border border-stone-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-800"
                          />
                          <p className="text-[10px] text-stone-400">Provide an engaging summary to optimize search engine click-through rates.</p>
                        </div>

                        <div className="space-y-1.5">
                          <Label className="text-stone-700 font-bold">Focus Keyword</Label>
                          <Input
                            value={focusKeyword}
                            onChange={(e) => setFocusKeyword(e.target.value)}
                            placeholder="Enter main SEO keyword..."
                            className="bg-white border-stone-200"
                          />
                          <p className="text-[10px] text-stone-400 font-medium">Use a specific term that perfectly targets search user intent.</p>
                        </div>

                        <div className="flex items-center space-x-2 pt-2">
                          <Checkbox
                            id="isPillarContent"
                            checked={isPillarContent}
                            onCheckedChange={setIsPillarContent}
                          />
                          <label htmlFor="isPillarContent" className="text-sm font-bold text-stone-700 cursor-pointer select-none">Mark as Pillar/Cornerstone Content</label>
                        </div>
                      </div>

                      {/* SEO Score Checklists */}
                      <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm space-y-4">
                        <h4 className="text-sm font-bold text-stone-700 uppercase tracking-wider flex items-center gap-2">
                          <CheckCircle2 size={16} className="text-emerald-700" /> SEO Checklist Analysis
                        </h4>

                        <div className="divide-y divide-stone-100">
                          {/* Title check */}
                          <div className="flex items-center justify-between py-2.5">
                            <span className="text-sm text-stone-600 font-medium">Focus Keyword in SEO Title</span>
                            {focusKeyword ? (
                              seoAnalysis.checks.keywordInTitle ? (
                                <Badge className="bg-emerald-100 text-emerald-800">Pass</Badge>
                              ) : (
                                <Badge variant="outline" className="text-red-700 bg-red-50 border-red-200">Fail</Badge>
                              )
                            ) : (
                              <span className="text-xs text-stone-400">Waiting for Keyword</span>
                            )}
                          </div>

                          {/* Description check */}
                          <div className="flex items-center justify-between py-2.5">
                            <span className="text-sm text-stone-600 font-medium">Focus Keyword in SEO Meta Description</span>
                            {focusKeyword ? (
                              seoAnalysis.checks.keywordInDescription ? (
                                <Badge className="bg-emerald-100 text-emerald-800">Pass</Badge>
                              ) : (
                                <Badge variant="outline" className="text-red-700 bg-red-50 border-red-200">Fail</Badge>
                              )
                            ) : (
                              <span className="text-xs text-stone-400">Waiting for Keyword</span>
                            )}
                          </div>

                          {/* Slug check */}
                          <div className="flex items-center justify-between py-2.5">
                            <span className="text-sm text-stone-600 font-medium">Focus Keyword in Slug</span>
                            {focusKeyword ? (
                              seoAnalysis.checks.keywordInSlug ? (
                                <Badge className="bg-emerald-100 text-emerald-800">Pass</Badge>
                              ) : (
                                <Badge variant="outline" className="text-amber-700 bg-amber-50 border-amber-200">Warning</Badge>
                              )
                            ) : (
                              <span className="text-xs text-stone-400">Waiting for Keyword</span>
                            )}
                          </div>

                          {/* Content start check */}
                          <div className="flex items-center justify-between py-2.5">
                            <span className="text-sm text-stone-600 font-medium">Focus Keyword in Content Introduction (First 10%)</span>
                            {focusKeyword ? (
                              seoAnalysis.checks.keywordInContentBeginning ? (
                                <Badge className="bg-emerald-100 text-emerald-800">Pass</Badge>
                              ) : (
                                <Badge variant="outline" className="text-red-700 bg-red-50 border-red-200">Fail</Badge>
                              )
                            ) : (
                              <span className="text-xs text-stone-400">Waiting for Keyword</span>
                            )}
                          </div>

                          {/* Length check */}
                          <div className="flex items-center justify-between py-2.5">
                            <span className="text-sm text-stone-600 font-medium flex flex-col">
                              <span>Content Length Check</span>
                              <span className="text-[10px] text-stone-400 font-normal">Current: {seoAnalysis.wordCount} words (Recommended: 600+)</span>
                            </span>
                            {seoAnalysis.checks.contentLengthOk ? (
                              <Badge className="bg-emerald-100 text-emerald-800">Pass</Badge>
                            ) : (
                              <Badge variant="outline" className="text-amber-700 bg-amber-50 border-amber-200">Warning</Badge>
                            )}
                          </div>

                          {/* Heading check */}
                          <div className="flex items-center justify-between py-2.5">
                            <span className="text-sm text-stone-600 font-medium">Focus Keyword inside Heading (H2/H3)</span>
                            {focusKeyword ? (
                              seoAnalysis.checks.keywordInHeadings ? (
                                <Badge className="bg-emerald-100 text-emerald-800">Pass</Badge>
                              ) : (
                                <Badge variant="outline" className="text-amber-700 bg-amber-50 border-amber-200">Warning</Badge>
                              )
                            ) : (
                              <span className="text-xs text-stone-400">Waiting for Keyword</span>
                            )}
                          </div>
                        </div>
                      </div>

                    </TabsContent>

                    {/* ADVANCED TAB */}
                    <TabsContent value="advanced" className="m-0 space-y-6">

                      {/* Robots meta tags */}
                      <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm space-y-4">
                        <h4 className="text-sm font-bold text-stone-700 uppercase tracking-wider flex items-center gap-2">
                          <Eye size={16} className="text-emerald-700" /> Robots Meta Tag Settings
                        </h4>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <div className="flex items-start space-x-2.5 p-3 rounded-lg border border-stone-150 bg-stone-50/50 hover:bg-stone-50 transition-colors">
                            <Checkbox
                              id="noindex"
                              checked={robotsMeta.noindex}
                              onCheckedChange={(val) => setRobotsMeta(prev => ({ ...prev, noindex: !!val }))}
                            />
                            <div className="grid gap-1 leading-none">
                              <label htmlFor="noindex" className="text-sm font-bold text-stone-800 cursor-pointer select-none">No Index</label>
                              <p className="text-[10px] text-stone-400 font-medium">Instruct search engines NOT to index this page.</p>
                            </div>
                          </div>

                          <div className="flex items-start space-x-2.5 p-3 rounded-lg border border-stone-150 bg-stone-50/50 hover:bg-stone-50 transition-colors">
                            <Checkbox
                              id="nofollow"
                              checked={robotsMeta.nofollow}
                              onCheckedChange={(val) => setRobotsMeta(prev => ({ ...prev, nofollow: !!val }))}
                            />
                            <div className="grid gap-1 leading-none">
                              <label htmlFor="nofollow" className="text-sm font-bold text-stone-800 cursor-pointer select-none">No Follow</label>
                              <p className="text-[10px] text-stone-400 font-medium">Do not pass link equity / PageRank authority.</p>
                            </div>
                          </div>

                          <div className="flex items-start space-x-2.5 p-3 rounded-lg border border-stone-150 bg-stone-50/50 hover:bg-stone-50 transition-colors">
                            <Checkbox
                              id="noarchive"
                              checked={robotsMeta.noarchive}
                              onCheckedChange={(val) => setRobotsMeta(prev => ({ ...prev, noarchive: !!val }))}
                            />
                            <div className="grid gap-1 leading-none">
                              <label htmlFor="noarchive" className="text-sm font-bold text-stone-800 cursor-pointer select-none">No Archive</label>
                              <p className="text-[10px] text-stone-400 font-medium">Do not show standard cached links on SERP.</p>
                            </div>
                          </div>

                          <div className="flex items-start space-x-2.5 p-3 rounded-lg border border-stone-150 bg-stone-50/50 hover:bg-stone-50 transition-colors">
                            <Checkbox
                              id="noimageindex"
                              checked={robotsMeta.noimageindex}
                              onCheckedChange={(val) => setRobotsMeta(prev => ({ ...prev, noimageindex: !!val }))}
                            />
                            <div className="grid gap-1 leading-none">
                              <label htmlFor="noimageindex" className="text-sm font-bold text-stone-800 cursor-pointer select-none">No Image Index</label>
                              <p className="text-[10px] text-stone-400 font-medium">Do not index search images on Google Image tab.</p>
                            </div>
                          </div>
                        </div>

                        {/* Advanced Robots Settings */}
                        <div className="space-y-4 pt-4 border-t border-stone-100">
                          <h5 className="text-xs font-bold text-stone-700 uppercase tracking-widest">Advanced Robots parameters</h5>

                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-1.5">
                              <Label className="text-stone-600 font-bold">Max Snippet</Label>
                              <Input
                                type="number"
                                value={advancedRobots.maxSnippet}
                                onChange={(e) => setAdvancedRobots(prev => ({ ...prev, maxSnippet: parseInt(e.target.value) || -1 }))}
                                className="bg-white border-stone-200"
                              />
                              <p className="text-[9px] text-stone-400">Limit characters allowed in SERP snippets. (-1 for unlimited)</p>
                            </div>

                            <div className="space-y-1.5">
                              <Label className="text-stone-600 font-bold">Max Video Preview</Label>
                              <Input
                                type="number"
                                value={advancedRobots.maxVideo}
                                onChange={(e) => setAdvancedRobots(prev => ({ ...prev, maxVideo: parseInt(e.target.value) || -1 }))}
                                className="bg-white border-stone-200"
                              />
                              <p className="text-[9px] text-stone-400">Limit length of video search previews (seconds). (-1 for unlimited)</p>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Canonical & Breadcrumb */}
                      <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm space-y-4">
                        <h4 className="text-sm font-bold text-stone-700 uppercase tracking-wider">Canonical & Breadcrumbs URL</h4>

                        <div className="space-y-1.5">
                          <Label className="text-stone-600 font-bold">Canonical URL Override</Label>
                          <Input
                            value={canonicalUrl}
                            onChange={(e) => setCanonicalUrl(e.target.value)}
                            placeholder="https://example.com/authoritative-page/"
                            className="bg-white border-stone-200"
                          />
                          <p className="text-[10px] text-stone-400">Leave blank to default to page URL. Solves keyword cannibalization.</p>
                        </div>

                        <div className="space-y-1.5">
                          <Label className="text-stone-600 font-bold">Breadcrumb Title</Label>
                          <Input
                            value={breadcrumbTitle}
                            onChange={(e) => setBreadcrumbTitle(e.target.value)}
                            placeholder="Custom title in breadcrumb trail"
                            className="bg-white border-stone-200"
                          />
                        </div>
                      </div>

                      {/* Redirections Manager */}
                      <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm space-y-4">
                        <div className="flex justify-between items-center">
                          <h4 className="text-sm font-bold text-stone-700 uppercase tracking-wider">301/302 Redirect Manager</h4>
                          <Checkbox
                            id="enableRedir"
                            checked={redirection.enable}
                            onCheckedChange={(val) => setRedirection(prev => ({ ...prev, enable: !!val }))}
                          />
                        </div>

                        {redirection.enable && (
                          <div className="space-y-4 pt-3 border-t border-stone-100 animate-in fade-in slide-in-from-top-1 duration-200">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                              <div className="space-y-1.5 md:col-span-1">
                                <Label className="text-stone-600 font-bold">Redirect Type</Label>
                                <select
                                  value={redirection.type}
                                  onChange={(e) => setRedirection(prev => ({ ...prev, type: e.target.value }))}
                                  className="w-full h-10 border border-stone-200 rounded-lg px-3 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-800 text-sm"
                                >
                                  <option value="301">301 Permanent</option>
                                  <option value="302">302 Temporary</option>
                                  <option value="307">307 Temporary</option>
                                  <option value="410">410 Content Deleted</option>
                                </select>
                              </div>

                              <div className="space-y-1.5 md:col-span-2">
                                <Label className="text-stone-600 font-bold">Destination URL</Label>
                                <Input
                                  value={redirection.url}
                                  onChange={(e) => setRedirection(prev => ({ ...prev, url: e.target.value }))}
                                  placeholder="https://example.com/target-page/"
                                  className="bg-white border-stone-200"
                                />
                              </div>
                            </div>
                            <p className="text-[10px] text-amber-700 bg-amber-50 p-2 rounded border border-amber-100">
                              ⚠️ Warning: Enabling redirection will bypass the default layout and forward users directly to the target URL.
                            </p>
                          </div>
                        )}
                      </div>

                    </TabsContent>

                    {/* SCHEMA TAB */}
                    <TabsContent value="schema" className="m-0 space-y-6">

                      <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm space-y-4">
                        <div className="flex justify-between items-center">
                          <h4 className="text-sm font-bold text-stone-700 uppercase tracking-wider flex items-center gap-2">
                            <Code size={16} className="text-emerald-700" /> Structured Data / Schema Markup
                          </h4>

                          <div className="flex bg-stone-100 border border-stone-200 rounded-lg p-0.5">
                            <button 
                              type="button" 
                              onClick={() => setActiveSchemaTab('templates')}
                              className={`p-1.5 px-3 rounded-md text-xs font-semibold transition-all ${activeSchemaTab === 'templates' ? 'bg-white text-emerald-950 shadow-sm' : 'text-stone-400'}`}
                            >
                              Schema Templates
                            </button>
                            <button 
                              type="button" 
                              onClick={() => setActiveSchemaTab('import')}
                              className={`p-1.5 px-3 rounded-md text-xs font-semibold transition-all ${activeSchemaTab === 'import' ? 'bg-white text-emerald-950 shadow-sm' : 'text-stone-400'}`}
                            >
                              Import
                            </button>
                            <button 
                              type="button" 
                              onClick={() => setActiveSchemaTab('custom')}
                              className={`p-1.5 px-3 rounded-md text-xs font-semibold transition-all ${activeSchemaTab === 'custom' ? 'bg-white text-emerald-950 shadow-sm' : 'text-stone-400'}`}
                            >
                              Custom Schema
                            </button>
                          </div>
                        </div>

                        {/* TAB 1: SCHEMA TEMPLATES */}
                        {activeSchemaTab === 'templates' && (
                          <div className="space-y-6">
                            
                            {/* Schema in Use */}
                            <div className="space-y-2">
                              <h5 className="font-bold text-stone-700 text-xs uppercase tracking-wider">Schema in Use</h5>
                              {getParsedCustomSchemas().length > 0 ? (
                                <div className="space-y-3">
                                  {getParsedCustomSchemas().map((schema, index) => (
                                    <div key={index} className="flex items-center justify-between p-3.5 bg-emerald-50/30 border border-emerald-250 rounded-xl">
                                      <div className="flex items-center gap-2.5">
                                        <span className="text-xl">⚡</span>
                                        <div>
                                          <span className="font-bold text-stone-800 text-sm">
                                            {schema['@type'] || 'Custom'}
                                          </span>
                                          <p className="text-[10px] text-stone-400 font-semibold">Custom Schema Override (Active)</p>
                                        </div>
                                      </div>
                                      <div className="flex gap-2">
                                        <Button 
                                          type="button" 
                                          size="sm" 
                                          variant="outline" 
                                          onClick={() => {
                                            setActiveEditingSchemaIndex(index);
                                            setActiveBuilderSchema(schemaObjToTree(schema));
                                            setBuilderTab('edit');
                                            setIsBuilderOpen(true);
                                          }}
                                          className="text-xs h-8 border-stone-200 bg-white hover:bg-stone-50"
                                        >
                                          Edit
                                        </Button>
                                        <Button 
                                          type="button" 
                                          size="sm" 
                                          variant="outline"
                                          onClick={() => {
                                            const activeSchemas = getParsedCustomSchemas();
                                            const updated = activeSchemas.filter((_, i) => i !== index);
                                            setCustomSchema(updated.length > 0 ? JSON.stringify(updated, null, 2) : '');
                                            toast.success('Schema removed');
                                          }}
                                          className="text-xs h-8 text-red-650 hover:text-red-700 border-stone-200 bg-white"
                                        >
                                          Delete
                                        </Button>
                                      </div>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="flex items-center justify-between p-3.5 bg-stone-50 border border-stone-200 rounded-xl">
                                  <div className="flex items-center gap-2.5">
                                    <span className="text-xl">⚙️</span>
                                    <div>
                                      <span className="font-bold text-stone-800 text-sm">
                                        {contentType === 'blog' || contentType === 'knowledge' ? 'Article' : contentType === 'entrepreneurs' ? 'Person' : 'LocalBusiness'}
                                      </span>
                                      <p className="text-[10px] text-stone-400 font-semibold">Default Auto Schema (Active)</p>
                                    </div>
                                  </div>
                                  <div>
                                    <Button 
                                      type="button" 
                                      size="sm" 
                                      variant="outline"
                                      onClick={() => {
                                        const prefilledType = contentType === 'blog' || contentType === 'knowledge' ? 'Article' : contentType === 'entrepreneurs' ? 'Person' : 'LocalBusiness';
                                        const prefilled = getPrefilledTemplate(prefilledType, documentTitle, documentExcerpt, contentType, defaultShareImage);
                                        setActiveEditingSchemaIndex(null);
                                        setActiveBuilderSchema(schemaObjToTree(prefilled));
                                        setBuilderTab('edit');
                                        setIsBuilderOpen(true);
                                      }}
                                      className="text-xs h-8 border-stone-200 bg-white hover:bg-stone-50"
                                    >
                                      Customize
                                    </Button>
                                  </div>
                                </div>
                              )}
                            </div>

                            {/* Available Schema Types */}
                            <div className="space-y-4 pt-3 border-t border-stone-100">
                              <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
                                <h5 className="font-bold text-stone-700 text-xs uppercase tracking-wider">Available Schema Types</h5>
                                
                                <div className="flex items-center gap-4">
                                  {/* Filter toggles */}
                                  <div className="flex items-center gap-3 text-xs font-semibold text-stone-500">
                                    <label className="flex items-center gap-1 cursor-pointer">
                                      <input 
                                        type="radio" 
                                        name="schemaFilter" 
                                        checked={schemaFilterTab === 'catalog'} 
                                        onChange={() => setSchemaFilterTab('catalog')}
                                        className="text-emerald-800 focus:ring-emerald-800"
                                      />
                                      Schema Catalog
                                    </label>
                                    <label className="flex items-center gap-1 cursor-pointer">
                                      <input 
                                        type="radio" 
                                        name="schemaFilter" 
                                        checked={schemaFilterTab === 'user'} 
                                        onChange={() => setSchemaFilterTab('user')}
                                        className="text-emerald-800 focus:ring-emerald-800"
                                      />
                                      Your Templates
                                    </label>
                                  </div>

                                  <input 
                                    type="text" 
                                    placeholder="Search schemas..."
                                    value={schemaSearchQuery}
                                    onChange={(e) => setSchemaSearchQuery(e.target.value)}
                                    className="h-8 text-xs border border-stone-200 rounded px-2.5 bg-white focus:outline-none focus:ring-1 focus:ring-emerald-800 w-44 font-medium"
                                  />
                                </div>
                              </div>

                              {schemaFilterTab === 'catalog' ? (
                                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                                  {[
                                    { type: 'Article', name: '📰 Article', desc: 'Blogs, News, Tech posts' },
                                    { type: 'Book', name: '📖 Book', desc: 'Authors, Books, Publications' },
                                    { type: 'Course', name: '🎓 Course', desc: 'Online classes, Training programs' },
                                    { type: 'Dataset', name: '📊 Dataset', desc: 'Data tables, Repositories' },
                                    { type: 'Event', name: '📅 Event', desc: 'Conferences, Webinars, Meetings' },
                                    { type: 'FAQ', name: '❓ FAQ Page', desc: 'Frequently Asked Questions lists' },
                                    { type: 'FactCheck', name: '🔍 Fact Check', desc: 'Fact-checking claim reviews' },
                                    { type: 'HowTo', name: '🛠️ HowTo', desc: 'Step-by-step instructions, Guides' },
                                    { type: 'Job Posting', name: '💼 Job Posting', desc: 'Hiring announcements, Job posts' },
                                    { type: 'LocalBusiness', name: '🏢 LocalBusiness', desc: 'Directory listings, physical places' },
                                    { type: 'Movie', name: '🎬 Movie', desc: 'Films, TV shows, Media works' },
                                    { type: 'Music', name: '🎵 Music', desc: 'Playlists, Albums, Songs' },
                                    { type: 'Organization', name: '🏢 Organization', desc: 'Companies, Brands, NGOs' },
                                    { type: 'Person', name: '👤 Person', desc: 'Author, Entrepreneurs, Influencers' },
                                    { type: 'Product', name: '🛒 Product', desc: 'E-commerce items, Store listings' },
                                    { type: 'Recipe', name: '🍳 Recipe', desc: 'Food recipes, Cooking instructions' }
                                  ]
                                  .filter(item => item.name.toLowerCase().includes(schemaSearchQuery.toLowerCase()) || item.desc.toLowerCase().includes(schemaSearchQuery.toLowerCase()))
                                  .map((item) => (
                                    <div 
                                      key={item.type}
                                      className="p-3.5 rounded-xl border border-stone-200 bg-stone-50/50 flex flex-col justify-between hover:border-emerald-800 hover:bg-white transition-all duration-200 group"
                                    >
                                      <div>
                                        <h6 className="font-bold text-stone-800 text-xs mb-0.5">{item.name}</h6>
                                        <p className="text-[9px] text-stone-400 font-semibold mb-3 leading-tight">{item.desc}</p>
                                      </div>
                                      <Button 
                                        type="button" 
                                        variant="outline" 
                                        size="sm"
                                        onClick={() => {
                                          const prefilled = getPrefilledTemplate(item.type, documentTitle, documentExcerpt, contentType, defaultShareImage);
                                          setActiveEditingSchemaIndex(null);
                                          setActiveBuilderSchema(schemaObjToTree(prefilled));
                                          setBuilderTab('edit');
                                          setIsBuilderOpen(true);
                                        }}
                                        className="h-7 text-[10px] w-full border-stone-200 bg-white group-hover:border-emerald-800 group-hover:text-emerald-800 font-bold"
                                      >
                                        Use Template
                                      </Button>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <div className="space-y-2">
                                  {userTemplates.length === 0 ? (
                                    <div className="p-8 text-center text-stone-400 text-xs bg-stone-50 rounded-xl border border-stone-150">
                                      No saved custom templates found. Click "Save as Template" inside the Schema Builder to reuse designs!
                                    </div>
                                  ) : (
                                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                                      {userTemplates
                                        .filter(item => item.name.toLowerCase().includes(schemaSearchQuery.toLowerCase()))
                                        .map((item, idx) => (
                                          <div 
                                            key={idx}
                                            className="p-3.5 rounded-xl border border-stone-200 bg-stone-50/50 flex flex-col justify-between hover:border-emerald-800 hover:bg-white transition-all duration-200 group relative"
                                          >
                                            <button
                                              type="button"
                                              onClick={() => {
                                                const updated = userTemplates.filter((_, uIdx) => uIdx !== idx);
                                                setUserTemplates(updated);
                                                localStorage.setItem('seo_user_templates', JSON.stringify(updated));
                                                toast.success('Template deleted');
                                              }}
                                              className="absolute right-2 top-2 p-1 hover:bg-red-50 text-stone-400 hover:text-red-650 rounded transition-colors"
                                              title="Delete saved template"
                                            >
                                              <Trash2 size={12} />
                                            </button>
                                            <div>
                                              <h6 className="font-bold text-stone-800 text-xs mb-0.5 pr-5">✨ {item.name}</h6>
                                              <p className="text-[9px] text-stone-400 font-semibold mb-3 leading-tight">
                                                Created: {new Date(item.createdAt).toLocaleDateString()}
                                              </p>
                                            </div>
                                            <Button 
                                              type="button" 
                                              variant="outline" 
                                              size="sm"
                                              onClick={() => {
                                                setActiveEditingSchemaIndex(null);
                                                setActiveBuilderSchema(item.tree);
                                                setBuilderTab('edit');
                                                setIsBuilderOpen(true);
                                              }}
                                              className="h-7 text-[10px] w-full border-stone-200 bg-white group-hover:border-emerald-800 group-hover:text-emerald-800 font-bold"
                                            >
                                              Use Custom Template
                                            </Button>
                                          </div>
                                        ))}
                                    </div>
                                  )}
                                </div>
                              )}
                            </div>

                          </div>
                        )}

                        {/* TAB 2: IMPORT */}
                        {activeSchemaTab === 'import' && (
                          <div className="space-y-4">
                            <div className="space-y-1.5">
                              <Label className="text-stone-700 font-bold">Import JSON-LD Schema Code</Label>
                              <p className="text-[10px] text-stone-400">Paste your structured data payload below. We will parse it and load it into the Schema Builder.</p>
                              <textarea 
                                placeholder={'{\n  "@context": "https://schema.org",\n  "@type": "Article",\n  "headline": "Example Title"\n}'}
                                rows={10}
                                id="schema-import-area"
                                className="w-full p-3 font-mono text-xs border rounded-lg bg-stone-900 text-emerald-450 focus:outline-none focus:ring-1 focus:ring-emerald-800 border-stone-200"
                              />
                            </div>
                            <Button 
                              type="button"
                              onClick={() => {
                                const val = document.getElementById('schema-import-area')?.value;
                                if (!val || !val.trim()) {
                                  toast.error('Please paste valid schema code first');
                                  return;
                                }
                                try {
                                  const parsed = JSON.parse(val);
                                  setActiveEditingSchemaIndex(null);
                                  const tree = schemaObjToTree(parsed);
                                  setActiveBuilderSchema(tree);
                                  setBuilderTab('edit');
                                  setIsBuilderOpen(true);
                                  toast.success('Schema successfully imported into builder!');
                                } catch (e) {
                                  toast.error('JSON parsing failed. Please verify syntax structure.');
                                }
                              }}
                              className="w-full bg-emerald-805 hover:bg-emerald-950 text-white font-bold text-xs"
                            >
                              Import Schema into Builder
                            </Button>
                          </div>
                        )}

                        {/* TAB 3: CUSTOM OVERRIDE SCHEMA */}
                        {activeSchemaTab === 'custom' && (
                          <div className="space-y-4">
                            <div className="space-y-2">
                              <Label className="text-stone-700 font-bold">Custom Schema Override (JSON-LD)</Label>
                              <textarea 
                                value={customSchema} 
                                onChange={(e) => setCustomSchema(e.target.value)} 
                                placeholder={'{\n  "@context": "https://schema.org",\n  "@type": "Article",\n  "headline": "..."\n}'}
                                rows={8}
                                className={`w-full p-3 font-mono text-xs border rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-800 ${isSchemaValid ? 'text-stone-900 border-stone-300' : 'text-red-600 border-red-500'}`}
                              />
                              {!isSchemaValid && (
                                <p className="text-[10px] text-red-650 flex items-center gap-1 font-semibold">
                                  <AlertTriangle size={12} /> Invalid JSON payload format. Please inspect braces and quotes.
                                </p>
                              )}
                            </div>

                            {/* AI configuration controls for custom schema generation */}
                            {Object.keys(providers).length > 0 && (
                              <div className="grid grid-cols-2 gap-3 p-3.5 bg-stone-50 border border-stone-200 rounded-xl">
                                <div className="space-y-1">
                                  <label className="block text-[10px] font-bold text-stone-505 uppercase tracking-wider">
                                    AI Provider
                                  </label>
                                  <select
                                    value={selectedProvider}
                                    onChange={(e) => {
                                      const p = e.target.value;
                                      setSelectedProvider(p);
                                      setSelectedProfileIndex(0);
                                    }}
                                    className="w-full text-xs h-8 border border-stone-200 rounded bg-white px-2 focus:outline-none focus:ring-1 focus:ring-emerald-800 font-medium"
                                  >
                                    {Object.keys(providers).map((name) => (
                                      <option key={name} value={name}>
                                        {name.charAt(0).toUpperCase() + name.slice(1)}
                                      </option>
                                    ))}
                                  </select>
                                </div>
                                <div className="space-y-1">
                                  <label className="block text-[10px] font-bold text-stone-505 uppercase tracking-wider">
                                    AI Profile
                                  </label>
                                  <select
                                    value={selectedProfileIndex}
                                    onChange={(e) => setSelectedProfileIndex(parseInt(e.target.value))}
                                    className="w-full text-xs h-8 border border-stone-200 rounded bg-white px-2 focus:outline-none focus:ring-1 focus:ring-emerald-800 font-medium"
                                  >
                                    {providers[selectedProvider]?.profiles?.map((profile, idx) => (
                                      <option key={idx} value={idx}>
                                        {profile.profileName || `Profile ${idx + 1}`} ({profile.selectedModel || 'Default'})
                                      </option>
                                    )) || <option value={0}>Profile 1</option>}
                                  </select>
                                </div>
                              </div>
                            )}

                            <div className="flex gap-2">
                              <Button 
                                type="button" 
                                variant="outline"
                                onClick={handleGenerateAISchema}
                                disabled={isGeneratingSchema || Object.keys(providers).length === 0}
                                className="flex-1 text-xs border-stone-200 bg-white hover:bg-stone-50"
                              >
                                {isGeneratingSchema ? <Loader2 size={12} className="animate-spin mr-1.5" /> : <Wand2 size={12} className="mr-1.5" />}
                                AI Generate Schema
                              </Button>
                              <Button 
                                type="button" 
                                variant="outline"
                                disabled={!customSchema.trim() || !isSchemaValid}
                                onClick={() => {
                                  // Create dynamic form to POST code snippet directly to validator.schema.org
                                  const form = document.createElement('form');
                                  form.method = 'POST';
                                  form.action = 'https://validator.schema.org/';
                                  form.target = '_blank';

                                  const input = document.createElement('input');
                                  input.type = 'hidden';
                                  input.name = 'html';
                                  input.value = `<script type="application/ld+json">\n${customSchema}\n</script>`;

                                  form.appendChild(input);
                                  document.body.appendChild(form);
                                  form.submit();
                                  document.body.removeChild(form);
                                }}
                                className="flex-1 text-xs border-stone-200 bg-white hover:bg-stone-50"
                              >
                                <ExternalLink size={12} className="mr-1.5" />
                                Test Schema
                              </Button>
                            </div>
                          </div>
                        )}

                      </div>

                      {/* FLOATING OVERLAY DIALOG FOR HIERARCHICAL SCHEMA BUILDER */}
                      {isBuilderOpen && (
                        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
                          <div className="bg-white rounded-2xl shadow-2xl border border-stone-100 w-full max-w-4xl max-h-[85vh] flex flex-col overflow-hidden animate-in zoom-in-95 duration-200">
                            
                            {/* Builder Header */}
                            <div className="p-5 border-b border-stone-150 flex items-center justify-between bg-stone-50/50">
                              <div>
                                <h3 className="font-bold text-stone-850 text-base">Schema Builder</h3>
                                <p className="text-[10px] text-stone-400 font-semibold">Visual nested properties and nodes customizer</p>
                              </div>
                              <button 
                                type="button" 
                                onClick={() => setIsBuilderOpen(false)}
                                className="p-1.5 hover:bg-stone-100 rounded-full transition-colors text-stone-400 hover:text-stone-700"
                              >
                                <X size={18} />
                              </button>
                            </div>

                            {/* Builder Sub-navigation */}
                            <div className="px-5 pt-3 border-b border-stone-100 flex gap-4 bg-white">
                              <button
                                type="button"
                                onClick={() => setBuilderTab('edit')}
                                className={`pb-2.5 text-xs font-bold transition-all border-b-2 ${builderTab === 'edit' ? 'border-emerald-805 text-emerald-805' : 'border-transparent text-stone-400'}`}
                              >
                                Tree Editor
                              </button>
                              <button
                                type="button"
                                onClick={() => setBuilderTab('code')}
                                className={`pb-2.5 text-xs font-bold transition-all border-b-2 ${builderTab === 'code' ? 'border-emerald-805 text-emerald-805' : 'border-transparent text-stone-400'}`}
                              >
                                Raw JSON-LD Preview
                              </button>
                            </div>

                            {/* Builder Content Body */}
                            <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-white">
                              {builderTab === 'edit' ? (
                                <div className="space-y-2">
                                  {activeBuilderSchema.length === 0 ? (
                                    <div className="p-12 text-center text-stone-400 text-xs border-2 border-dashed border-stone-200 rounded-xl">
                                      Empty Schema. Click add actions below to start injecting fields!
                                    </div>
                                  ) : (
                                    activeBuilderSchema.map(node => (
                                      <SchemaNodeRow
                                        key={node.id}
                                        node={node}
                                        onUpdate={(updated) => {
                                          const copy = activeBuilderSchema.map(c => c.id === node.id ? updated : c);
                                          setActiveBuilderSchema(copy);
                                        }}
                                        onDelete={(id) => {
                                          const copy = activeBuilderSchema.filter(c => c.id !== id);
                                          setActiveBuilderSchema(copy);
                                        }}
                                      />
                                    ))
                                  )}

                                  {/* Add Root Nodes Actions */}
                                  <div className="flex gap-2.5 pt-4 border-t border-stone-100">
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      onClick={() => {
                                        setActiveBuilderSchema([...activeBuilderSchema, {
                                          id: `node-${Math.random().toString(36).substr(2, 9)}-${Date.now()}`,
                                          key: '',
                                          value: '',
                                          type: 'text'
                                        }]);
                                      }}
                                      className="text-xs bg-white border-stone-200 hover:bg-stone-50"
                                    >
                                      <Plus size={12} className="mr-1.5 text-emerald-800" />
                                      Add Property
                                    </Button>
                                    <Button
                                      type="button"
                                      variant="outline"
                                      size="sm"
                                      onClick={() => {
                                        setActiveBuilderSchema([...activeBuilderSchema, {
                                          id: `node-${Math.random().toString(36).substr(2, 9)}-${Date.now()}`,
                                          key: '',
                                          type: 'group',
                                          children: []
                                        }]);
                                      }}
                                      className="text-xs bg-white border-stone-200 hover:bg-stone-50"
                                    >
                                      <Plus size={12} className="mr-1.5 text-stone-500" />
                                      Add Property Group
                                    </Button>
                                  </div>
                                </div>
                              ) : (
                                <div className="space-y-2">
                                  <div className="flex justify-between items-center">
                                    <label className="text-[10px] font-bold text-stone-400 uppercase tracking-wider">Compiled Output JSON</label>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        const code = JSON.stringify(treeToSchemaObj(activeBuilderSchema), null, 2);
                                        navigator.clipboard.writeText(code);
                                        toast.success('Code copied to clipboard');
                                      }}
                                      className="text-[10px] font-bold text-emerald-800 hover:underline flex items-center gap-1"
                                    >
                                      <Copy size={10} /> Copy Code
                                    </button>
                                  </div>
                                  <pre className="p-4 bg-stone-900 rounded-xl text-emerald-400 font-mono text-xs overflow-auto max-h-[50vh]">
                                    {JSON.stringify(treeToSchemaObj(activeBuilderSchema), null, 2)}
                                  </pre>
                                </div>
                              )}
                            </div>

                            {/* Builder Footer Actions */}
                            <div className="p-4 border-t border-stone-150 bg-stone-55 flex items-center justify-between">
                              {/* Left: Save as template */}
                              <div>
                                {isNamingTemplate ? (
                                  <div className="flex items-center gap-2">
                                    <Input 
                                      placeholder="Enter template name..." 
                                      value={templateName} 
                                      onChange={(e) => setTemplateName(e.target.value)}
                                      className="h-8 text-xs w-48 bg-white border-stone-250 focus:ring-emerald-800" 
                                    />
                                    <Button 
                                      type="button"
                                      size="sm" 
                                      onClick={() => {
                                        if (!templateName.trim()) {
                                          toast.error('Please enter a valid template name');
                                          return;
                                        }
                                        const newTpl = {
                                          name: templateName.trim(),
                                          tree: activeBuilderSchema,
                                          createdAt: new Date().toISOString()
                                        };
                                        const updated = [...userTemplates, newTpl];
                                        setUserTemplates(updated);
                                        localStorage.setItem('seo_user_templates', JSON.stringify(updated));
                                        setIsNamingTemplate(false);
                                        setTemplateName('');
                                        toast.success('Template saved successfully!');
                                      }}
                                      className="h-8 text-xs bg-emerald-800 text-white hover:bg-emerald-950 font-bold"
                                    >
                                      Save
                                    </Button>
                                    <Button 
                                      type="button"
                                      size="sm" 
                                      variant="ghost" 
                                      onClick={() => {
                                        setIsNamingTemplate(false);
                                        setTemplateName('');
                                      }}
                                      className="h-8 text-xs"
                                    >
                                      Cancel
                                    </Button>
                                  </div>
                                ) : (
                                  <Button 
                                    type="button" 
                                    variant="outline" 
                                    size="sm"
                                    onClick={() => setIsNamingTemplate(true)}
                                    disabled={activeBuilderSchema.length === 0}
                                    className="text-xs border-stone-200 bg-white hover:bg-stone-50"
                                  >
                                    Save as Template
                                  </Button>
                                )}
                              </div>

                              {/* Right: Apply & Exit */}
                              <div className="flex gap-2">
                                <Button
                                  type="button"
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setIsBuilderOpen(false)}
                                  className="text-xs border-stone-200 bg-white hover:bg-stone-50"
                                >
                                  Cancel
                                </Button>
                                <Button
                                  type="button"
                                  size="sm"
                                  onClick={() => {
                                    const compiled = treeToSchemaObj(activeBuilderSchema);
                                    const activeSchemas = getParsedCustomSchemas();
                                    
                                    if (activeEditingSchemaIndex !== null) {
                                      activeSchemas[activeEditingSchemaIndex] = compiled;
                                    } else {
                                      activeSchemas.push(compiled);
                                    }
                                    
                                    setCustomSchema(JSON.stringify(activeSchemas, null, 2));
                                    setIsBuilderOpen(false);
                                    toast.success('Custom schema updated for this post!');
                                  }}
                                  disabled={activeBuilderSchema.length === 0}
                                  className="text-xs bg-emerald-950 text-white hover:bg-emerald-900 font-bold shadow-sm"
                                >
                                  Save for this Post
                                </Button>
                              </div>
                            </div>

                          </div>
                        </div>
                      )}

                    </TabsContent>
{/* SOCIAL TAB */}
                    <TabsContent value="social" className="m-0 space-y-6">

                      {/* Social Previews */}
                      <Tabs defaultValue="facebook" className="space-y-4">
                        <TabsList className="bg-stone-100 p-0.5 border border-stone-200 rounded-lg">
                          <TabsTrigger value="facebook" className="text-xs font-bold px-3 py-1.5 data-[state=active]:bg-white data-[state=active]:text-emerald-950">Universal Share</TabsTrigger>
                          <TabsTrigger value="twitter" className="text-xs font-bold px-3 py-1.5 data-[state=active]:bg-white data-[state=active]:text-emerald-950">Twitter Card (Override)</TabsTrigger>
                        </TabsList>

                        {/* Facebook preview & edit */}
                        <TabsContent value="facebook" className="m-0 space-y-4 animate-in fade-in duration-200">

                          {/* FaceBook card mockup */}
                          <div className="bg-white border border-stone-200 rounded-lg overflow-hidden max-w-md mx-auto shadow-sm text-left">
                            <div className="aspect-[1.91/1] bg-stone-100 flex items-center justify-center border-b border-stone-150">
                              {displayOgImage ? (
                                <img src={displayOgImage} alt="Preview" className="w-full h-full object-cover" />
                              ) : (
                                <div className="text-stone-400 text-xs flex flex-col items-center gap-1.5">
                                  <Share2 size={24} />
                                  <span>Default Sharing Image (Featured Cover)</span>
                                </div>
                              )}
                            </div>
                            <div className="p-3 bg-stone-50/50">
                              <p className="text-[10px] text-stone-400 font-bold uppercase tracking-wider">ENTREPRENEURS.BD</p>
                              <h5 className="font-bold text-stone-800 text-sm line-clamp-1 mt-0.5">{socialMeta.ogTitle || interpolatedTitle || documentTitle}</h5>
                              <p className="text-stone-500 text-xs line-clamp-2 mt-1 leading-normal">{socialMeta.ogDescription || interpolatedDesc || documentExcerpt}</p>
                            </div>
                          </div>

                          {/* Fields */}
                          <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm space-y-4">
                            <div>
                              <h5 className="text-sm font-bold text-stone-700 uppercase">Universal Social Share</h5>
                              <p className="text-xs text-stone-500 mt-0.5">Configures general Open Graph tags utilized by Facebook, LinkedIn, Slack, WhatsApp, and most other platforms.</p>
                            </div>

                            <div className="space-y-1.5">
                              <Label className="text-stone-600 font-bold">Universal Title</Label>
                              <Input
                                value={socialMeta.ogTitle}
                                onChange={(e) => setSocialMeta(prev => ({ ...prev, ogTitle: e.target.value }))}
                                placeholder={interpolatedTitle || documentTitle}
                                className="bg-white border-stone-200"
                              />
                            </div>

                            <div className="space-y-1.5">
                              <Label className="text-stone-600 font-bold">Universal Description</Label>
                              <textarea
                                value={socialMeta.ogDescription}
                                onChange={(e) => setSocialMeta(prev => ({ ...prev, ogDescription: e.target.value }))}
                                placeholder={interpolatedDesc || documentExcerpt}
                                rows={2.5}
                                className="w-full p-2.5 border border-stone-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-800"
                              />
                            </div>

                            <div className="space-y-1.5">
                              <Label className="text-stone-600 font-bold">Universal Share Image</Label>
                              <ImageUploader
                                value={socialMeta.ogImage}
                                onChange={(url) => setSocialMeta(prev => ({ ...prev, ogImage: url }))}
                                placeholder="Paste image URL or choose/upload one..."
                                entityType={contentType || 'blog'}
                              />
                              <p className="text-xs text-stone-500 mt-1">If left empty, falls back to the featured cover image.</p>
                            </div>
                          </div>
                        </TabsContent>

                        {/* Twitter preview & edit */}
                        <TabsContent value="twitter" className="m-0 space-y-4 animate-in fade-in duration-200">

                          {/* Twitter card mockup */}
                          <div className="bg-white border border-stone-200 rounded-2xl overflow-hidden max-w-md mx-auto shadow-sm text-left">
                            <div className="aspect-[1.91/1] bg-stone-100 flex items-center justify-center border-b border-stone-150">
                              {displayTwitterImage ? (
                                <img src={displayTwitterImage} alt="Preview" className="w-full h-full object-cover" />
                              ) : (
                                <div className="text-stone-400 text-xs flex flex-col items-center gap-1.5">
                                  <Share2 size={24} />
                                  <span>Default Twitter Image (Universal / Featured Cover)</span>
                                </div>
                              )}
                            </div>
                            <div className="p-3">
                              <p className="text-[10px] text-stone-400 font-bold">entrepreneurs.bd</p>
                              <h5 className="font-bold text-stone-800 text-sm line-clamp-1 mt-0.5">{socialMeta.twitterTitle || socialMeta.ogTitle || interpolatedTitle || documentTitle}</h5>
                              <p className="text-stone-500 text-xs line-clamp-2 mt-1 leading-normal">{socialMeta.twitterDescription || socialMeta.ogDescription || interpolatedDesc || documentExcerpt}</p>
                            </div>
                          </div>

                          {/* Fields */}
                          <div className="bg-white border border-stone-200 rounded-2xl p-6 shadow-sm space-y-4">
                            <h5 className="text-sm font-bold text-stone-700 uppercase">Twitter Card Metadata</h5>

                            <div className="space-y-1.5">
                              <Label className="text-stone-600 font-bold">Twitter Title</Label>
                              <Input
                                value={socialMeta.twitterTitle}
                                onChange={(e) => setSocialMeta(prev => ({ ...prev, twitterTitle: e.target.value }))}
                                placeholder={interpolatedTitle || documentTitle}
                                className="bg-white border-stone-200"
                              />
                            </div>

                            <div className="space-y-1.5">
                              <Label className="text-stone-600 font-bold">Twitter Description</Label>
                              <textarea
                                value={socialMeta.twitterDescription}
                                onChange={(e) => setSocialMeta(prev => ({ ...prev, twitterDescription: e.target.value }))}
                                placeholder={interpolatedDesc || documentExcerpt}
                                rows={2.5}
                                className="w-full p-2.5 border border-stone-200 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-emerald-800"
                              />
                            </div>

                            <div className="space-y-1.5">
                              <Label className="text-stone-600 font-bold">Twitter Share Image</Label>
                              <ImageUploader
                                value={socialMeta.twitterImage}
                                onChange={(url) => setSocialMeta(prev => ({ ...prev, twitterImage: url }))}
                                placeholder="Paste image URL or choose/upload one..."
                                entityType={contentType || 'blog'}
                              />
                            </div>

                            <div className="space-y-1.5">
                              <Label className="text-stone-600 font-bold">Twitter Card Style</Label>
                              <select
                                value={socialMeta.twitterCard}
                                onChange={(e) => setSocialMeta(prev => ({ ...prev, twitterCard: e.target.value }))}
                                className="w-full h-10 border border-stone-200 rounded-lg px-3 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-800 text-sm"
                              >
                                <option value="summary_large_image">Summary Card with Large Image</option>
                                <option value="summary">Summary Card (Small thumbnail)</option>
                              </select>
                            </div>
                          </div>
                        </TabsContent>
                      </Tabs>

                    </TabsContent>

                  </div>
                </ScrollArea>
              </div>

            </Tabs>

          </div>

          {/* Footer Save actions */}
          <div className="px-6 py-4 bg-white border-t border-stone-200 flex justify-end space-x-3">
            <Dialog.Close asChild>
              <Button type="button" variant="outline" className="border-stone-200 hover:bg-stone-50">
                Cancel
              </Button>
            </Dialog.Close>
            <Button
              type="button"
              onClick={handleSave}
              disabled={!isSchemaValid}
              className="bg-emerald-950 text-white hover:bg-emerald-900 shadow-md shadow-emerald-950/10"
            >
              Apply SEO & Schema Settings
            </Button>
          </div>

        </Dialog.Content>
      </Dialog.Portal>
    </Dialog.Root>
  );
};

export default SEOModal;
