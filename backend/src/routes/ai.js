import { Router } from 'express';
import { generateKepoGuess, generateKepoAudio, detectObjects } from '../services/ai.js';

const router = Router();

// Object detection endpoint
router.post('/detect', async (req, res) => {
  try {
    const { image, prompts } = req.body;

    if (!image) {
      return res.status(400).json({ error: 'Image is required' });
    }

    const result = await detectObjects(image, prompts);
    res.json(result);
  } catch (error) {
    console.error('Error in object detection:', error);
    res.status(500).json({ error: 'Failed to detect objects' });
  }
});

// Match detected object to product
router.post('/match', async (req, res) => {
  try {
    const { detectedName } = req.body;
    const { prisma } = await import('../index.js');

    // Try to find a matching product by name (fuzzy match)
    const products = await prisma.product.findMany();

    const normalizedDetected = detectedName.toLowerCase();

    // Simple fuzzy matching
    const match = products.find((p) => {
      const normalizedProduct = p.name.toLowerCase();
      return (
        normalizedProduct.includes(normalizedDetected) ||
        normalizedDetected.includes(normalizedProduct) ||
        normalizedProduct.split(' ').some((word) => normalizedDetected.includes(word))
      );
    });

    if (match) {
      res.json({ matched: true, product: match });
    } else {
      res.json({ matched: false, product: null });
    }
  } catch (error) {
    console.error('Error matching product:', error);
    res.status(500).json({ error: 'Failed to match product' });
  }
});

// Kepo guess endpoint
router.post('/kepo/guess', async (req, res) => {
  try {
    const { items } = req.body;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'Items array is required' });
    }

    const guess = await generateKepoGuess(items);

    if (guess && guess !== 'NULL') {
      res.json({ guess, hasGuess: true });
    } else {
      res.json({ guess: null, hasGuess: false });
    }
  } catch (error) {
    console.error('Error generating kepo guess:', error);
    res.status(500).json({ error: 'Failed to generate guess' });
  }
});

// Kepo speak endpoint (TTS)
router.post('/kepo/speak', async (req, res) => {
  try {
    const { text, transactionId } = req.body;

    if (!text) {
      return res.status(400).json({ error: 'Text is required' });
    }

    const audioUrl = await generateKepoAudio(text, transactionId || 'temp');

    if (audioUrl) {
      res.json({ audioUrl });
    } else {
      res.status(500).json({ error: 'Failed to generate audio' });
    }
  } catch (error) {
    console.error('Error generating speech:', error);
    res.status(500).json({ error: 'Failed to generate speech' });
  }
});

export default router;
