import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useLanguage } from '@/context/LanguageContext';
import { useAuth } from '@/context/AuthContext';
import { useToast } from '@/hooks/use-toast';

const Login = () => {
  const navigate = useNavigate();
  const { t } = useLanguage();
  const { login } = useAuth();
  const { toast } = useToast();
  const [phone, setPhone] = useState('');

  const handleSendOTP = () => {
    if (phone.length < 10) {
      toast({
        title: 'Invalid Phone Number',
        description: 'Please enter a valid 10-digit phone number',
        variant: 'destructive',
      });
      return;
    }

    // Mock login
    login({
      id: '1',
      name: 'Demo User',
      phone: phone,
      role: 'Officer',
    });

    toast({
      title: 'Login Successful',
      description: 'Welcome to SUCHAK',
    });

    navigate('/app');
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-8 text-center">
        <div className="flex justify-center mb-6">
          <div className="w-24 h-24 rounded-full bg-primary flex items-center justify-center">
            <Shield className="w-12 h-12 text-primary-foreground" />
          </div>
        </div>

        <div>
          <h1 className="text-4xl font-bold text-primary mb-2">SUCHAK</h1>
          <p className="text-muted-foreground">{t.defencePlatform}</p>
        </div>

        <div className="bg-card p-8 rounded-2xl shadow-xl space-y-6">
          <h2 className="text-2xl font-semibold text-foreground">
            {t.enterPhone}
          </h2>

          <div className="space-y-4">
            <div>
              <label className="text-sm text-muted-foreground block text-left mb-2">
                {t.phoneNumber}
              </label>
              <div className="flex gap-2">
                <div className="w-16 bg-secondary rounded-lg flex items-center justify-center text-foreground font-medium">
                  +91
                </div>
                <Input
                  type="tel"
                  placeholder="9876543210"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  maxLength={10}
                  className="flex-1 h-12 bg-secondary border-none text-foreground"
                />
              </div>
            </div>

            <Button
              onClick={handleSendOTP}
              size="lg"
              className="w-full h-12 text-base font-semibold"
            >
              {t.sendOTP}
            </Button>
          </div>

          <div className="space-y-2 text-sm">
            <button
              onClick={() => navigate('/register')}
              className="text-primary hover:underline block w-full"
            >
              {t.newUser}
            </button>
            <button
              onClick={() => navigate('/register-family')}
              className="text-primary hover:underline block w-full"
            >
              {t.familyJoin}
            </button>
          </div>
        </div>

        <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
          <Lock className="w-4 h-4" />
          <span>{t.encrypted}</span>
        </div>
      </div>
    </div>
  );
};

export default Login;
