import { AuthOptions } from "next-auth";
import CredentialsProvider from "next-auth/providers/credentials";
import GoogleProvider from "next-auth/providers/google";
import { PrismaAdapter } from "@auth/prisma-adapter";
import { prisma } from "@/lib/prisma";
import { compare } from "bcryptjs";
import { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';
import crypto from 'crypto';

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
            plan: patient.user?.plan
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
          plan: user.plan
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
    signIn: '/login',
    error: '/login'
  }
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