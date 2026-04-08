import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { Heart, Clock, CheckCircle, XCircle, PawPrint, MessageCircle, Bell, ChevronRight, MapPin, Trash2 } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function UserDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [favorites, setFavorites] = useState([]);
  const [adoptions, setAdoptions] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const config = { withCredentials: true, headers };

      const [favRes, adoptRes, notifRes] = await Promise.all([
        axios.get(`${API}/users/favorites`, config),
        axios.get(`${API}/adoptions/user`, config),
        axios.get(`${API}/notifications`, config)
      ]);

      setFavorites(favRes.data);
      setAdoptions(adoptRes.data);
      setNotifications(notifRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const removeFavorite = async (petId) => {
    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API}/users/favorites/${petId}`, {
        withCredentials: true,
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      setFavorites(prev => prev.filter(p => p.id !== petId));
      toast.success('Removido dos favoritos');
    } catch (error) {
      toast.error('Erro ao remover dos favoritos');
    }
  };

  const markAllRead = async () => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API}/notifications/read-all`, {}, {
        withCredentials: true,
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      setNotifications(prev => prev.map(n => ({ ...n, read: true })));
      toast.success('Todas notificações marcadas como lidas');
    } catch (error) {
      toast.error('Erro ao marcar notificações');
    }
  };

  const getImageUrl = (photo) => {
    if (!photo) return 'https://images.unsplash.com/photo-1744824838728-59f825fc7da1?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjY2NzF8MHwxfHNlYXJjaHwyfHxjdXRlJTIwZG9nJTIwcG9ydHJhaXR8ZW58MHx8fHwxNzc1NjA1NDU2fDA&ixlib=rb-4.1.0&q=85';
    if (photo.startsWith('http')) return photo;
    return `${process.env.REACT_APP_BACKEND_URL}/api/files/${photo}`;
  };

  const statusColors = {
    pending: 'bg-yellow-100 text-yellow-700',
    approved: 'bg-green-100 text-green-700',
    rejected: 'bg-red-100 text-red-700'
  };

  const statusLabels = {
    pending: 'Pendente',
    approved: 'Aprovada',
    rejected: 'Rejeitada'
  };

  const statusIcons = {
    pending: Clock,
    approved: CheckCircle,
    rejected: XCircle
  };

  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <div className="min-h-screen bg-[#FAFAFA] py-8">
      <div className="container mx-auto px-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold text-[#1C1724]">
            Olá, {user?.name?.split(' ')[0]}!
          </h1>
          <p className="text-[#564F62] mt-1">Gerencie seus favoritos e solicitações de adoção</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
          <div className="bg-white border border-[#E4DDF1] rounded-2xl p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-[#F3EFFF] rounded-full flex items-center justify-center">
                <Heart className="w-6 h-6 text-[#5A3E85]" />
              </div>
              <div>
                <p className="text-2xl font-bold text-[#1C1724]">{favorites.length}</p>
                <p className="text-sm text-[#564F62]">Favoritos</p>
              </div>
            </div>
          </div>
          <div className="bg-white border border-[#E4DDF1] rounded-2xl p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-[#FFC499]/30 rounded-full flex items-center justify-center">
                <PawPrint className="w-6 h-6 text-[#5A3E85]" />
              </div>
              <div>
                <p className="text-2xl font-bold text-[#1C1724]">{adoptions.length}</p>
                <p className="text-sm text-[#564F62]">Solicitações</p>
              </div>
            </div>
          </div>
          <div className="bg-white border border-[#E4DDF1] rounded-2xl p-6">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <Bell className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-2xl font-bold text-[#1C1724]">{unreadCount}</p>
                <p className="text-sm text-[#564F62]">Novas notificações</p>
              </div>
            </div>
          </div>
        </div>

        {/* Content Tabs */}
        <Tabs defaultValue="favorites" className="w-full">
          <TabsList className="bg-white border border-[#E4DDF1] rounded-full p-1 mb-6">
            <TabsTrigger 
              value="favorites" 
              className="rounded-full data-[state=active]:bg-[#5A3E85] data-[state=active]:text-white"
              data-testid="favorites-tab"
            >
              <Heart className="w-4 h-4 mr-2" />
              Favoritos
            </TabsTrigger>
            <TabsTrigger 
              value="adoptions" 
              className="rounded-full data-[state=active]:bg-[#5A3E85] data-[state=active]:text-white"
              data-testid="adoptions-tab"
            >
              <PawPrint className="w-4 h-4 mr-2" />
              Solicitações
            </TabsTrigger>
            <TabsTrigger 
              value="notifications" 
              className="rounded-full data-[state=active]:bg-[#5A3E85] data-[state=active]:text-white relative"
              data-testid="notifications-tab"
            >
              <Bell className="w-4 h-4 mr-2" />
              Notificações
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {unreadCount}
                </span>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Favorites Tab */}
          <TabsContent value="favorites">
            {loading ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map(i => (
                  <div key={i} className="bg-white border border-[#E4DDF1] rounded-2xl p-4 animate-pulse">
                    <div className="h-40 bg-gray-200 rounded-xl mb-4" />
                    <div className="h-5 bg-gray-200 rounded w-3/4 mb-2" />
                    <div className="h-4 bg-gray-200 rounded w-1/2" />
                  </div>
                ))}
              </div>
            ) : favorites.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {favorites.map(pet => (
                  <div key={pet.id} className="bg-white border border-[#E4DDF1] rounded-2xl overflow-hidden hover:shadow-lg transition-shadow">
                    <div className="relative h-40">
                      <img 
                        src={getImageUrl(pet.photos?.[0])} 
                        alt={pet.name}
                        className="w-full h-full object-cover"
                        onError={(e) => { e.target.src = getImageUrl(null); }}
                      />
                      <button
                        onClick={() => removeFavorite(pet.id)}
                        className="absolute top-3 right-3 p-2 bg-white/80 rounded-full hover:bg-white transition-colors"
                        data-testid={`remove-favorite-${pet.id}`}
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </button>
                    </div>
                    <div className="p-4">
                      <h3 className="font-bold text-[#1C1724]">{pet.name}</h3>
                      <p className="text-sm text-[#564F62] flex items-center mt-1">
                        <MapPin className="w-3 h-3 mr-1" />
                        {pet.city}, {pet.state}
                      </p>
                      <Link to={`/pets/${pet.id}`}>
                        <Button 
                          className="w-full mt-3 bg-[#F3EFFF] text-[#5A3E85] hover:bg-[#E4DDF1] rounded-full text-sm"
                          data-testid={`view-favorite-${pet.id}`}
                        >
                          Ver detalhes
                          <ChevronRight className="w-4 h-4 ml-1" />
                        </Button>
                      </Link>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white border border-[#E4DDF1] rounded-2xl p-12 text-center">
                <Heart className="w-16 h-16 text-[#E4DDF1] mx-auto mb-4" />
                <h3 className="text-xl font-bold text-[#1C1724] mb-2">Nenhum favorito</h3>
                <p className="text-[#564F62] mb-4">Explore os pets disponíveis e adicione aos favoritos</p>
                <Link to="/pets">
                  <Button className="bg-[#5A3E85] hover:bg-[#452C69] text-white rounded-full">
                    Ver pets
                  </Button>
                </Link>
              </div>
            )}
          </TabsContent>

          {/* Adoptions Tab */}
          <TabsContent value="adoptions">
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3].map(i => (
                  <div key={i} className="bg-white border border-[#E4DDF1] rounded-2xl p-6 animate-pulse">
                    <div className="flex gap-4">
                      <div className="w-20 h-20 bg-gray-200 rounded-xl" />
                      <div className="flex-1 space-y-2">
                        <div className="h-5 bg-gray-200 rounded w-1/2" />
                        <div className="h-4 bg-gray-200 rounded w-3/4" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : adoptions.length > 0 ? (
              <div className="space-y-4">
                {adoptions.map(adoption => {
                  const StatusIcon = statusIcons[adoption.status];
                  return (
                    <div key={adoption.id} className="bg-white border border-[#E4DDF1] rounded-2xl p-6">
                      <div className="flex flex-col sm:flex-row gap-4">
                        <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0">
                          <img 
                            src={getImageUrl(adoption.pet_photo)} 
                            alt={adoption.pet_name}
                            className="w-full h-full object-cover"
                            onError={(e) => { e.target.src = getImageUrl(null); }}
                          />
                        </div>
                        <div className="flex-1">
                          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                            <h3 className="font-bold text-[#1C1724]">{adoption.pet_name}</h3>
                            <Badge className={`${statusColors[adoption.status]} flex items-center gap-1 w-fit`}>
                              <StatusIcon className="w-3 h-3" />
                              {statusLabels[adoption.status]}
                            </Badge>
                          </div>
                          <p className="text-sm text-[#564F62] mt-1 line-clamp-2">{adoption.message}</p>
                          <p className="text-xs text-[#564F62] mt-2">
                            Enviada em {new Date(adoption.created_at).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                        <Link to={`/pets/${adoption.pet_id}`} className="flex-shrink-0">
                          <Button variant="outline" className="border-[#E4DDF1] rounded-full">
                            Ver pet
                          </Button>
                        </Link>
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="bg-white border border-[#E4DDF1] rounded-2xl p-12 text-center">
                <PawPrint className="w-16 h-16 text-[#E4DDF1] mx-auto mb-4" />
                <h3 className="text-xl font-bold text-[#1C1724] mb-2">Nenhuma solicitação</h3>
                <p className="text-[#564F62] mb-4">Você ainda não solicitou a adoção de nenhum pet</p>
                <Link to="/pets">
                  <Button className="bg-[#5A3E85] hover:bg-[#452C69] text-white rounded-full">
                    Encontrar um pet
                  </Button>
                </Link>
              </div>
            )}
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications">
            {notifications.length > 0 && (
              <div className="flex justify-end mb-4">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={markAllRead}
                  className="border-[#E4DDF1] rounded-full text-sm"
                  data-testid="mark-all-read"
                >
                  Marcar todas como lidas
                </Button>
              </div>
            )}
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => (
                  <div key={i} className="bg-white border border-[#E4DDF1] rounded-xl p-4 animate-pulse">
                    <div className="h-4 bg-gray-200 rounded w-1/2 mb-2" />
                    <div className="h-3 bg-gray-200 rounded w-3/4" />
                  </div>
                ))}
              </div>
            ) : notifications.length > 0 ? (
              <div className="space-y-3">
                {notifications.map(notif => (
                  <div 
                    key={notif.id} 
                    className={`bg-white border rounded-xl p-4 ${notif.read ? 'border-[#E4DDF1]' : 'border-[#5A3E85] bg-[#F3EFFF]/50'}`}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`w-2 h-2 rounded-full mt-2 ${notif.read ? 'bg-gray-300' : 'bg-[#5A3E85]'}`} />
                      <div className="flex-1">
                        <h4 className="font-semibold text-[#1C1724]">{notif.title}</h4>
                        <p className="text-sm text-[#564F62]">{notif.message}</p>
                        <p className="text-xs text-[#564F62] mt-1">
                          {new Date(notif.created_at).toLocaleDateString('pt-BR', { 
                            day: '2-digit', 
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white border border-[#E4DDF1] rounded-2xl p-12 text-center">
                <Bell className="w-16 h-16 text-[#E4DDF1] mx-auto mb-4" />
                <h3 className="text-xl font-bold text-[#1C1724] mb-2">Sem notificações</h3>
                <p className="text-[#564F62]">Você não tem notificações no momento</p>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
