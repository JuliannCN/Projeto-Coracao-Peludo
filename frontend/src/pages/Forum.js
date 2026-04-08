import { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import axios from 'axios';
import { MessageSquare, Plus, Search, Heart, MessageCircle, Filter, ChevronRight, User } from 'lucide-react';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'sonner';

const API = `${process.env.REACT_APP_BACKEND_URL}/api`;

const categories = [
  { value: 'dicas', label: 'Dicas', color: 'bg-blue-100 text-blue-700' },
  { value: 'curiosidades', label: 'Curiosidades', color: 'bg-purple-100 text-purple-700' },
  { value: 'saude', label: 'Saúde Animal', color: 'bg-green-100 text-green-700' },
  { value: 'adocao', label: 'Adoção Responsável', color: 'bg-orange-100 text-orange-700' }
];

export default function Forum() {
  const { user, isAuthenticated } = useAuth();
  const [searchParams, setSearchParams] = useSearchParams();
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState(searchParams.get('category') || '');
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewPostModal, setShowNewPostModal] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [newPost, setNewPost] = useState({ title: '', content: '', category: 'dicas' });

  useEffect(() => {
    fetchPosts();
  }, [selectedCategory]);

  const fetchPosts = async () => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (selectedCategory) params.append('category', selectedCategory);
      if (searchQuery) params.append('search', searchQuery);
      
      const response = await axios.get(`${API}/forum/posts?${params.toString()}`);
      setPosts(response.data.posts || []);
    } catch (error) {
      console.error('Error fetching posts:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchPosts();
  };

  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
    if (category) {
      setSearchParams({ category });
    } else {
      setSearchParams({});
    }
  };

  const handleCreatePost = async (e) => {
    e.preventDefault();
    if (!isAuthenticated) {
      toast.error('Faça login para criar um post');
      return;
    }

    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      await axios.post(`${API}/forum/posts`, newPost, {
        withCredentials: true,
        headers: token ? { Authorization: `Bearer ${token}` } : {}
      });
      toast.success('Post criado com sucesso!');
      setShowNewPostModal(false);
      setNewPost({ title: '', content: '', category: 'dicas' });
      fetchPosts();
    } catch (error) {
      toast.error('Erro ao criar post');
    } finally {
      setSubmitting(false);
    }
  };

  const getCategoryInfo = (categoryValue) => {
    return categories.find(c => c.value === categoryValue) || categories[0];
  };

  return (
    <div className="min-h-screen bg-[#FAFAFA] py-8">
      <div className="container mx-auto px-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#1C1724] flex items-center gap-3">
              <MessageSquare className="w-8 h-8 text-[#5A3E85]" />
              Fórum da Comunidade
            </h1>
            <p className="text-[#564F62] mt-1">Compartilhe dicas, dúvidas e experiências</p>
          </div>
          <Button 
            onClick={() => {
              if (!isAuthenticated) {
                toast.error('Faça login para criar um post');
                return;
              }
              setShowNewPostModal(true);
            }}
            className="bg-[#5A3E85] hover:bg-[#452C69] text-white rounded-full"
            data-testid="new-post-btn"
          >
            <Plus className="w-5 h-5 mr-2" />
            Novo Post
          </Button>
        </div>

        {/* Search and Filter */}
        <div className="bg-white border border-[#E4DDF1] rounded-2xl p-6 mb-8">
          <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#564F62]" />
              <Input
                placeholder="Buscar posts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 rounded-xl"
                data-testid="search-posts"
              />
            </div>
            <Button type="submit" className="bg-[#5A3E85] hover:bg-[#452C69] text-white rounded-full">
              Buscar
            </Button>
          </form>
        </div>

        {/* Categories */}
        <div className="flex flex-wrap gap-3 mb-8">
          <Button
            variant={selectedCategory === '' ? 'default' : 'outline'}
            onClick={() => handleCategoryChange('')}
            className={`rounded-full ${selectedCategory === '' ? 'bg-[#5A3E85] text-white' : 'border-[#E4DDF1]'}`}
            data-testid="category-all"
          >
            Todos
          </Button>
          {categories.map(cat => (
            <Button
              key={cat.value}
              variant={selectedCategory === cat.value ? 'default' : 'outline'}
              onClick={() => handleCategoryChange(cat.value)}
              className={`rounded-full ${selectedCategory === cat.value ? 'bg-[#5A3E85] text-white' : 'border-[#E4DDF1]'}`}
              data-testid={`category-${cat.value}`}
            >
              {cat.label}
            </Button>
          ))}
        </div>

        {/* Posts List */}
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="bg-white border border-[#E4DDF1] rounded-2xl p-6 animate-pulse">
                <div className="h-6 bg-gray-200 rounded w-3/4 mb-3" />
                <div className="h-4 bg-gray-200 rounded w-full mb-2" />
                <div className="h-4 bg-gray-200 rounded w-2/3" />
              </div>
            ))}
          </div>
        ) : posts.length > 0 ? (
          <div className="space-y-4">
            {posts.map(post => {
              const categoryInfo = getCategoryInfo(post.category);
              return (
                <Link 
                  key={post.id} 
                  to={`/forum/${post.id}`}
                  className="block bg-white border border-[#E4DDF1] rounded-2xl p-6 hover:border-[#5A3E85] transition-colors"
                  data-testid={`post-${post.id}`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-start gap-4">
                    <div className="flex-1">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <Badge className={categoryInfo.color}>{categoryInfo.label}</Badge>
                        <span className="text-xs text-[#564F62]">
                          {new Date(post.created_at).toLocaleDateString('pt-BR')}
                        </span>
                      </div>
                      <h3 className="text-lg font-bold text-[#1C1724] mb-2">{post.title}</h3>
                      <p className="text-[#564F62] line-clamp-2">{post.content}</p>
                      <div className="flex items-center gap-4 mt-4 text-sm text-[#564F62]">
                        <div className="flex items-center gap-1">
                          <User className="w-4 h-4" />
                          {post.author_name}
                        </div>
                        <div className="flex items-center gap-1">
                          <MessageCircle className="w-4 h-4" />
                          {post.comments_count} comentários
                        </div>
                        <div className="flex items-center gap-1">
                          <Heart className="w-4 h-4" />
                          {post.likes_count} curtidas
                        </div>
                      </div>
                    </div>
                    <ChevronRight className="w-5 h-5 text-[#564F62] hidden sm:block" />
                  </div>
                </Link>
              );
            })}
          </div>
        ) : (
          <div className="bg-white border border-[#E4DDF1] rounded-2xl p-12 text-center">
            <MessageSquare className="w-16 h-16 text-[#E4DDF1] mx-auto mb-4" />
            <h3 className="text-xl font-bold text-[#1C1724] mb-2">Nenhum post encontrado</h3>
            <p className="text-[#564F62] mb-4">Seja o primeiro a compartilhar algo!</p>
            {isAuthenticated && (
              <Button 
                onClick={() => setShowNewPostModal(true)}
                className="bg-[#5A3E85] hover:bg-[#452C69] text-white rounded-full"
              >
                <Plus className="w-5 h-5 mr-2" />
                Criar Post
              </Button>
            )}
          </div>
        )}
      </div>

      {/* New Post Modal */}
      <Dialog open={showNewPostModal} onOpenChange={setShowNewPostModal}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-xl font-bold">Criar Novo Post</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleCreatePost} className="space-y-4">
            <div>
              <Label>Título *</Label>
              <Input
                value={newPost.title}
                onChange={(e) => setNewPost({ ...newPost, title: e.target.value })}
                placeholder="Título do seu post"
                required
                className="rounded-xl mt-1"
                data-testid="post-title-input"
              />
            </div>
            <div>
              <Label>Categoria *</Label>
              <Select 
                value={newPost.category} 
                onValueChange={(v) => setNewPost({ ...newPost, category: v })}
              >
                <SelectTrigger className="mt-1" data-testid="post-category-select">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(cat => (
                    <SelectItem key={cat.value} value={cat.value}>{cat.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Conteúdo *</Label>
              <Textarea
                value={newPost.content}
                onChange={(e) => setNewPost({ ...newPost, content: e.target.value })}
                placeholder="Escreva seu post aqui..."
                required
                className="rounded-xl mt-1 min-h-[150px]"
                data-testid="post-content-input"
              />
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowNewPostModal(false)} className="rounded-full">
                Cancelar
              </Button>
              <Button 
                type="submit" 
                disabled={submitting}
                className="bg-[#5A3E85] hover:bg-[#452C69] text-white rounded-full"
                data-testid="submit-post-btn"
              >
                {submitting ? 'Publicando...' : 'Publicar'}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
