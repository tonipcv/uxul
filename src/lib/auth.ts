import { AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import { compare } from "bcryptjs";
import { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import crypto from 'crypto';
import { NextAuthOptions } from 'next-auth';

declare module 'next-auth' {
  interface User {
    id: string;
    email: string;
    name: string;
    type: 'user' | 'patient';
    userSlug?: string;
  }

  interface Session {
    user: User;
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string;
    type: 'user' | 'patient';
    userSlug?: string;
  }
}

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Senha', type: 'password' },
        type: { label: 'Tipo', type: 'text' }
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email e senha são obrigatórios');
        }

        // Verificar se é autenticação de paciente
        if (credentials.type === 'patient') {
          const patient = await prisma.patient.findFirst({
            where: { email: credentials.email },
            include: {
              user: {
                select: {
                  slug: true
                }
              }
            }
          });

          if (!patient) {
            throw new Error('Email não encontrado');
          }

          if (!patient.hasPassword || !patient.password) {
            throw new Error('Conta sem senha definida');
          }

          const passwordValid = await compare(credentials.password, patient.password);
          if (!passwordValid) {
            throw new Error('Senha incorreta');
          }

          return {
            id: patient.id,
            email: patient.email,
            name: patient.name,
            type: 'patient' as const
          };
        }

        // Autenticação de médico (código existente)
        const user = await prisma.user.findUnique({
          where: { email: credentials.email }
        });

        if (!user) {
          throw new Error('Email não encontrado');
        }

        if (!user.password) {
          throw new Error('Conta sem senha definida');
        }

        const passwordValid = await compare(credentials.password, user.password);
        if (!passwordValid) {
          throw new Error('Senha incorreta');
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          type: 'user' as const
        };
      }
    })
  ],
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error'
  },
  session: {
    strategy: 'jwt'
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.type = user.type;
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id;
        session.user.type = token.type;
      }
      return session;
    }
  },
};

export async function isAuthenticated(req: NextRequest): Promise<boolean> {
  const session = await getToken({ 
    req, 
    secret: process.env.NEXTAUTH_SECRET 
  });
  
  return !!session;
}

export async function generatePatientAccessToken() {
  const token = crypto.randomBytes(32).toString('hex');
  const hashedToken = crypto
    .createHash('sha256')
    .update(token)
    .digest('hex');

  return { token, hashedToken };
} 