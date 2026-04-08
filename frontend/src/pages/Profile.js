import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { User, Mail, Phone, MapPin, Building, Camera, Save, Loader2 } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function Profile() {
  const navigate = useNavigate();
  const { user, updateUser, isAuthenticated } = useAuth();
  const [loading, setLoading] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    city: '',
    state: '',
    ong_name: '',
    description: ''
  });

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/auth?mode=login');
      return;
    }
    
    if (user) {
      setFormData({
        name: user.name || '',
        phone: user.phone || '',
        city: user.city || '',
        state: user.state || '',
        ong_name: user.ong_name || '',
        description: user.description || ''
      });
    }
  }, [user, isAuthenticated, navigate]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const token = localStorage.getItem('token');
      await axios.put(`${API}/users/profile`, formData, {
        withCredentials: true,
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      
      updateUser(formData);
      toast.success('Perfil atualizado com sucesso!');
    } catch (error) {
      toast.error('Erro ao atualizar perfil');
    } finally {
      setLoading(false);
    }
  };

  const handleAvatarUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingAvatar(true);
    const formData = new FormData();
    formData.append('file', file);

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API}/users/avatar`, formData, {
        withCredentials: true,
        headers: {
          'Content-Type': 'multipart/form-data',
          ...(token ? { Authorization: `Bearer ${token}` } : {})
        }
      });
      
      updateUser({ avatar_url: response.data.path });
      toast.success('Foto atualizada!');
    } catch (error) {
      toast.error('Erro ao enviar foto');
    } finally {
      setUploadingAvatar(false);
    }
  };

  const getImageUrl = (photo) => {
    if (!photo) return null;
    if (photo.startsWith('http')) return photo;
    return `${process.env.REACT_APP_BACKEND_URL}/api/files/${photo}`;
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] py-8">
      <div className="container mx-auto px-6 max-w-2xl">
        <h1 className="text-2xl sm:text-3xl font-bold text-[#1C1724] mb-8">Meu Perfil</h1>

        <div className="bg-white border border-[#E4DDF1] rounded-2xl p-8">
          {/* Avatar Section */}
          <div className="flex flex-col items-center mb-8">
            <div className="relative">
              <Avatar className="w-24 h-24">
                <AvatarImage src={getImageUrl(user?.avatar_url)} />
                <AvatarFallback className="bg-[#5A3E85] text-white text-2xl">
                  {user?.name?.charAt(0)?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <label className="absolute bottom-0 right-0 w-8 h-8 bg-[#5A3E85] rounded-full flex items-center justify-center cursor-pointer hover:bg-[#452C69] transition-colors">
                {uploadingAvatar ? (
                  <Loader2 className="w-4 h-4 text-white animate-spin" />
                ) : (
                  <Camera className="w-4 h-4 text-white" />
                )}
                <input 
                  type="file" 
                  accept="image/*" 
                  className="hidden" 
                  onChange={handleAvatarUpload}
                  disabled={uploadingAvatar}
                />
              </label>
            </div>
            <p className="text-sm text-[#564F62] mt-2">Clique para alterar a foto</p>
          </div>

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Email (read-only) */}
            <div>
              <Label className="flex items-center gap-2 text-[#1C1724]">
                <Mail className="w-4 h-4" /> Email
              </Label>
              <Input 
                value={user?.email || ''} 
                disabled 
                className="rounded-xl mt-1 bg-[#F3EFFF]" 
              />
              <p className="text-xs text-[#564F62] mt-1">O email não pode ser alterado</p>
            </div>

            {/* Name */}
            <div>
              <Label className="flex items-center gap-2 text-[#1C1724]">
                <User className="w-4 h-4" /> Nome
              </Label>
              <Input 
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="rounded-xl mt-1" 
                data-testid="profile-name"
              />
            </div>

            {/* Phone */}
            <div>
              <Label className="flex items-center gap-2 text-[#1C1724]">
                <Phone className="w-4 h-4" /> Telefone
              </Label>
              <Input 
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder="(00) 00000-0000"
                className="rounded-xl mt-1" 
                data-testid="profile-phone"
              />
            </div>

            {/* Location */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="flex items-center gap-2 text-[#1C1724]">
                  <MapPin className="w-4 h-4" /> Cidade
                </Label>
                <Input 
                  name="city"
                  value={formData.city}
                  onChange={handleChange}
                  className="rounded-xl mt-1" 
                  data-testid="profile-city"
                />
              </div>
              <div>
                <Label className="text-[#1C1724]">Estado</Label>
                <Input 
                  name="state"
                  value={formData.state}
                  onChange={handleChange}
                  maxLength={2}
                  placeholder="UF"
                  className="rounded-xl mt-1" 
                  data-testid="profile-state"
                />
              </div>
            </div>

            {/* ONG Fields */}
            {user?.user_type === 'ong' && (
              <>
                <div>
                  <Label className="flex items-center gap-2 text-[#1C1724]">
                    <Building className="w-4 h-4" /> Nome da ONG
                  </Label>
                  <Input 
                    name="ong_name"
                    value={formData.ong_name}
                    onChange={handleChange}
                    className="rounded-xl mt-1" 
                    data-testid="profile-ong-name"
                  />
                </div>

                <div>
                  <Label className="text-[#1C1724]">Descrição da ONG</Label>
                  <Textarea 
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Conte sobre sua ONG..."
                    className="rounded-xl mt-1 min-h-[100px]" 
                    data-testid="profile-description"
                  />
                </div>
              </>
            )}

            <Button 
              type="submit" 
              disabled={loading}
              className="w-full bg-[#5A3E85] hover:bg-[#452C69] text-white rounded-full py-3"
              data-testid="save-profile-btn"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="w-5 h-5 mr-2" />
                  Salvar Alterações
                </>
              )}
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}
