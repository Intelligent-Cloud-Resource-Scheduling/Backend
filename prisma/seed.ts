import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  const adminEmail = 'omar@admin.cloud';
  const adminPassword = '123456';

  // 1. Hash the password
  const hashedPassword = await bcrypt.hash(adminPassword, 10);

  // 2. upsert: This means "Update if exists, Create if not"
  // This prevents the script from crashing on unique constraint errors
  const admin = await prisma.admins.upsert({
    where: { email: adminEmail },
    update: {}, // Don't change anything if they already exist
    create: {
      email: adminEmail,
      password: hashedPassword,
    },
  });

  console.log(`✅ Admin account ensured: ${admin.email}`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error('❌ Error during seeding:', e);
    await prisma.$disconnect();
    return;
  });