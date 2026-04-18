import React from 'react';

const BrandedPlaceholder = ({ title, category, className = "" }) => {
  return (
    <div className={`w-full h-full relative overflow-hidden flex flex-col justify-between p-6 bg-emerald-900 group ${className}`}>
      {/* Background Decor */}
      <div className="absolute inset-0 opacity-10">
        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white blur-3xl"></div>
        <div className="absolute -bottom-10 -left-10 w-40 h-40 rounded-full bg-emerald-400 blur-3xl"></div>
        <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.1) 1px, transparent 0)', backgroundSize: '24px 24px' }}></div>
      </div>

      {/* Brand Header */}
      <div className="relative z-10 flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <div className="w-6 h-6 bg-emerald-100 rounded flex items-center justify-center">
            <span className="text-emerald-900 font-bold text-[10px]">e</span>
          </div>
          <span className="text-[10px] font-bold text-emerald-100 tracking-widest uppercase">Entrepreneurs BD</span>
        </div>
        {category && (
          <span className="text-[10px] font-semibold bg-emerald-800 text-emerald-100 px-2 py-0.5 rounded border border-emerald-700/50">
            {category}
          </span>
        )}
      </div>

      {/* Title */}
      <div className="relative z-10 mt-auto">
        <h3 className="text-white font-bold text-lg md:text-xl leading-tight line-clamp-3 group-hover:scale-[1.02] transition-transform duration-500">
          {title}
        </h3>
        <div className="w-12 h-1 bg-emerald-500 mt-4 rounded-full opacity-50 group-hover:w-20 transition-all duration-500"></div>
      </div>

      {/* Site URL Footer */}
      <div className="absolute bottom-3 right-4 opacity-20 text-[9px] font-medium text-white italic">
        entrepreneurs.bd
      </div>
    </div>
  );
};

export default BrandedPlaceholder;
