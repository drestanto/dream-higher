import { Router } from 'express';
import { prisma } from '../index.js';
import { generateKepoGuess, generateKepoAudio } from '../services/ai.js';

const router = Router();

// Get all transactions
router.get('/', async (req, res) => {
  try {
    const { page = 1, limit = 20, type, status, from, to } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const where = {};
    if (type) where.type = type;
    if (status) where.status = status;
    if (from || to) {
      where.createdAt = {};
      if (from) where.createdAt.gte = new Date(from);
      if (to) where.createdAt.lte = new Date(to);
    }

    const [transactions, total] = await Promise.all([
      prisma.transaction.findMany({
        where,
        include: {
          items: {
            include: { product: true },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit),
      }),
      prisma.transaction.count({ where }),
    ]);

    res.json({
      transactions,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit)),
      },
    });
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ error: 'Failed to fetch transactions' });
  }
});

// Get transaction by ID
router.get('/:id', async (req, res) => {
  try {
    const transaction = await prisma.transaction.findUnique({
      where: { id: req.params.id },
      include: {
        items: {
          include: { product: true },
        },
      },
    });
    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }
    res.json(transaction);
  } catch (error) {
    console.error('Error fetching transaction:', error);
    res.status(500).json({ error: 'Failed to fetch transaction' });
  }
});

// Create transaction
router.post('/', async (req, res) => {
  try {
    const { type } = req.body; // IN or OUT
    const transaction = await prisma.transaction.create({
      data: {
        type: type || 'OUT',
        status: 'PENDING',
      },
      include: {
        items: {
          include: { product: true },
        },
      },
    });
    res.status(201).json(transaction);
  } catch (error) {
    console.error('Error creating transaction:', error);
    res.status(500).json({ error: 'Failed to create transaction' });
  }
});

// Add item to transaction
router.post('/:id/items', async (req, res) => {
  try {
    const { productId, barcode, quantity = 1 } = req.body;
    const transactionId = req.params.id;

    // Find product by ID or barcode
    let product;
    if (productId) {
      product = await prisma.product.findUnique({ where: { id: productId } });
    } else if (barcode) {
      product = await prisma.product.findUnique({ where: { barcode } });
    }

    if (!product) {
      const scannedId = barcode || productId;
      return res.status(404).json({
        error: `Barang ID:${scannedId} tidak ditemukan, bukan punya warung/toko`
      });
    }

    // Get transaction to determine price
    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
    });

    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    // Use sellPrice for OUT (selling), buyPrice for IN (buying stock)
    const unitPrice = transaction.type === 'OUT' ? product.sellPrice : product.buyPrice;

    // Check if item already exists in transaction
    const existingItem = await prisma.transactionItem.findFirst({
      where: {
        transactionId,
        productId: product.id,
      },
    });

    let item;
    if (existingItem) {
      // Update quantity
      item = await prisma.transactionItem.update({
        where: { id: existingItem.id },
        data: { quantity: existingItem.quantity + quantity },
        include: { product: true },
      });
    } else {
      // Create new item
      item = await prisma.transactionItem.create({
        data: {
          transactionId,
          productId: product.id,
          quantity,
          unitPrice,
        },
        include: { product: true },
      });
    }

    // Update total amount
    const allItems = await prisma.transactionItem.findMany({
      where: { transactionId },
    });
    const totalAmount = allItems.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);

    await prisma.transaction.update({
      where: { id: transactionId },
      data: { totalAmount },
    });

    const updatedTransaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
      include: {
        items: { include: { product: true } },
      },
    });

    res.status(201).json({ item, transaction: updatedTransaction });
  } catch (error) {
    console.error('Error adding item:', error);
    res.status(500).json({ error: 'Failed to add item' });
  }
});

// Update item quantity
router.patch('/:id/items/:itemId', async (req, res) => {
  try {
    const { quantity } = req.body;
    const { id: transactionId, itemId } = req.params;

    const item = await prisma.transactionItem.update({
      where: { id: itemId },
      data: { quantity },
      include: { product: true },
    });

    // Update total amount
    const allItems = await prisma.transactionItem.findMany({
      where: { transactionId },
    });
    const totalAmount = allItems.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);

    const transaction = await prisma.transaction.update({
      where: { id: transactionId },
      data: { totalAmount },
      include: {
        items: { include: { product: true } },
      },
    });

    res.json({ item, transaction });
  } catch (error) {
    console.error('Error updating item:', error);
    res.status(500).json({ error: 'Failed to update item' });
  }
});

