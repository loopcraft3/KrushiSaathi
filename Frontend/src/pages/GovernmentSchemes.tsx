import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, FileText, ExternalLink, Filter, MapPin, Loader2, MessageCircle } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import PageHeader from '@/components/PageHeader'

interface SchemeTemplate {
  id: number;
  nameKey: string;
  descriptionKey: string;
  eligibilityKey: string;
  benefitsKey: string;
  stateKey: string;
  categoryKey: string;
  statusKey: string;
  link: string;
}

interface Scheme extends Omit<SchemeTemplate, 'nameKey' | 'descriptionKey' | 'eligibilityKey' | 'benefitsKey' | 'stateKey' | 'categoryKey' | 'statusKey'> {
  name: string;
  description: string;
  eligibility: string;
  benefits: string;
  state: string;
  stateKey: string;
  category: string;
  status: string;
  categoryKey: string;
}

export const GovernmentSchemes: React.FC = () => {
  const { t } = useLanguage();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedState, setSelectedState] = useState('all');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [schemes, setSchemes] = useState<Scheme[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Define scheme templates with translation keys
  const schemeTemplates = useMemo<SchemeTemplate[]>(() => [
    {
      id: 1,
      nameKey: 'schemes.pmKisanSammanNidhi.name',
      descriptionKey: 'schemes.pmKisanSammanNidhi.description',
      eligibilityKey: 'schemes.pmKisanSammanNidhi.eligibility',
      benefitsKey: 'schemes.pmKisanSammanNidhi.benefits',
      stateKey: 'states.allIndia',
      categoryKey: 'categories.financialSupport',
      statusKey: 'status.active',
      link: 'https://pmkisan.gov.in/',
    },
    {
      id: 2,
      nameKey: 'schemes.pradhanMantriFasalBimaYojana.name',
      descriptionKey: 'schemes.pradhanMantriFasalBimaYojana.description',
      eligibilityKey: 'schemes.pradhanMantriFasalBimaYojana.eligibility',
      benefitsKey: 'schemes.pradhanMantriFasalBimaYojana.benefits',
      stateKey: 'states.allIndia',
      categoryKey: 'categories.insurance',
      statusKey: 'status.active',
      link: 'https://pmfby.gov.in/',
    },
    {
      id: 3,
      nameKey: 'schemes.kisanCreditCard.name',
      descriptionKey: 'schemes.kisanCreditCard.description',
      eligibilityKey: 'schemes.kisanCreditCard.eligibility',
      benefitsKey: 'schemes.kisanCreditCard.benefits',
      stateKey: 'states.allIndia',
      categoryKey: 'categories.loan',
      statusKey: 'status.active',
      link: 'https://www.india.gov.in/spotlight/kisan-credit-card-kcc',
    },
    {
      id: 4,
      nameKey: 'schemes.paramparagatKrishiVikasYojana.name',
      descriptionKey: 'schemes.paramparagatKrishiVikasYojana.description',
      eligibilityKey: 'schemes.paramparagatKrishiVikasYojana.eligibility',
      benefitsKey: 'schemes.paramparagatKrishiVikasYojana.benefits',
      stateKey: 'states.allIndia',
      categoryKey: 'categories.organicFarming',
      statusKey: 'status.active',
      link: 'https://pgsindia-ncof.gov.in/PKVY/PKVY_Home.aspx',
    },
    {
      id: 5,
      nameKey: 'schemes.pmKisanMaandhanYojana.name',
      descriptionKey: 'schemes.pmKisanMaandhanYojana.description',
      eligibilityKey: 'schemes.pmKisanMaandhanYojana.eligibility',
      benefitsKey: 'schemes.pmKisanMaandhanYojana.benefits',
      stateKey: 'states.allIndia',
      categoryKey: 'categories.pension',
      statusKey: 'status.active',
      link: 'https://maandhan.in/pmkmy',
    },
    {
      id: 6,
      nameKey: 'schemes.maharashtraKrishiSanman.name',
      descriptionKey: 'schemes.maharashtraKrishiSanman.description',
      eligibilityKey: 'schemes.maharashtraKrishiSanman.eligibility',
      benefitsKey: 'schemes.maharashtraKrishiSanman.benefits',
      stateKey: 'states.maharashtra',
      categoryKey: 'categories.financialSupport',
      statusKey: 'status.active',
      link: '#',
    }
  ], []);

  // Translate scheme templates
  useEffect(() => {
    const translateSchemes = async () => {
      try {
        setIsLoading(true);
        const translatedSchemes = schemeTemplates.map(scheme => ({
          ...scheme,
          name: t(scheme.nameKey),
          description: t(scheme.descriptionKey),
          eligibility: t(scheme.eligibilityKey),
          benefits: t(scheme.benefitsKey),
          state: t(scheme.stateKey),
          stateKey: scheme.stateKey,
          category: t(scheme.categoryKey),
          categoryKey: scheme.categoryKey,
          status: t(scheme.statusKey),
          link: scheme.link
        }));
        setSchemes(translatedSchemes);
      } catch (error) {
        console.error('Error translating schemes:', error);
      } finally {
        setIsLoading(false);
      }
    };

    translateSchemes();
  }, [t, schemeTemplates]);

  // Get states and categories from schemes
  const { states, categories } = useMemo(() => {
    // Get unique state keys
    const stateKeys = Array.from(new Set(schemeTemplates.map(scheme => scheme.stateKey)));
    
    // Sort states with 'allIndia' first, then sort the rest alphabetically by their translated names
    const sortedStates = [...stateKeys].sort((a, b) => {
      if (a === 'states.allIndia') return -1;
      if (b === 'states.allIndia') return 1;
      return t(a).localeCompare(t(b));
    });
    
    // Get unique category keys
    const uniqueCategories = Array.from(new Set(schemeTemplates.map(scheme => scheme.categoryKey)));
    
    return { states: sortedStates, categories: uniqueCategories };
  }, [schemeTemplates, t]);

  const filteredSchemes = useMemo(() => {
    if (isLoading) return [];
    
    const searchLower = searchTerm.toLowerCase();
    return schemes.filter(scheme => {
      const matchesSearch = searchTerm === '' ||
        scheme.name.toLowerCase().includes(searchLower) ||
        scheme.description.toLowerCase().includes(searchLower) ||
        scheme.eligibility.toLowerCase().includes(searchLower) ||
        scheme.benefits.toLowerCase().includes(searchLower);
      
      const matchesState = selectedState === 'all' || (scheme as any).stateKey === selectedState;
      const matchesCategory = selectedCategory === 'all' || (scheme as any).categoryKey === selectedCategory;
      
      return matchesSearch && matchesState && matchesCategory;
    });
  }, [schemes, searchTerm, selectedState, selectedCategory, isLoading]);

  // Preload translations for filter dropdowns and common UI elements
  useEffect(() => {
    // This is just to ensure translations are in the cache
    const translationsToPreload = [
      'common.allStates',
      'common.allCategories',
      'common.noResults.title',
      'common.noResults.description',
      'common.noSchemesFound',
      'common.tryDifferentFilters',
      'common.searchPlaceholder',
      'common.selectState',
      'common.selectCategory',
      'common.resultsCount',
      'common.translating',
      'common.needHelp',
      'common.helpDescription',
      'common.askAIAssistant',
      'common.viewDetails',
      'common.eligibility',
      'common.benefits',
      'common.notSpecified',
      'common.search'
    ];
    
    translationsToPreload.forEach(key => t(key));
  }, [t]);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="flex flex-col items-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-muted-foreground">{t('common.loading', {}) || 'Loading schemes...'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-6">
       {/* Header */}
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-4 text-foreground">
          {t('pages.schemes.title', {})}
        </h1>
        <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
          {t('pages.schemes.subtitle', {})}
        </p>
      </div>

      {/* Search and Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t('common.searchPlaceholder', {})}
            className="pl-9"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            disabled={isLoading}
          />
        </div>
        
        <Select 
          value={selectedState} 
          onValueChange={setSelectedState}
          disabled={isLoading}
        >
          <SelectTrigger className="w-full">
            <MapPin className="h-4 w-4 mr-2 text-muted-foreground" />
            <SelectValue placeholder={t('common.selectState', {})}>
              {selectedState === 'all' ? t('common.allStates', {}) : t(selectedState) || selectedState}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">
              {t('common.allStates', {})}
            </SelectItem>
            {states.map((stateKey) => (
              <SelectItem key={stateKey} value={stateKey}>
                {t(stateKey) || stateKey}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <Select 
          value={selectedCategory} 
          onValueChange={setSelectedCategory}
          disabled={isLoading}
        >
          <SelectTrigger className="w-full">
            <Filter className="h-4 w-4 mr-2 text-muted-foreground" />
            <SelectValue placeholder={t('common.selectCategory', {})}>
              {selectedCategory === 'all' ? t('common.allCategories', {}) : t(selectedCategory) || selectedCategory}
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">
              {t('common.allCategories', {})}
            </SelectItem>
            {categories.map((category) => (
              <SelectItem key={category} value={category}>
                {t(category) || category}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        
        <Button 
          className="w-full" 
          disabled={isLoading}
          onClick={() => {
            // Trigger a re-filter
            setSchemes([...schemes]);
          }}
        >
          <Search className="h-4 w-4 mr-2" />
          {t('common.search', {})}
        </Button>
      </div>

      {/* Results Count */}
      <div className="flex justify-between items-center">
        <div className="text-sm text-muted-foreground">
          {filteredSchemes.length === 0 
            ? t('common.noResults.title', {})
            : filteredSchemes.length === 1 
              ? t('common.resultsCount_one', { count: filteredSchemes.length })
              : t('common.resultsCount_other', { count: filteredSchemes.length })}
        </div>
      </div>

      {/* Schemes Grid */}
      {filteredSchemes.length === 0 ? (
        <div className="text-center py-12">
          <FileText className="h-12 w-12 mx-auto text-muted-foreground" />
          <h3 className="mt-2 text-lg font-medium text-foreground">
            {t('common.noResults.title', {})}
          </h3>
          <p className="text-muted-foreground mt-1">
            {t('common.noResults.description', {})}
          </p>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {filteredSchemes.map((scheme, index) => (
          <Card key={scheme.id} className="hover:shadow-glow transition-smooth animate-bounce-in" style={{animationDelay: `${index * 0.1}s`}}>
            <CardHeader>
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <CardTitle className="text-lg font-semibold text-foreground mb-2">
                    {scheme.name}
                  </CardTitle>
                  <div className="flex flex-wrap gap-2 mb-2">
                    <Badge variant="outline" className="text-xs">
                      {scheme.state || t(scheme.stateKey) || scheme.stateKey}
                    </Badge>
                    <Badge variant="secondary" className="text-xs">
                      {scheme.category}
                    </Badge>
                  </div>
                </div>
              </div>
              <CardDescription className="text-sm text-muted-foreground">
                {scheme.description}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <h4 className="text-sm font-medium text-foreground mb-1">
                  {t('common.eligibility', {})}
                </h4>
                <p className="text-sm text-muted-foreground">
                  {scheme.eligibility || t('common.notSpecified', {}) || 'Not specified'}
                </p>
              </div>
              <div>
                <h4 className="text-sm font-medium text-foreground mb-1">
                  {t('common.benefits', {})}
                </h4>
                <p className="text-sm text-muted-foreground">
                  {scheme.benefits || 'Not specified'}
                </p>
              </div>
              <div className="pt-2">
                <Button 
                  variant="outline" 
                  className="w-full hover:bg-primary/10 hover:shadow-glow transition-smooth"
                  onClick={() => window.open(scheme.link, '_blank')}
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  {t('common.viewDetails', {})}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
        </div>
      )}
      {/* Help Section */}
      <Card className="bg-gradient-to-br from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20 shadow-float mt-8 border-0">
        <CardHeader className="pb-4">
          <div className="flex items-start space-x-4">
            <div className="bg-primary/10 p-2 rounded-full">
              <MessageCircle className="h-6 w-6 text-primary" />
            </div>
            <div>
              <CardTitle className="text-foreground text-lg">
                {t('common.needHelp', {})}
              </CardTitle>
              <CardDescription className="text-muted-foreground">
                {t('common.helpDescription', {})}
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0 pl-16">
          <Button 
            className="bg-primary hover:bg-primary/90 text-white shadow-sm"
            onClick={() => {
              // Trigger chat open event
              window.dispatchEvent(new Event('openChat'));
            }}
          >
            {t('common.askAIAssistant', {})}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};

// Export as both named and default for backward compatibility
export default GovernmentSchemes;