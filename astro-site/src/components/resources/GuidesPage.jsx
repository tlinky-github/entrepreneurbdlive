import React, { useState, useEffect } from 'react';
import * as LucideIcons from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card';
import { Skeleton } from '../../components/ui/skeleton';
import { guidesAPI } from '../../lib/api';

const BookOpen = LucideIcons.BookOpen;

const resolveLucideIcon = (name) => {
  if (!name || typeof name !== 'string') return null;
  const clean = name.trim();
  if (LucideIcons[clean] && typeof LucideIcons[clean] !== 'string') return LucideIcons[clean];

  // Convert kebab-case or space-case to PascalCase (e.g. "building-2" -> "Building2", "book-open" -> "BookOpen")
  const pascal = clean
    .split(/[-_ ]+/)
    .map(p => p.charAt(0).toUpperCase() + p.slice(1))
    .join('');
  if (LucideIcons[pascal] && typeof LucideIcons[pascal] !== 'string') return LucideIcons[pascal];

  // Case-insensitive match against LucideIcons keys
  const lower = clean.toLowerCase().replace(/[^a-z0-9]/g, '');
  const key = Object.keys(LucideIcons).find(k => k.toLowerCase() === lower);
  if (key && LucideIcons[key] && typeof LucideIcons[key] !== 'string') return LucideIcons[key];

  return null;
};

const GuidesPage = ({ initialGuides = [] }) => {
  const [firestoreGuides, setFirestoreGuides] = useState(initialGuides || []);
  const [loading, setLoading] = useState(!initialGuides || initialGuides.length === 0);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await guidesAPI.list();
        const published = (res.data || []).filter(g => g.status === 'published');
        const mapped = published.map((g, idx) => ({
          ...g,
          order: Number(g.order ?? g.position ?? (idx + 1))
        }));
        mapped.sort((a, b) => a.order - b.order);
        if (mapped.length > 0 || !initialGuides || initialGuides.length === 0) {
          setFirestoreGuides(mapped);
        }
      } catch (err) {
        console.error('Failed to load guides from Firestore:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const allGuides = firestoreGuides;

  return (
    <>

      {/* Hero Section */}
      <section className="py-24 bg-stone-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-stone-200 mb-6 shadow-sm">
              <BookOpen className="w-4 h-4 text-emerald-900" />
              <span className="text-sm font-medium text-emerald-900">Practical Resources</span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-stone-900 mb-6">
              Practical Guides
            </h1>
            <p className="text-lg text-stone-600 leading-relaxed max-w-2xl mx-auto">
              Frameworks and considerations for navigating common entrepreneurial challenges.
              These guides provide structured approaches while acknowledging that outcomes
              depend on individual circumstances.
            </p>
          </div>
        </div>
      </section>

      {/* Guides List */}
      <section className="py-20 lg:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto space-y-8">
            {loading ? (
              <div className="space-y-6">
                {[...Array(3)].map((_, i) => (
                  <Skeleton key={i} className="h-40 w-full rounded-xl bg-stone-100" />
                ))}
              </div>
            ) : allGuides.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-stone-500">No guides published yet.</p>
              </div>
            ) : (
              allGuides.map((guide, guideIndex) => (
                <Card key={guide.id || guideIndex} className="border-stone-200 overflow-hidden shadow-md">
                  <CardHeader className="bg-stone-50 border-b border-stone-200">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-emerald-900 flex items-center justify-center flex-shrink-0 text-xl">
                        {(() => {
                          const IconComp = resolveLucideIcon(guide.icon);
                          const DefaultIcon = LucideIcons.BookOpen;
                          if (IconComp) return <IconComp className="w-6 h-6 text-emerald-100" />;
                          if (guide.icon) return <span>{guide.icon}</span>;
                          return DefaultIcon ? <DefaultIcon className="w-6 h-6 text-emerald-100" /> : null;
                        })()}
                      </div>
                      <div>
                        <CardTitle className="text-xl text-stone-900">
                          {guide.title}
                        </CardTitle>
                        <CardDescription className="text-stone-500">
                          {guide.description}
                        </CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-8">
                    <div className="space-y-8">
                      {(() => {
                        const steps = (Array.isArray(guide.steps) && guide.steps.length > 0)
                          ? guide.steps
                          : (Array.isArray(guide.content) && guide.content.length > 0)
                            ? guide.content
                            : (Array.isArray(guide.sections) ? guide.sections : []);

                        if (steps.length === 0) {
                          return <p className="text-stone-400 text-sm italic">No steps added for this guide yet.</p>;
                        }

                        return steps.map((section, sectionIndex) => {
                          const heading = section.heading || section.title || section.name || `Step ${sectionIndex + 1}`;
                          const text = section.text || section.description || section.details || section.content || '';
                          return (
                            <div key={sectionIndex} className="flex gap-4">
                              <div className="flex-shrink-0">
                                <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center">
                                  <span className="text-emerald-900 font-bold text-sm">
                                    {sectionIndex + 1}
                                  </span>
                                </div>
                              </div>
                              <div>
                                <h4 className="font-semibold text-stone-900 mb-2">
                                  {heading}
                                </h4>
                                {text && (
                                  <p className="text-stone-600 leading-relaxed whitespace-pre-line">
                                    {text}
                                  </p>
                                )}
                              </div>
                            </div>
                          );
                        });
                      })()}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </section>

      {/* Disclaimer */}
      <section className="py-12 bg-stone-50 border-t border-stone-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <p className="text-sm text-stone-500 leading-relaxed">
              <strong className="text-stone-900">Note:</strong> These guides provide general frameworks
              and considerations. Outcomes depend on individual circumstances, market conditions,
              and execution. Adapt these approaches to your specific situation and consider seeking
              professional advice for significant decisions.
            </p>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 lg:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-2xl sm:text-3xl font-bold text-stone-900 mb-4">
              Explore More Resources
            </h2>
            <p className="text-stone-600 mb-8">
              Continue your learning with our knowledge hub and FAQs.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a href="/knowledge">
                <Button className="bg-emerald-900 hover:bg-emerald-800 text-white min-w-[160px]">
                  Knowledge Hub
                </Button>
              </a>
              <a href="/resources/faqs">
                <Button
                  variant="outline"
                  className="border-emerald-900 text-emerald-900 hover:bg-emerald-50 min-w-[160px]"
                >
                  Browse FAQs
                </Button>
              </a>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default GuidesPage;
