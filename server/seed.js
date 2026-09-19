import 'dotenv/config';
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

const CATEGORIES = [
  { name: 'Food', icon: '🍔', color: '#f97316' },
  { name: 'Transport', icon: '🚗', color: '#3b82f6' },
  { name: 'Shopping', icon: '🛍️', color: '#ec4899' },
  { name: 'Education', icon: '📚', color: '#8b5cf6' },
  { name: 'Entertainment', icon: '🎮', color: '#06b6d4' },
  { name: 'Bills', icon: '📄', color: '#ef4444' },
  { name: 'Health', icon: '🏥', color: '#10b981' },
  { name: 'Travel', icon: '✈️', color: '#f59e0b' },
  { name: 'Other', icon: '📦', color: '#6b7280' }
];

async function seed() {
  console.log('🌱 Seeding database...\n');

  // Create demo user
  const passwordHash = await bcrypt.hash('Demo1234', 12);
  const user = await prisma.user.upsert({
    where: { email: 'demo@financetracker.com' },
    update: {},
    create: {
      email: 'demo@financetracker.com',
      passwordHash
    }
  });

  console.log(`  👤 User: demo@financetracker.com / Demo1234`);

  // Create profile
  await prisma.profile.upsert({
    where: { userId: user.id },
    update: {},
    create: { userId: user.id, fullName: 'Demo User' }
  });

  // Create settings
  await prisma.userSettings.upsert({
    where: { userId: user.id },
    update: {},
    create: { userId: user.id }
  });

  // Create categories
  const categoryMap = {};
  for (const cat of CATEGORIES) {
    const category = await prisma.category.upsert({
      where: { userId_name: { userId: user.id, name: cat.name } },
      update: {},
      create: { userId: user.id, ...cat, isDefault: true }
    });
    categoryMap[cat.name] = category.id;
  }

  // Create sample expenses for the past 60 days
  const expenses = [];
  const merchants = {
    Food: ["McDonald's", 'Zomato', 'Swiggy', 'Dominos', 'Cafe Coffee Day', 'Restaurant', 'Bakery'],
    Transport: ['Uber', 'Ola', 'Metro', 'Auto', 'Petrol Pump', 'Rapido'],
    Shopping: ['Amazon', 'Flipkart', 'Myntra', 'D-Mart', 'Big Bazaar', 'Local Market'],
    Education: ['Udemy', 'Coursera', 'Books', 'Stationery', 'Course Fee'],
    Entertainment: ['Netflix', 'Movie Tickets', 'Spotify', 'Gaming', 'Concert'],
    Bills: ['Electricity', 'Water', 'Internet', 'Phone', 'Gas', 'Rent'],
    Health: ['Pharmacy', 'Doctor Visit', 'Lab Test', 'Gym', 'Medicine'],
    Travel: ['Train Ticket', 'Bus Ticket', 'Hotel', 'Flight', 'Tourism'],
    Other: ['ATM Fee', 'Courier', 'Gift', 'Miscellaneous', 'Donation']
  };

  const paymentMethods = ['Cash', 'UPI', 'Debit Card', 'Credit Card', 'Bank Transfer'];

  for (let daysAgo = 0; daysAgo < 60; daysAgo++) {
    const date = new Date();
    date.setDate(date.getDate() - daysAgo);
    date.setHours(0, 0, 0, 0);

    // 1-4 expenses per day
    const count = Math.floor(Math.random() * 4) + 1;
    for (let i = 0; i < count; i++) {
      const catName = CATEGORIES[Math.floor(Math.random() * CATEGORIES.length)].name;
      const merchList = merchants[catName];
      expenses.push({
        userId: user.id,
        categoryId: categoryMap[catName],
        amount: Math.round((Math.random() * 1500 + 50) * 100) / 100,
        merchant: merchList[Math.floor(Math.random() * merchList.length)],
        date,
        note: '',
        paymentMethod: paymentMethods[Math.floor(Math.random() * paymentMethods.length)]
      });
    }
  }

  // Delete existing demo expenses
  await prisma.expense.deleteMany({ where: { userId: user.id } });

  // Insert all
  await prisma.expense.createMany({ data: expenses });
  console.log(`  💰 Created ${expenses.length} sample expenses`);

  // Create a monthly budget
  const now = new Date();
  await prisma.budget.upsert({
    where: { userId_month_year: { userId: user.id, month: now.getMonth() + 1, year: now.getFullYear() } },
    update: {},
    create: {
      userId: user.id,
      monthlyLimit: 20000,
      month: now.getMonth() + 1,
      year: now.getFullYear()
    }
  });
  console.log(`  📊 Created monthly budget: ₹20,000`);

  console.log('\n✅ Seed complete!\n');
}

seed()
  .catch(e => {
    console.error('Seed error:', e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