// Remove item from transaction
router.delete('/:id/items/:itemId', async (req, res) => {
  try {
    const { id: transactionId, itemId } = req.params;

    await prisma.transactionItem.delete({
      where: { id: itemId },
    });

    // Update total amount
    const allItems = await prisma.transactionItem.findMany({
      where: { transactionId },
    });
    const totalAmount = allItems.reduce((sum, i) => sum + i.unitPrice * i.quantity, 0);

    const transaction = await prisma.transaction.update({
      where: { id: transactionId },
      data: { totalAmount },
      include: {
        items: { include: { product: true } },
      },
    });

    res.json({ message: 'Item removed', transaction });
  } catch (error) {
    console.error('Error removing item:', error);
    res.status(500).json({ error: 'Failed to remove item' });
  }
});

// Complete transaction (fast, no AI generation)
router.post('/:id/complete', async (req, res) => {
  try {
    const transactionId = req.params.id;

    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
      include: {
        items: { include: { product: true } },
      },
    });

    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    // Update stock for each item
    for (const item of transaction.items) {
      const stockChange = transaction.type === 'OUT' ? -item.quantity : item.quantity;
      await prisma.product.update({
        where: { id: item.productId },
        data: {
          stock: { increment: stockChange },
        },
      });
    }

    // Complete the transaction (no AI yet - will be generated separately)
    const completedTransaction = await prisma.transaction.update({
      where: { id: transactionId },
      data: {
        status: 'COMPLETED',
        completedAt: new Date(),
      },
      include: {
        items: { include: { product: true } },
      },
    });

    res.json({
      transaction: completedTransaction,
    });
  } catch (error) {
    console.error('Error completing transaction:', error);
    res.status(500).json({ error: 'Failed to complete transaction' });
  }
});

// Generate Kepo AI sentence for a completed transaction
router.post('/:id/generate-kepo', async (req, res) => {
  try {
    const transactionId = req.params.id;

    const transaction = await prisma.transaction.findUnique({
      where: { id: transactionId },
      include: {
        items: { include: { product: true } },
      },
    });

    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    // Only generate for OUT transactions with items
    if (transaction.type !== 'OUT' || transaction.items.length === 0) {
      return res.json({ kepoSentence: null, kepoAudioUrl: null });
    }

    const itemNames = transaction.items.map(
      (i) => `${i.product.name} (${i.quantity})`
    );

    let kepoGuess = null;
    let kepoSentence = null;
    let kepoAudioUrl = null;

    try {
      const kepoResult = await generateKepoGuess(itemNames);

      if (kepoResult && kepoResult.sentence) {
        kepoGuess = JSON.stringify(kepoResult);
        kepoSentence = kepoResult.sentence;
        kepoAudioUrl = await generateKepoAudio(kepoResult.tts, transactionId);
      }
    } catch (aiError) {
      console.error('AI error (non-fatal):', aiError);
    }

    // Update transaction with kepo data
    await prisma.transaction.update({
      where: { id: transactionId },
      data: {
        kepoGuess,
        kepoAudioUrl,
      },
    });

    res.json({
      kepoSentence,
      kepoAudioUrl,
    });
  } catch (error) {
    console.error('Error generating kepo:', error);
    res.status(500).json({ error: 'Failed to generate kepo' });
  }
});

// Cancel/Delete transaction
router.delete('/:id', async (req, res) => {
  try {
    await prisma.transaction.delete({
      where: { id: req.params.id },
    });

    res.json({ message: 'Transaction cancelled' });
  } catch (error) {
    console.error('Error cancelling transaction:', error);
    res.status(500).json({ error: 'Failed to cancel transaction' });
  }
});

// Get receipt
router.get('/:id/receipt', async (req, res) => {
  try {
    const transaction = await prisma.transaction.findUnique({
      where: { id: req.params.id },
      include: {
        items: { include: { product: true } },
      },
    });

    if (!transaction) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    // Parse kepo guess if exists
    let kepoSentence = null;
    if (transaction.kepoGuess) {
      try {
        const parsed = JSON.parse(transaction.kepoGuess);
        kepoSentence = parsed.sentence;
      } catch {
        // Old format - just use as is
        kepoSentence = transaction.kepoGuess;
      }
    }

    const receipt = {
      shopName: 'WARUNG DREAM HIGHER',
      address: 'Jl. Dream Higher Hackathon Imphnen X Kolosal',
      date: transaction.completedAt || transaction.createdAt,
      receiptNumber: `TXN-${new Date(transaction.createdAt).toISOString().slice(0, 10).replace(/-/g, '')}-${transaction.id.slice(0, 4).toUpperCase()}`,
      type: transaction.type === 'OUT' ? 'SALE' : 'PURCHASE',
      items: transaction.items.map((item) => ({
        name: item.product.name,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        total: item.quantity * item.unitPrice,
      })),
      total: transaction.totalAmount,
      kepoSentence, // AI's annoying comment
    };

    res.json(receipt);
  } catch (error) {
    console.error('Error generating receipt:', error);
    res.status(500).json({ error: 'Failed to generate receipt' });
  }
});

export default router;
