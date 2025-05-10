import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function addIsModalColumn() {
  try {
    console.log('Adding isModal column to Page table...');
    
    await prisma.$executeRaw`
      ALTER TABLE "Page" ADD COLUMN IF NOT EXISTS "isModal" BOOLEAN NOT NULL DEFAULT false;
    `;
    
    console.log('Successfully added isModal column!');
  } catch (error) {
    console.error('Error adding isModal column:', error);
  } finally {
    await prisma.$disconnect();
  }
}

addIsModalColumn(); 