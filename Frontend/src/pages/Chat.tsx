import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Chatbot } from '@/components/chatbot/Chatbot';
import { useLanguage } from '@/contexts/LanguageContext';
import PageHeader from '@/components/PageHeader'

export default function Chat() {
  const { t } = useLanguage();
  
  return (
    <div className="container mx-auto p-4 h-full flex flex-col">
      
      <h1 className="text-3xl font-bold mb-6">{t('chat.title', {}) || 'Krishi Saathi AI Assistant'}</h1>
      <Card className="flex-1 flex flex-col overflow-hidden">
        <CardHeader className="bg-primary text-primary-foreground p-4">
          <CardTitle className="text-xl">{t('app.title', {}) || 'Krishi Saathi'}</CardTitle>
          <p className="text-sm opacity-80">{t('chat.subtitle', {}) || 'Your farming assistant'}</p>
        </CardHeader>
        <CardContent className="flex-1 p-0">
          <Chatbot />
        </CardContent>
      </Card>
    </div>
  );
}
