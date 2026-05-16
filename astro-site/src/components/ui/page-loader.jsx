import { Loader2 } from 'lucide-react';

export const PageLoader = ({ message = "Loading..." }) => {
    return (
        <div className="min-h-[50vh] flex flex-col items-center justify-center p-8 text-center space-y-4">
            <div className="relative">
                <div className="absolute inset-0 bg-emerald-100 rounded-full animate-ping opacity-75"></div>
                <div className="relative bg-emerald-50 p-4 rounded-full">
                    <Loader2 className="w-8 h-8 text-emerald-600 animate-spin" />
                </div>
            </div>
            <div className="space-y-1">
                <h3 className="text-lg font-medium text-emerald-900">{message}</h3>
                <p className="text-sm text-stone-500 max-w-sm mx-auto">
                    Preparing your content just for you...
                </p>
            </div>
        </div>
    );
};
