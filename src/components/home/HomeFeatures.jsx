import { Rocket, Target, TrendingUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';

const features = [
  {
    icon: Rocket,
    title: 'Entrepreneur Profiles',
    description: 'Showcase your journey and connect with fellow founders across Bangladesh.',
  },
  {
    icon: Target,
    title: 'Business Directory',
    description: 'List your startup or SME and get discovered by investors and partners.',
  },
  {
    icon: TrendingUp,
    title: 'Growth Resources',
    description: 'Access guides, templates, and tools to accelerate your business growth.',
  },
];

export default function HomeFeatures() {
  return (
    <section className="py-20 lg:py-28 bg-stone-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16 animate-fade-in">
          <Badge className="bg-emerald-100 text-emerald-900 mb-4 px-4 py-1 border-none font-bold uppercase tracking-wider text-[10px]">
            Platform Features
          </Badge>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-stone-900 mb-4 tracking-tight">
            Everything You Need to <span className="text-emerald-900 underline decoration-emerald-200 underline-offset-8">Grow</span>
          </h2>
          <p className="text-lg text-stone-600 max-w-2xl mx-auto leading-relaxed">
            From building your profile to finding resources, we've got the tools to support every stage of your entrepreneurial journey.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 px-4 sm:px-0">
          {features.map((feature, index) => (
            <Card
              key={index}
              className="border-stone-200/60 shadow-sm hover:border-emerald-900/20 hover:shadow-[0_20px_40px_rgba(0,0,0,0.04)] transition-all duration-300 group rounded-3xl overflow-hidden bg-white"
            >
              <CardContent className="p-8 lg:p-10">
                <div className="w-16 h-16 bg-emerald-50 rounded-2xl mb-8 flex items-center justify-center group-hover:bg-emerald-900 transition-all duration-300 group-hover:rotate-6 shadow-sm">
                  <feature.icon className="w-8 h-8 text-emerald-900 group-hover:text-white transition-colors" />
                </div>
                <h3 className="text-2xl font-bold text-stone-900 mb-4 group-hover:text-emerald-900 transition-colors">
                  {feature.title}
                </h3>
                <p className="text-stone-600 leading-relaxed text-base">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}
