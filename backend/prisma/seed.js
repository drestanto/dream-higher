import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const products = [
  // Bahan Kue
  { barcode: '8991001234501', name: 'Telur', category: 'Bahan', buyPrice: 2000, sellPrice: 2500, stock: 50, detectionLabel: 'egg' },
  { barcode: '8991001234505', name: 'Susu Kental Manis', category: 'Bahan', buyPrice: 8000, sellPrice: 10000, stock: 15, detectionLabel: 'condensed milk can' },

  // Mie Instan
  { barcode: '089686010947', name: 'Indomie Goreng', category: 'Mie', buyPrice: 2500, sellPrice: 3500, stock: 100, detectionLabel: 'instant noodle pack' },

  // Snack
  { barcode: '089686911101', name: 'Chitato Sapi Panggang', category: 'Snack', buyPrice: 8000, sellPrice: 10000, stock: 25, detectionLabel: 'chips bag' },
  { barcode: '089686911103', name: 'Oreo Original', category: 'Snack', buyPrice: 5000, sellPrice: 7000, stock: 30, detectionLabel: 'cookie pack' },

  // Rokok
  { barcode: '8991001234601', name: 'Gudang Garam Surya', category: 'Rokok', buyPrice: 20000, sellPrice: 25000, stock: 30, detectionLabel: 'cigarette pack' },

  // Low stock (for testing alerts)
  { barcode: '8991001234703', name: 'Keju Kraft', category: 'Bahan', buyPrice: 8000, sellPrice: 12000, stock: 4, detectionLabel: 'cheese block' },

  // Real barcode products
  { barcode: '4987176000552', name: 'Vicks VapoRub', category: 'Obat', buyPrice: 50000, sellPrice: 100000, stock: 10, detectionLabel: 'medicine tube' },
  { barcode: '9325344002642', name: 'Sabun', category: 'Kebutuhan Rumah', buyPrice: 2000, sellPrice: 3000, stock: 20, detectionLabel: 'soap bar' },
  { barcode: '6930444800789', name: 'Pen Tablet', category: 'Elektronik', buyPrice: 1000000, sellPrice: 1200000, stock: 5, detectionLabel: 'tablet box' },
];

async function main() {
  console.log('Seeding database...');

  // Clear existing data
  await prisma.transactionItem.deleteMany();
  await prisma.transaction.deleteMany();
  await prisma.product.deleteMany();

  // Insert products
  for (const product of products) {
    await prisma.product.create({
      data: product,
    });
  }

  console.log(`Seeded ${products.length} products`);

  // Get all products for transaction generation
  const allProducts = await prisma.product.findMany();

  // Helper to get random items from array
  const getRandomItems = (arr, count) => {
    const shuffled = [...arr].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  };

  // Helper to get random int between min and max
  const randomInt = (min, max) => Math.floor(Math.random() * (max - min + 1)) + min;

  // Generate transactions for last 14 days
  const now = new Date();
  let transactionCount = 0;

  for (let daysAgo = 13; daysAgo >= 0; daysAgo--) {
    const date = new Date(now);
    date.setDate(date.getDate() - daysAgo);
    date.setHours(randomInt(8, 20), randomInt(0, 59), 0, 0); // Random time between 8 AM - 8 PM

    // Create 2-5 OUT (sales) transactions per day
    const outCount = randomInt(2, 5);
    for (let i = 0; i < outCount; i++) {
      const txDate = new Date(date);
      txDate.setMinutes(txDate.getMinutes() + i * randomInt(30, 120)); // Space out transactions

      const selectedProducts = getRandomItems(allProducts, randomInt(1, 5));
      const items = selectedProducts.map((p) => ({
        productId: p.id,
        quantity: randomInt(1, 3),
        unitPrice: p.sellPrice,
      }));

      const totalAmount = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);

      await prisma.transaction.create({
        data: {
          type: 'OUT',
          status: 'COMPLETED',
          totalAmount,
          completedAt: txDate,
          createdAt: txDate,
          items: { create: items },
        },
      });

      transactionCount++;
    }

    // Create 0-2 IN (purchases) transactions per day
    const inCount = randomInt(0, 2);
    for (let i = 0; i < inCount; i++) {
      const txDate = new Date(date);
      txDate.setHours(randomInt(9, 17), randomInt(0, 59), 0, 0);

      const selectedProducts = getRandomItems(allProducts, randomInt(3, 8));
      const items = selectedProducts.map((p) => ({
        productId: p.id,
        quantity: randomInt(5, 20),
        unitPrice: p.buyPrice,
      }));

      const totalAmount = items.reduce((sum, item) => sum + item.unitPrice * item.quantity, 0);

      await prisma.transaction.create({
        data: {
          type: 'IN',
          status: 'COMPLETED',
          totalAmount,
          completedAt: txDate,
          createdAt: txDate,
          items: { create: items },
        },
      });

      transactionCount++;
    }
  }

  console.log(`Created ${transactionCount} sample transactions over 14 days`);
  console.log('Seeding complete!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
