import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const KOLOSAL_API_URL = process.env.KOLOSAL_API_URL || 'https://api.kolosal.ai';
const KOLOSAL_API_KEY = process.env.KOLOSAL_API_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// Generate Kepo guess using Kolosal Chat Completion
export async function generateKepoGuess(items) {
  if (!KOLOSAL_API_KEY) {
    console.warn('KOLOSAL_API_KEY not set, skipping kepo guess');
    return null;
  }

  try {
    const itemList = Array.isArray(items) ? items.join(', ') : items;

    const response = await axios.post(
      `${KOLOSAL_API_URL}/v1/chat/completions`,
      {
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'system',
            content: `Kamu adalah penjaga warung Indonesia yang kepo dan suka nebak-nebak masakan.
Berdasarkan barang yang dibeli, tebak mau masak/bikin apa.

RULES:
- Jawab HANYA jika kamu yakin ada resep yang cocok
- Jika tidak yakin atau barang tidak berhubungan dengan masakan, jawab HANYA dengan kata: NULL
- Jika yakin, jawab dengan gaya bahasa Indonesia santai, kepo, sedikit annoying
- Maksimal 1-2 kalimat pendek
- Boleh pakai "mas", "mbak", "bang", "kak" secara random
- JANGAN gunakan emoji

Contoh jawaban VALID:
- "Wah mau bikin bolu ya mas? Enak tuh!"
- "Nasi goreng nih pasti! Jangan lupa kerupuknya bang!"
- "Martabak manis kayaknya, buat pacar ya mbak?"
- "Banyak indomie, anak kos ya kak?"

Contoh jawaban jika TIDAK YAKIN:
- NULL`,
          },
          {
            role: 'user',
            content: `Barang dibeli: ${itemList}`,
          },
        ],
        max_tokens: 100,
        temperature: 0.8,
      },
      {
        headers: {
          Authorization: `Bearer ${KOLOSAL_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const guess = response.data.choices?.[0]?.message?.content?.trim();
    console.log('Kepo guess:', guess);

    return guess;
  } catch (error) {
    console.error('Error generating kepo guess:', error.response?.data || error.message);
    return null;
  }
}

// Generate audio using OpenAI TTS
export async function generateKepoAudio(text, transactionId) {
  if (!OPENAI_API_KEY) {
    console.warn('OPENAI_API_KEY not set, skipping TTS');
    return null;
  }

  try {
    const response = await axios.post(
      'https://api.openai.com/v1/audio/speech',
      {
        model: 'tts-1',
        input: text,
        voice: 'alloy',
        response_format: 'mp3',
      },
      {
        headers: {
          Authorization: `Bearer ${OPENAI_API_KEY}`,
          'Content-Type': 'application/json',
        },
        responseType: 'arraybuffer',
      }
    );

    // Save audio file
    const audioDir = path.join(__dirname, '../../public/audio');
    if (!fs.existsSync(audioDir)) {
      fs.mkdirSync(audioDir, { recursive: true });
    }

    const filename = `kepo-${transactionId}.mp3`;
    const filepath = path.join(audioDir, filename);

    fs.writeFileSync(filepath, Buffer.from(response.data));

    console.log('Audio saved:', filepath);

    return `/audio/${filename}`;
  } catch (error) {
    console.error('Error generating audio:', error.response?.data || error.message);
    return null;
  }
}

// Object detection using Kolosal API
export async function detectObjects(imageBase64, prompts = ['bottle', 'food', 'snack', 'drink']) {
  if (!KOLOSAL_API_KEY) {
    console.warn('KOLOSAL_API_KEY not set, skipping object detection');
    return { success: false, results: [] };
  }

  const startTime = Date.now();
  console.log(`[LATENCY] Kolosal API call starting... (prompts: ${prompts.join(', ')})`);

  try {
    const response = await axios.post(
      `${KOLOSAL_API_URL}/v1/segment/base64`,
      {
        image: imageBase64,
        prompts: prompts,
        return_masks: false,
        return_annotated: false,
        threshold: 0.5,
      },
      {
        headers: {
          Authorization: `Bearer ${KOLOSAL_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const endTime = Date.now();
    const kolosalProcessTime = response.data.processing_time_ms || 'N/A';
    console.log(`[LATENCY] Kolosal API response: ${endTime - startTime}ms (internal: ${kolosalProcessTime}ms)`);
    console.log(`[LATENCY] Results: ${response.data.results?.length || 0} objects detected`);

    return response.data;
  } catch (error) {
    const endTime = Date.now();
    console.error(`[LATENCY] Kolosal API error after ${endTime - startTime}ms:`, error.response?.data || error.message);
    return { success: false, results: [], error: error.message };
  }
}
