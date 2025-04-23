import { NextRequest, NextResponse } from 'next/server';
import { OpenAI } from 'openai';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';

// Inicializar o cliente OpenAI
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

export async function POST(req: NextRequest) {
  try {
    // Verificar autenticação
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Não autorizado' },
        { status: 401 }
      );
    }

    const body = await req.json();
    const { type, prompt, nodeType, existingNodes } = body;

    // Validar campos obrigatórios
    if (!type || !prompt) {
      return NextResponse.json(
        { error: 'Tipo e prompt são obrigatórios' },
        { status: 400 }
      );
    }

    let systemPrompt = '';
    let userPrompt = prompt;

    // Personalizar o prompt com base no tipo de solicitação
    if (type === 'generate_message') {
      systemPrompt = 'Você é um assistente especializado em criar mensagens para chatbots. Crie uma mensagem clara, concisa e amigável baseada na descrição fornecida. A mensagem deve ser direta e apropriada para um chatbot de atendimento médico.';
    } 
    else if (type === 'generate_question') {
      systemPrompt = `Você é um assistente especializado em criar perguntas para formulários e chatbots. 
      Crie uma pergunta clara e objetiva baseada na descrição fornecida. 
      A pergunta deve ser direta e apropriada para um chatbot de atendimento médico.
      Se o tipo de input for especificado, adapte a pergunta para este tipo.
      Tipos possíveis: texto, email, telefone, número, data, seleção.`;
      
      if (nodeType) {
        userPrompt += ` O tipo de input é: ${nodeType}.`;
      }
    } 
    else if (type === 'generate_flow') {
      systemPrompt = `Você é um assistente especializado em criar fluxos de conversa para chatbots na área médica. 
      Crie um fluxo de conversa completo baseado na descrição fornecida.
      Retorne o resultado como um array JSON com a seguinte estrutura:
      [
        {
          "type": "message" ou "input" ou "condition",
          "content": {
            // Para mensagens:
            "message": "Texto da mensagem"
            
            // Para perguntas (inputs):
            "question": "Texto da pergunta",
            "variableName": "nome_variavel",
            "inputType": "text", // Pode ser: text, email, tel, number, date, select
            "placeholder": "Texto de exemplo"
            
            // Para condições:
            "variable": "nome_variavel",
            "operator": "equals", // Pode ser: equals, contains, startsWith, endsWith, greaterThan, lessThan
            "value": "valor_comparacao"
          },
          "position": { "x": número, "y": número }
        }
      ]
      
      Os nós devem formar um fluxo de conversa coerente para um chatbot médico.`;
      
      // Adicionar informações de nós existentes, se disponíveis
      if (existingNodes && existingNodes.length > 0) {
        userPrompt += ` Considere que o fluxo já tem os seguintes nós: ${JSON.stringify(existingNodes)}. A resposta deve ser complementar a estes nós.`;
      }
    }
    else if (type === 'improve_message') {
      systemPrompt = 'Você é um assistente especializado em melhorar mensagens para chatbots. Reescreva a mensagem fornecida para torná-la mais clara, concisa e amigável. A mensagem deve ser apropriada para um chatbot de atendimento médico.';
    }
    else if (type === 'translate_message') {
      systemPrompt = 'Você é um assistente especializado em traduções. Traduza a mensagem fornecida para o português do Brasil, mantendo o tom e a intenção originais.';
    }
    else {
      return NextResponse.json(
        { error: 'Tipo de solicitação inválido' },
        { status: 400 }
      );
    }

    // Fazer a chamada para a API da OpenAI
    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview', // Ou outro modelo conforme necessário
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.7,
      max_tokens: 2000
    });

    const response = completion.choices[0].message.content;

    // Para fluxos, tentar fazer parse do JSON
    if (type === 'generate_flow') {
      try {
        // Extrair apenas o array JSON da resposta, caso haja texto adicional
        const jsonMatch = response ? response.match(/\[[\s\S]*\]/) : null;
        const jsonString = jsonMatch ? jsonMatch[0] : response;
        const flowData = JSON.parse(jsonString || '[]');
        
        return NextResponse.json({ response: flowData });
      } catch (error) {
        console.error('Erro ao fazer parse do JSON:', error);
        return NextResponse.json({ response });
      }
    }

    return NextResponse.json({ response });
  } catch (error) {
    console.error('Erro na chamada de IA:', error);
    return NextResponse.json(
      { error: 'Erro ao processar sua solicitação' },
      { status: 500 }
    );
  }
} 