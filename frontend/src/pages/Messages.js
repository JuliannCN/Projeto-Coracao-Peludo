import { useState, useEffect, useRef } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { ChevronLeft, Send, MessageCircle, PawPrint } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

export default function Messages() {
  const { partnerId } = useParams();
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [conversations, setConversations] = useState([]);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [selectedPartner, setSelectedPartner] = useState(null);
  const messagesEndRef = useRef(null);

  const petId = searchParams.get('pet');

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/auth?mode=login');
      return;
    }
    fetchConversations();
  }, [isAuthenticated]);

  useEffect(() => {
    if (partnerId) {
      fetchMessages(partnerId);
    }
  }, [partnerId]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const fetchConversations = async () => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/messages`, {
        withCredentials: true,
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      setConversations(response.data);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching conversations:', error);
      setLoading(false);
    }
  };

  const fetchMessages = async (pId) => {
    try {
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/messages/${pId}`, {
        withCredentials: true,
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      setMessages(response.data);
      
      // Set selected partner info
      const conv = conversations.find(c => c.partner_id === pId);
      if (conv) {
        setSelectedPartner({ id: pId, name: conv.partner_name });
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !partnerId) return;

    setSending(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/messages`, {
        receiver_id: partnerId,
        content: newMessage,
        pet_id: petId
      }, {
        withCredentials: true,
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });

      setNewMessage('');
      fetchMessages(partnerId);
      fetchConversations();
    } catch (error) {
      toast.error('Erro ao enviar mensagem');
    } finally {
      setSending(false);
    }
  };

  const selectConversation = (conv) => {
    setSelectedPartner({ id: conv.partner_id, name: conv.partner_name });
    navigate(`/messages/${conv.partner_id}`);
  };

  const getImageUrl = (photo) => {
    if (!photo) return null;
    if (photo.startsWith('http')) return photo;
    return `${process.env.REACT_APP_BACKEND_URL}/api/files/${photo}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] flex items-center justify-center">
        <div className="animate-pulse text-[#564F62]">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAFAFA]">
      <div className="container mx-auto px-0 sm:px-6 py-0 sm:py-8">
        <div className="bg-white border-0 sm:border border-[#E4DDF1] sm:rounded-2xl overflow-hidden flex h-[calc(100vh-4rem)] sm:h-[calc(100vh-8rem)]">
          {/* Conversations List */}
          <div className={`w-full sm:w-80 border-r border-[#E4DDF1] flex flex-col ${partnerId ? 'hidden sm:flex' : 'flex'}`}>
            <div className="p-4 border-b border-[#E4DDF1]">
              <h2 className="text-lg font-bold text-[#1C1724] flex items-center gap-2">
                <MessageCircle className="w-5 h-5 text-[#5A3E85]" />
                Mensagens
              </h2>
            </div>
            
            <div className="flex-1 overflow-y-auto">
              {conversations.length > 0 ? (
                conversations.map(conv => (
                  <button
                    key={conv.partner_id}
                    onClick={() => selectConversation(conv)}
                    className={`w-full p-4 text-left hover:bg-[#F3EFFF] transition-colors border-b border-[#E4DDF1] ${
                      partnerId === conv.partner_id ? 'bg-[#F3EFFF]' : ''
                    }`}
                    data-testid={`conversation-${conv.partner_id}`}
                  >
                    <div className="flex items-center gap-3">
                      <Avatar className="w-12 h-12">
                        <AvatarFallback className="bg-[#5A3E85] text-white">
                          {conv.partner_name?.charAt(0)?.toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="font-medium text-[#1C1724] truncate">{conv.partner_name}</p>
                          {conv.unread_count > 0 && (
                            <span className="w-5 h-5 bg-[#5A3E85] text-white text-xs rounded-full flex items-center justify-center">
                              {conv.unread_count}
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-[#564F62] truncate">{conv.last_message}</p>
                      </div>
                    </div>
                  </button>
                ))
              ) : (
                <div className="p-8 text-center">
                  <MessageCircle className="w-12 h-12 text-[#E4DDF1] mx-auto mb-3" />
                  <p className="text-[#564F62]">Nenhuma conversa ainda</p>
                </div>
              )}
            </div>
          </div>

          {/* Chat Area */}
          <div className={`flex-1 flex flex-col ${!partnerId ? 'hidden sm:flex' : 'flex'}`}>
            {partnerId ? (
              <>
                {/* Chat Header */}
                <div className="p-4 border-b border-[#E4DDF1] flex items-center gap-3">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="sm:hidden"
                    onClick={() => navigate('/messages')}
                  >
                    <ChevronLeft className="w-5 h-5" />
                  </Button>
                  <Avatar className="w-10 h-10">
                    <AvatarFallback className="bg-[#5A3E85] text-white">
                      {selectedPartner?.name?.charAt(0)?.toUpperCase() || '?'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="font-medium text-[#1C1724]">{selectedPartner?.name || 'Conversa'}</p>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {messages.map(msg => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.is_mine ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`max-w-[75%] rounded-2xl p-4 ${
                        msg.is_mine 
                          ? 'bg-[#5A3E85] text-white rounded-br-none' 
                          : 'bg-[#F3EFFF] text-[#1C1724] rounded-bl-none'
                      }`}>
                        {msg.pet_name && (
                          <div className={`text-xs mb-1 flex items-center gap-1 ${msg.is_mine ? 'text-white/70' : 'text-[#564F62]'}`}>
                            <PawPrint className="w-3 h-3" />
                            Sobre: {msg.pet_name}
                          </div>
                        )}
                        <p>{msg.content}</p>
                        <p className={`text-xs mt-1 ${msg.is_mine ? 'text-white/70' : 'text-[#564F62]'}`}>
                          {new Date(msg.created_at).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                    </div>
                  ))}
                  <div ref={messagesEndRef} />
                </div>

                {/* Message Input */}
                <form onSubmit={handleSend} className="p-4 border-t border-[#E4DDF1]">
                  <div className="flex gap-2">
                    <Input
                      value={newMessage}
                      onChange={(e) => setNewMessage(e.target.value)}
                      placeholder="Digite sua mensagem..."
                      className="flex-1 rounded-full"
                      data-testid="message-input"
                    />
                    <Button
                      type="submit"
                      disabled={sending || !newMessage.trim()}
                      className="bg-[#5A3E85] hover:bg-[#452C69] text-white rounded-full"
                      data-testid="send-message-btn"
                    >
                      <Send className="w-5 h-5" />
                    </Button>
                  </div>
                </form>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <MessageCircle className="w-16 h-16 text-[#E4DDF1] mx-auto mb-4" />
                  <p className="text-[#564F62]">Selecione uma conversa</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
