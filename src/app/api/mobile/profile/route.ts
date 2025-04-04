import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { validateToken } from '../middleware';
import bcrypt from 'bcryptjs';

/**
 * @swagger
 * /api/mobile/profile:
 *   get:
 *     summary: Obtém o perfil do usuário logado
 *     responses:
 *       200:
 *         description: Perfil do usuário obtido com sucesso
 *       401:
 *         description: Não autorizado
 */
export async function GET(req: NextRequest) {
  try {
    // Validar o token de autenticação
    const validation = await validateToken(req);
    
    if (!validation.isValid || !validation.user) {
      return NextResponse.json(
        { error: validation.error || 'Token inválido' },
        { status: 401 }
      );
    }

    const userId = validation.user.id;

    // Buscar dados do usuário
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
        phone: true,
        specialty: true,
        slug: true,
        plan: true,
        planExpiresAt: true,
        createdAt: true,
        _count: {
          select: {
            indications: true,
            leads: true
          }
        }
      }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    // Buscar estatísticas do último mês
    const lastMonth = new Date();
    lastMonth.setDate(lastMonth.getDate() - 30);

    const clicksCount = await prisma.event.count({
      where: {
        userId,
        type: 'click',
        createdAt: { gte: lastMonth }
      }
    });

    const leadsCount = await prisma.lead.count({
      where: {
        userId,
        createdAt: { gte: lastMonth }
      }
    });

    return NextResponse.json({
      ...user,
      stats: {
        totalIndications: user._count.indications,
        totalLeads: user._count.leads,
        recentClicks: clicksCount,
        recentLeads: leadsCount,
        conversionRate: clicksCount > 0 ? Math.round((leadsCount / clicksCount) * 100) : 0
      }
    });
  } catch (error) {
    console.error('Erro ao buscar perfil do usuário:', error);
    return NextResponse.json(
      { error: 'Erro ao processar a solicitação' },
      { status: 500 }
    );
  }
}

/**
 * @swagger
 * /api/mobile/profile:
 *   put:
 *     summary: Atualiza o perfil do usuário logado
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               phone:
 *                 type: string
 *               specialty:
 *                 type: string
 *               currentPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Perfil atualizado com sucesso
 *       400:
 *         description: Dados inválidos
 *       401:
 *         description: Não autorizado ou senha atual incorreta
 */
export async function PUT(req: NextRequest) {
  try {
    // Validar o token de autenticação
    const validation = await validateToken(req);
    
    if (!validation.isValid || !validation.user) {
      return NextResponse.json(
        { error: validation.error || 'Token inválido' },
        { status: 401 }
      );
    }

    const userId = validation.user.id;

    // Extrair dados do corpo da requisição
    const data = await req.json();
    const { name, phone, specialty, currentPassword, newPassword } = data;

    // Verificar se o usuário existe
    const user = await prisma.user.findUnique({
      where: { id: userId }
    });

    if (!user) {
      return NextResponse.json(
        { error: 'Usuário não encontrado' },
        { status: 404 }
      );
    }

    // Preparar dados para atualização
    const updateData: any = {};
    
    // Atualizar campos básicos
    if (name !== undefined) updateData.name = name;
    if (phone !== undefined) updateData.phone = phone;
    if (specialty !== undefined) updateData.specialty = specialty;

    // Verificar se há alteração de senha
    if (newPassword) {
      // Verificar se a senha atual foi fornecida
      if (!currentPassword) {
        return NextResponse.json(
          { error: 'É necessário fornecer a senha atual para alterá-la' },
          { status: 400 }
        );
      }

      // Verificar se a senha atual está correta
      const passwordValid = await bcrypt.compare(currentPassword, user.password);
      if (!passwordValid) {
        return NextResponse.json(
          { error: 'Senha atual incorreta' },
          { status: 401 }
        );
      }

      // Criptografar a nova senha
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      updateData.password = hashedPassword;
    }

    // Se não há nada para atualizar
    if (Object.keys(updateData).length === 0) {
      return NextResponse.json(
        { error: 'Nenhum campo para atualizar' },
        { status: 400 }
      );
    }

    // Atualizar o usuário
    const updatedUser = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        phone: true,
        specialty: true,
        image: true,
        plan: true
      }
    });

    return NextResponse.json({
      success: true,
      message: 'Perfil atualizado com sucesso',
      user: updatedUser
    });
  } catch (error) {
    console.error('Erro ao atualizar perfil do usuário:', error);
    return NextResponse.json(
      { error: 'Erro ao processar a solicitação' },
      { status: 500 }
    );
  }
} 