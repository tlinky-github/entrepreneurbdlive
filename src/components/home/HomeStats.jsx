import { Users, Building2, FileText, BookOpen } from 'lucide-react';

export default function HomeStats({ stats = {} }) {
  const statItems = [
    { label: 'Entrepreneurs', value: `${stats.total_entrepreneurs || '0'}+`, icon: Users, color: 'bg-emerald-100' },
    { label: 'Businesses', value: `${stats.total_listings || '0'}+`, icon: Building2, color: 'bg-emerald-100' },
    { label: 'Articles', value: `${stats.total_blog_posts || '0'}+`, icon: FileText, color: 'bg-emerald-100' },
    { label: 'Resources', value: `${stats.total_resources || '0'}+`, icon: BookOpen, color: 'bg-emerald-100' },
  ];

  return (
    <section className="relative -mt-12 z-10">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.08)] p-8 lg:p-10 border border-stone-100">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8 lg:gap-12 divide-x-0 lg:divide-x divide-stone-100">
            {statItems.map((stat, index) => (
              <div key={index} className="text-center group flex flex-col items-center">
                <div className={`w-14 h-14 ${stat.color} rounded-2xl mx-auto mb-4 flex items-center justify-center group-hover:scale-110 group-hover:bg-emerald-900 group-hover:text-white transition-all duration-300 shadow-sm`}>
                  <stat.icon className="w-7 h-7 text-emerald-900 group-hover:text-white transition-colors" />
                </div>
                <div className="text-3xl sm:text-4xl font-bold text-stone-900 tracking-tight lg:mb-1">
                  {stat.value}
                </div>
                <div className="text-xs sm:text-sm font-semibold text-stone-500 uppercase tracking-widest">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
