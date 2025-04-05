'use client';

import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ChevronRightIcon, MagnifyingGlassIcon } from '@heroicons/react/24/outline';

// Dados simulados de posts do blog
const blogPosts = [
  {
    id: 1,
    title: 'Os 10 principais avanços da cardiologia em 2023',
    excerpt: 'Descubra as inovações mais recentes que estão transformando o tratamento de doenças cardíacas.',
    category: 'Cardiologia',
    author: 'Dr. João Silva',
    date: '10 de abril de 2023',
    imageUrl: 'https://images.unsplash.com/photo-1576091160550-2173dba999ef?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    readTime: '5 min'
  },
  {
    id: 2,
    title: 'Como a telemedicina está revolucionando o atendimento médico',
    excerpt: 'A pandemia acelerou a adoção da telemedicina, trazendo benefícios tanto para médicos quanto para pacientes.',
    category: 'Telemedicina',
    author: 'Dra. Maria Santos',
    date: '25 de março de 2023',
    imageUrl: 'https://images.unsplash.com/photo-1622253692010-333f2da6031d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    readTime: '7 min'
  },
  {
    id: 3,
    title: 'Alimentação saudável e seu impacto na prevenção de doenças',
    excerpt: 'Uma dieta balanceada é fundamental para prevenir diversos problemas de saúde. Confira as recomendações atuais.',
    category: 'Nutrição',
    author: 'Dr. Paulo Mendes',
    date: '15 de fevereiro de 2023',
    imageUrl: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    readTime: '4 min'
  },
  {
    id: 4,
    title: 'Inteligência Artificial aplicada ao diagnóstico médico',
    excerpt: 'Novos algoritmos estão ajudando médicos a identificar doenças com maior precisão e rapidez.',
    category: 'Tecnologia',
    author: 'Dra. Ana Oliveira',
    date: '3 de janeiro de 2023',
    imageUrl: 'https://images.unsplash.com/photo-1581093458791-9a03e45b9f2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    readTime: '6 min'
  },
  {
    id: 5,
    title: 'Saúde mental: por que devemos falar mais sobre isso?',
    excerpt: 'A importância de dar atenção à saúde mental e os benefícios de buscar ajuda profissional.',
    category: 'Saúde Mental',
    author: 'Dr. Ricardo Almeida',
    date: '12 de dezembro de 2022',
    imageUrl: 'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
    readTime: '8 min'
  },
];

// Categorias para filtro
const categories = [
  'Todas',
  'Cardiologia', 
  'Telemedicina', 
  'Nutrição', 
  'Tecnologia', 
  'Saúde Mental'
];

