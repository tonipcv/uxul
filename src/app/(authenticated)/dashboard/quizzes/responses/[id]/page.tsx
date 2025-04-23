'use client';

import { useState, useEffect } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardFooter 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, User, Phone, Calendar, ClipboardList } from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { toast } from 'sonner';

interface ResponseDetail {
  key: string;
  text: string;
  value: any;
  displayValue: string;
  type: string;
}

export default function QuizResponseDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const { data: session } = useSession();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [leadData, setLeadData] = useState<any>(null);
  const [responseDetails, setResponseDetails] = useState<ResponseDetail[]>([]);
  const [quizName, setQuizName] = useState('');

  useEffect(() => {
    if (!session?.user?.id) return;
    fetchResponseDetails();
  }, [session, id]);

  const fetchResponseDetails = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/leads/${id}`);
      
      if (!response.ok) {
        throw new Error('Erro ao buscar detalhes da resposta');
      }
      
      const data = await response.json();
      setLeadData(data);
      
      // Buscar nome do quiz se tiver indication
      if (data.indicationId) {
        try {
          const indicationResponse = await fetch(`/api/indications/${data.indicationId}`);
          if (indicationResponse.ok) {
            const indicationData = await indicationResponse.json();
            if (indicationData.quiz?.name) {
              setQuizName(indicationData.quiz.name);
            }
          }
        } catch (err) {
          console.error('Erro ao buscar informações da indicação:', err);
        }
      }
      
      // Processar metadata se existir
      if (data.medicalNotes && data.source === 'quiz') {
        try {
          const metadata = JSON.parse(data.medicalNotes);
          const details: ResponseDetail[] = [];
          
          // Extrair apenas as chaves principais (sem sufixos)
          Object.keys(metadata).forEach(key => {
            if (!key.endsWith('_text') && !key.endsWith('_value') && !key.endsWith('_display')) {
              details.push({
                key,
                text: metadata[key].text || key,
                value: metadata[key].value,
                displayValue: metadata[key].displayValue || String(metadata[key].value),
                type: metadata[key].type || 'text'
              });
            }
          });
          
          setResponseDetails(details);
        } catch (e) {
          console.error('Erro ao processar respostas do quiz:', e);
          setError('Erro ao processar os dados das respostas');
        }
      } else {
        setError('Esta resposta não contém dados de questionário');
      }
    } catch (err) {
      console.error('Erro ao buscar resposta:', err);
      setError('Erro ao carregar os detalhes da resposta');
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return format(parseISO(dateString), "dd 'de' MMMM 'de' yyyy, HH:mm", { locale: ptBR });
    } catch (e) {
      return 'Data inválida';
    }
  };

  if (loading) {
    return (
      <div className="container px-4 py-10 mx-auto max-w-5xl">
        <div className="flex items-center mb-6">
          <Button 
            variant="outline" 
            onClick={() => router.push('/dashboard/quizzes/responses')}
            className="mr-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <Skeleton className="h-8 w-72" />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <Skeleton className="h-5 w-32 mb-2" />
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-4 w-3/4" />
              </div>
            </CardContent>
          </Card>
          
          <Card className="md:col-span-2">
            <CardHeader>
              <Skeleton className="h-5 w-48 mb-2" />
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
                <Skeleton className="h-24 w-full" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container px-4 py-10 mx-auto max-w-5xl">
        <div className="flex mb-6">
          <Button 
            variant="outline" 
            onClick={() => router.push('/dashboard/quizzes/responses')}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar para Respostas
          </Button>
        </div>
        
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <div className="bg-red-50 p-3 rounded-full mb-4">
              <ClipboardList className="h-8 w-8 text-red-500" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Erro ao carregar respostas</h2>
            <p className="text-gray-500 mb-6">{error}</p>
            <Button 
              onClick={fetchResponseDetails}
              className="bg-blue-600 hover:bg-blue-700"
            >
              Tentar novamente
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container px-4 py-10 mx-auto max-w-5xl">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <Button 
            variant="outline" 
            onClick={() => router.push('/dashboard/quizzes/responses')}
            className="mr-4"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Voltar
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Detalhes da Resposta</h1>
            <p className="text-gray-500 text-sm">{quizName || 'Questionário'}</p>
          </div>
        </div>
      </div>
      
      {leadData && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Informações do Lead</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start">
                  <User className="h-4 w-4 mr-2 mt-1 text-gray-400" />
                  <div>
                    <div className="font-semibold">{leadData.name}</div>
                    <div className="text-sm text-gray-500">{leadData.email || 'Email não informado'}</div>
                  </div>
                </div>
                
                <div className="flex items-center">
                  <Phone className="h-4 w-4 mr-2 text-gray-400" />
                  <div className="font-medium">{leadData.phone}</div>
                </div>
                
                <div className="flex items-center">
                  <Calendar className="h-4 w-4 mr-2 text-gray-400" />
                  <div className="text-sm">{formatDate(leadData.createdAt)}</div>
                </div>
                
                <Separator />
                
                <div>
                  <div className="text-xs text-gray-500 mb-1">Origem</div>
                  <Badge variant="outline" className="font-normal">
                    {leadData.source || 'Não especificado'}
                  </Badge>
                </div>
                
                <div>
                  <div className="text-xs text-gray-500 mb-1">Status</div>
                  <Badge variant="outline" className={
                    leadData.status === 'converted' 
                      ? 'bg-green-50 text-green-600 border-green-200'
                      : 'bg-blue-50 text-blue-600 border-blue-200'
                  }>
                    {leadData.status === 'converted' ? 'Convertido' : (leadData.status || 'Novo')}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card className="md:col-span-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-500">Respostas do Questionário</CardTitle>
              <CardDescription>
                {responseDetails.length} perguntas respondidas
              </CardDescription>
            </CardHeader>
            <CardContent>
              {responseDetails.length > 0 ? (
                <div className="space-y-6">
                  {responseDetails.map((detail, index) => (
                    <div key={detail.key} className={index > 0 ? "pt-4 border-t border-gray-100" : ""}>
                      <h3 className="font-medium text-gray-800 mb-1">{detail.text}</h3>
                      <p className="text-gray-900 break-words">
                        {detail.displayValue || (
                          Array.isArray(detail.value) 
                            ? detail.value.join(", ") 
                            : String(detail.value)
                        )}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        Variável: {detail.key} • Tipo: {detail.type}
                      </p>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-8 text-center">
                  <div className="bg-gray-100 p-3 rounded-full mb-3">
                    <ClipboardList className="h-6 w-6 text-gray-400" />
                  </div>
                  <h3 className="text-gray-700 font-medium">Sem respostas detalhadas</h3>
                  <p className="text-gray-500 text-sm mt-1 max-w-md">
                    Não foi possível encontrar as respostas detalhadas para este questionário.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
} 