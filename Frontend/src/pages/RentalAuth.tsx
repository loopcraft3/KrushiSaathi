// pages/RentalAuth.tsx
// Login and Signup page for the entire app

import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { registerUser, loginUser } from '@/services/authApi';
import { Tractor, Leaf, Eye, EyeOff, AlertCircle } from 'lucide-react';

// ── TRANSLATIONS ─────────────────────────────────────────────────────
const translations = {
  en: {
    title: 'KrushiSaathi',
    subtitle: 'Your farming assistant',
    login: 'Login',
    signup: 'Sign Up',
    fullName: 'Full Name',
    namePlaceholder: 'e.g. Ram Kumar',
    username: 'Username',
    usernamePlaceholder: 'e.g. ramkumar123',
    password: 'Password',
    passwordPlaceholder: 'Enter password',
    iAmA: 'I am a',
    farmer: 'Farmer',
    farmerSub: 'Rent equipment',
    vendor: 'Vendor',
    vendorSub: 'List equipment',
    place: 'Village / City',
    placePlaceholder: 'e.g. Pune, Maharashtra',
    landArea: 'Land Area (acres)',
    landPlaceholder: 'e.g. 5',
    farmerType: 'Farming Type',
    selectFarmerType: 'Select farming type',
    farmerTypes: ['Wheat', 'Rice', 'Kharif', 'Rabi', 'Horticulture', 'Mixed Farming'],
    loggingIn: 'Logging in...',
    creatingAccount: 'Creating account...',
    loginBtn: 'Login',
    createAccount: 'Create Account',
    noAccount: "Don't have an account?",
    hasAccount: 'Already have an account?',
    fillAll: 'Please fill all fields',
    enterName: 'Please enter your name',
    footer: 'KrushiSaathi — AI Farmer Assistant Platform 🌾',
  },
  hi: {
    title: 'कृषिसाथी',
    subtitle: 'आपका खेती सहायक',
    login: 'लॉगिन',
    signup: 'साइन अप',
    fullName: 'पूरा नाम',
    namePlaceholder: 'जैसे राम कुमार',
    username: 'यूज़रनेम',
    usernamePlaceholder: 'जैसे ramkumar123',
    password: 'पासवर्ड',
    passwordPlaceholder: 'पासवर्ड दर्ज करें',
    iAmA: 'मैं हूँ',
    farmer: 'किसान',
    farmerSub: 'उपकरण किराए पर लें',
    vendor: 'विक्रेता',
    vendorSub: 'उपकरण सूचीबद्ध करें',
    place: 'गाँव / शहर',
    placePlaceholder: 'जैसे पुणे, महाराष्ट्र',
    landArea: 'जमीन (एकड़)',
    landPlaceholder: 'जैसे 5',
    farmerType: 'खेती का प्रकार',
    selectFarmerType: 'खेती का प्रकार चुनें',
    farmerTypes: ['गेहूँ', 'चावल', 'खरीफ', 'रबी', 'बागवानी', 'मिश्रित खेती'],
    loggingIn: 'लॉगिन हो रहा है...',
    creatingAccount: 'खाता बन रहा है...',
    loginBtn: 'लॉगिन करें',
    createAccount: 'खाता बनाएं',
    noAccount: 'खाता नहीं है?',
    hasAccount: 'पहले से खाता है?',
    fillAll: 'कृपया सभी फ़ील्ड भरें',
    enterName: 'कृपया अपना नाम दर्ज करें',
    footer: 'कृषिसाथी — AI किसान सहायक प्लेटफ़ॉर्म 🌾',
  },
  mr: {
    title: 'कृषिसाथी',
    subtitle: 'तुमचा शेती सहाय्यक',
    login: 'लॉगिन',
    signup: 'साइन अप',
    fullName: 'पूर्ण नाव',
    namePlaceholder: 'उदा. राम कुमार',
    username: 'युजरनेम',
    usernamePlaceholder: 'उदा. ramkumar123',
    password: 'पासवर्ड',
    passwordPlaceholder: 'पासवर्ड टाका',
    iAmA: 'मी आहे',
    farmer: 'शेतकरी',
    farmerSub: 'उपकरणे भाड्याने घ्या',
    vendor: 'विक्रेता',
    vendorSub: 'उपकरणे सूचीबद्ध करा',
    place: 'गाव / शहर',
    placePlaceholder: 'उदा. पुणे, महाराष्ट्र',
    landArea: 'जमीन (एकर)',
    landPlaceholder: 'उदा. 5',
    farmerType: 'शेतीचा प्रकार',
    selectFarmerType: 'शेतीचा प्रकार निवडा',
    farmerTypes: ['गहू', 'भात', 'खरीप', 'रब्बी', 'फलोत्पादन', 'मिश्र शेती'],
    loggingIn: 'लॉगिन होत आहे...',
    creatingAccount: 'खाते तयार होत आहे...',
    loginBtn: 'लॉगिन करा',
    createAccount: 'खाते तयार करा',
    noAccount: 'खाते नाही?',
    hasAccount: 'आधीच खाते आहे?',
    fillAll: 'कृपया सर्व फील्ड भरा',
    enterName: 'कृपया तुमचे नाव टाका',
    footer: 'कृषिसाथी — AI शेतकरी सहाय्यक प्लॅटफॉर्म 🌾',
  },
};

