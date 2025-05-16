'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import ReactMarkdown from 'react-markdown';
import Navigation from '@/components/Navigation';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function IAPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const newMessage: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, newMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [...messages, newMessage] }),
      });

      if (!response.ok) throw new Error(response.statusText);

      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let assistantMessage = '';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const chunk = decoder.decode(value);
          assistantMessage += chunk;
          
          setMessages(prev => {
            const newMessages = [...prev];
            if (newMessages[newMessages.length - 1]?.role === 'assistant') {
              newMessages[newMessages.length - 1].content = assistantMessage;
            } else {
              newMessages.push({ role: 'assistant', content: assistantMessage });
            }
            return newMessages;
          });
        }
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Navigation />
      <div className="min-h-[100dvh] bg-gray-50 pb-24 lg:pb-16 lg:ml-16">
        <div className="container mx-auto px-2 max-w-full pt-20 lg:pt-8">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Assistente Financeiro IA</h2>
              <p className="text-sm text-gray-600 mt-1">Análise inteligente dos dados financeiros</p>
            </div>
          </div>

          <Card className="bg-white border-0 shadow-sm hover:shadow-md transition-all duration-300">
            <div className="p-6">
              <div className="space-y-4 mb-6">
                {messages.map((message, index) => (
                  <Card key={index} className={`p-4 ${
                    message.role === 'user' 
                      ? 'bg-sky-50 border border-sky-100' 
                      : 'bg-emerald-50 border border-emerald-100'
                  }`}>
                    <div className="font-medium mb-2 text-sm">
                      {message.role === 'user' ? 'Você' : 'Assistente'}:
                    </div>
                    <ReactMarkdown className="prose max-w-none">
                      {message.content}
                    </ReactMarkdown>
                  </Card>
                ))}
                {isLoading && (
                  <div className="flex items-center space-x-2 text-gray-500 p-4">
                    <div className="animate-pulse">Pensando...</div>
                  </div>
                )}
              </div>

              <form onSubmit={sendMessage} className="flex space-x-3">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Digite sua pergunta sobre os dados financeiros..."
                  className="flex-1 px-4 py-2.5 border rounded-lg focus:outline-none focus:ring-2 focus:ring-sky-500 bg-gray-50"
                  disabled={isLoading}
                />
                <button
                  type="submit"
                  disabled={isLoading}
                  className={`px-6 py-2.5 rounded-lg text-white font-medium transition-colors ${
                    isLoading
                      ? 'bg-gray-400'
                      : 'bg-sky-500 hover:bg-sky-600'
                  }`}
                >
                  Enviar
                </button>
              </form>
            </div>
          </Card>

          <Card className="mt-6 bg-white border-0 shadow-sm p-6">
            <h3 className="font-semibold text-gray-800 mb-4">Sugestões de perguntas</h3>
            <ul className="space-y-3 text-gray-600">
              <li className="flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-sky-400"></span>
                <span>Qual foi a evolução da receita nos últimos meses?</span>
              </li>
              <li className="flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-sky-400"></span>
                <span>Como está a margem de lucro operacional?</span>
              </li>
              <li className="flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-sky-400"></span>
                <span>Quais são os centros de custo mais relevantes?</span>
              </li>
              <li className="flex items-center space-x-2">
                <span className="w-2 h-2 rounded-full bg-sky-400"></span>
                <span>Pode me ajudar a entender as principais métricas do DRE?</span>
              </li>
            </ul>
          </Card>
        </div>
      </div>
    </>
  );
} 