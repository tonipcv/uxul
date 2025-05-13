import { AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import { compare } from "bcryptjs";
import { getToken } from 'next-auth/jwt';
import crypto from 'crypto';
import { hash } from 'bcryptjs';
import jwt from 'jsonwebtoken';

declare module 'next-auth' {
  interface User {
    id: string;
    email: string;
    name: string;
    type: 'user' | 'patient';
    userSlug?: string;
    image?: string | null;
    plan?: string;
  }

  interface Session {
    user: User;
  }
}

export const authOptions: AuthOptions = {
  secret: process.env.NEXTAUTH_SECRET,
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  adapter: PrismaAdapter(prisma) as any,
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

        if (credentials.type === 'patient') {
          const patient = await prisma.patient.findFirst({
            where: { email: credentials.email },
            include: {
              user: {
                select: {
                  slug: true,
                  plan: true
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
            type: 'patient' as const,
            userSlug: patient.user?.slug,
            plan: patient.user?.plan || undefined
          };
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
          select: {
            id: true,
            email: true,
            name: true,
            password: true,
            slug: true,
            image: true,
            plan: true
          }
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
          type: 'user' as const,
          userSlug: user.slug,
          image: user.image,
          plan: user.plan || undefined
        };
      }
    })
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.type = user.type;
        token.userSlug = user.userSlug;
        token.image = user.image;
        token.plan = user.plan;
        token.email = user.email;
      }
      return token;
    },
    async session({ session, token }) {
      return {
        ...session,
        user: {
          ...session.user,
          id: token.id,
          email: token.email,
          type: token.type as 'user' | 'patient',
          userSlug: token.userSlug as string | undefined,
          image: token.image as string | null | undefined,
          plan: token.plan
        }
      };
    }
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/signin'
  }
};

interface AuthTokenPayload {
  id: string;
  email: string;
  type: 'patient';
}

/**
 * Creates an authentication token for a patient
 */
export async function createAuthToken(payload: AuthTokenPayload): Promise<string> {
  return jwt.sign(
    payload,
    process.env.JWT_SECRET || 'fallback-secret-for-development',
    { expiresIn: '7d' }
  );
}

/**
 * Gera um token de acesso temporário para o paciente
 */
export async function generatePatientAccessToken() {
  // Gerar token aleatório
  const token = crypto.randomBytes(32).toString('hex');
  
  // Hash do token para armazenar no banco
  const hashedToken = await hash(token, 10);

  return { token, hashedToken };
} 