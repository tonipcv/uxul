/* eslint-disable */
'use client';

import { useState, useRef, useEffect } from 'react';
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import Image from 'next/image';
import { Loader2, Camera, Bot, User, Send } from "lucide-react";
import { cn } from "@/lib/utils";
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import heicConvert from 'heic-convert';

interface NutritionInfo {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
  description: string;
}

interface Message {
  type: 'image' | 'response' | 'text';
  content: string;
  text?: string;
  nutritionInfo?: NutritionInfo;
  timestamp: Date;
}

interface ApiError {
  message: string;
  details?: string;
}

export default function GptPage() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userText, setUserText] = useState('');
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const convertHeicToJpeg = async (file: File): Promise<string> => {
    try {
      const buffer = await file.arrayBuffer();
      const convertedBuffer = await heicConvert({
        buffer: Buffer.from(buffer),
        format: 'JPEG',
        quality: 0.9
      });
      
      return `data:image/jpeg;base64,${Buffer.from(convertedBuffer).toString('base64')}`;
    } catch (error) {
      console.error('Error converting HEIC:', error);
      throw new Error('Erro ao converter a imagem. Por favor, tente novamente.');
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 20 * 1024 * 1024) { // 20MB limit
      setError('A imagem é muito grande. Por favor, use uma imagem menor que 20MB.');
      return;
    }

    // Accept both standard image formats and HEIC/HEIF
    if (!file.type.startsWith('image/') && 
        !file.type.includes('heic') && 
        !file.type.includes('heif')) {
      setError('Por favor, selecione apenas arquivos de imagem.');
      return;
    }

    try {
      let imageData: string;
      
      if (file.type.includes('heic') || file.type.includes('heif')) {
        // Convert HEIC/HEIF to JPEG
        imageData = await convertHeicToJpeg(file);
      } else {
        // Handle other image formats normally
        const reader = new FileReader();
        imageData = await new Promise((resolve, reject) => {
          reader.onloadend = () => resolve(reader.result as string);
          reader.onerror = reject;
          reader.readAsDataURL(file);
        });
      }

      setSelectedImage(imageData);
      setError(null);
    } catch (error) {
      console.error('Error processing image:', error);
      setError('Erro ao processar a imagem. Por favor, tente novamente.');
    }
    
    // Clear the input so the same file can be selected again
    e.target.value = '';
  };

  const handleSubmit = async () => {
    if (!selectedImage && !userText.trim()) {
      setError('Por favor, adicione uma imagem ou texto.');
      return;
    }

    try {
      // Add message to chat
      if (selectedImage) {
        setMessages(prev => [...prev, { 
          type: 'image', 
          content: selectedImage,
          text: userText,
          timestamp: new Date()
        }]);
      } else {
        setMessages(prev => [...prev, { 
          type: 'text', 
          content: userText,
          timestamp: new Date()
        }]);
      }
      
      setIsAnalyzing(true);
      setError(null);

      const response = await fetch('/api/analyze-food', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          image: selectedImage,
          text: userText
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Erro ao analisar');
      }

      setMessages(prev => [...prev, { 
        type: 'response', 
        content: data.description,
        nutritionInfo: data,
        timestamp: new Date()
      }]);

      // Reset form
      setSelectedImage(null);
      setUserText('');
    } catch (error: unknown) {
      console.error('Error:', error);
      if (error instanceof Error) {
        setError(error.message);
      } else {
        setError('Erro ao analisar. Por favor, tente novamente.');
      }
      
      // Remove a última mensagem se houver erro
      setMessages(prev => prev.slice(0, -1));
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      <div className="hidden lg:block fixed top-0 left-0 right-0 z-30 bg-background/50 backdrop-blur supports-[backdrop-filter]:bg-background/30 border-b">
        <div className="container max-w-3xl mx-auto flex items-center gap-3 h-14 px-4">
          <Bot className="h-6 w-6" />
          <h1 className="text-lg font-normal">Assistente Nutricional</h1>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto pt-16 lg:pt-[3.5rem] pb-[calc(18rem+env(safe-area-inset-bottom))] lg:pb-[11rem]">
        <div className="container max-w-3xl mx-auto p-4">
          <div className="space-y-4">
            {messages.length === 0 && (
              <div className="text-center py-20 lg:py-8 text-muted-foreground flex flex-col items-center justify-center min-h-[50vh] lg:min-h-0">
                <Bot className="h-8 w-8 mb-4 opacity-50" />
                <p className="text-sm max-w-[200px] mx-auto">Envie uma foto ou descreva seu alimento para análise nutricional</p>
              </div>
            )}
            
            {messages.map((message, index) => (
              <div
                key={index}
                className={cn(
                  "flex items-end gap-2",
                  message.type === 'image' || message.type === 'text' ? "justify-end" : "justify-start"
                )}
              >
                {message.type === 'response' && (
                  <Bot className="h-6 w-6 mb-1" />
                )}
                <div
                  className={cn(
                    "rounded-2xl p-4 max-w-[85%] relative",
                    message.type === 'image' || message.type === 'text'
                      ? "bg-primary text-primary-foreground rounded-br-sm" 
                      : "bg-muted rounded-bl-sm"
                  )}
                >
                  {message.type === 'image' ? (
                    <div className="space-y-3">
                      <div className="relative aspect-video w-full min-w-[200px] overflow-hidden rounded-lg">
                        <Image
                          src={message.content}
                          alt="Food"
                          fill
                          className="object-cover"
                        />
                      </div>
                      {message.text && (
                        <p className="text-sm">{message.text}</p>
                      )}
                      <div className="text-[10px] opacity-70 text-right">
                        {format(message.timestamp, 'HH:mm', { locale: ptBR })}
                      </div>
                    </div>
                  ) : message.type === 'text' ? (
                    <div className="space-y-3">
                      <p className="text-sm">{message.content}</p>
                      <div className="text-[10px] opacity-70 text-right">
                        {format(message.timestamp, 'HH:mm', { locale: ptBR })}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      <p className="text-sm leading-relaxed">{message.content}</p>
                      {message.nutritionInfo && (
                        <div className="grid grid-cols-2 gap-2 bg-background/50 rounded-xl p-3">
                          <div className="space-y-1">
                            <div className="text-lg font-bold">{message.nutritionInfo.calories}</div>
                            <div className="text-xs text-muted-foreground">Calorias</div>
                          </div>
                          <div className="space-y-1">
                            <div className="text-lg font-bold">{message.nutritionInfo.protein}g</div>
                            <div className="text-xs text-muted-foreground">Proteína</div>
                          </div>
                          <div className="space-y-1">
                            <div className="text-lg font-bold">{message.nutritionInfo.carbs}g</div>
                            <div className="text-xs text-muted-foreground">Carboidratos</div>
                          </div>
                          <div className="space-y-1">
                            <div className="text-lg font-bold">{message.nutritionInfo.fat}g</div>
                            <div className="text-xs text-muted-foreground">Gorduras</div>
                          </div>
                        </div>
                      )}
                      <div className="text-[10px] opacity-70">
                        {format(message.timestamp, 'HH:mm', { locale: ptBR })}
                      </div>
                    </div>
                  )}
                </div>
                {(message.type === 'image' || message.type === 'text') && (
                  <User className="h-6 w-6 mb-1" />
                )}
              </div>
            ))}
            
            {isAnalyzing && (
              <div className="flex items-end gap-2">
                <Bot className="h-6 w-6 mb-1" />
                <div className="bg-muted rounded-2xl rounded-bl-sm p-4">
                  <div className="flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    <span className="text-sm">Analisando sua refeição...</span>
                  </div>
                </div>
              </div>
            )}

            {error && (
              <div className="flex justify-center">
                <div className="text-sm text-red-500 bg-red-500/10 px-4 py-2 rounded-full">
                  {error}
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 z-30 bg-background border-t">
        <div className="container max-w-3xl mx-auto p-4 pb-[calc(5rem+env(safe-area-inset-bottom))] lg:pb-4">
          <div className="space-y-4">
            {selectedImage && (
              <div className="relative aspect-video w-full max-w-[150px] overflow-hidden rounded-lg border">
                <Image
                  src={selectedImage}
                  alt="Selected food"
                  fill
                  className="object-cover"
                />
              </div>
            )}
            <div className="flex flex-col gap-2">
              <Textarea
                placeholder={selectedImage ? "Descreva o alimento ou adicione informações relevantes... (opcional)" : "Descreva o alimento que você quer analisar..."}
                value={userText}
                onChange={(e) => setUserText(e.target.value)}
                className="min-h-[80px] max-h-[120px] resize-none text-sm"
              />
              <div className="flex items-center gap-2">
                <Input
                  type="file"
                  accept="image/*,.heic,.heif"
                  onChange={handleImageUpload}
                  className="hidden"
                  id="image-upload"
                  disabled={isAnalyzing}
                />
                <Button
                  variant="outline"
                  className="flex-1"
                  disabled={isAnalyzing}
                  onClick={() => document.getElementById('image-upload')?.click()}
                >
                  <Camera className="mr-2 h-4 w-4" />
                  <span className="hidden sm:inline">{selectedImage ? "Trocar foto" : "Adicionar foto"}</span>
                  <span className="sm:hidden">Foto</span>
                </Button>
                <Button
                  className="flex-1"
                  disabled={(!selectedImage && !userText.trim()) || isAnalyzing}
                  onClick={handleSubmit}
                >
                  <Send className="mr-2 h-4 w-4" />
                  <span className="hidden sm:inline">{isAnalyzing ? "Analisando..." : "Analisar"}</span>
                  <span className="sm:hidden">{isAnalyzing ? "..." : "Enviar"}</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 