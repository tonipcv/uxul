import { NextRequest, NextResponse } from 'next/server';
import { google } from 'googleapis';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code');
    const state = searchParams.get('state'); // ID do usuário
    const error = searchParams.get('error');

    // Se tiver um erro ou não tiver código de autorização, retornar erro
    if (error || !code) {
      console.error('Erro na autenticação Google:', error);
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/agenda?error=auth_failed`);
    }

    if (!state) {
      console.error('Estado inválido no callback');
      return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/agenda?error=invalid_state`);
    }

    // Configurar OAuth client
    const oauth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      `${process.env.NEXTAUTH_URL}/api/google/callback`
    );

    // Trocar o código pelo token de acesso
    const { tokens } = await oauth2Client.getToken(code);
    const { access_token, refresh_token, expiry_date } = tokens;

    // Salvar os tokens na conta do usuário
    await prisma.account.upsert({
      where: {
        provider_providerAccountId: {
          provider: 'google',
          providerAccountId: state // Usando o ID do usuário como providerAccountId
        }
      },
      update: {
        access_token: access_token,
        refresh_token: refresh_token,
        expires_at: expiry_date ? Math.floor(expiry_date / 1000) : undefined,
        scope: 'calendar.events',
        token_type: 'Bearer'
      },
      create: {
        provider: 'google',
        providerAccountId: state, // Usando o ID do usuário como providerAccountId
        type: 'oauth',
        access_token: access_token,
        refresh_token: refresh_token,
        expires_at: expiry_date ? Math.floor(expiry_date / 1000) : undefined,
        scope: 'calendar.events',
        token_type: 'Bearer',
        userId: state
      }
    });

    // Redirecionar para a página da agenda com sucesso
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/agenda?connected=true`);
  } catch (error) {
    console.error('Erro no callback Google:', error);
    return NextResponse.redirect(`${process.env.NEXTAUTH_URL}/agenda?error=callback_failed`);
  }
} 