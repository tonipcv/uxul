'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRightIcon } from "@heroicons/react/24/outline";
import ReactMarkdown from 'react-markdown';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

export default function AIPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage = { role: 'user' as const, content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/ai', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: [...messages, userMessage] })
      });

      const data = await response.json();

      if (response.ok) {
        setMessages(prev => [...prev, { role: 'assistant', content: data.response }]);
      } else {
        console.error('Error:', data.error);
        setMessages(prev => [...prev, { role: 'assistant', content: 'Desculpe, ocorreu um erro ao processar sua mensagem.' }]);
      }
    } catch (error) {
      console.error('Error:', error);
      setMessages(prev => [...prev, { role: 'assistant', content: 'Desculpe, ocorreu um erro ao processar sua mensagem.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Card className="min-h-screen lg:min-h-[calc(100vh-4rem)] border-0 lg:border">
        <CardHeader className="flex flex-col space-y-4 pb-4 lg:pb-7 sticky top-0 bg-background/50 backdrop-blur supports-[backdrop-filter]:bg-background/30 z-10 pt-[72px] lg:pt-4">
          <CardTitle className="text-xs font-normal text-white/70">Assistente IA</CardTitle>
        </CardHeader>

        <CardContent className="pb-24 lg:pb-8 space-y-6 px-4 lg:px-6">
          {/* Messages */}
          <div className="space-y-4 min-h-[200px]">
            {messages.length === 0 ? (
              <div className="text-center py-8">
                <span className="text-xs text-muted-foreground">Faça uma pergunta para começar...</span>
              </div>
            ) : (
              messages.map((message, index) => (
                <Card key={index} className={`border ${message.role === 'assistant' ? 'border-white/10' : 'border-turquoise/20'}`}>
                  <CardContent className="p-4">
                    <div className="flex items-start gap-4">
                      <div className="min-w-[24px] h-6 flex items-center justify-center rounded bg-background border border-white/10 text-[10px] font-light">
                        {message.role === 'assistant' ? 'AI' : 'EU'}
                      </div>
                      <div className="text-sm font-light whitespace-pre-wrap flex-1 prose prose-invert max-w-none">
                        {message.role === 'assistant' ? (
                          <ReactMarkdown
                            components={{
                              strong: (props) => (
                                <span className="font-bold text-turquoise">{props.children}</span>
                              )
                            }}
                          >
                            {message.content}
                          </ReactMarkdown>
                        ) : (
                          message.content
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
            {isLoading && (
              <Card className="border border-white/10">
                <CardContent className="p-4">
                  <div className="flex items-start gap-4">
                    <div className="min-w-[24px] h-6 flex items-center justify-center rounded bg-background border border-white/10 text-[10px] font-light">
                      AI
                    </div>
                    <p className="text-sm font-light text-muted-foreground animate-pulse">
                      Pensando...
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Input form */}
          <form onSubmit={handleSubmit} className="sticky bottom-0 pt-4">
            <div className="relative">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Digite sua mensagem..."
                className="min-h-[100px] w-full rounded-md border border-white/10 bg-transparent px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:border-turquoise disabled:cursor-not-allowed disabled:opacity-50 font-light resize-none pr-16"
                disabled={isLoading}
              />
              <div className="absolute bottom-3 right-3">
                <Button 
                  type="submit" 
                  size="icon"
                  className="h-8 w-8 rounded-full border-turquoise border bg-transparent hover:bg-turquoise/10 text-white hover:text-white"
                  disabled={!input.trim() || isLoading}
                >
                  <ArrowRightIcon className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
} 