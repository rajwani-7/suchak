import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLanguage } from '@/context/LanguageContext';
import { Button } from '@/components/ui/button';

const languages = [
  { code: 'english', label: 'English' },
  { code: 'hindi', label: 'हिन्दी' },
  { code: 'marathi', label: 'मराठी' },
  { code: 'gujarati', label: 'ગુજરાતી' },
  { code: 'punjabi', label: 'ਪੰਜਾਬੀ' },
  { code: 'tamil', label: 'தமிழ்' },
  { code: 'bengali', label: 'বাংলা' },
  { code: 'telugu', label: 'తెలుగు' },
  { code: 'kannada', label: 'ಕನ್ನಡ' },
  { code: 'malayalam', label: 'മലയാളം' },
  { code: 'urdu', label: 'اردو' },
];

const Welcome = () => {
  const navigate = useNavigate();
  const { language, setLanguage, t } = useLanguage();
  const [selectedLang, setSelectedLang] = useState('english');

  const handleLanguageSelect = (code: string) => {
    setSelectedLang(code);
    setLanguage(code);
  };

  const handleGetStarted = () => {
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-2xl text-center space-y-8">
        <h1 className="text-4xl md:text-5xl font-bold text-primary mb-2">
          {t.welcome}
        </h1>
        
        <p className="text-muted-foreground text-lg">
          {t.selectLanguage}
        </p>

        <div className="grid grid-cols-2 gap-4 max-w-xl mx-auto">
          {languages.map((lang) => (
            <Button
              key={lang.code}
              variant={selectedLang === lang.code ? 'default' : 'secondary'}
              size="lg"
              onClick={() => handleLanguageSelect(lang.code)}
              className="h-14 text-lg font-medium"
            >
              {lang.label}
            </Button>
          ))}
        </div>

        <Button
          size="lg"
          onClick={handleGetStarted}
          className="w-full max-w-md h-14 text-lg font-semibold"
        >
          {t.getStarted}
        </Button>
      </div>
    </div>
  );
};

export default Welcome;
