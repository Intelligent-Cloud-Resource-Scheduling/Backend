import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function seedAdmin() {
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

async function seedPlans() {
  const plansToSeed = [
    {
      name: 'Free Plan',
      description: 'Upload your videos and upscale them easily.',
      price: 0,
      max_uploads_per_week: 100,
    },
  ];

  for (const planData of plansToSeed) {
    const existingPlan = await prisma.plans.findFirst({
      where: { name: planData.name },
      select: { id: true, uuid: true },
    });

    if (existingPlan) {
      const updatedPlan = await prisma.plans.update({
        where: { id: existingPlan.id },
        data: {
          description: planData.description,
          price: planData.price,
          max_uploads_per_week: planData.max_uploads_per_week,
        },
      });

      console.log(`✅ Plan updated: ${updatedPlan.name} (${updatedPlan.uuid})`);
    } else {
      const createdPlan = await prisma.plans.create({
        data: planData,
      });

      console.log(`✅ Plan created: ${createdPlan.name} (${createdPlan.uuid})`);
    }
  }
}

async function main() {
  console.log('🌱 Seeding database...');
  await seedAdmin();
  await seedPlans();
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