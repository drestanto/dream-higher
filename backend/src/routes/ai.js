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

// Match detected object to product by detectionLabel
router.post('/match', async (req, res) => {
  try {
    const { detectedLabel } = req.body;
    const { prisma } = await import('../index.js');

    if (!detectedLabel) {
      return res.status(400).json({ error: 'detectedLabel is required' });
    }

    const normalizedLabel = detectedLabel.toLowerCase().trim();

    // Find product by exact detectionLabel match
    const match = await prisma.product.findFirst({
      where: {
        detectionLabel: {
          equals: normalizedLabel,
        },
      },
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

// Get all detection labels for prompts
router.get('/detection-labels', async (req, res) => {
  try {
    const { prisma } = await import('../index.js');

    const products = await prisma.product.findMany({
      where: {
        detectionLabel: {
          not: null,
        },
      },
      select: {
        id: true,
        name: true,
        detectionLabel: true,
      },
    });

    const labels = products.map((p) => p.detectionLabel);

    res.json({ labels, products });
  } catch (error) {
    console.error('Error fetching detection labels:', error);
    res.status(500).json({ error: 'Failed to fetch detection labels' });
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
