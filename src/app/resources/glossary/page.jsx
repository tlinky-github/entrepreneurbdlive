import React from 'react';
import { glossaryAPI } from '@/lib/api';
import { glossaryTerms as mockGlossary } from '@/data/mock';
import GlossaryClient from './GlossaryClient';

export const metadata = {
  title: 'Entrepreneurship Glossary | Reference Desk',
  description: 'Clear definitions of essential entrepreneurship and business terms. A high-fidelity reference for the modern founder.',
};

export default async function GlossaryPage() {
  let firestoreTerms = [];

  try {
    const res = await glossaryAPI.list();
    firestoreTerms = (res.data || []).filter(t => t.status === 'published');
  } catch (error) {
    console.error('[Glossary Hub] Firestore ingestion failed:', error);
  }

  // 🛡️ Data Ingestion Protocol: Hybrid Firestore + Mock
  const allTerms = [...firestoreTerms, ...mockGlossary];

  return <GlossaryClient initialTerms={allTerms} />;
}
