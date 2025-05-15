const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Paths
const prismaDir = path.join(process.cwd(), 'prisma');
const dbPath = path.join(prismaDir, 'dev.db');
const envPath = path.join(process.cwd(), '.env');
const envLocalPath = path.join(process.cwd(), '.env.local');

console.log('Starting database fix script...');

// Check if prisma directory exists
if (!fs.existsSync(prismaDir)) {
  console.log('Creating prisma directory...');
  fs.mkdirSync(prismaDir, { recursive: true });
}

// Check if .env file exists, create it if not
if (!fs.existsSync(envPath)) {
  console.log('Creating .env file...');
  fs.writeFileSync(envPath, 'DATABASE_URL="file:./prisma/dev.db"\n');
} else {
  // Check if DATABASE_URL is correctly set in .env
  const envContent = fs.readFileSync(envPath, 'utf8');
  if (!envContent.includes('DATABASE_URL')) {
    console.log('Adding DATABASE_URL to .env file...');
    fs.appendFileSync(envPath, '\nDATABASE_URL="file:./prisma/dev.db"\n');
  } else if (!envContent.includes('file:./prisma/dev.db')) {
    console.log('Fixing DATABASE_URL in .env file...');
    const updatedEnv = envContent.replace(
      /DATABASE_URL=.*$/m,
      'DATABASE_URL="file:./prisma/dev.db"'
    );
    fs.writeFileSync(envPath, updatedEnv);
  }
}

// Check if .env.local file exists, create it if not
if (!fs.existsSync(envLocalPath)) {
  console.log('Creating .env.local file...');
  fs.writeFileSync(envLocalPath, 'DATABASE_URL="file:./prisma/dev.db"\n');
} else {
  // Check if DATABASE_URL is correctly set in .env.local
  const envLocalContent = fs.readFileSync(envLocalPath, 'utf8');
  if (!envLocalContent.includes('DATABASE_URL')) {
    console.log('Adding DATABASE_URL to .env.local file...');
    fs.appendFileSync(envLocalPath, '\nDATABASE_URL="file:./prisma/dev.db"\n');
  } else if (!envLocalContent.includes('file:./prisma/dev.db')) {
    console.log('Fixing DATABASE_URL in .env.local file...');
    const updatedEnvLocal = envLocalContent.replace(
      /DATABASE_URL=.*$/m,
      'DATABASE_URL="file:./prisma/dev.db"'
    );
    fs.writeFileSync(envLocalPath, updatedEnvLocal);
  }
}

// Generate Prisma client
try {
  console.log('Generating Prisma client...');
  execSync('npx prisma generate', { stdio: 'inherit' });
} catch (error) {
  console.error('Error generating Prisma client:', error.message);
}

// Push schema to database if it doesn't exist
if (!fs.existsSync(dbPath)) {
  try {
    console.log('Creating database with Prisma...');
    execSync('npx prisma db push', { stdio: 'inherit' });
  } catch (error) {
    console.error('Error pushing schema to database:', error.message);
  }
}

console.log('Database fix script completed'); 