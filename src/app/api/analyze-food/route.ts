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

    if (!image && !text) {
      return NextResponse.json(
        { error: 'É necessário fornecer uma imagem ou texto' },
        { status: 400 }
      );
    }

    let foodDescription = '';

    if (image) {
      // Use Vision API to analyze the image
      const visionResponse = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "user",
            content: [
              { 
                type: "text", 
                text: `Descreva brevemente esta refeição, listando apenas os principais componentes e suas quantidades aproximadas. Seja objetivo e conciso. ${text ? `Contexto adicional: ${text}` : ''} Responda em português.` 
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

      foodDescription = visionResponse.choices[0].message.content;
    } else {
      // Use text only for analysis
      foodDescription = text;
    }

    // Now use OpenAI to estimate nutritional values based on the description
    const nutritionResponse = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "Você é um especialista em nutrição. Forneça uma estimativa nutricional conservadora baseada na descrição do alimento. Sua resposta deve ser um objeto JSON com apenas: calories (número), protein (número), carbs (número), fat (número). Não inclua texto adicional, apenas o JSON."
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
    const description = foodDescription.replace(/\*\*/g, '').trim();

    return NextResponse.json({
      ...nutritionData,
      description,
    });
  } catch (error: unknown) {
    console.error('Erro ao analisar comida:', error);
    if (error instanceof Error) {
      console.error('Error name:', error.name);
      console.error('Error message:', error.message);
      console.error('Error stack:', error.stack);
    }
    const errorMessage = error instanceof Error ? error.message : 'Falha ao analisar';
    return NextResponse.json(
      { 
        error: errorMessage,
        details: error instanceof Error ? error.stack : String(error)
      },
      { status: 500 }
    );
  }
} 