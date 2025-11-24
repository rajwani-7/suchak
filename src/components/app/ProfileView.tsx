import { Edit2, Phone, Shield, LogOut } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/context/LanguageContext';

const ProfileView = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const { t } = useLanguage();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <div className="h-full bg-card flex items-center justify-center">
      <div className="w-full max-w-md p-8 space-y-6">
        <div className="text-center space-y-4">
          <Avatar className="w-32 h-32 mx-auto">
            <AvatarImage src={user?.avatar} />
            <AvatarFallback className="text-4xl bg-primary text-primary-foreground">
              {user?.name[0] || 'U'}
            </AvatarFallback>
          </Avatar>

          <div>
            <h2 className="text-2xl font-bold text-foreground">{user?.name || 'Demo User'}</h2>
            <p className="text-muted-foreground">{user?.role || 'Officer'}</p>
          </div>
        </div>

        <div className="space-y-3 bg-secondary rounded-xl p-4">
          <div className="flex items-center gap-3 text-foreground">
            <Phone className="w-5 h-5 text-muted-foreground" />
            <span>{user?.phone || '+91 9876543210'}</span>
          </div>
          <div className="flex items-center gap-3 text-foreground">
            <Shield className="w-5 h-5 text-muted-foreground" />
            <span>{t.verifiedAccount}</span>
          </div>
        </div>

        <div className="space-y-3">
          <Button variant="outline" className="w-full justify-start" size="lg">
            <Edit2 className="w-5 h-5 mr-2" />
            {t.editProfile}
          </Button>

          <Button
            onClick={handleLogout}
            variant="destructive"
            className="w-full justify-start"
            size="lg"
          >
            <LogOut className="w-5 h-5 mr-2" />
            {t.logout}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ProfileView;
