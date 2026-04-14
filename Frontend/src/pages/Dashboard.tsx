import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ChatInterface } from '@/components/ChatInterface';
import { Sparkles, Camera, FileText, TrendingUp, Sun, TrendingDown } from 'lucide-react';
import heroFarmingImage from '@/assets/farmer 5.png';
import { useLanguage } from '@/contexts/LanguageContext';
import PageHeader from '@/components/PageHeader'

const Dashboard: React.FC = () => {
  const [isChatOpen, setIsChatOpen] = useState(false);

  const { t } = useLanguage();

  const quickStats = useMemo(() => [
    { title: t('dashboard.stats.weather', {}), value: '28°C', icon: Sun, color: 'text-secondary', desc: t('dashboard.states.sunny', {}) },
    { title: t('dashboard.stats.wheatRate', {}), value: '₹2,125', icon: TrendingUp, color: 'text-success', desc: 'Quintal' },
    { title: t('dashboard.stats.riceRate', {}), value: '₹1,890', icon: TrendingDown, color: 'text-destructive', desc: 'Quintal' },
  ], [t]);

  const recentActivities = useMemo(() => [
    { action: t('dashboard.activities.fertilizer', {}), time: t('dashboard.activities.2hours', {}) },
    { action: t('dashboard.activities.cropDisease', {}), time: t('dashboard.activities.5hours', {}) },
    { action: t('dashboard.activities.schemeAlert', {}), time: t('dashboard.activities.1day', {}) },
    { action: t('dashboard.activities.weatherUpdate', {}), time: t('dashboard.activities.2days', {}) },
  ], [t]);

  return (
    
    <div className="min-h-screen bg-background">
      <PageHeader icon="🏠" title="Dashboard" subtitle="Welcome to KrushiSaathi" />
      {/* Hero Section */}
      <section className="relative h-80 md:h-[28rem] overflow-hidden flex items-center justify-center" role="banner" aria-label="KrishiSaathi Hero Section">
        <img
          src={heroFarmingImage}
          alt={t('dashboard.hero.alt', {})}
          className="absolute inset-0 w-full h-full object-cover object-top z-0"
          style={{ objectPosition: 'center 25%' }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-green-900/30 via-black/20 to-blue-900/30 z-10"></div>
        <div className="relative z-20 flex flex-col items-center justify-center w-full">
          <h1 className="text-4xl md:text-6xl font-bold mb-2 text-white drop-shadow-lg text-center">{t('app.name', {})}</h1>
          <p className="text-lg md:text-2xl text-white opacity-90 mb-1 text-center">{t('dashboard.tagline.hindi', {})}</p>
          <p className="text-base md:text-lg text-white opacity-80 text-center">{t('dashboard.tagline.english', {})}</p>
        </div>
      </section>

      <div className="max-w-6xl mx-auto px-2 md:px-6 py-8 space-y-8">
        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {quickStats.map((stat, index) => (
            <Card key={stat.title} className="flex flex-col items-center justify-center text-center h-32 md:h-36 shadow-glow">
              <CardHeader className="flex flex-row items-center justify-between w-full pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground flex-1 text-left">
                  {stat.title}
                </CardTitle>
                <stat.icon className={`h-5 w-5 ${stat.color}`} />
              </CardHeader>
              <CardContent className="flex flex-col items-center justify-center flex-1">
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className="text-xs text-muted-foreground mt-1">{stat.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="w-full">
          <Card className="shadow-float">
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Sparkles className="h-5 w-5 text-primary" />
                <span>{t('dashboard.quickActions.title', {})}</span>
              </CardTitle>
              <CardDescription>
                {t('dashboard.quickActions.description', {})}
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-2 md:grid-cols-3 gap-4" role="group" aria-label="Quick action buttons">
              <Button 
                variant="outline" 
                className="h-20 flex-col space-y-2 hover:bg-secondary/20 hover:shadow-glow transition-bounce"
                onClick={() => window.location.href = '/schemes'}
                aria-label={t('dashboard.quickActions.schemesAriaLabel', {})}
              >
                <FileText className="h-6 w-6" aria-hidden="true" />
                <span className="text-sm">{t('nav.schemes', {})}</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-20 flex-col space-y-2 hover:bg-success/20 hover:shadow-glow transition-bounce"
                onClick={() => window.location.href = '/fertilizer'}
                aria-label={t('dashboard.quickActions.fertilizerAriaLabel', {})}
              >
                <Sparkles className="h-6 w-6" aria-hidden="true" />
                <span className="text-sm">{t('nav.fertilizer', {})}</span>
              </Button>
              <Button 
                variant="outline" 
                className="h-20 flex-col space-y-2 hover:bg-warning/20 hover:shadow-glow transition-bounce"
                onClick={() => window.location.href = '/crop-health'}
                aria-label={t('dashboard.quickActions.cropHealthAriaLabel', {})}
              >
                <Camera className="h-6 w-6" aria-hidden="true" />
                <span className="text-sm">{t('nav.cropHealth', {})}</span>
              </Button>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activities */}
        <Card className="shadow-float">
          <CardHeader>
            <CardTitle>{t('dashboard.recentActivities.title', {})}</CardTitle>
            <CardDescription>
              {t('dashboard.recentActivities.description', {})}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {recentActivities.map((activity, index) => (
              <div key={index} className="flex items-center justify-between py-2 border-b border-border/30 last:border-b-0">
                <p className="text-sm text-foreground">{activity.action}</p>
                <span className="text-xs text-muted-foreground">{activity.time}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Tips Section */}
        <Card className="gradient-earth shadow-float">
          <CardHeader>
            <CardTitle className="text-foreground">{t('dashboard.tips.title', {})}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-foreground/80 leading-relaxed">
              {t('dashboard.tips.content.hindi', {})}
            </p>
            <p className="text-xs text-foreground/60 mt-2">
              {t('dashboard.tips.content.english', {})}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Chat Interface */}
      <ChatInterface isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />
    </div>
  );
};

export default Dashboard;