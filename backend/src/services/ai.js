import axios from 'axios';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const KOLOSAL_API_URL = process.env.KOLOSAL_API_URL || 'https://api.kolosal.ai';
const KOLOSAL_API_KEY = process.env.KOLOSAL_API_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// Fallback kepo sentences when AI fails
const FALLBACK_KEPO = [
  { sentence: "Belanja nih? Oke deh, semoga duitnya cukup ya!", tts: "Belanja niiiih? (nada kepo) Oke deeeh, semoga duitnya cukuuup yaaaa! (nada nyindir)" },
  { sentence: "Wah rajin belanja, dompetnya tebel nih kayaknya!", tts: "Waaaah rajin belanjaaaa (kagum palsu), dompetnya tebel nih kayaknyaaaa! (nada iri)" },
  { sentence: "Makasih udah belanja, jangan lupa balik lagi ya!", tts: "Makasiiih udah belanjaaaa (nada males), jangan lupa balik lagi yaaaa! (nada maksa)" },
];

// Generate Kepo guess using Kolosal Chat Completion
export async function generateKepoGuess(items) {
  if (!KOLOSAL_API_KEY) {
    console.warn('KOLOSAL_API_KEY not set, using fallback');
    return FALLBACK_KEPO[Math.floor(Math.random() * FALLBACK_KEPO.length)];
  }

  try {
    const itemList = Array.isArray(items) ? items.join(', ') : items;

    const response = await axios.post(
      `${KOLOSAL_API_URL}/v1/chat/completions`,
      {
        model: 'global.anthropic.claude-sonnet-4-5-20250929-v1:0',
        messages: [
          {
            role: 'system',
            content: `Kamu adalah penjaga warung Indonesia yang SUPER KEPO, NYINYIR, dan NGESELIN. Kamu suka banget nebak-nebak dan nyindir customer.

PERSONALITY:
- Kepo parah, selalu pengen tau mau ngapain
- Nyinyir, suka nyindir halus tapi lucu
- Gaul, pake bahasa anak muda Jakarta (lu/gue, dong, kali, mah, anjir, wkwk)
- Suka kasih backhanded compliment
- Kadang salah nebak tapi pede aja

OUTPUT FORMAT (JSON):
{
  "sentence": "kalimat singkat yang akan ditampilkan",
  "tts": "kalimat dengan panduan prosodi untuk text-to-speech"
}

PANDUAN TTS:
- Tambah huruf vokal untuk penekanan (misal: "tuuuh", "bangeeet")
- Tambah keterangan nada dalam kurung: (nada kepo), (nada nyindir), (nada ngejek), (nada kaget), (nada iri), (bernada ngejek)
- Buat terdengar annoying tapi lucu

CONTOH OUTPUT:
{"sentence":"Mau ngapain tuh? Gambar-gambar di laptop? Udah kayak artis lu!","tts":"Mau ngapain tuuuh? (nada kepo) Gambar-gambar di laptop? (nada heran) Udaaah kayak artiiis luuu! (nada ngejek)"}
{"sentence":"Mentega buat apa? Martabak? Mending pake Wisman. Oh, ga cukup ya uangnya?","tts":"Mentega buat apaaaa? (nada kepo) Martabak? Mending pake Wismaaan. (nada sok tau) Ohhh, ga cukup ya uangnyaaa? (nada nyindir)"}
{"sentence":"Lima Indomie? Diet anak kos nih ye, sehat-sehat ya!","tts":"Lima Indomieeee? (nada kaget) Diet anak kos nih yeeee (ngejek), sehat-sehat yaaaa! (nada sok perhatian)"}
{"sentence":"Beli sabun sama shampoo? Tumben mandi, ada yang mau ditembak?","tts":"Beli sabun sama shampoooo? (nada heran) Tumben mandiii (nyindir), ada yang mau ditembaaak? (nada godain)"}
{"sentence":"Rokok sama kopi doang? Healing ala bapak-bapak banget dah...","tts":"Rokok sama kopi doaaang? (nada males) Healing ala bapak-bapak banget daaah... (nada judging)"}

RULES:
- HANYA output JSON valid, tidak ada text lain
- Sentence maksimal 1-2 kalimat pendek
- JANGAN pakai emoji
- Selalu kreatif dan beda tiap response
- Boleh nebak salah buat lucu-lucuan`,
          },
          {
            role: 'user',
            content: `Barang dibeli: ${itemList}`,
          },
        ],
        max_tokens: 200,
        temperature: 0.9,
      },
      {
        headers: {
          Authorization: `Bearer ${KOLOSAL_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const rawResponse = response.data.choices?.[0]?.message?.content?.trim();
    console.log('Kepo raw response:', rawResponse);

    // Parse JSON response - handle markdown code blocks
    try {
      let jsonStr = rawResponse;

      // Extract JSON from markdown code block if present
      const codeBlockMatch = rawResponse.match(/```(?:json)?\s*([\s\S]*?)```/);
      if (codeBlockMatch) {
        jsonStr = codeBlockMatch[1].trim();
      }

      const parsed = JSON.parse(jsonStr);
      if (parsed.sentence && parsed.tts) {
        return parsed;
      }
    } catch (parseError) {
      console.error('Failed to parse kepo JSON:', parseError.message);
    }

    // Fallback if parsing fails
    return FALLBACK_KEPO[Math.floor(Math.random() * FALLBACK_KEPO.length)];
  } catch (error) {
    console.error('Error generating kepo guess:', error.response?.data || error.message);
    return FALLBACK_KEPO[Math.floor(Math.random() * FALLBACK_KEPO.length)];
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
        voice: 'nova', // nova sounds more expressive/dramatic
        response_format: 'mp3',
        speed: 0.9, // slightly slower for more dramatic effect
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
