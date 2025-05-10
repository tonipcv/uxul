'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams } from 'next/navigation';
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface Doctor {
  id: string;
  name: string;
  specialty: string;
  image: string | null;
}

interface Message {
  id: string;
  content: string;
  type: string;
  sender: string;
  isTyping?: boolean;
  inputType?: string;
  variableName?: string;
  placeholder?: string;
}

interface InputData {
  type: string;
  variableName?: string;
  placeholder?: string;
}

interface QuizQuestion {
  id: string;
  type: string;
  text: string;
  required: boolean;
  options?: string[];
  variableName?: string;
}

interface Quiz {
  id: string;
  name: string;
  description?: string;
  isPublished: boolean;
  questions: QuizQuestion[];
}

interface IndicationPageProps {
  indication: {
    id: string;
    name: string;
    description?: string;
    // Add other indication fields as needed
  };
}

const IndicationPage: React.FC<IndicationPageProps> = ({ indication }) => {
  const params = useParams<{ userSlug: string }>();
  const [doctor, setDoctor] = useState<Doctor | null>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);

  // Chat state
  const [isChatbot, setIsChatbot] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [chatStarted, setChatStarted] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [chatSessionId, setChatSessionId] = useState<string | null>(null);
  const [waitingForInput, setWaitingForInput] = useState(false);
  const [currentInputData, setCurrentInputData] = useState<InputData>({ type: 'text' });

  // Quiz state
  const [isQuiz, setIsQuiz] = useState(false);
  const [quiz, setQuiz] = useState<Quiz | null>(null);
  const [activeQuestionIndex, setActiveQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [isSubmittingQuiz, setIsSubmittingQuiz] = useState(false);
  const quizRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom of chat
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Fetch doctor info
  useEffect(() => {
    const fetchDoctorInfo = async () => {
      if (!params.userSlug) return;
      
      try {
        const response = await fetch(`/api/doctors/${params.userSlug}`);
        if (response.ok) {
          const data = await response.json();
          setDoctor(data);
        }
      } catch (error) {
        console.error('Error fetching doctor info:', error);
      } finally {
        setInitialLoading(false);
      }
    };

    fetchDoctorInfo();
  }, [params.userSlug]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const response = await fetch('/api/lead', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          phone,
          doctorId: doctor?.id,
          indicationId: indication.id,
        }),
      });

      if (response.ok) {
        setSuccess(true);
        setName('');
        setPhone('');
      } else {
        const data = await response.json();
        setError(data.error || 'Ocorreu um erro ao enviar seus dados.');
      }
    } catch (error) {
      setError('Ocorreu um erro ao enviar seus dados. Tente novamente.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <Card>
        <CardContent className="p-6">
          {/* Doctor Info */}
          {doctor && (
            <div className="flex items-center space-x-4 mb-6">
              {doctor.image && (
                <img
                  src={doctor.image}
                  alt={doctor.name}
                  className="w-16 h-16 rounded-full"
                />
              )}
              <div>
                <h2 className="text-xl font-semibold">{doctor.name}</h2>
                <p className="text-gray-600">{doctor.specialty}</p>
              </div>
            </div>
          )}

          {/* Indication Info */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold mb-2">{indication.name}</h1>
            {indication.description && (
              <p className="text-gray-600">{indication.description}</p>
            )}
          </div>

          {/* Contact Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="name">Nome</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div>
              <Label htmlFor="phone">Telefone</Label>
              <Input
                id="phone"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                required
              />
            </div>

            {error && (
              <p className="text-red-600">{error}</p>
            )}

            {success ? (
              <div className="text-green-600">
                Seus dados foram enviados com sucesso! Entraremos em contato em breve.
              </div>
            ) : (
              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? 'Enviando...' : 'Enviar'}
              </Button>
            )}
          </form>
        </CardContent>
      </Card>

      {/* Chat Section */}
      {isChatbot && (
        <div className="mt-8">
          <div className="bg-white rounded-lg shadow p-4 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex ${
                  message.sender === 'user' ? 'justify-end' : 'justify-start'
                }`}
              >
                <div
                  className={`rounded-lg p-3 max-w-[70%] ${
                    message.sender === 'user'
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-100'
                  }`}
                >
                  {message.content}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          {waitingForInput && (
            <div className="mt-4">
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder={currentInputData.placeholder}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    // Handle message send
                  }
                }}
              />
            </div>
          )}
        </div>
      )}

      {/* Quiz Section */}
      {isQuiz && quiz && (
        <div className="mt-8" ref={quizRef}>
          <Card>
            <CardContent className="p-6">
              <h2 className="text-xl font-semibold mb-4">{quiz.name}</h2>
              {quiz.description && (
                <p className="text-gray-600 mb-6">{quiz.description}</p>
              )}

              {quiz.questions[activeQuestionIndex] && (
                <div className="space-y-4">
                  <p className="font-medium">
                    {quiz.questions[activeQuestionIndex].text}
                  </p>

                  {/* Question inputs based on type */}
                  {/* Add different input types handling here */}
                </div>
              )}

              <div className="flex justify-between mt-6">
                <Button
                  onClick={() => setActiveQuestionIndex(prev => prev - 1)}
                  disabled={activeQuestionIndex === 0}
                >
                  Anterior
                </Button>
                <Button
                  onClick={() => setActiveQuestionIndex(prev => prev + 1)}
                  disabled={activeQuestionIndex === quiz.questions.length - 1}
                >
                  Próxima
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

export default IndicationPage; 