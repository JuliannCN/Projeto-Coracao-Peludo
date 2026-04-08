import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import axios from 'axios';
import { PawPrint, Plus, Users, Clock, CheckCircle, XCircle, Edit, Trash2, Upload, Eye, Building, Bell } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Switch } from '../components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function OngDashboard() {
  const { user } = useAuth();
  const [pets, setPets] = useState([]);
  const [adoptions, setAdoptions] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showPetModal, setShowPetModal] = useState(false);
  const [editingPet, setEditingPet] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingPhoto, setUploadingPhoto] = useState(false);

  const [petForm, setPetForm] = useState({
    name: '',
    pet_type: 'dog',
    breed: '',
    age: 'young',
    size: 'medium',
    gender: 'male',
    description: '',
    health_info: '',
    vaccinated: false,
    neutered: false,
    special_needs: '',
    city: user?.city || '',
    state: user?.state || ''
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};
      const config = { withCredentials: true, headers };

      const [petsRes, adoptionsRes, notifsRes] = await Promise.all([
        axios.get(`${API}/ongs/${user?.id}/pets`, config),
        axios.get(`${API}/adoptions/ong`, config),
        axios.get(`${API}/notifications`, config)
      ]);

      setPets(petsRes.data);
      setAdoptions(adoptionsRes.data);
      setNotifications(notifsRes.data);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePetSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const token = localStorage.getItem('token');
      const headers = token ? { Authorization: `Bearer ${token}` } : {};

      if (editingPet) {
        await axios.put(`${API}/pets/${editingPet.id}`, petForm, {
          withCredentials: true,
          headers
        });
        toast.success('Pet atualizado com sucesso!');
      } else {
        await axios.post(`${API}/pets`, petForm, {
          withCredentials: true,
          headers
        });
        toast.success('Pet cadastrado com sucesso!');
      }

      setShowPetModal(false);
      resetPetForm();
      fetchData();
    } catch (error) {
      toast.error(error.response?.data?.detail || 'Erro ao salvar pet');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePhotoUpload = async (e, petId) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingPhoto(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/pets/${petId}/photos`, formData, {
        withCredentials: true,
        headers: {
          'Content-Type': 'multipart/form-data',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      });
      toast.success('Foto enviada com sucesso!');
      fetchData();
    } catch (error) {
      toast.error('Erro ao enviar foto');
    } finally {
      setUploadingPhoto(false);
    }
  };

  const handleDeletePet = async (petId) => {
    if (!window.confirm('Tem certeza que deseja excluir este pet?')) return;

    try {
      const token = localStorage.getItem('token');
      await axios.delete(`${API}/pets/${petId}`, {
        withCredentials: true,
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      toast.success('Pet excluído com sucesso');
      fetchData();
    } catch (error) {
      toast.error('Erro ao excluir pet');
    }
  };

  const handleAdoptionUpdate = async (adoptionId, status) => {
    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API}/adoptions/${adoptionId}`, { status }, {
        withCredentials: true,
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      toast.success(`Solicitação ${status === 'approved' ? 'aprovada' : 'rejeitada'}`);
      fetchData();
    } catch (error) {
      toast.error('Erro ao atualizar solicitação');
    }
  };

  const openEditModal = (pet) => {
    setEditingPet(pet);
    setPetForm({
      name: pet.name,
      pet_type: pet.pet_type,
      breed: pet.breed || '',
      age: pet.age,
      size: pet.size,
      gender: pet.gender,
      description: pet.description,
      health_info: pet.health_info || '',
      vaccinated: pet.vaccinated,
      neutered: pet.neutered,
      special_needs: pet.special_needs || '',
      city: pet.city,
      state: pet.state
    });
    setShowPetModal(true);
  };

  const resetPetForm = () => {
    setEditingPet(null);
    setPetForm({
      name: '',
      pet_type: 'dog',
      breed: '',
      age: 'young',
      size: 'medium',
      gender: 'male',
      description: '',
      health_info: '',
      vaccinated: false,
      neutered: false,
      special_needs: '',
      city: user?.city || '',
      state: user?.state || ''
    });
  };

  const getImageUrl = (photo) => {
    if (!photo) return 'https://images.unsplash.com/photo-1744824838728-59f825fc7da1?crop=entropy&cs=srgb&fm=jpg&ixid=M3w4NjY2NzF8MHwxfHNlYXJjaHwyfHxjdXRlJTIwZG9nJTIwcG9ydHJhaXR8ZW58MHx8fHwxNzc1NjA1NDU2fDA&ixlib=rb-4.1.0&q=85';
    if (photo.startsWith('http')) return photo;
    return `${process.env.REACT_APP_BACKEND_URL}/api/files/${photo}`;
  };

  const statusColors = { available: 'bg-green-100 text-green-700', adopted: 'bg-blue-100 text-blue-700', pending: 'bg-yellow-100 text-yellow-700' };
  const statusLabels = { available: 'Disponível', adopted: 'Adotado', pending: 'Pendente' };
  const adoptionStatusColors = { pending: 'bg-yellow-100 text-yellow-700', approved: 'bg-green-100 text-green-700', rejected: 'bg-red-100 text-red-700' };
  const adoptionStatusLabels = { pending: 'Pendente', approved: 'Aprovada', rejected: 'Rejeitada' };

  const pendingAdoptions = adoptions.filter(a => a.status === 'pending').length;
  const unreadNotifications = notifications.filter(n => !n.read).length;

  return (
    <div className="min-h-screen bg-[#FAFAFA] py-8">
      <div className="container mx-auto px-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#1C1724] flex items-center gap-2">
              <Building className="w-8 h-8 text-[#5A3E85]" />
              {user?.ong_name || 'Dashboard da ONG'}
            </h1>
            <p className="text-[#564F62] mt-1">Gerencie seus pets e solicitações de adoção</p>
          </div>
          <Button 
            onClick={() => { resetPetForm(); setShowPetModal(true); }}
            className="bg-[#5A3E85] hover:bg-[#452C69] text-white rounded-full"
            data-testid="add-pet-btn"
          >
            <Plus className="w-5 h-5 mr-2" />
            Cadastrar Pet
          </Button>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <div className="bg-white border border-[#E4DDF1] rounded-2xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#F3EFFF] rounded-full flex items-center justify-center">
                <PawPrint className="w-5 h-5 text-[#5A3E85]" />
              </div>
              <div>
                <p className="text-xl font-bold text-[#1C1724]">{pets.length}</p>
                <p className="text-xs text-[#564F62]">Total de pets</p>
              </div>
            </div>
          </div>
          <div className="bg-white border border-[#E4DDF1] rounded-2xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-600" />
              </div>
              <div>
                <p className="text-xl font-bold text-[#1C1724]">{pets.filter(p => p.status === 'available').length}</p>
                <p className="text-xs text-[#564F62]">Disponíveis</p>
              </div>
            </div>
          </div>
          <div className="bg-white border border-[#E4DDF1] rounded-2xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center">
                <Clock className="w-5 h-5 text-yellow-600" />
              </div>
              <div>
                <p className="text-xl font-bold text-[#1C1724]">{pendingAdoptions}</p>
                <p className="text-xs text-[#564F62]">Pendentes</p>
              </div>
            </div>
          </div>
          <div className="bg-white border border-[#E4DDF1] rounded-2xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-xl font-bold text-[#1C1724]">{pets.filter(p => p.status === 'adopted').length}</p>
                <p className="text-xs text-[#564F62]">Adotados</p>
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="pets" className="w-full">
          <TabsList className="bg-white border border-[#E4DDF1] rounded-full p-1 mb-6">
            <TabsTrigger value="pets" className="rounded-full data-[state=active]:bg-[#5A3E85] data-[state=active]:text-white" data-testid="pets-tab">
              <PawPrint className="w-4 h-4 mr-2" />
              Meus Pets
            </TabsTrigger>
            <TabsTrigger value="adoptions" className="rounded-full data-[state=active]:bg-[#5A3E85] data-[state=active]:text-white relative" data-testid="adoptions-tab">
              <Users className="w-4 h-4 mr-2" />
              Interessados
              {pendingAdoptions > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">{pendingAdoptions}</span>
              )}
            </TabsTrigger>
            <TabsTrigger value="notifications" className="rounded-full data-[state=active]:bg-[#5A3E85] data-[state=active]:text-white relative" data-testid="ong-notifications-tab">
              <Bell className="w-4 h-4 mr-2" />
              Notificações
              {unreadNotifications > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">{unreadNotifications}</span>
              )}
            </TabsTrigger>
          </TabsList>

          {/* Pets Tab */}
          <TabsContent value="pets">
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
            ) : pets.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {pets.map(pet => (
                  <div key={pet.id} className="bg-white border border-[#E4DDF1] rounded-2xl overflow-hidden">
                    <div className="relative h-40">
                      <img src={getImageUrl(pet.photos?.[0])} alt={pet.name} className="w-full h-full object-cover" onError={(e) => { e.target.src = getImageUrl(null); }} />
                      <Badge className={`absolute top-3 right-3 ${statusColors[pet.status]}`}>{statusLabels[pet.status]}</Badge>
                    </div>
                    <div className="p-4">
                      <h3 className="font-bold text-[#1C1724]">{pet.name}</h3>
                      <p className="text-sm text-[#564F62]">{pet.breed || pet.pet_type} • {pet.age}</p>
                      
                      {/* Photo Upload */}
                      <div className="mt-3">
                        <label className="flex items-center justify-center gap-2 p-2 border border-dashed border-[#E4DDF1] rounded-lg cursor-pointer hover:bg-[#F3EFFF] transition-colors">
                          <Upload className="w-4 h-4 text-[#564F62]" />
                          <span className="text-sm text-[#564F62]">{uploadingPhoto ? 'Enviando...' : 'Adicionar foto'}</span>
                          <input type="file" accept="image/*" className="hidden" onChange={(e) => handlePhotoUpload(e, pet.id)} disabled={uploadingPhoto} />
                        </label>
                      </div>

                      <div className="flex gap-2 mt-3">
                        <Button variant="outline" size="sm" className="flex-1 rounded-full border-[#E4DDF1]" onClick={() => openEditModal(pet)} data-testid={`edit-pet-${pet.id}`}>
                          <Edit className="w-4 h-4 mr-1" /> Editar
                        </Button>
                        <Link to={`/pets/${pet.id}`} className="flex-1">
                          <Button variant="outline" size="sm" className="w-full rounded-full border-[#E4DDF1]">
                            <Eye className="w-4 h-4 mr-1" /> Ver
                          </Button>
                        </Link>
                        <Button variant="outline" size="sm" className="rounded-full border-red-200 text-red-500 hover:bg-red-50" onClick={() => handleDeletePet(pet.id)} data-testid={`delete-pet-${pet.id}`}>
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white border border-[#E4DDF1] rounded-2xl p-12 text-center">
                <PawPrint className="w-16 h-16 text-[#E4DDF1] mx-auto mb-4" />
                <h3 className="text-xl font-bold text-[#1C1724] mb-2">Nenhum pet cadastrado</h3>
                <p className="text-[#564F62] mb-4">Cadastre seu primeiro pet para adoção</p>
                <Button onClick={() => { resetPetForm(); setShowPetModal(true); }} className="bg-[#5A3E85] hover:bg-[#452C69] text-white rounded-full">
                  <Plus className="w-5 h-5 mr-2" /> Cadastrar Pet
                </Button>
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
                {adoptions.map(adoption => (
                  <div key={adoption.id} className="bg-white border border-[#E4DDF1] rounded-2xl p-6">
                    <div className="flex flex-col lg:flex-row gap-4">
                      <div className="w-20 h-20 rounded-xl overflow-hidden flex-shrink-0">
                        <img src={getImageUrl(adoption.pet_photo)} alt={adoption.pet_name} className="w-full h-full object-cover" onError={(e) => { e.target.src = getImageUrl(null); }} />
                      </div>
                      <div className="flex-1">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 mb-2">
                          <h3 className="font-bold text-[#1C1724]">{adoption.pet_name}</h3>
                          <Badge className={adoptionStatusColors[adoption.status]}>{adoptionStatusLabels[adoption.status]}</Badge>
                        </div>
                        <div className="text-sm text-[#564F62] mb-2">
                          <span className="font-medium text-[#1C1724]">Interessado:</span> {adoption.user_name} ({adoption.user_email})
                        </div>
                        <p className="text-sm text-[#564F62] bg-[#F3EFFF] p-3 rounded-lg">{adoption.message}</p>
                        <p className="text-xs text-[#564F62] mt-2">Recebido em {new Date(adoption.created_at).toLocaleDateString('pt-BR')}</p>
                      </div>
                      {adoption.status === 'pending' && (
                        <div className="flex lg:flex-col gap-2">
                          <Button onClick={() => handleAdoptionUpdate(adoption.id, 'approved')} className="flex-1 bg-green-500 hover:bg-green-600 text-white rounded-full" data-testid={`approve-${adoption.id}`}>
                            <CheckCircle className="w-4 h-4 mr-1" /> Aprovar
                          </Button>
                          <Button onClick={() => handleAdoptionUpdate(adoption.id, 'rejected')} variant="outline" className="flex-1 border-red-200 text-red-500 hover:bg-red-50 rounded-full" data-testid={`reject-${adoption.id}`}>
                            <XCircle className="w-4 h-4 mr-1" /> Rejeitar
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="bg-white border border-[#E4DDF1] rounded-2xl p-12 text-center">
                <Users className="w-16 h-16 text-[#E4DDF1] mx-auto mb-4" />
                <h3 className="text-xl font-bold text-[#1C1724] mb-2">Nenhuma solicitação</h3>
                <p className="text-[#564F62]">Ainda não há interessados em seus pets</p>
              </div>
            )}
          </TabsContent>

          {/* Notifications Tab */}
          <TabsContent value="notifications">
            {notifications.length > 0 ? (
              <div className="space-y-3">
                {notifications.map(notif => (
                  <div key={notif.id} className={`bg-white border rounded-xl p-4 ${notif.read ? 'border-[#E4DDF1]' : 'border-[#5A3E85] bg-[#F3EFFF]/50'}`}>
                    <div className="flex items-start gap-3">
                      <div className={`w-2 h-2 rounded-full mt-2 ${notif.read ? 'bg-gray-300' : 'bg-[#5A3E85]'}`} />
                      <div>
                        <h4 className="font-semibold text-[#1C1724]">{notif.title}</h4>
                        <p className="text-sm text-[#564F62]">{notif.message}</p>
                        <p className="text-xs text-[#564F62] mt-1">{new Date(notif.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}</p>
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

      {/* Pet Modal */}
      <Dialog open={showPetModal} onOpenChange={setShowPetModal}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">{editingPet ? 'Editar Pet' : 'Cadastrar Novo Pet'}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handlePetSubmit} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <Label>Nome do Pet *</Label>
                <Input value={petForm.name} onChange={(e) => setPetForm({ ...petForm, name: e.target.value })} placeholder="Ex: Rex" required className="rounded-xl mt-1" data-testid="pet-name-input" />
              </div>
              <div>
                <Label>Tipo *</Label>
                <Select value={petForm.pet_type} onValueChange={(v) => setPetForm({ ...petForm, pet_type: v })}>
                  <SelectTrigger className="mt-1" data-testid="pet-type-select"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="dog">Cachorro</SelectItem>
                    <SelectItem value="cat">Gato</SelectItem>
                    <SelectItem value="bird">Pássaro</SelectItem>
                    <SelectItem value="other">Outro</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Raça</Label>
                <Input value={petForm.breed} onChange={(e) => setPetForm({ ...petForm, breed: e.target.value })} placeholder="Ex: Labrador" className="rounded-xl mt-1" data-testid="pet-breed-input" />
              </div>
              <div>
                <Label>Idade *</Label>
                <Select value={petForm.age} onValueChange={(v) => setPetForm({ ...petForm, age: v })}>
                  <SelectTrigger className="mt-1" data-testid="pet-age-select"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="puppy">Filhote</SelectItem>
                    <SelectItem value="young">Jovem</SelectItem>
                    <SelectItem value="adult">Adulto</SelectItem>
                    <SelectItem value="senior">Idoso</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Porte *</Label>
                <Select value={petForm.size} onValueChange={(v) => setPetForm({ ...petForm, size: v })}>
                  <SelectTrigger className="mt-1" data-testid="pet-size-select"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="small">Pequeno</SelectItem>
                    <SelectItem value="medium">Médio</SelectItem>
                    <SelectItem value="large">Grande</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Sexo *</Label>
                <Select value={petForm.gender} onValueChange={(v) => setPetForm({ ...petForm, gender: v })}>
                  <SelectTrigger className="mt-1" data-testid="pet-gender-select"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Macho</SelectItem>
                    <SelectItem value="female">Fêmea</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label>Cidade *</Label>
                <Input value={petForm.city} onChange={(e) => setPetForm({ ...petForm, city: e.target.value })} placeholder="Ex: São Paulo" required className="rounded-xl mt-1" data-testid="pet-city-input" />
              </div>
              <div>
                <Label>Estado *</Label>
                <Input value={petForm.state} onChange={(e) => setPetForm({ ...petForm, state: e.target.value })} placeholder="Ex: SP" maxLength={2} required className="rounded-xl mt-1" data-testid="pet-state-input" />
              </div>
            </div>

            <div>
              <Label>Descrição *</Label>
              <Textarea value={petForm.description} onChange={(e) => setPetForm({ ...petForm, description: e.target.value })} placeholder="Conte sobre o pet, sua personalidade..." required className="rounded-xl mt-1 min-h-[100px]" data-testid="pet-description-input" />
            </div>

            <div>
              <Label>Informações de Saúde</Label>
              <Textarea value={petForm.health_info} onChange={(e) => setPetForm({ ...petForm, health_info: e.target.value })} placeholder="Condições de saúde, tratamentos..." className="rounded-xl mt-1" data-testid="pet-health-input" />
            </div>

            <div>
              <Label>Necessidades Especiais</Label>
              <Textarea value={petForm.special_needs} onChange={(e) => setPetForm({ ...petForm, special_needs: e.target.value })} placeholder="Cuidados específicos necessários..." className="rounded-xl mt-1" data-testid="pet-special-needs-input" />
            </div>

            <div className="flex gap-6">
              <div className="flex items-center gap-2">
                <Switch checked={petForm.vaccinated} onCheckedChange={(v) => setPetForm({ ...petForm, vaccinated: v })} data-testid="pet-vaccinated-switch" />
                <Label>Vacinado</Label>
              </div>
              <div className="flex items-center gap-2">
                <Switch checked={petForm.neutered} onCheckedChange={(v) => setPetForm({ ...petForm, neutered: v })} data-testid="pet-neutered-switch" />
                <Label>Castrado</Label>
              </div>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowPetModal(false)} className="rounded-full">Cancelar</Button>
              <Button type="submit" disabled={submitting} className="bg-[#5A3E85] hover:bg-[#452C69] text-white rounded-full" data-testid="save-pet-btn">
                {submitting ? 'Salvando...' : (editingPet ? 'Atualizar' : 'Cadastrar')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
