import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { PawPrint, Search, MapPin, Filter, Heart, ChevronRight, Users, Building, ArrowRight } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import { useAuth } from '../contexts/AuthContext';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

// Pet card component
function PetCard({ pet, onFavorite, isFavorite }) {
  const defaultImage = 'https://images.unsplash.com/photo-1744824838728-59f825fc7da1?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjY2NzF8MHwxfHNlYXJjaHwyfHxjdXRlJTIwZG9nJTIwcG9ydHJhaXR8ZW58MHx8fHwxNzc1NjA1NDU2fDA&ixlib=rb-4.1.0&q=85';
  
  const getImageUrl = (photo) => {
    if (!photo) return defaultImage;
    if (photo.startsWith('http')) return photo;
    return `${process.env.REACT_APP_BACKEND_URL}/api/files/${photo}`;
  };

  const ageLabels = { puppy: 'Filhote', young: 'Jovem', adult: 'Adulto', senior: 'Idoso' };
  const sizeLabels = { small: 'Pequeno', medium: 'Médio', large: 'Grande' };
  const typeLabels = { dog: 'Cachorro', cat: 'Gato', bird: 'Pássaro', other: 'Outro' };

  return (
    <div 
      className="pet-card bg-white border border-[#E4DDF1] rounded-3xl overflow-hidden flex flex-col"
      data-testid={`pet-card-${pet.id}`}
    >
      <div className="relative h-64 overflow-hidden">
        <img 
          src={getImageUrl(pet.photos?.[0])} 
          alt={pet.name}
          className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
          onError={(e) => { e.target.src = defaultImage; }}
        />
        <button
          onClick={(e) => { e.preventDefault(); onFavorite?.(pet.id); }}
          className="absolute top-4 right-4 p-2 rounded-full bg-white/80 backdrop-blur-sm hover:bg-white transition-colors"
          data-testid={`favorite-btn-${pet.id}`}
        >
          <Heart className={`w-5 h-5 ${isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-600'}`} />
        </button>
        <Badge className="absolute bottom-4 left-4 bg-[#FFC499] text-[#1C1724] font-bold">
          {typeLabels[pet.pet_type] || pet.pet_type}
        </Badge>
      </div>
      <div className="p-6 flex flex-col flex-1">
        <h3 className="text-xl font-bold text-[#1C1724] mb-2">{pet.name}</h3>
        <div className="flex flex-wrap gap-2 mb-3">
          <span className="text-sm text-[#564F62]">{ageLabels[pet.age] || pet.age}</span>
          <span className="text-[#E4DDF1]">•</span>
          <span className="text-sm text-[#564F62]">{sizeLabels[pet.size] || pet.size}</span>
          {pet.breed && (
            <>
              <span className="text-[#E4DDF1]">•</span>
              <span className="text-sm text-[#564F62]">{pet.breed}</span>
            </>
          )}
        </div>
        <div className="flex items-center text-sm text-[#564F62] mb-4">
          <MapPin className="w-4 h-4 mr-1" />
          {pet.city}, {pet.state}
        </div>
        <div className="mt-auto">
          <Link to={`/pets/${pet.id}`}>
            <Button 
              className="w-full bg-[#F3EFFF] text-[#5A3E85] hover:bg-[#E4DDF1] hover:text-[#452C69] font-bold rounded-full"
              data-testid={`view-pet-btn-${pet.id}`}
            >
              Ver detalhes
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function Home() {
  const { user, isAuthenticated } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [pets, setPets] = useState([]);
  const [stats, setStats] = useState({ pets_available: 0, pets_adopted: 0, ongs_count: 0, users_count: 0 });
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState([]);
  const [filters, setFilters] = useState({
    pet_type: searchParams.get('type') || '',
    age: searchParams.get('age') || '',
    size: searchParams.get('size') || '',
    city: searchParams.get('city') || ''
  });
  const [showFilters, setShowFilters] = useState(false);

  useEffect(() => {
    fetchPets();
    fetchStats();
    if (isAuthenticated) {
      fetchFavorites();
    }
  }, [isAuthenticated]);

  const fetchPets = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (filters.pet_type) params.append('pet_type', filters.pet_type);
      if (filters.age) params.append('age', filters.age);
      if (filters.size) params.append('size', filters.size);
      if (filters.city) params.append('city', filters.city);
      
      const response = await axios.get(`${API}/pets?${params.toString()}`);
      setPets(response.data.pets || []);
    } catch (error) {
      console.error('Error fetching pets:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await axios.get(`${API}/stats`);
      setStats(response.data);
    } catch (error) {
      console.error('Error fetching stats:', error);
    }
  };

  const fetchFavorites = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/users/favorites`, {
        withCredentials: true,
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      setFavorites(response.data.map(p => p.id));
    } catch (error) {
      console.error('Error fetching favorites:', error);
    }
  };

  const handleFavorite = async (petId) => {
    if (!isAuthenticated) {
      window.location.href = '/auth?mode=login';
      return;
    }
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
      if (favorites.includes(petId)) {
        await axios.delete(`${API}/users/favorites/${petId}`, { withCredentials: true, headers });
        setFavorites(prev => prev.filter(id => id !== petId));
      } else {
        await axios.post(`${API}/users/favorites/${petId}`, {}, { withCredentials: true, headers });
        setFavorites(prev => [...prev, petId]);
      }
    } catch (error) {
      console.error('Error updating favorite:', error);
    }
  };

  const handleFilterChange = (key, value) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
    
    const params = new URLSearchParams();
    Object.entries(newFilters).forEach(([k, v]) => {
      if (v) params.set(k, v);
    });
    setSearchParams(params);
  };

  const applyFilters = () => {
    fetchPets();
    setShowFilters(false);
  };

  const clearFilters = () => {
    setFilters({ pet_type: '', age: '', size: '', city: '' });
    setSearchParams({});
    fetchPets();
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      {/* Hero Section - Bento Grid */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#F3EFFF] via-[#FAFAFA] to-[#FFC499]/20" />
        
        <div className="container mx-auto px-6 py-16 lg:py-24 relative">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left Column - Text */}
            <div className="lg:col-span-6 space-y-6 animate-fade-in">
              <div className="inline-flex items-center gap-2 bg-[#FFC499] text-[#1C1724] px-4 py-2 rounded-full text-sm font-bold uppercase tracking-wider">
                <PawPrint className="w-4 h-4" />
                Adoção Responsável
              </div>
              
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-none text-[#1C1724]">
                Encontre seu{' '}
                <span className="text-[#5A3E85]">melhor amigo</span>
              </h1>
              
              <p className="text-lg text-[#564F62] max-w-md leading-relaxed">
                Conectamos pessoas a animais que precisam de um lar. 
                Descubra o amor incondicional através da adoção responsável.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4">
                <Link to="/pets">
                  <Button 
                    className="bg-[#5A3E85] hover:bg-[#452C69] text-white font-bold py-4 px-8 rounded-full text-lg"
                    data-testid="find-pet-btn"
                  >
                    Encontrar um pet
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Button>
                </Link>
                <Link to="/forum">
                  <Button 
                    variant="outline"
                    className="border-2 border-[#5A3E85] text-[#5A3E85] hover:bg-[#F3EFFF] font-bold py-4 px-8 rounded-full text-lg"
                    data-testid="forum-btn"
                  >
                    Acessar Fórum
                  </Button>
                </Link>
              </div>
            </div>
            
            {/* Right Column - Image + Stats */}
            <div className="lg:col-span-6 relative animate-fade-in stagger-2">
              <div className="relative">
                <img 
                  src="https://images.unsplash.com/photo-1753685725777-0d1bf5796b3a?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjA3MDB8MHwxfHNlYXJjaHwxfHxwZXJzb24lMjBodWdnaW5nJTIwZG9nfGVufDB8fHx8MTc3NTYwNTQ2Mnww&ixlib=rb-4.1.0&q=85"
                  alt="Pessoa abraçando cachorro"
                  className="w-full h-[400px] lg:h-[500px] object-cover rounded-3xl shadow-2xl"
                />
                
                {/* Floating Stats Card */}
                <div className="absolute -bottom-6 -left-6 bg-white border border-[#E4DDF1] rounded-2xl p-6 shadow-xl animate-slide-in stagger-3">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-[#FFC499] rounded-full flex items-center justify-center">
                      <Heart className="w-6 h-6 text-[#1C1724]" />
                    </div>
                    <div>
                      <p className="text-3xl font-black text-[#5A3E85]">{stats.pets_adopted}+</p>
                      <p className="text-sm text-[#564F62]">Pets Adotados</p>
                    </div>
                  </div>
                </div>
                
                {/* Another floating card */}
                <div className="absolute -top-4 -right-4 bg-white border border-[#E4DDF1] rounded-2xl p-4 shadow-xl animate-slide-in stagger-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#F3EFFF] rounded-full flex items-center justify-center">
                      <Building className="w-5 h-5 text-[#5A3E85]" />
                    </div>
                    <div>
                      <p className="text-xl font-bold text-[#1C1724]">{stats.ongs_count}</p>
                      <p className="text-xs text-[#564F62]">ONGs parceiras</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Bar */}
      <section className="bg-[#5A3E85] py-8">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 text-center">
            <div className="animate-fade-in">
              <p className="text-3xl font-black text-white">{stats.pets_available}</p>
              <p className="text-sm text-white/70">Pets disponíveis</p>
            </div>
            <div className="animate-fade-in stagger-1">
              <p className="text-3xl font-black text-white">{stats.pets_adopted}</p>
              <p className="text-sm text-white/70">Pets adotados</p>
            </div>
            <div className="animate-fade-in stagger-2">
              <p className="text-3xl font-black text-white">{stats.ongs_count}</p>
              <p className="text-sm text-white/70">ONGs parceiras</p>
            </div>
            <div className="animate-fade-in stagger-3">
              <p className="text-3xl font-black text-white">{stats.users_count}</p>
              <p className="text-sm text-white/70">Usuários ativos</p>
            </div>
          </div>
        </div>
      </section>

      {/* Pets Section */}
      <section className="py-16" id="pets">
        <div className="container mx-auto px-6">
          {/* Section Header */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6 mb-10">
            <div>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-[#1C1724]">
                Pets disponíveis para adoção
              </h2>
              <p className="text-[#564F62] mt-2">Encontre seu novo companheiro</p>
            </div>
            
            <Button 
              variant="outline"
              onClick={() => setShowFilters(!showFilters)}
              className="border-[#E4DDF1] text-[#5A3E85] hover:bg-[#F3EFFF] rounded-full"
              data-testid="toggle-filters-btn"
            >
              <Filter className="w-4 h-4 mr-2" />
              Filtros
            </Button>
          </div>

          {/* Filters */}
          {showFilters && (
            <div className="bg-white border border-[#E4DDF1] rounded-2xl p-6 mb-8 animate-fade-in">
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
                <div>
                  <label className="text-sm font-medium text-[#564F62] mb-2 block">Tipo</label>
                  <Select value={filters.pet_type} onValueChange={(v) => handleFilterChange('pet_type', v)}>
                    <SelectTrigger data-testid="filter-type">
                      <SelectValue placeholder="Todos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Todos</SelectItem>
                      <SelectItem value="dog">Cachorro</SelectItem>
                      <SelectItem value="cat">Gato</SelectItem>
                      <SelectItem value="bird">Pássaro</SelectItem>
                      <SelectItem value="other">Outro</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-[#564F62] mb-2 block">Idade</label>
                  <Select value={filters.age} onValueChange={(v) => handleFilterChange('age', v)}>
                    <SelectTrigger data-testid="filter-age">
                      <SelectValue placeholder="Todas" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Todas</SelectItem>
                      <SelectItem value="puppy">Filhote</SelectItem>
                      <SelectItem value="young">Jovem</SelectItem>
                      <SelectItem value="adult">Adulto</SelectItem>
                      <SelectItem value="senior">Idoso</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-[#564F62] mb-2 block">Porte</label>
                  <Select value={filters.size} onValueChange={(v) => handleFilterChange('size', v)}>
                    <SelectTrigger data-testid="filter-size">
                      <SelectValue placeholder="Todos" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Todos</SelectItem>
                      <SelectItem value="small">Pequeno</SelectItem>
                      <SelectItem value="medium">Médio</SelectItem>
                      <SelectItem value="large">Grande</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-[#564F62] mb-2 block">Cidade</label>
                  <Input 
                    placeholder="Digite a cidade"
                    value={filters.city}
                    onChange={(e) => handleFilterChange('city', e.target.value)}
                    className="rounded-xl"
                    data-testid="filter-city"
                  />
                </div>
                
                <div className="flex items-end gap-2">
                  <Button 
                    onClick={applyFilters}
                    className="flex-1 bg-[#5A3E85] hover:bg-[#452C69] text-white rounded-full"
                    data-testid="apply-filters-btn"
                  >
                    Aplicar
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={clearFilters}
                    className="border-[#E4DDF1] rounded-full"
                    data-testid="clear-filters-btn"
                  >
                    Limpar
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Pet Grid */}
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {[1, 2, 3, 4, 5, 6].map((i) => (
                <div key={i} className="bg-white border border-[#E4DDF1] rounded-3xl overflow-hidden animate-pulse">
                  <div className="h-64 bg-gray-200" />
                  <div className="p-6 space-y-3">
                    <div className="h-6 bg-gray-200 rounded w-3/4" />
                    <div className="h-4 bg-gray-200 rounded w-1/2" />
                    <div className="h-10 bg-gray-200 rounded-full" />
                  </div>
                </div>
              ))}
            </div>
          ) : pets.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
              {pets.map((pet, index) => (
                <div key={pet.id} className={`animate-fade-in stagger-${(index % 6) + 1}`}>
                  <PetCard 
                    pet={pet} 
                    onFavorite={handleFavorite}
                    isFavorite={favorites.includes(pet.id)}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-16">
              <PawPrint className="w-16 h-16 text-[#E4DDF1] mx-auto mb-4" />
              <h3 className="text-xl font-bold text-[#1C1724] mb-2">Nenhum pet encontrado</h3>
              <p className="text-[#564F62]">Tente ajustar os filtros ou volte mais tarde</p>
            </div>
          )}

          {/* View All Button */}
          {pets.length > 0 && (
            <div className="text-center mt-12">
              <Link to="/pets">
                <Button 
                  className="bg-[#5A3E85] hover:bg-[#452C69] text-white font-bold py-4 px-8 rounded-full"
                  data-testid="view-all-pets-btn"
                >
                  Ver todos os pets
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-gradient-to-r from-[#5A3E85] to-[#452C69]">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-white mb-4">
            É uma ONG? Cadastre seus pets!
          </h2>
          <p className="text-white/80 mb-8 max-w-2xl mx-auto">
            Faça parte da nossa comunidade e ajude mais animais a encontrarem um lar amoroso.
          </p>
          <Link to="/auth?mode=register&type=ong">
            <Button 
              className="bg-[#FFC499] hover:bg-[#FFB57A] text-[#1C1724] font-bold py-4 px-8 rounded-full text-lg"
              data-testid="register-ong-btn"
            >
              Cadastrar ONG
              <Building className="w-5 h-5 ml-2" />
            </Button>
          </Link>
        </div>
      </section>
    </div>
  );
}