type Lang = 'en' | 'hi' | 'mr';

const RentalAuth: React.FC = () => {
  const { login } = useAuth();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  const [lang, setLang] = useState<Lang>('en');

  const t = translations[lang];

  // Form fields
  const [name, setName] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'farmer' | 'vendor'>('farmer');
  const [place, setPlace] = useState('');
  const [landArea, setLandArea] = useState('');
  const [farmerType, setFarmerType] = useState('');

  const handleSubmit = async () => {
    if (!username || !password) { setError(t.fillAll); return; }
    if (!isLogin && !name) { setError(t.enterName); return; }

    try {
      setLoading(true);
      setError(null);

      let result;
      if (isLogin) {
        result = await loginUser(username, password);
      } else {
        result = await registerUser(name, username, password, role, place, landArea, farmerType);
      }

      login(result.user, result.token);
    } catch (e: any) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') handleSubmit();
  };

  const switchMode = () => {
    setIsLogin(!isLogin);
    setError(null);
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">

        {/* Language Switcher */}
        <div className="flex justify-center gap-2 mb-5">
          {(['en', 'hi', 'mr'] as Lang[]).map((l) => (
            <button
              key={l}
              onClick={() => setLang(l)}
              className={`px-4 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                lang === l
                  ? 'bg-primary text-primary-foreground border-primary'
                  : 'border-border text-muted-foreground hover:border-primary hover:text-foreground'
              }`}
            >
              {l === 'en' ? 'English' : l === 'hi' ? 'हिंदी' : 'मराठी'}
            </button>
          ))}
        </div>

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Leaf className="h-9 w-9 text-primary" />
          </div>
          <h1 className="text-3xl font-bold text-foreground">{t.title}</h1>
          <p className="text-muted-foreground mt-1">{t.subtitle}</p>
        </div>

        {/* Card */}
        <div className="bg-card border border-border rounded-2xl shadow-lg p-6">

          {/* Tabs */}
          <div className="flex rounded-xl bg-muted p-1 mb-6">
            <button
              onClick={() => { setIsLogin(true); setError(null); }}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                isLogin ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {t.login}
            </button>
            <button
              onClick={() => { setIsLogin(false); setError(null); }}
              className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                !isLogin ? 'bg-background shadow text-foreground' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              {t.signup}
            </button>
          </div>

          {/* Error */}
          {error && (
            <div className="mb-4 flex items-center gap-2 p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-destructive text-sm">
              <AlertCircle className="h-4 w-4 flex-shrink-0" />
              {error}
            </div>
          )}

          <div className="space-y-4">

            {/* Name — signup only */}
            {!isLogin && (
              <div className="space-y-1">
                <label className="text-sm font-medium text-foreground">{t.fullName}</label>
                <input
                  type="text"
                  placeholder={t.namePlaceholder}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
              </div>
            )}

            {/* Username */}
            <div className="space-y-1">
              <label className="text-sm font-medium text-foreground">{t.username}</label>
              <input
                type="text"
                placeholder={t.usernamePlaceholder}
                value={username}
                onChange={(e) => setUsername(e.target.value.toLowerCase().replace(/\s/g, ''))}
                onKeyDown={handleKeyDown}
                className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
              />
            </div>

            {/* Password */}
            <div className="space-y-1">
              <label className="text-sm font-medium text-foreground">{t.password}</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder={t.passwordPlaceholder}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={handleKeyDown}
                  className="w-full px-3 py-2.5 pr-10 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                />
                <button
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Signup-only fields */}
            {!isLogin && (
              <>
                {/* Role selector */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-foreground">{t.iAmA}</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button
                      onClick={() => setRole('farmer')}
                      className={`p-3 rounded-xl border-2 transition-all duration-200 text-left ${
                        role === 'farmer' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40'
                      }`}
                    >
                      <Tractor className={`h-6 w-6 mb-1 ${role === 'farmer' ? 'text-primary' : 'text-muted-foreground'}`} />
                      <p className={`text-sm font-semibold ${role === 'farmer' ? 'text-primary' : 'text-foreground'}`}>{t.farmer}</p>
                      <p className="text-xs text-muted-foreground">{t.farmerSub}</p>
                    </button>
                    <button
                      onClick={() => setRole('vendor')}
                      className={`p-3 rounded-xl border-2 transition-all duration-200 text-left ${
                        role === 'vendor' ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40'
                      }`}
                    >
                      <Leaf className={`h-6 w-6 mb-1 ${role === 'vendor' ? 'text-primary' : 'text-muted-foreground'}`} />
                      <p className={`text-sm font-semibold ${role === 'vendor' ? 'text-primary' : 'text-foreground'}`}>{t.vendor}</p>
                      <p className="text-xs text-muted-foreground">{t.vendorSub}</p>
                    </button>
                  </div>
                </div>

                {/* Place */}
                <div className="space-y-1">
                  <label className="text-sm font-medium text-foreground">{t.place}</label>
                  <input
                    type="text"
                    placeholder={t.placePlaceholder}
                    value={place}
                    onChange={(e) => setPlace(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>

                {/* Land Area */}
                <div className="space-y-1">
                  <label className="text-sm font-medium text-foreground">{t.landArea}</label>
                  <input
                    type="number"
                    placeholder={t.landPlaceholder}
                    value={landArea}
                    onChange={(e) => setLandArea(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                  />
                </div>

                {/* Farmer Type — only for farmers */}
                {role === 'farmer' && (
                  <div className="space-y-1">
                    <label className="text-sm font-medium text-foreground">{t.farmerType}</label>
                    <select
                      value={farmerType}
                      onChange={(e) => setFarmerType(e.target.value)}
                      className="w-full px-3 py-2.5 rounded-lg border border-border bg-background text-sm focus:outline-none focus:ring-2 focus:ring-primary/50"
                    >
                      <option value="">{t.selectFarmerType}</option>
                      {t.farmerTypes.map((ft) => (
                        <option key={ft} value={ft}>{ft}</option>
                      ))}
                    </select>
                  </div>
                )}
              </>
            )}

            {/* Submit Button */}
            <button
              onClick={handleSubmit}
              disabled={loading}
              className="w-full py-2.5 rounded-lg bg-primary text-primary-foreground font-semibold text-sm hover:bg-primary/90 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed mt-2"
            >
              {loading
                ? (isLogin ? t.loggingIn : t.creatingAccount)
                : (isLogin ? t.loginBtn : t.createAccount)
              }
            </button>
          </div>

          {/* Switch mode */}
          <p className="text-center text-sm text-muted-foreground mt-4">
            {isLogin ? `${t.noAccount} ` : `${t.hasAccount} `}
            <button onClick={switchMode} className="text-primary font-medium hover:underline">
              {isLogin ? t.signup : t.login}
            </button>
          </p>
        </div>

        <p className="text-center text-xs text-muted-foreground mt-4">{t.footer}</p>
      </div>
    </div>
  );
};

export default RentalAuth;