import { useLocation, Link, useNavigate } from 'react-router-dom';
import { Button } from '../../components/ui/button';
import { Card, CardContent } from '../../components/ui/card';
import { Badge } from '../../components/ui/badge';
import { CheckCircle2, ArrowRight, Building2, User } from 'lucide-react';
import { SEO } from '../../components/SEO';
import { useEffect } from 'react';

const SubmissionSuccess = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { name, type } = location.state || {};

  // Redirect if accessed directly without state
  useEffect(() => {
    if (!name) {
      navigate('/submit');
    }
  }, [name, navigate]);

  if (!name) return null;

  return (
    <div className="min-h-screen bg-stone-50 py-20 px-4">
      <SEO 
        title="Submission Successful - Entrepreneurs.bd" 
        description="Thank you for your submission to Bangladesh's entrepreneur ecosystem."
      />
      
      <div className="max-w-2xl mx-auto text-center">
        <div className="mb-8 flex justify-center">
          <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center animate-bounce-subtle">
            <CheckCircle2 className="w-12 h-12 text-emerald-900" />
          </div>
        </div>

        <Badge className="bg-emerald-100 text-emerald-900 mb-6 px-4 py-1.5">
          Submission Received
        </Badge>
        
        <h1 className="text-4xl font-bold text-stone-900 mb-6">
          Thank you, <span className="text-emerald-900">{name}</span>!
        </h1>

        <Card className="border-stone-200 shadow-xl overflow-hidden mb-12">
          <CardContent className="p-8">
            <div className="flex justify-center mb-6">
              {type === 'entrepreneur' ? (
                <div className="flex items-center gap-3 px-4 py-2 bg-stone-100 rounded-full">
                  <User className="w-5 h-5 text-stone-500" />
                  <span className="text-stone-700 font-medium">Entrepreneur Profile Submission</span>
                </div>
              ) : (
                <div className="flex items-center gap-3 px-4 py-2 bg-stone-100 rounded-full">
                  <Building2 className="w-5 h-5 text-stone-500" />
                  <span className="text-stone-700 font-medium">Business Directory Submission</span>
                </div>
              )}
            </div>

            <p className="text-lg text-stone-600 mb-8 leading-relaxed">
              {type === 'entrepreneur' ? (
                <>
                  We&apos;re incredibly excited to showcase your journey as a founder. 
                  Our team is currently reviewing your details to ensure we present 
                  your story in the best possible light.
                </>
              ) : (
                <>
                  Your business is a vital part of Bangladesh&apos;s growing ecosystem. 
                  We&apos;ve received your directory listing and our moderators are 
                  validating the details to help you get the best visibility.
                </>
              )}
            </p>

            <div className="bg-emerald-50 rounded-xl p-6 border border-emerald-100 text-left">
              <h3 className="font-semibold text-emerald-900 mb-2 flex items-center gap-2">
                What happens next?
              </h3>
              <ul className="space-y-3 text-sm text-emerald-800">
                <li className="flex gap-3">
                  <span className="bg-emerald-200 text-emerald-900 w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0">1</span>
                    Our editorial team will review your submission for accuracy and formatting.
                </li>
                <li className="flex gap-3">
                  <span className="bg-emerald-200 text-emerald-900 w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0">2</span>
                    If we need any clarifications, we&apos;ll reach out via the email you provided.
                </li>
                <li className="flex gap-3">
                  <span className="bg-emerald-200 text-emerald-900 w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0">3</span>
                    Once approved, your profile will be live and shared across our network!
                </li>
              </ul>
            </div>
          </CardContent>
        </Card>

        <div className="flex flex-wrap justify-center gap-4">
          <Link to="/">
            <Button variant="ghost" className="text-stone-600 hover:text-emerald-900">
              Back to Home
            </Button>
          </Link>
          <Link to="/blog">
            <Button className="bg-emerald-900 text-white hover:bg-emerald-800 px-8">
              Read Latest Insights
              <ArrowRight className="ml-2 w-4 h-4" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default SubmissionSuccess;