export default function BlogPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todas');
  
  // Filtrar posts com base na pesquisa e categoria
  const filteredPosts = blogPosts.filter(post => {
    const matchesSearch = post.title.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         post.excerpt.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === 'Todas' || post.category === selectedCategory;
    
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-800 via-blue-700 to-blue-900">
      {/* Elementos decorativos */}
      <div className="absolute top-20 left-10 w-80 h-80 bg-blue-500/20 rounded-full blur-3xl -z-10" />
      <div className="absolute bottom-20 right-10 w-80 h-80 bg-indigo-500/20 rounded-full blur-3xl -z-10" />

      {/* Header */}
      <div className="relative pt-16 pb-20">
        <div className="container mx-auto px-4">
          <h1 className="text-3xl md:text-4xl font-bold mb-4 text-white">Blog Med1</h1>
          <p className="text-blue-100 max-w-2xl opacity-90">
            Artigos, dicas e novidades sobre medicina, tecnologia e saúde para profissionais e pacientes.
          </p>
        </div>
      </div>
      
      {/* Search and Filter Section */}
      <div className="container mx-auto px-4 py-8">
        <div className="bg-white/10 backdrop-blur-sm border border-white/30 rounded-xl p-6">
          <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
            {/* Search */}
            <div className="relative w-full md:max-w-md">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-blue-200" />
              <Input
                type="text"
                placeholder="Buscar artigos..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 bg-white/10 backdrop-blur-sm border-2 border-white/30 text-white placeholder:text-blue-200/60 focus:ring-2 focus:ring-white/50 focus:border-transparent"
              />
            </div>
            
            {/* Categories */}
            <div className="flex flex-wrap gap-2 w-full md:w-auto justify-center md:justify-end">
              {categories.map((category) => (
                <Button
                  key={category}
                  variant="outline"
                  size="sm"
                  onClick={() => setSelectedCategory(category)}
                  className={`${
                    selectedCategory === category 
                      ? 'bg-blue-600/30 text-white border-blue-400/30' 
                      : 'bg-white/10 text-blue-100 border-white/20 hover:bg-blue-600/20 hover:text-white'
                  }`}
                >
                  {category}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </div>
      
      {/* Blog Posts Grid */}
      <div className="container mx-auto px-4 py-6 mb-12">
        {filteredPosts.length === 0 ? (
          <div className="text-center py-12 bg-white/10 backdrop-blur-sm border border-white/30 rounded-xl p-8">
            <h3 className="text-lg font-medium text-white">Nenhum artigo encontrado</h3>
            <p className="text-blue-100/80 mt-2">Tente ajustar sua busca ou categoria.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {filteredPosts.map((post) => (
              <Card key={post.id} className="overflow-hidden border-0 shadow-lg bg-white/10 backdrop-blur-sm hover:shadow-xl transition-all hover:scale-[1.02] hover:bg-white/15">
                <div className="relative h-48 w-full">
                  <Image
                    src={post.imageUrl}
                    alt={post.title}
                    fill
                    sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-blue-900/80 via-transparent to-transparent" />
                  <div className="absolute top-3 left-3">
                    <span className="bg-blue-500/80 backdrop-blur-sm text-white text-xs font-medium px-2.5 py-1 rounded-full">
                      {post.category}
                    </span>
                  </div>
                </div>
                <CardContent className="p-6">
                  <div className="flex justify-between items-center text-sm text-blue-200/80 mb-3">
                    <span>{post.date}</span>
                    <span>{post.readTime} de leitura</span>
                  </div>
                  <h3 className="text-xl font-semibold text-white mb-2 line-clamp-2">{post.title}</h3>
                  <p className="text-blue-100/80 mb-4 line-clamp-3">{post.excerpt}</p>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-blue-200">{post.author}</span>
                    <Link 
                      href={`/blog/post/${post.id}`} 
                      className="text-blue-200 hover:text-white flex items-center text-sm font-medium"
                    >
                      Ler mais
                      <ChevronRightIcon className="h-4 w-4 ml-1" />
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
      
      {/* Newsletter */}
      <div className="relative py-16">
        <div className="container mx-auto px-4">
          <div className="max-w-2xl mx-auto text-center bg-white/10 backdrop-blur-sm border border-white/30 rounded-xl p-8">
            <h2 className="text-2xl font-bold text-white mb-4">Receba nossas atualizações</h2>
            <p className="text-blue-100/80 mb-6">
              Inscreva-se para receber os novos artigos diretamente em seu email.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 max-w-md mx-auto">
              <Input 
                type="email" 
                placeholder="Seu melhor email" 
                className="bg-white/10 backdrop-blur-sm border-2 border-white/30 text-white placeholder:text-blue-200/60 focus:ring-2 focus:ring-white/50 focus:border-transparent"
              />
              <Button className="bg-white text-blue-700 hover:bg-white/90 transition-colors">
                Inscrever-se
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Footer */}
      <div className="border-t border-blue-500/20 py-6">
        <div className="container mx-auto px-4 text-center text-sm text-blue-200/80">
          <p>© {new Date().getFullYear()} Med1 | Todos os direitos reservados</p>
        </div>
      </div>
    </div>
  );
} 