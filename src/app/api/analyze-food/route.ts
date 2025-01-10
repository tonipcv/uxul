/* eslint-disable */
import { NextResponse } from 'next/server';
import OpenAI from 'openai';

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface ApiError {
  message: string;
  details?: string;
}

export async function POST(req: Request) {
  try {
    const { image, text } = await req.json();

    if (!image) {
      return NextResponse.json(
        { error: 'Imagem é obrigatória' },
        { status: 400 }
      );
    }

    // First, use OpenAI's Vision API to identify the food
    const visionResponse = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "user",
          content: [
            { 
              type: "text", 
              text: `Analise esta imagem de comida e forneça uma descrição detalhada do que você vê. Foque em identificar os principais ingredientes e tamanhos das porções. ${text ? `Informação adicional do usuário: ${text}` : ''} Responda em português.` 
            },
            {
              type: "image_url",
              image_url: {
                url: image,
                detail: "low"
              }
            }
          ],
        },
      ],
      max_tokens: 500,
    });

    if (!visionResponse.choices[0]?.message?.content) {
      throw new Error('Sem resposta da API de visão');
    }

    const foodDescription = visionResponse.choices[0].message.content;

    // Now use OpenAI to estimate nutritional values based on the description
    const nutritionResponse = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "Você é um especialista em nutrição. Com base na descrição do alimento fornecida, estime os valores nutricionais. Forneça apenas os valores numéricos para calorias, proteínas, carboidratos e gorduras em gramas. Formate sua resposta como um objeto JSON com estes campos: calories (número), protein (número), carbs (número), fat (número). Seja conservador em suas estimativas."
        },
        {
          role: "user",
          content: foodDescription
        }
      ],
      response_format: { type: "json_object" },
    });

    if (!nutritionResponse.choices[0]?.message?.content) {
      throw new Error('Sem resposta da API de nutrição');
    }

    const nutritionData = JSON.parse(nutritionResponse.choices[0].message.content);

    return NextResponse.json({
      ...nutritionData,
      description: foodDescription,
    });
  } catch (error: unknown) {
    console.error('Erro ao analisar comida:', error);
    const errorMessage = error instanceof Error ? error.message : 'Falha ao analisar imagem da comida';
    return NextResponse.json(
      { 
        error: errorMessage,
        details: error instanceof Error ? error.toString() : undefined
      },
      { status: 500 }
    );
  }
} 