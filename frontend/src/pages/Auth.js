import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate, Link } from 'react-router-dom';
import { PawPrint, Mail, Lock, User, Phone, MapPin, Building, FileText, Eye, EyeOff, ArrowLeft } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Textarea } from '../components/ui/textarea';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';

export default function Auth() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { login, register, isAuthenticated } = useAuth();
  
  const [mode, setMode] = useState(searchParams.get('mode') || 'login');
  const [userType, setUserType] = useState(searchParams.get('type') || 'user');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    phone: '',
    city: '',
    state: '',
    // ONG fields
    ong_name: '',
    cnpj: '',
    description: ''
  });

  useEffect(() => {
    if (isAuthenticated) {
      navigate('/dashboard');
    }
  }, [isAuthenticated, navigate]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      await login(formData.email, formData.password);
      toast.success('Login realizado com sucesso!');
      navigate('/dashboard');
    } catch (error) {
      const message = error.response?.data?.detail;
      if (typeof message === 'string') {
        toast.error(message);
      } else if (Array.isArray(message)) {
        toast.error(message.map(e => e.msg).join(' '));
      } else {
        toast.error('Email ou senha inválidos');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    
    if (formData.password !== formData.confirmPassword) {
      toast.error('As senhas não coincidem');
      return;
    }
    
    if (formData.password.length < 6) {
      toast.error('A senha deve ter pelo menos 6 caracteres');
      return;
    }

    setLoading(true);
    
    try {
      const userData = {
        name: formData.name,
        email: formData.email,
        password: formData.password,
        user_type: userType,
        phone: formData.phone || null,
        city: formData.city || null,
        state: formData.state || null
      };

      if (userType === 'ong') {
        userData.ong_name = formData.ong_name;
        userData.cnpj = formData.cnpj;
        userData.description = formData.description;
      }

      await register(userData);
      toast.success('Cadastro realizado com sucesso!');
      navigate('/dashboard');
    } catch (error) {
      const message = error.response?.data?.detail;
      if (typeof message === 'string') {
        toast.error(message);
      } else if (Array.isArray(message)) {
        toast.error(message.map(e => e.msg).join(' '));
      } else {
        toast.error('Erro ao criar conta');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = () => {
    // REMINDER: DO NOT HARDCODE THE URL, OR ADD ANY FALLBACKS OR REDIRECT URLS, THIS BREAKS THE AUTH
    const redirectUrl = window.location.origin + '/auth/callback';
    window.location.href = `https://auth.emergentagent.com/?redirect=${encodeURIComponent(redirectUrl)}`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#F3EFFF] via-[#FAFAFA] to-[#FFC499]/20 flex items-center justify-center py-12 px-4">
      <div className="w-full max-w-md">
        {/* Back Link */}
        <Link to="/" className="inline-flex items-center text-[#564F62] hover:text-[#5A3E85] mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Voltar para Home
        </Link>

        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-4">
            <div className="w-12 h-12 bg-[#5A3E85] rounded-2xl flex items-center justify-center">
              <PawPrint className="w-7 h-7 text-white" />
            </div>
            <span className="text-2xl font-black text-[#1C1724]">Corações Peludos</span>
          </div>
        </div>

        {/* Auth Card */}
        <div className="bg-white border border-[#E4DDF1] rounded-3xl p-8 shadow-xl">
          <Tabs value={mode} onValueChange={setMode} className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-6 rounded-full bg-[#F3EFFF] p-1">
              <TabsTrigger 
                value="login" 
                className="rounded-full data-[state=active]:bg-[#5A3E85] data-[state=active]:text-white"
                data-testid="login-tab"
              >
                Entrar
              </TabsTrigger>
              <TabsTrigger 
                value="register" 
                className="rounded-full data-[state=active]:bg-[#5A3E85] data-[state=active]:text-white"
                data-testid="register-tab"
              >
                Cadastrar
              </TabsTrigger>
            </TabsList>

            {/* Login Form */}
            <TabsContent value="login">
              <form onSubmit={handleLogin} className="space-y-4">
                <div>
                  <Label htmlFor="email" className="text-[#1C1724]">Email</Label>
                  <div className="relative mt-1">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#564F62]" />
                    <Input
                      id="email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="seu@email.com"
                      className="pl-10 rounded-xl"
                      required
                      data-testid="login-email"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="password" className="text-[#1C1724]">Senha</Label>
                  <div className="relative mt-1">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#564F62]" />
                    <Input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="••••••••"
                      className="pl-10 pr-10 rounded-xl"
                      required
                      data-testid="login-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#564F62] hover:text-[#5A3E85]"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#5A3E85] hover:bg-[#452C69] text-white font-bold py-3 rounded-full"
                  data-testid="login-submit"
                >
                  {loading ? 'Entrando...' : 'Entrar'}
                </Button>

                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-[#E4DDF1]" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-white text-[#564F62]">ou continue com</span>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  onClick={handleGoogleLogin}
                  className="w-full border-[#E4DDF1] text-[#1C1724] hover:bg-[#F3EFFF] rounded-full py-3"
                  data-testid="google-login"
                >
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Continuar com Google
                </Button>
              </form>
            </TabsContent>

            {/* Register Form */}
            <TabsContent value="register">
              {/* User Type Selection */}
              <div className="mb-6">
                <Label className="text-[#1C1724] mb-2 block">Tipo de conta</Label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setUserType('user')}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      userType === 'user' 
                        ? 'border-[#5A3E85] bg-[#F3EFFF]' 
                        : 'border-[#E4DDF1] hover:border-[#5A3E85]/50'
                    }`}
                    data-testid="user-type-user"
                  >
                    <User className={`w-6 h-6 mx-auto mb-2 ${userType === 'user' ? 'text-[#5A3E85]' : 'text-[#564F62]'}`} />
                    <span className={`text-sm font-medium ${userType === 'user' ? 'text-[#5A3E85]' : 'text-[#564F62]'}`}>
                      Adotante
                    </span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setUserType('ong')}
                    className={`p-4 rounded-xl border-2 transition-all ${
                      userType === 'ong' 
                        ? 'border-[#5A3E85] bg-[#F3EFFF]' 
                        : 'border-[#E4DDF1] hover:border-[#5A3E85]/50'
                    }`}
                    data-testid="user-type-ong"
                  >
                    <Building className={`w-6 h-6 mx-auto mb-2 ${userType === 'ong' ? 'text-[#5A3E85]' : 'text-[#564F62]'}`} />
                    <span className={`text-sm font-medium ${userType === 'ong' ? 'text-[#5A3E85]' : 'text-[#564F62]'}`}>
                      ONG
                    </span>
                  </button>
                </div>
              </div>

              <form onSubmit={handleRegister} className="space-y-4">
                <div>
                  <Label htmlFor="name" className="text-[#1C1724]">Nome completo</Label>
                  <div className="relative mt-1">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#564F62]" />
                    <Input
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="Seu nome"
                      className="pl-10 rounded-xl"
                      required
                      data-testid="register-name"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="reg-email" className="text-[#1C1724]">Email</Label>
                  <div className="relative mt-1">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#564F62]" />
                    <Input
                      id="reg-email"
                      name="email"
                      type="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="seu@email.com"
                      className="pl-10 rounded-xl"
                      required
                      data-testid="register-email"
                    />
                  </div>
                </div>

                {/* ONG Specific Fields */}
                {userType === 'ong' && (
                  <>
                    <div>
                      <Label htmlFor="ong_name" className="text-[#1C1724]">Nome da ONG</Label>
                      <div className="relative mt-1">
                        <Building className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#564F62]" />
                        <Input
                          id="ong_name"
                          name="ong_name"
                          value={formData.ong_name}
                          onChange={handleChange}
                          placeholder="Nome da sua ONG"
                          className="pl-10 rounded-xl"
                          required
                          data-testid="register-ong-name"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="cnpj" className="text-[#1C1724]">CNPJ</Label>
                      <div className="relative mt-1">
                        <FileText className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#564F62]" />
                        <Input
                          id="cnpj"
                          name="cnpj"
                          value={formData.cnpj}
                          onChange={handleChange}
                          placeholder="00.000.000/0001-00"
                          className="pl-10 rounded-xl"
                          data-testid="register-cnpj"
                        />
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="description" className="text-[#1C1724]">Descrição da ONG</Label>
                      <Textarea
                        id="description"
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        placeholder="Conte um pouco sobre sua ONG..."
                        className="rounded-xl mt-1"
                        data-testid="register-description"
                      />
                    </div>
                  </>
                )}

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="city" className="text-[#1C1724]">Cidade</Label>
                    <div className="relative mt-1">
                      <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#564F62]" />
                      <Input
                        id="city"
                        name="city"
                        value={formData.city}
                        onChange={handleChange}
                        placeholder="Sua cidade"
                        className="pl-10 rounded-xl"
                        data-testid="register-city"
                      />
                    </div>
                  </div>
                  <div>
                    <Label htmlFor="state" className="text-[#1C1724]">Estado</Label>
                    <Input
                      id="state"
                      name="state"
                      value={formData.state}
                      onChange={handleChange}
                      placeholder="UF"
                      className="rounded-xl mt-1"
                      maxLength={2}
                      data-testid="register-state"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="phone" className="text-[#1C1724]">Telefone</Label>
                  <div className="relative mt-1">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#564F62]" />
                    <Input
                      id="phone"
                      name="phone"
                      value={formData.phone}
                      onChange={handleChange}
                      placeholder="(00) 00000-0000"
                      className="pl-10 rounded-xl"
                      data-testid="register-phone"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="reg-password" className="text-[#1C1724]">Senha</Label>
                  <div className="relative mt-1">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#564F62]" />
                    <Input
                      id="reg-password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      value={formData.password}
                      onChange={handleChange}
                      placeholder="Mínimo 6 caracteres"
                      className="pl-10 pr-10 rounded-xl"
                      required
                      data-testid="register-password"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#564F62] hover:text-[#5A3E85]"
                    >
                      {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                    </button>
                  </div>
                </div>

                <div>
                  <Label htmlFor="confirmPassword" className="text-[#1C1724]">Confirmar Senha</Label>
                  <div className="relative mt-1">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#564F62]" />
                    <Input
                      id="confirmPassword"
                      name="confirmPassword"
                      type="password"
                      value={formData.confirmPassword}
                      onChange={handleChange}
                      placeholder="Confirme sua senha"
                      className="pl-10 rounded-xl"
                      required
                      data-testid="register-confirm-password"
                    />
                  </div>
                </div>

                <Button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#5A3E85] hover:bg-[#452C69] text-white font-bold py-3 rounded-full"
                  data-testid="register-submit"
                >
                  {loading ? 'Criando conta...' : 'Criar Conta'}
                </Button>

                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-[#E4DDF1]" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-4 bg-white text-[#564F62]">ou continue com</span>
                  </div>
                </div>

                <Button
                  type="button"
                  variant="outline"
                  onClick={handleGoogleLogin}
                  className="w-full border-[#E4DDF1] text-[#1C1724] hover:bg-[#F3EFFF] rounded-full py-3"
                  data-testid="google-register"
                >
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Continuar com Google
                </Button>
              </form>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
