import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const products = [
  // Bahan Kue
  { barcode: '8991001234501', name: 'Telur', category: 'Bahan', buyPrice: 2000, sellPrice: 2500, stock: 50 },
  { barcode: '8991001234502', name: 'Tepung Terigu Segitiga', category: 'Bahan', buyPrice: 8000, sellPrice: 10000, stock: 30 },
  { barcode: '8991001234503', name: 'Gula Pasir', category: 'Bahan', buyPrice: 12000, sellPrice: 14000, stock: 25 },
  { barcode: '8991001234504', name: 'Mentega BlueBand', category: 'Bahan', buyPrice: 5000, sellPrice: 7000, stock: 20 },
  { barcode: '8991001234505', name: 'Susu Kental Manis', category: 'Bahan', buyPrice: 8000, sellPrice: 10000, stock: 15 },

  // Mie Instan
  { barcode: '089686010947', name: 'Indomie Goreng', category: 'Mie', buyPrice: 2500, sellPrice: 3500, stock: 100 },
  { barcode: '089686010954', name: 'Indomie Soto', category: 'Mie', buyPrice: 2500, sellPrice: 3500, stock: 80 },
  { barcode: '089686010961', name: 'Indomie Kari Ayam', category: 'Mie', buyPrice: 2500, sellPrice: 3500, stock: 60 },
  { barcode: '089686010978', name: 'Indomie Ayam Bawang', category: 'Mie', buyPrice: 2500, sellPrice: 3500, stock: 70 },
  { barcode: '089686010985', name: 'Mie Sedaap Goreng', category: 'Mie', buyPrice: 2500, sellPrice: 3500, stock: 50 },

  // Bumbu & Minyak
  { barcode: '8991001234509', name: 'Kecap Manis ABC', category: 'Bumbu', buyPrice: 5000, sellPrice: 7000, stock: 25 },
  { barcode: '8991001234510', name: 'Minyak Goreng Bimoli 1L', category: 'Bahan', buyPrice: 15000, sellPrice: 18000, stock: 20 },
  { barcode: '8991001234511', name: 'Bawang Merah 100g', category: 'Bumbu', buyPrice: 3000, sellPrice: 5000, stock: 40 },
  { barcode: '8991001234512', name: 'Bawang Putih 100g', category: 'Bumbu', buyPrice: 3000, sellPrice: 5000, stock: 40 },
  { barcode: '8991001234513', name: 'Garam Dapur', category: 'Bumbu', buyPrice: 2000, sellPrice: 3000, stock: 30 },
  { barcode: '8991001234514', name: 'Merica Bubuk', category: 'Bumbu', buyPrice: 3000, sellPrice: 5000, stock: 20 },

  // Minuman
  { barcode: '089686911015', name: 'Aqua 600ml', category: 'Minuman', buyPrice: 3000, sellPrice: 4000, stock: 100 },
  { barcode: '089686911022', name: 'Teh Botol Sosro', category: 'Minuman', buyPrice: 4000, sellPrice: 5000, stock: 50 },
  { barcode: '089686911039', name: 'Pocari Sweat 500ml', category: 'Minuman', buyPrice: 7000, sellPrice: 9000, stock: 30 },
  { barcode: '089686911046', name: 'Coca Cola 390ml', category: 'Minuman', buyPrice: 5000, sellPrice: 7000, stock: 40 },
  { barcode: '089686911053', name: 'Sprite 390ml', category: 'Minuman', buyPrice: 5000, sellPrice: 7000, stock: 40 },
  { barcode: '089686911060', name: 'Fanta 390ml', category: 'Minuman', buyPrice: 5000, sellPrice: 7000, stock: 35 },

  // Snack
  { barcode: '089686911101', name: 'Chitato Sapi Panggang', category: 'Snack', buyPrice: 8000, sellPrice: 10000, stock: 25 },
  { barcode: '089686911102', name: 'Lays Original', category: 'Snack', buyPrice: 8000, sellPrice: 10000, stock: 20 },
  { barcode: '089686911103', name: 'Oreo Original', category: 'Snack', buyPrice: 5000, sellPrice: 7000, stock: 30 },
  { barcode: '089686911104', name: 'Tango Wafer Coklat', category: 'Snack', buyPrice: 4000, sellPrice: 6000, stock: 25 },
  { barcode: '089686911105', name: 'Biskuat Coklat', category: 'Snack', buyPrice: 3000, sellPrice: 5000, stock: 35 },

  // Bahan Lainnya
  { barcode: '8991001234518', name: 'Santan Kara', category: 'Bahan', buyPrice: 5000, sellPrice: 7000, stock: 20 },
  { barcode: '8991001234519', name: 'Gula Merah', category: 'Bahan', buyPrice: 8000, sellPrice: 10000, stock: 15 },
  { barcode: '8991001234520', name: 'Beras 1kg', category: 'Bahan', buyPrice: 12000, sellPrice: 14000, stock: 50 },
  { barcode: '8991001234521', name: 'Tepung Beras', category: 'Bahan', buyPrice: 6000, sellPrice: 8000, stock: 15 },
  { barcode: '8991001234522', name: 'Kelapa Parut', category: 'Bahan', buyPrice: 5000, sellPrice: 7000, stock: 10 },

  // Rokok (for realistic warung)
  { barcode: '8991001234601', name: 'Gudang Garam Surya', category: 'Rokok', buyPrice: 20000, sellPrice: 25000, stock: 30 },
  { barcode: '8991001234602', name: 'Djarum Super', category: 'Rokok', buyPrice: 18000, sellPrice: 22000, stock: 25 },
  { barcode: '8991001234603', name: 'Sampoerna Mild', category: 'Rokok', buyPrice: 22000, sellPrice: 28000, stock: 20 },

  // Low stock items (for testing alerts)
  { barcode: '8991001234701', name: 'Vanili Bubuk', category: 'Bahan', buyPrice: 2000, sellPrice: 3000, stock: 3 },
  { barcode: '8991001234702', name: 'Coklat Bubuk', category: 'Bahan', buyPrice: 5000, sellPrice: 7000, stock: 2 },
  { barcode: '8991001234703', name: 'Keju Kraft', category: 'Bahan', buyPrice: 8000, sellPrice: 12000, stock: 4 },

  // Real barcode products (for testing with actual items)
  { barcode: '4987176000552', name: 'Vicks VapoRub', category: 'Obat', buyPrice: 50000, sellPrice: 100000, stock: 10 },
  { barcode: '9325344002642', name: 'Sabun', category: 'Kebutuhan Rumah', buyPrice: 2000, sellPrice: 3000, stock: 20 },
  { barcode: '6930444800789', name: 'Pen Tablet', category: 'Elektronik', buyPrice: 1000000, sellPrice: 1200000, stock: 5 },
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

  // Create some sample transactions
  const sampleProducts = await prisma.product.findMany({ take: 5 });

  // Sample completed transaction
  const tx1 = await prisma.transaction.create({
    data: {
      type: 'OUT',
      status: 'COMPLETED',
      totalAmount: sampleProducts.slice(0, 3).reduce((sum, p) => sum + p.sellPrice, 0),
      completedAt: new Date(),
      items: {
        create: sampleProducts.slice(0, 3).map((p) => ({
          productId: p.id,
          quantity: 1,
          unitPrice: p.sellPrice,
        })),
      },
    },
  });

  console.log('Created sample transaction:', tx1.id);
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
