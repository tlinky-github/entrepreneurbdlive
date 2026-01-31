import React from 'react';
import { Link } from 'react-router-dom';
import { SEO } from '../components/SEO';
import { BookOpen, Search, ArrowRight } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { glossaryTerms } from '../data/mock';

const GlossaryPage = () => {
  const [searchTerm, setSearchTerm] = React.useState('');

  const filteredTerms = glossaryTerms.filter(item =>
    item.term.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.definition.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Group terms alphabetically
  const groupedTerms = filteredTerms.reduce((acc, term) => {
    const letter = term.term[0].toUpperCase();
    if (!acc[letter]) {
      acc[letter] = [];
    }
    acc[letter].push(term);
    return acc;
  }, {});

  const sortedLetters = Object.keys(groupedTerms).sort();

  return (
    <>
      <SEO
        pageKey="glossary"
        breadcrumbs={[
          { name: 'Home', path: '/' },
          { name: 'Resources', path: '/resources' },
          { name: 'Glossary', path: '/resources/glossary' }
        ]}
      />
      {/* Hero Section */}
      <section className="py-24 bg-stone-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-stone-200 mb-6 shadow-sm">
              <BookOpen className="w-4 h-4 text-emerald-900" />
              <span className="text-sm font-medium text-emerald-900">Reference</span>
            </div>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-stone-900 mb-6">
              Entrepreneurship Glossary
            </h1>
            <p className="text-lg text-stone-600 leading-relaxed mb-8 max-w-2xl mx-auto">
              Clear definitions of essential entrepreneurship and business terms.
              Use this glossary as a reference while exploring our content.
            </p>

            {/* Search */}
            <div className="max-w-md mx-auto relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
              <Input
                type="text"
                placeholder="Search terms..."
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
            {filteredTerms.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-stone-500 mb-4">No terms found matching "{searchTerm}"</p>
                <Button variant="outline" onClick={() => setSearchTerm('')}>
                  Clear search
                </Button>
              </div>
            ) : (
              <div className="space-y-12">
                {sortedLetters.map((letter) => (
                  <div key={letter} id={`letter-${letter}`} className="scroll-mt-40">
                    <h2 className="text-3xl font-bold text-emerald-900 mb-6 pb-2 border-b border-stone-200">
                      {letter}
                    </h2>
                    <dl className="space-y-6">
                      {groupedTerms[letter].map((item, index) => (
                        <div key={index} className="group">
                          <dt className="text-lg font-semibold text-stone-900 mb-2">
                            {item.term}
                          </dt>
                          <dd className="text-stone-600 leading-relaxed pl-4 border-l-2 border-emerald-200 group-hover:border-emerald-500 transition-colors">
                            {item.definition}
                          </dd>
                        </div>
                      ))}
                    </dl>
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
            <Button
              asChild
              className="bg-emerald-900 hover:bg-emerald-800 text-white"
            >
              <Link to="/knowledge">
                Explore Knowledge Hub
                <ArrowRight className="ml-2 w-4 h-4" />
              </Link>
            </Button>
          </div>
        </div>
      </section>
    </>
  );
};

export default GlossaryPage;
