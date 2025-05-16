import { OpenAI } from 'openai';
import { NextResponse } from 'next/server';

// Verificar se a API key está definida
if (!process.env.OPENAI_API_KEY) {
  throw new Error('OPENAI_API_KEY não está definida no ambiente');
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json(
        { error: 'Formato de mensagem inválido' },
        { status: 400 }
      );
    }

    const completion = await openai.chat.completions.create({
      model: "gpt-4-turbo-preview",
      messages: [
        {
          role: "system",
          content: "Você é um assistente financeiro especializado em análise de DRE (Demonstrativo de Resultados). Você ajuda a interpretar dados financeiros, calcular métricas importantes e responder dúvidas sobre performance financeira. Use sempre termos em português e formate valores monetários no padrão brasileiro."
        },
        ...messages
      ],
      temperature: 0.7,
      stream: true,
    });

    // Transformar o stream da OpenAI em um ReadableStream web padrão
    const stream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of completion) {
            const content = chunk.choices[0]?.delta?.content || '';
            if (content) {
              // Enviar apenas o conteúdo do texto, sem os metadados
              controller.enqueue(new TextEncoder().encode(content));
            }
          }
          controller.close();
        } catch (error) {
          controller.error(error);
        }
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    });
  } catch (error: any) {
    console.error('Erro na API do OpenAI:', error);
    return NextResponse.json(
      { 
        error: 'Erro ao processar a requisição',
        details: error.message 
      }, 
      { status: error.status || 500 }
    );
  }
} 