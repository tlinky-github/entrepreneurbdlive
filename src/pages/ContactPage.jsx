import React from 'react';
import { Link } from 'react-router-dom';
import { SEO } from '../components/SEO';
import { Mail, MapPin, Linkedin, Facebook, Send, MessageSquare } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Textarea } from '../components/ui/textarea';
import { Label } from '../components/ui/label';
import { siteConfig } from '../data/mock';
import { toast } from 'sonner';

const ContactPage = () => {
  const [formData, setFormData] = React.useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [isSubmitting, setIsSubmitting] = React.useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    // Simulate form submission
    await new Promise(resolve => setTimeout(resolve, 1000));

    toast.success('Message sent successfully!', {
      description: 'We will get back to you as soon as possible.'
    });

    setFormData({ name: '', email: '', subject: '', message: '' });
    setIsSubmitting(false);
  };

  return (
    <>
      <SEO
        pageKey="contact"
        breadcrumbs={[
          { name: 'Home', path: '/' },
          { name: 'Contact', path: '/contact' }
        ]}
      />
      {/* Hero Section */}
      <section className="py-24 bg-stone-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto text-center">
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-stone-900 mb-6">
              Contact & Transparency
            </h1>
            <p className="text-lg text-stone-600 leading-relaxed max-w-2xl mx-auto">
              We welcome inquiries, feedback, and suggestions. Reach out to us through
              the channels below or use the contact form.
            </p>
          </div>
        </div>
      </section>

      {/* Contact Content */}
      <section className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-12">
            {/* Contact Information */}
            <div className="lg:col-span-1 space-y-6">
              <Card className="border-stone-200 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg text-stone-900">Contact Information</CardTitle>
                  <CardDescription>Ways to reach entrepreneurs.bd</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center flex-shrink-0">
                      <Mail className="w-5 h-5 text-emerald-900" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-stone-900">Email</p>
                      <a
                        href={`mailto:${siteConfig.contact.email}`}
                        className="text-sm text-stone-600 hover:text-emerald-900 transition-colors"
                      >
                        {siteConfig.contact.email}
                      </a>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-emerald-50 flex items-center justify-center flex-shrink-0">
                      <MapPin className="w-5 h-5 text-emerald-900" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-stone-900">Location</p>
                      <p className="text-sm text-stone-600">
                        {siteConfig.contact.location}
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-stone-200 shadow-sm">
                <CardHeader>
                  <CardTitle className="text-lg text-stone-900">Connect Online</CardTitle>
                  <CardDescription>Follow the founder on social media</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex gap-3">
                    <a
                      href={siteConfig.founder.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-stone-50 hover:bg-emerald-50 text-stone-600 hover:text-emerald-900 transition-colors"
                    >
                      <Linkedin className="w-4 h-4" />
                      <span className="text-sm font-medium">LinkedIn</span>
                    </a>
                    <a
                      href={siteConfig.founder.facebook}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 px-4 py-2 rounded-lg bg-stone-50 hover:bg-emerald-50 text-stone-600 hover:text-emerald-900 transition-colors"
                    >
                      <Facebook className="w-4 h-4" />
                      <span className="text-sm font-medium">Facebook</span>
                    </a>
                  </div>
                </CardContent>
              </Card>

              <Card className="border-emerald-100 bg-emerald-50/50">
                <CardHeader>
                  <CardTitle className="text-lg text-emerald-900">Response Policy</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-emerald-800 leading-relaxed">
                    We aim to respond to all inquiries within 2-3 business days. For content-related
                    suggestions or corrections, please include specific references to help us address
                    your feedback efficiently.
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Contact Form */}
            <div className="lg:col-span-2">
              <Card className="border-stone-200 shadow-sm">
                <CardHeader>
                  <div className="flex items-center gap-3 mb-2">
                    <div className="w-10 h-10 rounded-lg bg-emerald-900 flex items-center justify-center">
                      <MessageSquare className="w-5 h-5 text-emerald-100" />
                    </div>
                    <CardTitle className="text-xl text-stone-900">Send a Message</CardTitle>
                  </div>
                  <CardDescription>
                    Have a question, suggestion, or feedback? We'd love to hear from you.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                      <div className="space-y-2">
                        <Label htmlFor="name" className="text-stone-700">Name</Label>
                        <Input
                          id="name"
                          name="name"
                          value={formData.name}
                          onChange={handleChange}
                          placeholder="Your name"
                          required
                          className="border-stone-200 focus:border-emerald-500 focus:ring-emerald-500"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email" className="text-stone-700">Email</Label>
                        <Input
                          id="email"
                          name="email"
                          type="email"
                          value={formData.email}
                          onChange={handleChange}
                          placeholder="your@email.com"
                          required
                          className="border-stone-200 focus:border-emerald-500 focus:ring-emerald-500"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="subject" className="text-stone-700">Subject</Label>
                      <Input
                        id="subject"
                        name="subject"
                        value={formData.subject}
                        onChange={handleChange}
                        placeholder="What is this regarding?"
                        required
                        className="border-stone-200 focus:border-emerald-500 focus:ring-emerald-500"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="message" className="text-stone-700">Message</Label>
                      <Textarea
                        id="message"
                        name="message"
                        value={formData.message}
                        onChange={handleChange}
                        placeholder="Your message..."
                        rows={6}
                        required
                        className="border-stone-200 focus:border-emerald-500 focus:ring-emerald-500 resize-none"
                      />
                    </div>

                    <Button
                      type="submit"
                      disabled={isSubmitting}
                      className="bg-emerald-900 hover:bg-emerald-800 text-white w-full sm:w-auto px-8"
                    >
                      {isSubmitting ? (
                        <span className="flex items-center gap-2">
                          <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></span>
                          Sending...
                        </span>
                      ) : (
                        <span className="flex items-center gap-2">
                          <Send className="w-4 h-4" />
                          Send Message
                        </span>
                      )}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* Transparency Notice */}
      <section className="py-20 bg-stone-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-2xl font-bold text-stone-900 mb-6 text-center">
              Our Commitment to Transparency
            </h2>
            <div className="prose-entrepreneurship">
              <p className="text-stone-600 leading-relaxed mb-4">
                entrepreneurs.bd is committed to maintaining transparency in all our communications
                and content. We believe that trust is built through honest, clear communication
                about who we are and what we offer.
              </p>
              <p className="text-stone-600 leading-relaxed mb-4">
                If you identify any errors in our content, have questions about our editorial
                process, or would like more information about any aspect of our platform,
                please don't hesitate to reach out.
              </p>
              <p className="text-stone-600 leading-relaxed">
                We welcome constructive feedback and are committed to continuous improvement
                in the quality and accuracy of our content.
              </p>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default ContactPage;
