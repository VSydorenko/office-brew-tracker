import { useAuth } from '@/components/ui/auth-provider';
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Dashboard from './Dashboard';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { Coffee } from 'lucide-react';

const Index = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (!loading && !user) {
      navigate('/auth');
    }
  }, [user, loading, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-brew">
        <div className="flex items-center gap-2 text-primary">
          <Coffee className="h-8 w-8 animate-pulse" />
          <span className="text-xl">Завантаження...</span>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-brew p-4">
        <div className="text-center">
          <Coffee className="h-16 w-16 text-primary mx-auto mb-6" />
          <h1 className="text-4xl font-bold mb-4 text-primary">Система обліку кави</h1>
          <p className="text-xl text-muted-foreground mb-8">
            Відстежуйте покупки та споживання кави в офісі
          </p>
          <Button asChild className="bg-gradient-coffee shadow-brew" aria-label="Увійти до системи">
            <Link to="/auth">Увійти до системи</Link>
          </Button>
        </div>
      </div>
    );
  }

  return <Dashboard />;
};

export default Index;
