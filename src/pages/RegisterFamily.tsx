import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Shield, User, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/context/LanguageContext';

const RegisterFamily = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useLanguage();
  const [formData, setFormData] = useState({
    fullName: '',
    phone: '',
    referenceId: '',
    relation: '',
  });
  const [file, setFile] = useState<File | null>(null);

  const handleSubmit = () => {
    if (!formData.fullName || !formData.phone || !formData.referenceId || !formData.relation) {
      toast({
        title: 'Incomplete Form',
        description: 'Please fill all required fields',
        variant: 'destructive',
      });
      return;
    }

    toast({
      title: 'Registration Successful',
      description: 'Your family member account has been created',
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
          <h1 className="text-3xl font-bold text-foreground mb-1">
            {t.familyMemberRegistration}
          </h1>
          <p className="text-muted-foreground">{t.joinViaReference}</p>
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
            <Input
              type="text"
              placeholder={t.referenceId}
              value={formData.referenceId}
              onChange={(e) => setFormData({ ...formData, referenceId: e.target.value })}
              className="h-12 bg-secondary border-none"
            />
          </div>

          <div>
            <Select value={formData.relation} onValueChange={(value) => setFormData({ ...formData, relation: value })}>
              <SelectTrigger className="h-12 bg-secondary border-none">
                <SelectValue placeholder={t.selectRelation} />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border">
                <SelectItem value="spouse">{t.spouse}</SelectItem>
                <SelectItem value="parent">{t.parent}</SelectItem>
                <SelectItem value="child">{t.child}</SelectItem>
                <SelectItem value="sibling">{t.sibling}</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="flex items-center justify-center h-12 bg-secondary rounded-lg cursor-pointer hover:bg-secondary/80 transition-colors">
              <Upload className="w-5 h-5 mr-2 text-muted-foreground" />
              <span className="text-foreground">
                {file ? file.name : t.chooseFile}
              </span>
              <input
                type="file"
                className="hidden"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
                accept="image/*,.pdf"
              />
            </label>
          </div>

          <Button
            onClick={handleSubmit}
            size="lg"
            className="w-full h-12 text-base font-semibold"
          >
            {t.joinAsFamilyMember}
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

export default RegisterFamily;
