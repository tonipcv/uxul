import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import { google } from 'googleapis';

// Função auxiliar para criar cliente OAuth2
async function getOAuth2Client(userId: string) {
  const account = await prisma.account.findFirst({
    where: {
      userId,
      provider: 'google',
      access_token: {
        not: null
      }
    }
  });

  if (!account || !account.access_token) {
    throw new Error('Usuário não autenticado com Google');
  }

  const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    `${process.env.NEXTAUTH_URL}/api/google/callback`
  );

  oauth2Client.setCredentials({
    access_token: account.access_token,
    refresh_token: account.refresh_token
  });

  return oauth2Client;
}

export async function GET(req: NextRequest) {
  try {
    // Verificar autenticação
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Usuário não autenticado' },
        { status: 401 }
      );
    }

    try {
      // Obter cliente OAuth2
      const oauth2Client = await getOAuth2Client(session.user.id);
      
      // Criar cliente de Calendar
      const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
      
      // Obter eventos
      const response = await calendar.events.list({
        calendarId: 'primary',
        timeMin: new Date().toISOString(),
        maxResults: 50,
        singleEvents: true,
        orderBy: 'startTime',
      });

      const events = response.data.items?.map(event => {
        return {
          id: event.id,
          title: event.summary,
          description: event.description,
          location: event.location,
          start: event.start?.dateTime || event.start?.date,
          end: event.end?.dateTime || event.end?.date,
          colorId: event.colorId
        };
      }) || [];

      return NextResponse.json({ events });
    } catch (error) {
      console.error('Erro ao buscar eventos:', error);
      return NextResponse.json(
        { error: 'Erro ao buscar eventos', details: error instanceof Error ? error.message : null },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Erro interno:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    // Verificar autenticação
    const session = await getServerSession(authOptions);
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Usuário não autenticado' },
        { status: 401 }
      );
    }

    // Obter dados do evento
    const eventData = await req.json();
    const { title, description, location, start, end, colorId } = eventData;

    try {
      // Obter cliente OAuth2
      const oauth2Client = await getOAuth2Client(session.user.id);
      
      // Criar cliente de Calendar
      const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
      
      // Criar evento
      const event = {
        summary: title,
        description,
        location,
        colorId,
        start: {
          dateTime: start,
          timeZone: 'America/Sao_Paulo',
        },
        end: {
          dateTime: end,
          timeZone: 'America/Sao_Paulo',
        }
      };
      
      const response = await calendar.events.insert({
        calendarId: 'primary',
        requestBody: event,
      });

      return NextResponse.json({ 
        success: true, 
        event: {
          id: response.data.id,
          title: response.data.summary,
          description: response.data.description,
          location: response.data.location,
          start: response.data.start?.dateTime || response.data.start?.date,
          end: response.data.end?.dateTime || response.data.end?.date,
          colorId: response.data.colorId
        }
      });
    } catch (error) {
      console.error('Erro ao criar evento:', error);
      return NextResponse.json(
        { error: 'Erro ao criar evento', details: error instanceof Error ? error.message : null },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error('Erro interno:', error);
    return NextResponse.json(
      { error: 'Erro interno do servidor' },
      { status: 500 }
    );
  }
} 