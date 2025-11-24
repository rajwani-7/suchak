import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, User, FileText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/context/LanguageContext';

const Register = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    serviceId: '',
    aadhaar: '',
  });

  const handleSubmit = () => {
    if (!formData.fullName || !formData.phone || !formData.serviceId || !formData.aadhaar) {
      toast({
        title: 'Incomplete Form',
        description: 'Please fill all required fields',
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: 'Registration Successful',
      description: 'Your account has been created',
    });

    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md space-y-6">
        <div className="flex justify-center mb-4">
          <div className="w-20 h-20 rounded-full bg-primary flex items-center justify-center">
            <Shield className="w-10 h-10 text-primary-foreground" />
          </div>
        </div>

        <div className="text-center">
          <h1 className="text-3xl font-bold text-foreground mb-1">{t.register}</h1>
          <p className="text-muted-foreground">{t.createAccount}</p>
        </div>

        <div className="bg-card p-8 rounded-2xl shadow-xl space-y-5">
          <div>
            <label className="text-sm text-foreground block mb-2">
              {t.fullName} <span className="text-destructive">{t.required}</span>
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder={t.fullName}
                value={formData.fullName}
                onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                className="pl-10 h-12 bg-secondary border-none"
              />
            </div>
          </div>

          <div>
            <div className="flex gap-2">
              <div className="w-16 bg-secondary rounded-lg flex items-center justify-center text-foreground font-medium">
                +91
              </div>
              <Input
                type="tel"
                placeholder="9876543210"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                maxLength={10}
                className="flex-1 h-12 bg-secondary border-none"
              />
            </div>
          </div>

          <div>
            <label className="text-sm text-foreground block mb-2">
              {t.serviceId} <span className="text-destructive">{t.required}</span>
            </label>
            <div className="relative">
              <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
              <Input
                type="text"
                placeholder="DEF123456"
                value={formData.serviceId}
                onChange={(e) => setFormData({ ...formData, serviceId: e.target.value })}
                className="pl-10 h-12 bg-secondary border-none"
              />
            </div>
          </div>

          <div>
            <Input
              type="text"
              placeholder={t.aadhaarNumber}
              value={formData.aadhaar}
              onChange={(e) => setFormData({ ...formData, aadhaar: e.target.value })}
              maxLength={12}
              className="h-12 bg-secondary border-none"
            />
          </div>

          <Button
            onClick={handleSubmit}
            size="lg"
            className="w-full h-12 text-base font-semibold"
          >
            {t.register}
          </Button>

          <button
            onClick={() => navigate('/login')}
            className="text-primary hover:underline text-sm block w-full text-center"
          >
            {t.alreadyHaveAccount} {t.loginHere}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Register;
