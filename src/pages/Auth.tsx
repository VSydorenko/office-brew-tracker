import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { Coffee } from 'lucide-react';

const Auth = () => {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (isSignUp) {
        const redirectUrl = `${window.location.origin}/`;
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: redirectUrl,
            data: {
              name: name,
            }
          }
        });

        if (error) {
          if (error.message.includes('already registered')) {
            toast({
              title: "Користувач вже існує",
              description: "Спробуйте увійти або використайте інший email",
              variant: "destructive",
            });
          } else {
            throw error;
          }
        } else {
          toast({
            title: "Реєстрація успішна!",
            description: "Перевірте ваш email для підтвердження",
          });
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });

        if (error) {
          if (error.message.includes('Invalid login credentials')) {
            toast({
              title: "Невірні дані",
              description: "Перевірте email та пароль",
              variant: "destructive",
            });
          } else {
            throw error;
          }
        } else {
          navigate('/');
        }
      }
    } catch (error: any) {
      toast({
        title: "Помилка",
        description: error.message || "Щось пішло не так",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-brew p-4">
      <Card className="w-full max-w-md shadow-coffee">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <Coffee className="h-12 w-12 text-primary" />
          </div>
          <CardTitle className="text-2xl font-bold text-primary">
            Облік кави в офісі
          </CardTitle>
          <CardDescription>
            {isSignUp ? 'Створіть новий акаунт' : 'Увійдіть до системи'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleAuth} className="space-y-4">
            {isSignUp && (
              <div className="space-y-2">
                <Label htmlFor="name">Ім'я</Label>
                <Input
                  id="name"
                  type="text"
                  placeholder="Ваше ім'я"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required={isSignUp}
                />
              </div>
            )}
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                placeholder="your@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Пароль</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            <Button
              type="submit"
              className="w-full bg-gradient-coffee shadow-brew"
              disabled={loading}
            >
              {loading ? 'Завантаження...' : (isSignUp ? 'Зареєструватися' : 'Увійти')}
            </Button>
          </form>
          <div className="mt-4 text-center">
            <Button
              variant="ghost"
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-muted-foreground hover:text-primary"
            >
              {isSignUp
                ? 'Вже маєте акаунт? Увійти'
                : 'Немає акаунту? Зареєструватися'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;