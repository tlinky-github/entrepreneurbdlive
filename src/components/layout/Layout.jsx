import Header from './Header';
import Footer from './Footer';
import { Toaster } from '../ui/sonner';
import CustomCodeInjector from '../common/CustomCodeInjector';

const Layout = ({ children, hideFooter = false }) => {
  return (
    <div className="min-h-screen flex flex-col bg-stone-50">
      <CustomCodeInjector />
      <Header />
      <main className="flex-1">
        {children}
      </main>
      {!hideFooter && <Footer />}
      <Toaster position="top-right" richColors />
    </div>
  );
};

export default Layout;
