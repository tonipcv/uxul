const { PrismaClient } = require('@prisma/client')
const prisma = new PrismaClient()

async function testConnection() {
  try {
    await prisma.$connect()
    console.log('✅ Conexão com o banco de dados estabelecida com sucesso!')
  } catch (error) {
    console.error('❌ Erro ao conectar com o banco de dados:', error)
  } finally {
    await prisma.$disconnect()
  }
}

testConnection() 