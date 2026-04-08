import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { PawPrint, Search, MapPin, Filter, Heart, ChevronRight, ChevronLeft, X } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Badge } from '../components/ui/badge';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

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
    <div className="pet-card bg-white border border-[#E4DDF1] rounded-3xl overflow-hidden flex flex-col" data-testid={`pet-card-${pet.id}`}>
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
            <Button className="w-full bg-[#F3EFFF] text-[#5A3E85] hover:bg-[#E4DDF1] hover:text-[#452C69] font-bold rounded-full" data-testid={`view-pet-btn-${pet.id}`}>
              Ver detalhes
              <ChevronRight className="w-4 h-4 ml-2" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}

export default function PetsList() {
  const { isAuthenticated } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [pets, setPets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [favorites, setFavorites] = useState([]);
  const [pagination, setPagination] = useState({ total: 0, page: 1, pages: 1 });
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState({
    pet_type: searchParams.get('type') || '',
    age: searchParams.get('age') || '',
    size: searchParams.get('size') || '',
    city: searchParams.get('city') || '',
    state: searchParams.get('state') || ''
  });

  useEffect(() => {
    fetchPets();
    if (isAuthenticated) {
      fetchFavorites();
    }
  }, [searchParams, isAuthenticated]);

  const fetchPets = async () => {
    try {
      setLoading(true);
      const page = searchParams.get('page') || '1';
      const params = new URLSearchParams({ page });
      
      if (filters.pet_type) params.append('pet_type', filters.pet_type);
      if (filters.age) params.append('age', filters.age);
      if (filters.size) params.append('size', filters.size);
      if (filters.city) params.append('city', filters.city);
      if (filters.state) params.append('state', filters.state);
      
      const response = await axios.get(`${API}/pets?${params.toString()}`);
      setPets(response.data.pets || []);
      setPagination({
        total: response.data.total,
        page: response.data.page,
        pages: response.data.pages
      });
    } catch (error) {
      console.error('Error fetching pets:', error);
    } finally {
      setLoading(false);
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
        toast.success('Removido dos favoritos');
      } else {
        await axios.post(`${API}/users/favorites/${petId}`, {}, { withCredentials: true, headers });
        setFavorites(prev => [...prev, petId]);
        toast.success('Adicionado aos favoritos');
      }
    } catch (error) {
      toast.error('Erro ao atualizar favoritos');
    }
  };

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const applyFilters = () => {
    const params = new URLSearchParams();
    Object.entries(filters).forEach(([k, v]) => {
      if (v) params.set(k, v);
    });
    setSearchParams(params);
    setShowFilters(false);
  };

  const clearFilters = () => {
    setFilters({ pet_type: '', age: '', size: '', city: '', state: '' });
    setSearchParams({});
  };

  const goToPage = (page) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', page.toString());
    setSearchParams(params);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const activeFiltersCount = Object.values(filters).filter(Boolean).length;

  return (
    <div className="min-h-screen bg-[#FAFAFA] py-8">
      <div className="container mx-auto px-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#1C1724]">Pets para Adoção</h1>
            <p className="text-[#564F62] mt-1">{pagination.total} pets encontrados</p>
          </div>
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="border-[#E4DDF1] text-[#5A3E85] hover:bg-[#F3EFFF] rounded-full relative"
            data-testid="toggle-filters"
          >
            <Filter className="w-4 h-4 mr-2" />
            Filtros
            {activeFiltersCount > 0 && (
              <span className="absolute -top-2 -right-2 w-5 h-5 bg-[#5A3E85] text-white text-xs rounded-full flex items-center justify-center">
                {activeFiltersCount}
              </span>
            )}
          </Button>
        </div>

        {/* Filters Panel */}
        {showFilters && (
          <div className="bg-white border border-[#E4DDF1] rounded-2xl p-6 mb-8 animate-fade-in">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-[#1C1724]">Filtrar por</h3>
              {activeFiltersCount > 0 && (
                <Button variant="ghost" size="sm" onClick={clearFilters} className="text-[#564F62]">
                  <X className="w-4 h-4 mr-1" /> Limpar
                </Button>
              )}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <div>
                <label className="text-sm font-medium text-[#564F62] mb-2 block">Tipo</label>
                <Select value={filters.pet_type} onValueChange={(v) => handleFilterChange('pet_type', v)}>
                  <SelectTrigger data-testid="filter-type"><SelectValue placeholder="Todos" /></SelectTrigger>
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
                  <SelectTrigger data-testid="filter-age"><SelectValue placeholder="Todas" /></SelectTrigger>
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
                  <SelectTrigger data-testid="filter-size"><SelectValue placeholder="Todos" /></SelectTrigger>
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
              <div className="flex items-end">
                <Button onClick={applyFilters} className="w-full bg-[#5A3E85] hover:bg-[#452C69] text-white rounded-full" data-testid="apply-filters">
                  Aplicar
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Active Filters */}
        {activeFiltersCount > 0 && (
          <div className="flex flex-wrap gap-2 mb-6">
            {filters.pet_type && (
              <Badge className="bg-[#F3EFFF] text-[#5A3E85]">
                Tipo: {filters.pet_type === 'dog' ? 'Cachorro' : filters.pet_type === 'cat' ? 'Gato' : filters.pet_type}
                <button onClick={() => { handleFilterChange('pet_type', ''); applyFilters(); }} className="ml-2"><X className="w-3 h-3" /></button>
              </Badge>
            )}
            {filters.age && (
              <Badge className="bg-[#F3EFFF] text-[#5A3E85]">
                Idade: {filters.age}
                <button onClick={() => { handleFilterChange('age', ''); applyFilters(); }} className="ml-2"><X className="w-3 h-3" /></button>
              </Badge>
            )}
            {filters.size && (
              <Badge className="bg-[#F3EFFF] text-[#5A3E85]">
                Porte: {filters.size}
                <button onClick={() => { handleFilterChange('size', ''); applyFilters(); }} className="ml-2"><X className="w-3 h-3" /></button>
              </Badge>
            )}
            {filters.city && (
              <Badge className="bg-[#F3EFFF] text-[#5A3E85]">
                Cidade: {filters.city}
                <button onClick={() => { handleFilterChange('city', ''); applyFilters(); }} className="ml-2"><X className="w-3 h-3" /></button>
              </Badge>
            )}
          </div>
        )}

        {/* Pet Grid */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {[1, 2, 3, 4, 5, 6, 7, 8].map((i) => (
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
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {pets.map((pet) => (
                <PetCard 
                  key={pet.id} 
                  pet={pet} 
                  onFavorite={handleFavorite}
                  isFavorite={favorites.includes(pet.id)}
                />
              ))}
            </div>

            {/* Pagination */}
            {pagination.pages > 1 && (
              <div className="flex items-center justify-center gap-2 mt-12">
                <Button
                  variant="outline"
                  onClick={() => goToPage(pagination.page - 1)}
                  disabled={pagination.page <= 1}
                  className="rounded-full border-[#E4DDF1]"
                >
                  <ChevronLeft className="w-5 h-5" />
                </Button>
                
                {Array.from({ length: Math.min(5, pagination.pages) }, (_, i) => {
                  let pageNum;
                  if (pagination.pages <= 5) {
                    pageNum = i + 1;
                  } else if (pagination.page <= 3) {
                    pageNum = i + 1;
                  } else if (pagination.page >= pagination.pages - 2) {
                    pageNum = pagination.pages - 4 + i;
                  } else {
                    pageNum = pagination.page - 2 + i;
                  }
                  
                  return (
                    <Button
                      key={pageNum}
                      variant={pageNum === pagination.page ? 'default' : 'outline'}
                      onClick={() => goToPage(pageNum)}
                      className={`rounded-full w-10 h-10 ${
                        pageNum === pagination.page 
                          ? 'bg-[#5A3E85] text-white' 
                          : 'border-[#E4DDF1]'
                      }`}
                    >
                      {pageNum}
                    </Button>
                  );
                })}
                
                <Button
                  variant="outline"
                  onClick={() => goToPage(pagination.page + 1)}
                  disabled={pagination.page >= pagination.pages}
                  className="rounded-full border-[#E4DDF1]"
                >
                  <ChevronRight className="w-5 h-5" />
                </Button>
              </div>
            )}
          </>
        ) : (
          <div className="text-center py-16">
            <PawPrint className="w-16 h-16 text-[#E4DDF1] mx-auto mb-4" />
            <h3 className="text-xl font-bold text-[#1C1724] mb-2">Nenhum pet encontrado</h3>
            <p className="text-[#564F62] mb-4">Tente ajustar os filtros</p>
            <Button onClick={clearFilters} className="bg-[#5A3E85] hover:bg-[#452C69] text-white rounded-full">
              Limpar filtros
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
