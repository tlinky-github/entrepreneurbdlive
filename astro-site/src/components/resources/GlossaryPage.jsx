import React, { useState, useEffect } from 'react';
import { Book, Search, ChevronRight, ArrowRight, ExternalLink } from 'lucide-react';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { Input } from '../../components/ui/input';
import { Skeleton } from '../../components/ui/skeleton';
import { glossaryAPI } from '../../lib/api';

const GlossaryPage = ({ initialTerms = [] }) => {
  const [searchTerm, setSearchTerm] = React.useState('');
  const [firestoreTerms, setFirestoreTerms] = useState(initialTerms || []);
  const [loading, setLoading] = useState(!initialTerms || initialTerms.length === 0);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await glossaryAPI.list();
        const published = (res.data || []).filter(t => t.status === 'published');
        if (published.length > 0 || !initialTerms || initialTerms.length === 0) {
          setFirestoreTerms(published);
        }
      } catch (err) {
        console.error('Failed to load glossary from Firestore:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const allTerms = firestoreTerms;

  const searchTermLower = searchTerm.toLowerCase();
  const filteredTerms = allTerms.filter(item => {
    const termText = (item.term || '').toLowerCase();
    const definitionText = (item.definition || '').toLowerCase();
    return termText.includes(searchTermLower) || definitionText.includes(searchTermLower);
  });

  // Group terms alphabetically
  const groupedTerms = filteredTerms.reduce((acc, term) => {
    const letter = ((term.term || '').trim()[0] || '#').toUpperCase();
    if (!acc[letter]) {
      acc[letter] = [];
    }
    acc[letter].push(term);
    return acc;
  }, {});

  const sortedLetters = Object.keys(groupedTerms).sort();

  return (
    <>

      {/* Hero Section */}
      <section className="py-24 bg-stone-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-stone-200 mb-6 shadow-sm">
              <Book className="w-4 h-4 text-emerald-900" />
              <span className="text-sm font-medium text-emerald-900">
                {allTerms.length > 0 ? `${allTerms.length}+ Terms Reference` : 'Business Reference'}
              </span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-stone-900 mb-6">
              Entrepreneurship Glossary
            </h1>
            <p className="text-lg text-stone-600 leading-relaxed mb-8 max-w-2xl mx-auto">
              Clear definitions of essential entrepreneurship and business terms.
              Use this reference to explore {allTerms.length > 0 ? `${allTerms.length}+ curated terms` : 'our business terms'}.
            </p>

            {/* Search */}
            <div className="max-w-md mx-auto relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
              <Input
                type="text"
                placeholder={allTerms.length > 0 ? `Search ${allTerms.length}+ terms...` : "Search terms..."}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-12 h-12 border-stone-200 focus:border-emerald-500 focus:ring-emerald-500 bg-white"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Alphabet Navigation */}
      <section className="py-6 bg-white border-b border-stone-200 sticky top-16 z-40 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-wrap justify-center gap-2">
            {sortedLetters.map((letter) => (
              <a
                key={letter}
                href={`#letter-${letter}`}
                className="w-8 h-8 rounded-lg bg-stone-100 hover:bg-emerald-100 hover:text-emerald-900 flex items-center justify-center text-sm font-medium text-stone-600 transition-colors"
              >
                {letter}
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* Glossary Content */}
      <section className="py-20 lg:py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto">
            {loading ? (
              <div className="space-y-4">
                {[...Array(4)].map((_, i) => (
                  <Skeleton key={i} className="h-28 w-full rounded-xl bg-stone-100" />
                ))}
              </div>
            ) : filteredTerms.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-stone-500 mb-4">
                  {searchTerm ? `No terms found matching "${searchTerm}"` : 'No glossary terms published yet.'}
                </p>
                {searchTerm && (
                  <Button variant="outline" onClick={() => setSearchTerm('')}>
                    Clear search
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-12">
                {sortedLetters.map((letter) => (
                  <div key={letter} id={`letter-${letter}`} className="scroll-mt-40">
                    <h2 className="text-3xl font-bold text-emerald-900 mb-6 pb-2 border-b border-stone-200">
                      {letter}
                    </h2>
                    <div className="space-y-6">
                      {(groupedTerms[letter] || []).map((item, index) => (
                        <Card key={index} className="group border-stone-200">
                          <CardContent className="p-6">
                            <dt className="text-lg font-semibold text-stone-900 mb-2">
                                {(item.url || item.link_url || item.href || item.link) ? (
                                  <a 
                                    href={item.url || item.link_url || item.href || item.link}
                                    target={item.target || "_blank"}
                                    rel={item.rel || "noopener noreferrer"}
                                    className="text-emerald-900 hover:text-emerald-700 hover:underline inline-flex items-center gap-1.5 group/link"
                                  >
                                    <span>{item.term || 'Untitled'}</span>
                                    <ExternalLink className="w-4 h-4 text-emerald-600 group-hover/link:text-emerald-800 transition-colors inline-block" />
                                  </a>
                                ) : (
                                  <span>{item.term || 'Untitled'}</span>
                                )}
                              </dt>
                            <dd className="text-stone-600 leading-relaxed pl-4 border-l-2 border-emerald-200 group-hover:border-emerald-500 transition-colors">
                              {item.definition || 'No definition available.'}
                            </dd>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20 lg:py-24 bg-stone-50 border-t border-stone-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-2xl sm:text-3xl font-bold text-stone-900 mb-4">
              Ready to Learn More?
            </h2>
            <p className="text-stone-600 mb-8">
              Explore our comprehensive knowledge hub for in-depth articles on entrepreneurship topics.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <a href="/knowledge">
                <Button className="bg-emerald-900 hover:bg-emerald-800 text-white min-w-[160px]">
                  Knowledge Hub
                </Button>
              </a>
              <a href="/resources/guides">
                <Button
                  variant="outline"
                  className="border-emerald-900 text-emerald-900 hover:bg-emerald-50 min-w-[160px]"
                >
                  Practical Guides
                </Button>
              </a>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default GlossaryPage;
