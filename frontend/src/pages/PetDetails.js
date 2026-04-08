import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { PawPrint, MapPin, Heart, Calendar, Ruler, Syringe, Scissors, AlertCircle, MessageCircle, ChevronLeft, Phone, Mail, Building } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Textarea } from '../components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '../components/ui/dialog';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function PetDetails() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [pet, setPet] = useState(null);
  const [loading, setLoading] = useState(true);
  const [selectedImage, setSelectedImage] = useState(0);
  const [showAdoptModal, setShowAdoptModal] = useState(false);
  const [adoptMessage, setAdoptMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [isFavorite, setIsFavorite] = useState(false);

  useEffect(() => {
    fetchPet();
    if (isAuthenticated) {
      checkFavorite();
    }
  }, [id, isAuthenticated]);

  const fetchPet = async () => {
    try {
      setLoading(true);
      const response = await axios.get(`${API}/pets/${id}`);
      setPet(response.data);
    } catch (error) {
      console.error('Error fetching pet:', error);
      toast.error('Pet não encontrado');
      navigate('/pets');
    } finally {
      setLoading(false);
    }
  };

  const checkFavorite = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/users/favorites`, {
        withCredentials: true,
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      setIsFavorite(response.data.some(p => p.id === id));
    } catch (error) {
      console.error('Error checking favorite:', error);
    }
  };

  const handleFavorite = async () => {
    if (!isAuthenticated) {
      navigate('/auth?mode=login');
      return;
    }
    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      
      if (isFavorite) {
        await axios.delete(`${API}/users/favorites/${id}`, { withCredentials: true, headers });
        setIsFavorite(false);
        toast.success('Removido dos favoritos');
      } else {
        await axios.post(`${API}/users/favorites/${id}`, {}, { withCredentials: true, headers });
        setIsFavorite(true);
        toast.success('Adicionado aos favoritos');
      }
    } catch (error) {
      toast.error('Erro ao atualizar favoritos');
    }
  };

  const handleAdopt = async () => {
    if (!isAuthenticated) {
      navigate('/auth?mode=login');
      return;
    }
    
    if (!adoptMessage.trim()) {
      toast.error('Por favor, escreva uma mensagem');
      return;
    }

    try {
      setSubmitting(true);
      const token = localStorage.getItem('token');
      await axios.post(`${API}/adoptions`, {
        pet_id: id,
        message: adoptMessage
      }, {
        withCredentials: true,
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      
      toast.success('Solicitação de adoção enviada!');
      setShowAdoptModal(false);
      setAdoptMessage('');
    } catch (error) {
      const message = error.response?.data?.detail || 'Erro ao enviar solicitação';
      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  const getImageUrl = (photo) => {
    if (!photo) return 'https://images.unsplash.com/photo-1744824838728-59f825fc7da1?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjY2NzF8MHwxfHNlYXJjaHwyfHxjdXRlJTIwZG9nJTIwcG9ydHJhaXR8ZW58MHx8fHwxNzc1NjA1NDU2fDA&ixlib=rb-4.1.0&q=85';
    if (photo.startsWith('http')) return photo;
    return `${process.env.REACT_APP_BACKEND_URL}/api/files/${photo}`;
  };

  const ageLabels = { puppy: 'Filhote', young: 'Jovem', adult: 'Adulto', senior: 'Idoso' };
  const sizeLabels = { small: 'Pequeno', medium: 'Médio', large: 'Grande' };
  const typeLabels = { dog: 'Cachorro', cat: 'Gato', bird: 'Pássaro', other: 'Outro' };
  const genderLabels = { male: 'Macho', female: 'Fêmea' };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center">
        <div className="animate-pulse space-y-4 w-full max-w-4xl px-6">
          <div className="h-96 bg-gray-200 rounded-3xl" />
          <div className="h-8 bg-gray-200 rounded w-1/2" />
          <div className="h-4 bg-gray-200 rounded w-3/4" />
        </div>
      </div>
    );
  }

  if (!pet) return null;

  const images = pet.photos?.length > 0 ? pet.photos : [null];

  return (
    <div className="min-h-screen bg-[#FAFAFA] py-8">
      <div className="container mx-auto px-6">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => navigate(-1)}
          className="mb-6 text-[#564F62] hover:text-[#5A3E85]"
          data-testid="back-btn"
        >
          <ChevronLeft className="w-5 h-5 mr-1" />
          Voltar
        </Button>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* Images Section */}
          <div className="space-y-4">
            <div className="relative rounded-3xl overflow-hidden bg-white border border-[#E4DDF1]">
              <img
                src={getImageUrl(images[selectedImage])}
                alt={pet.name}
                className="w-full h-[400px] lg:h-[500px] object-cover"
                onError={(e) => { e.target.src = getImageUrl(null); }}
              />
              <button
                onClick={handleFavorite}
                className="absolute top-4 right-4 p-3 rounded-full bg-white/80 backdrop-blur-sm hover:bg-white transition-colors shadow-lg"
                data-testid="favorite-btn"
              >
                <Heart className={`w-6 h-6 ${isFavorite ? 'fill-red-500 text-red-500' : 'text-gray-600'}`} />
              </button>
              {pet.status !== 'available' && (
                <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                  <Badge className="bg-red-500 text-white text-lg py-2 px-4">
                    {pet.status === 'adopted' ? 'Adotado' : 'Pendente'}
                  </Badge>
                </div>
              )}
            </div>

            {/* Thumbnails */}
            {images.length > 1 && (
              <div className="flex gap-3 overflow-x-auto pb-2">
                {images.map((photo, index) => (
                  <button
                    key={index}
                    onClick={() => setSelectedImage(index)}
                    className={`flex-shrink-0 w-20 h-20 rounded-xl overflow-hidden border-2 transition-all ${
                      selectedImage === index ? 'border-[#5A3E85] scale-105' : 'border-[#E4DDF1]'
                    }`}
                  >
                    <img
                      src={getImageUrl(photo)}
                      alt={`${pet.name} ${index + 1}`}
                      className="w-full h-full object-cover"
                      onError={(e) => { e.target.src = getImageUrl(null); }}
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info Section */}
          <div className="space-y-6">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <Badge className="bg-[#FFC499] text-[#1C1724] font-bold">
                  {typeLabels[pet.pet_type] || pet.pet_type}
                </Badge>
                {pet.status === 'available' && (
                  <Badge className="bg-green-100 text-green-700">Disponível</Badge>
                )}
              </div>
              <h1 className="text-3xl lg:text-4xl font-black text-[#1C1724]" data-testid="pet-name">
                {pet.name}
              </h1>
              {pet.breed && (
                <p className="text-lg text-[#564F62] mt-1">{pet.breed}</p>
              )}
            </div>

            <div className="flex items-center text-[#564F62]">
              <MapPin className="w-5 h-5 mr-2 text-[#5A3E85]" />
              {pet.city}, {pet.state}
            </div>

            {/* Characteristics Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div className="bg-white border border-[#E4DDF1] rounded-2xl p-4 text-center">
                <Calendar className="w-6 h-6 text-[#5A3E85] mx-auto mb-2" />
                <p className="text-sm text-[#564F62]">Idade</p>
                <p className="font-bold text-[#1C1724]">{ageLabels[pet.age] || pet.age}</p>
              </div>
              <div className="bg-white border border-[#E4DDF1] rounded-2xl p-4 text-center">
                <Ruler className="w-6 h-6 text-[#5A3E85] mx-auto mb-2" />
                <p className="text-sm text-[#564F62]">Porte</p>
                <p className="font-bold text-[#1C1724]">{sizeLabels[pet.size] || pet.size}</p>
              </div>
              <div className="bg-white border border-[#E4DDF1] rounded-2xl p-4 text-center">
                <PawPrint className="w-6 h-6 text-[#5A3E85] mx-auto mb-2" />
                <p className="text-sm text-[#564F62]">Sexo</p>
                <p className="font-bold text-[#1C1724]">{genderLabels[pet.gender] || pet.gender}</p>
              </div>
              <div className="bg-white border border-[#E4DDF1] rounded-2xl p-4 text-center">
                <Syringe className="w-6 h-6 text-[#5A3E85] mx-auto mb-2" />
                <p className="text-sm text-[#564F62]">Vacinado</p>
                <p className="font-bold text-[#1C1724]">{pet.vaccinated ? 'Sim' : 'Não'}</p>
              </div>
            </div>

            {/* Additional Info */}
            <div className="flex gap-4 flex-wrap">
              {pet.neutered && (
                <Badge variant="outline" className="border-[#5A3E85] text-[#5A3E85]">
                  <Scissors className="w-4 h-4 mr-1" /> Castrado
                </Badge>
              )}
              {pet.special_needs && (
                <Badge variant="outline" className="border-orange-500 text-orange-500">
                  <AlertCircle className="w-4 h-4 mr-1" /> Necessidades especiais
                </Badge>
              )}
            </div>

            {/* Description */}
            <div className="bg-white border border-[#E4DDF1] rounded-2xl p-6">
              <h3 className="font-bold text-[#1C1724] mb-3">Sobre {pet.name}</h3>
              <p className="text-[#564F62] leading-relaxed">{pet.description}</p>
              
              {pet.health_info && (
                <div className="mt-4 pt-4 border-t border-[#E4DDF1]">
                  <h4 className="font-semibold text-[#1C1724] mb-2">Informações de Saúde</h4>
                  <p className="text-[#564F62]">{pet.health_info}</p>
                </div>
              )}
              
              {pet.special_needs && (
                <div className="mt-4 pt-4 border-t border-[#E4DDF1]">
                  <h4 className="font-semibold text-[#1C1724] mb-2">Necessidades Especiais</h4>
                  <p className="text-[#564F62]">{pet.special_needs}</p>
                </div>
              )}
            </div>

            {/* ONG Info */}
            {pet.ong_info && (
              <div className="bg-[#F3EFFF] border border-[#E4DDF1] rounded-2xl p-6">
                <h3 className="font-bold text-[#1C1724] mb-4 flex items-center">
                  <Building className="w-5 h-5 mr-2 text-[#5A3E85]" />
                  Informações da ONG
                </h3>
                <div className="space-y-3">
                  <p className="font-semibold text-[#5A3E85] text-lg">{pet.ong_info.name}</p>
                  {pet.ong_info.description && (
                    <p className="text-[#564F62] text-sm">{pet.ong_info.description}</p>
                  )}
                  <div className="flex flex-col sm:flex-row gap-4 pt-2">
                    {pet.ong_info.email && (
                      <a href={`mailto:${pet.ong_info.email}`} className="flex items-center text-[#564F62] hover:text-[#5A3E85]">
                        <Mail className="w-4 h-4 mr-2" /> {pet.ong_info.email}
                      </a>
                    )}
                    {pet.ong_info.phone && (
                      <a href={`tel:${pet.ong_info.phone}`} className="flex items-center text-[#564F62] hover:text-[#5A3E85]">
                        <Phone className="w-4 h-4 mr-2" /> {pet.ong_info.phone}
                      </a>
                    )}
                  </div>
                  {pet.ong_info.city && (
                    <p className="flex items-center text-sm text-[#564F62]">
                      <MapPin className="w-4 h-4 mr-2" /> {pet.ong_info.city}, {pet.ong_info.state}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            {pet.status === 'available' && (
              <div className="flex gap-4">
                <Button
                  onClick={() => setShowAdoptModal(true)}
                  className="flex-1 bg-[#5A3E85] hover:bg-[#452C69] text-white font-bold py-4 rounded-full text-lg"
                  data-testid="adopt-btn"
                >
                  <Heart className="w-5 h-5 mr-2" />
                  Quero Adotar
                </Button>
                {pet.ong_info && isAuthenticated && (
                  <Link to={`/messages/${pet.ong_info.id}?pet=${id}`}>
                    <Button
                      variant="outline"
                      className="border-2 border-[#5A3E85] text-[#5A3E85] hover:bg-[#F3EFFF] font-bold py-4 px-6 rounded-full"
                      data-testid="message-ong-btn"
                    >
                      <MessageCircle className="w-5 h-5" />
                    </Button>
                  </Link>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Adopt Modal */}
      <Dialog open={showAdoptModal} onOpenChange={setShowAdoptModal}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Solicitar Adoção</DialogTitle>
            <DialogDescription>
              Conte um pouco sobre você e por que deseja adotar {pet?.name}
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <Textarea
              placeholder="Escreva sua mensagem para a ONG..."
              value={adoptMessage}
              onChange={(e) => setAdoptMessage(e.target.value)}
              className="min-h-[150px] rounded-xl"
              data-testid="adopt-message-input"
            />
          </div>
          <DialogFooter className="gap-2">
            <Button
              variant="outline"
              onClick={() => setShowAdoptModal(false)}
              className="rounded-full"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleAdopt}
              disabled={submitting}
              className="bg-[#5A3E85] hover:bg-[#452C69] text-white rounded-full"
              data-testid="confirm-adopt-btn"
            >
              {submitting ? 'Enviando...' : 'Enviar Solicitação'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
