import { Router } from 'express';
import { prisma } from '../index.js';
import { readBarcodes } from 'zxing-wasm';
import { generateDetectionLabel } from '../services/ai.js';

const router = Router();

// Scan barcode from base64 image
router.post('/scan-image', async (req, res) => {
  try {
    const { image } = req.body; // base64 image data

    if (!image) {
      return res.status(400).json({ error: 'No image provided' });
    }

    // Remove data URL prefix if present
    const base64Data = image.replace(/^data:image\/\w+;base64,/, '');
    const imageBuffer = Buffer.from(base64Data, 'base64');
    const blob = new Blob([imageBuffer], { type: 'image/jpeg' });

    const results = await readBarcodes(blob, {
      tryHarder: true,
      formats: ['EAN-13', 'EAN-8', 'UPC-A', 'UPC-E', 'Code128', 'Code39', 'QRCode'],
      maxNumberOfSymbols: 5,
    });

    if (results.length === 0) {
      return res.status(404).json({ error: 'No barcode detected in image' });
    }

    // Return all detected barcodes
    const barcodes = results.map(r => ({
      format: r.format,
      value: r.text,
    }));

    res.json({ barcodes });
  } catch (error) {
    console.error('Error scanning barcode from image:', error);
    res.status(500).json({ error: 'Failed to scan barcode' });
  }
});

// Get all products
router.get('/', async (req, res) => {
  try {
    const products = await prisma.product.findMany({
      orderBy: { name: 'asc' },
    });
    res.json(products);
  } catch (error) {
    console.error('Error fetching products:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// Get products for AI detection (lightweight, with detection labels only)
router.get('/for-detection', async (req, res) => {
  try {
    const priceType = req.query.priceType || 'selling'; // 'selling' or 'cost'

    const products = await prisma.product.findMany({
      where: {
        detectionLabel: { not: null },
      },
      select: {
        id: true,
        name: true,
        barcode: true,
        detectionLabel: true,
        sellPrice: true,
        buyPrice: true,
      },
    });

    // Map to simplified format with single price based on priceType
    const result = products.map((p) => ({
      id: p.id,
      name: p.name,
      barcode: p.barcode,
      detectionLabel: p.detectionLabel,
      price: priceType === 'cost' ? p.buyPrice : p.sellPrice,
    }));

    res.json(result);
  } catch (error) {
    console.error('Error fetching products for detection:', error);
    res.status(500).json({ error: 'Failed to fetch products' });
  }
});

// Get product by barcode
router.get('/barcode/:code', async (req, res) => {
  try {
    const product = await prisma.product.findUnique({
      where: { barcode: req.params.code },
    });
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json(product);
  } catch (error) {
    console.error('Error fetching product by barcode:', error);
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

// Get product by ID
router.get('/:id', async (req, res) => {
  try {
    const product = await prisma.product.findUnique({
      where: { id: req.params.id },
    });
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    res.json(product);
  } catch (error) {
    console.error('Error fetching product:', error);
    res.status(500).json({ error: 'Failed to fetch product' });
  }
});

// Create product
router.post('/', async (req, res) => {
  try {
    const { barcode, name, buyPrice, sellPrice, stock, category, imageUrl, lowStockThreshold } = req.body;

    // Auto-generate detection label using Kolosal AI
    let detectionLabel = null;
    try {
      detectionLabel = await generateDetectionLabel(name, category);
      console.log(`Auto-generated detection label for "${name}": ${detectionLabel || 'none'}`);
    } catch (aiError) {
      console.warn('Failed to generate detection label:', aiError.message);
      // Continue without detection label if AI fails
    }

    const product = await prisma.product.create({
      data: {
        barcode,
        name,
        buyPrice,
        sellPrice,
        stock: stock || 0,
        category,
        imageUrl,
        lowStockThreshold: lowStockThreshold || 5,
        detectionLabel,
      },
    });
    res.status(201).json(product);
  } catch (error) {
    console.error('Error creating product:', error);
    if (error.code === 'P2002') {
      return res.status(400).json({ error: 'Barcode already exists' });
    }
    res.status(500).json({ error: 'Failed to create product' });
  }
});

// Update product
router.patch('/:id', async (req, res) => {
  try {
    const product = await prisma.product.update({
      where: { id: req.params.id },
      data: req.body,
    });
    res.json(product);
  } catch (error) {
    console.error('Error updating product:', error);
    res.status(500).json({ error: 'Failed to update product' });
  }
});

// Delete product
router.delete('/:id', async (req, res) => {
  try {
    await prisma.product.delete({
      where: { id: req.params.id },
    });
    res.json({ message: 'Product deleted' });
  } catch (error) {
    console.error('Error deleting product:', error);
    res.status(500).json({ error: 'Failed to delete product' });
  }
});

export default router;
