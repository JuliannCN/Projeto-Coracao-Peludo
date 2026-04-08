import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import axios from 'axios';
import { ChevronLeft, Heart, MessageCircle, Send, User, Calendar } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Textarea } from '../components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '../components/ui/avatar';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const categories = [
  { value: 'dicas', label: 'Dicas', color: 'bg-blue-100 text-blue-700' },
  { value: 'curiosidades', label: 'Curiosidades', color: 'bg-purple-100 text-purple-700' },
  { value: 'saude', label: 'Saúde Animal', color: 'bg-green-100 text-green-700' },
  { value: 'adocao', label: 'Adoção Responsável', color: 'bg-orange-100 text-orange-700' }
];

export default function ForumPost() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const [post, setPost] = useState(null);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchPost();
  }, [id]);

  const fetchPost = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const response = await axios.get(`${API}/forum/posts/${id}`, {
        withCredentials: true,
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      setPost(response.data);
    } catch (error) {
      console.error('Error fetching post:', error);
      toast.error('Post não encontrado');
      navigate('/forum');
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async () => {
    if (!isAuthenticated) {
      toast.error('Faça login para curtir');
      return;
    }

    try {
      const token = localStorage.getItem('token');
      const response = await axios.post(`${API}/forum/posts/${id}/like`, {}, {
        withCredentials: true,
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      
      setPost(prev => ({
        ...prev,
        user_liked: response.data.liked,
        likes_count: response.data.liked ? prev.likes_count + 1 : prev.likes_count - 1
      }));
    } catch (error) {
      toast.error('Erro ao curtir');
    }
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      toast.error('Faça login para comentar');
      return;
    }
    
    if (!newComment.trim()) return;

    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/forum/posts/${id}/comments`, 
        { content: newComment },
        {
          withCredentials: true,
          headers: token ? { Authorization: `Bearer ${token}` } : {}
        }
      );
      
      setNewComment('');
      fetchPost(); // Refresh to get new comment
      toast.success('Comentário adicionado!');
    } catch (error) {
      toast.error('Erro ao comentar');
    } finally {
      setSubmitting(false);
    }
  };

  const getCategoryInfo = (categoryValue) => {
    return categories.find(c => c.value === categoryValue) || categories[0];
  };

  const getImageUrl = (photo) => {
    if (!photo) return null;
    if (photo.startsWith('http')) return photo;
    return `${process.env.REACT_APP_BACKEND_URL}/api/files/${photo}`;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] py-8">
        <div className="container mx-auto px-6 max-w-3xl">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-3/4" />
            <div className="h-4 bg-gray-200 rounded w-full" />
            <div className="h-4 bg-gray-200 rounded w-2/3" />
          </div>
        </div>
      </div>
    );
  }

  if (!post) return null;

  const categoryInfo = getCategoryInfo(post.category);

  return (
    <div className="min-h-screen bg-[#FAFAFA] py-8">
      <div className="container mx-auto px-6 max-w-3xl">
        {/* Back Button */}
        <Button
          variant="ghost"
          onClick={() => navigate('/forum')}
          className="mb-6 text-[#564F62] hover:text-[#5A3E85]"
          data-testid="back-to-forum"
        >
          <ChevronLeft className="w-5 h-5 mr-1" />
          Voltar ao Fórum
        </Button>

        {/* Post Content */}
        <article className="bg-white border border-[#E4DDF1] rounded-2xl p-8 mb-6">
          {/* Header */}
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <Badge className={categoryInfo.color}>{categoryInfo.label}</Badge>
            <span className="text-sm text-[#564F62] flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              {new Date(post.created_at).toLocaleDateString('pt-BR', {
                day: '2-digit',
                month: 'long',
                year: 'numeric'
              })}
            </span>
          </div>

          {/* Title */}
          <h1 className="text-2xl sm:text-3xl font-bold text-[#1C1724] mb-4" data-testid="post-title">
            {post.title}
          </h1>

          {/* Author */}
          <div className="flex items-center gap-3 mb-6 pb-6 border-b border-[#E4DDF1]">
            <Avatar className="w-10 h-10">
              <AvatarImage src={getImageUrl(post.author_avatar)} />
              <AvatarFallback className="bg-[#F3EFFF] text-[#5A3E85]">
                {post.author_name?.charAt(0)?.toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium text-[#1C1724]">{post.author_name}</p>
              <p className="text-sm text-[#564F62]">Autor</p>
            </div>
          </div>

          {/* Content */}
          <div className="prose prose-gray max-w-none mb-6">
            <p className="text-[#564F62] leading-relaxed whitespace-pre-wrap" data-testid="post-content">
              {post.content}
            </p>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-4 pt-6 border-t border-[#E4DDF1]">
            <Button
              variant="outline"
              onClick={handleLike}
              className={`rounded-full ${post.user_liked ? 'bg-red-50 border-red-200 text-red-500' : 'border-[#E4DDF1]'}`}
              data-testid="like-btn"
            >
              <Heart className={`w-5 h-5 mr-2 ${post.user_liked ? 'fill-red-500' : ''}`} />
              {post.likes_count} {post.likes_count === 1 ? 'curtida' : 'curtidas'}
            </Button>
            <div className="flex items-center gap-2 text-[#564F62]">
              <MessageCircle className="w-5 h-5" />
              {post.comments?.length || 0} {post.comments?.length === 1 ? 'comentário' : 'comentários'}
            </div>
          </div>
        </article>

        {/* Comments Section */}
        <section className="bg-white border border-[#E4DDF1] rounded-2xl p-8">
          <h2 className="text-xl font-bold text-[#1C1724] mb-6">
            Comentários ({post.comments?.length || 0})
          </h2>

          {/* New Comment Form */}
          {isAuthenticated ? (
            <form onSubmit={handleComment} className="mb-6">
              <div className="flex gap-3">
                <Avatar className="w-10 h-10 flex-shrink-0">
                  <AvatarImage src={getImageUrl(user?.avatar_url)} />
                  <AvatarFallback className="bg-[#F3EFFF] text-[#5A3E85]">
                    {user?.name?.charAt(0)?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <Textarea
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Escreva um comentário..."
                    className="rounded-xl mb-2"
                    data-testid="comment-input"
                  />
                  <Button
                    type="submit"
                    disabled={submitting || !newComment.trim()}
                    className="bg-[#5A3E85] hover:bg-[#452C69] text-white rounded-full"
                    data-testid="submit-comment-btn"
                  >
                    <Send className="w-4 h-4 mr-2" />
                    {submitting ? 'Enviando...' : 'Comentar'}
                  </Button>
                </div>
              </div>
            </form>
          ) : (
            <div className="bg-[#F3EFFF] rounded-xl p-4 mb-6 text-center">
              <p className="text-[#564F62]">
                <Link to="/auth?mode=login" className="text-[#5A3E85] font-medium hover:underline">
                  Faça login
                </Link>
                {' '}para comentar
              </p>
            </div>
          )}

          {/* Comments List */}
          {post.comments && post.comments.length > 0 ? (
            <div className="space-y-4">
              {post.comments.map(comment => (
                <div key={comment.id} className="flex gap-3 p-4 bg-[#FAFAFA] rounded-xl">
                  <Avatar className="w-10 h-10 flex-shrink-0">
                    <AvatarImage src={getImageUrl(comment.author_avatar)} />
                    <AvatarFallback className="bg-[#F3EFFF] text-[#5A3E85]">
                      {comment.author_name?.charAt(0)?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium text-[#1C1724]">{comment.author_name}</span>
                      <span className="text-xs text-[#564F62]">
                        {new Date(comment.created_at).toLocaleDateString('pt-BR', {
                          day: '2-digit',
                          month: 'short'
                        })}
                      </span>
                    </div>
                    <p className="text-[#564F62]">{comment.content}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <MessageCircle className="w-12 h-12 text-[#E4DDF1] mx-auto mb-3" />
              <p className="text-[#564F62]">Seja o primeiro a comentar!</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
