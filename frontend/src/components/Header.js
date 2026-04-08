import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { PawPrint, Menu, X, User, LogOut, Bell, MessageCircle, Building, LayoutDashboard, Heart, MessageSquare } from 'lucide-react';
import { Button } from './ui/button';
import { Avatar, AvatarFallback, AvatarImage } from './ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from './ui/dropdown-menu';
import { useAuth } from '../contexts/AuthContext';

export default function Header() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout, isAuthenticated } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/');
  };

  const getImageUrl = (photo) => {
    if (!photo) return null;
    if (photo.startsWith('http')) return photo;
    return `${process.env.REACT_APP_BACKEND_URL}/api/files/${photo}`;
  };

  const navLinks = [
    { href: '/', label: 'Home' },
    { href: '/pets', label: 'Adotar' },
    { href: '/forum', label: 'Fórum' }
  ];

  const isActive = (href) => {
    if (href === '/') return location.pathname === '/';
    return location.pathname.startsWith(href);
  };

  return (
    <header className="sticky top-0 z-50 backdrop-blur-xl bg-white/70 border-b border-black/5 shadow-sm">
      <div className="container mx-auto px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2" data-testid="logo">
            <div className="w-10 h-10 bg-[#5A3E85] rounded-xl flex items-center justify-center">
              <PawPrint className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-black text-[#1C1724] hidden sm:block">Corações Peludos</span>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map(link => (
              <Link
                key={link.href}
                to={link.href}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  isActive(link.href)
                    ? 'bg-[#F3EFFF] text-[#5A3E85]'
                    : 'text-[#564F62] hover:text-[#5A3E85] hover:bg-[#F3EFFF]/50'
                }`}
                data-testid={`nav-${link.label.toLowerCase()}`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Desktop Auth */}
          <div className="hidden md:flex items-center gap-3">
            {isAuthenticated ? (
              <>
                <Link to="/messages">
                  <Button variant="ghost" size="icon" className="rounded-full" data-testid="messages-btn">
                    <MessageCircle className="w-5 h-5 text-[#564F62]" />
                  </Button>
                </Link>
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="rounded-full p-1" data-testid="user-menu">
                      <Avatar className="w-9 h-9">
                        <AvatarImage src={getImageUrl(user?.avatar_url)} />
                        <AvatarFallback className="bg-[#5A3E85] text-white">
                          {user?.name?.charAt(0)?.toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <div className="px-3 py-2">
                      <p className="font-medium text-[#1C1724]">{user?.name}</p>
                      <p className="text-sm text-[#564F62]">{user?.email}</p>
                    </div>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link to="/dashboard" className="cursor-pointer" data-testid="menu-dashboard">
                        <LayoutDashboard className="w-4 h-4 mr-2" />
                        Dashboard
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/profile" className="cursor-pointer" data-testid="menu-profile">
                        <User className="w-4 h-4 mr-2" />
                        Perfil
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuItem asChild>
                      <Link to="/messages" className="cursor-pointer" data-testid="menu-messages">
                        <MessageCircle className="w-4 h-4 mr-2" />
                        Mensagens
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-red-600" data-testid="menu-logout">
                      <LogOut className="w-4 h-4 mr-2" />
                      Sair
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/auth?mode=login">
                  <Button variant="ghost" className="rounded-full text-[#5A3E85] font-medium" data-testid="login-btn">
                    Entrar
                  </Button>
                </Link>
                <Link to="/auth?mode=register">
                  <Button className="bg-[#5A3E85] hover:bg-[#452C69] text-white rounded-full font-medium" data-testid="register-btn">
                    Cadastrar
                  </Button>
                </Link>
              </div>
            )}
          </div>

          {/* Mobile Menu Button */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            data-testid="mobile-menu-btn"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </Button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden py-4 border-t border-[#E4DDF1] animate-fade-in">
            <nav className="flex flex-col gap-2">
              {navLinks.map(link => (
                <Link
                  key={link.href}
                  to={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`px-4 py-3 rounded-xl text-sm font-medium transition-colors ${
                    isActive(link.href)
                      ? 'bg-[#F3EFFF] text-[#5A3E85]'
                      : 'text-[#564F62] hover:bg-[#F3EFFF]/50'
                  }`}
                >
                  {link.label}
                </Link>
              ))}
              
              {isAuthenticated ? (
                <>
                  <div className="border-t border-[#E4DDF1] my-2" />
                  <Link
                    to="/dashboard"
                    onClick={() => setMobileMenuOpen(false)}
                    className="px-4 py-3 rounded-xl text-sm font-medium text-[#564F62] hover:bg-[#F3EFFF]/50 flex items-center gap-2"
                  >
                    <LayoutDashboard className="w-4 h-4" /> Dashboard
                  </Link>
                  <Link
                    to="/profile"
                    onClick={() => setMobileMenuOpen(false)}
                    className="px-4 py-3 rounded-xl text-sm font-medium text-[#564F62] hover:bg-[#F3EFFF]/50 flex items-center gap-2"
                  >
                    <User className="w-4 h-4" /> Perfil
                  </Link>
                  <Link
                    to="/messages"
                    onClick={() => setMobileMenuOpen(false)}
                    className="px-4 py-3 rounded-xl text-sm font-medium text-[#564F62] hover:bg-[#F3EFFF]/50 flex items-center gap-2"
                  >
                    <MessageCircle className="w-4 h-4" /> Mensagens
                  </Link>
                  <button
                    onClick={() => { handleLogout(); setMobileMenuOpen(false); }}
                    className="px-4 py-3 rounded-xl text-sm font-medium text-red-600 hover:bg-red-50 flex items-center gap-2 w-full text-left"
                  >
                    <LogOut className="w-4 h-4" /> Sair
                  </button>
                </>
              ) : (
                <>
                  <div className="border-t border-[#E4DDF1] my-2" />
                  <Link
                    to="/auth?mode=login"
                    onClick={() => setMobileMenuOpen(false)}
                    className="px-4 py-3 rounded-xl text-sm font-medium text-[#5A3E85] hover:bg-[#F3EFFF]/50"
                  >
                    Entrar
                  </Link>
                  <Link
                    to="/auth?mode=register"
                    onClick={() => setMobileMenuOpen(false)}
                    className="px-4 py-3 rounded-xl text-sm font-medium bg-[#5A3E85] text-white text-center"
                  >
                    Cadastrar
                  </Link>
                </>
              )}
            </nav>
          </div>
        )}
      </div>
    </header>
  );
}
