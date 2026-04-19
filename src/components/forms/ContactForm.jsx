"use client";

import React from 'react';
import { Send, MessageSquare } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

export default function ContactForm() {
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
    await new Promise(resolve => setTimeout(resolve, 1500));

    toast.success('Message sent successfully!', {
      description: 'The editorial board has received your inquiry. We will respond shortly.'
    });

    setFormData({ name: '', email: '', subject: '', message: '' });
    setIsSubmitting(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
        <div className="space-y-3">
          <Label htmlFor="name" className="text-[10px] font-black uppercase tracking-widest text-stone-400">Your Full Name</Label>
          <Input
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder="John Doe"
            required
            className="h-12 rounded-2xl border-stone-100 bg-stone-50/50 focus:bg-white transition-all focus:ring-emerald-900"
          />
        </div>
        <div className="space-y-3">
          <Label htmlFor="email" className="text-[10px] font-black uppercase tracking-widest text-stone-400">Professional Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            placeholder="john@business.bd"
            required
            className="h-12 rounded-2xl border-stone-100 bg-stone-50/50 focus:bg-white transition-all focus:ring-emerald-900"
          />
        </div>
      </div>

      <div className="space-y-3">
        <Label htmlFor="subject" className="text-[10px] font-black uppercase tracking-widest text-stone-400">Subject / Inquiry Type</Label>
        <Input
          id="subject"
          name="subject"
          value={formData.subject}
          onChange={handleChange}
          placeholder="Consultation, Partnership, or Content Feedback"
          required
          className="h-12 rounded-2xl border-stone-100 bg-stone-50/50 focus:bg-white transition-all focus:ring-emerald-900"
        />
      </div>

      <div className="space-y-3">
        <Label htmlFor="message" className="text-[10px] font-black uppercase tracking-widest text-stone-400">How can we help you?</Label>
        <Textarea
          id="message"
          name="message"
          value={formData.message}
          onChange={handleChange}
          placeholder="Detailed description of your inquiry..."
          rows={6}
          required
          className="rounded-[2rem] border-stone-100 bg-stone-50/50 focus:bg-white transition-all focus:ring-emerald-900 resize-none p-6"
        />
      </div>

      <Button
        type="submit"
        disabled={isSubmitting}
        className="h-14 px-10 bg-emerald-900 hover:bg-emerald-800 text-white font-black uppercase tracking-widest text-xs rounded-2xl transition-all w-full sm:w-auto overflow-hidden shadow-lg shadow-emerald-900/20"
      >
        {isSubmitting ? (
          <span className="flex items-center gap-3">
            <span className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></span>
            Transmitting...
          </span>
        ) : (
          <span className="flex items-center gap-3">
            <Send className="w-4 h-4" />
            Dispatch Message
          </span>
        )}
      </Button>
    </form>
  );
}
