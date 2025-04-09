import { NextRequest } from 'next/server';
import { verify } from 'jsonwebtoken';
import { cookies } from 'next/headers';
import crypto from 'crypto';
import { hash } from 'bcryptjs';
import jwt from 'jsonwebtoken';

// Verificar se a variável de ambiente JWT_SECRET está definida
const JWT_SECRET = process.env.JWT_SECRET || 'fallback-secret-for-development';

export interface PatientJwtPayload {
  id: string;
  email: string;
  name: string;
  type: 'patient';
}

/**
 * Verifica se o paciente está autenticado via JWT
 */
export async function getAuthenticatedPatient(req: NextRequest) {
  try {
    // Verificar cookie JWT
    const token = req.cookies.get('patient_token')?.value;
    
    if (!token) {
      return null;
    }

    // Verificar validade do token
    const decoded = verify(token, JWT_SECRET) as PatientJwtPayload;
    if (!decoded || decoded.type !== 'patient') {
      return null;
    }

    return decoded;
  } catch (error) {
    console.error('Erro ao verificar autenticação do paciente:', error);
    return null;
  }
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

export function generateToken(patientId: string, type: 'auth' | 'reset'): string {
  const payload = {
    sub: patientId,
    type,
    iat: Math.floor(Date.now() / 1000),
    exp: Math.floor(Date.now() / 1000) + (type === 'auth' ? 60 * 60 * 24 * 7 : 60 * 60) // 7 dias para auth, 1 hora para reset
  };

  return jwt.sign(payload, process.env.JWT_SECRET!);
} 