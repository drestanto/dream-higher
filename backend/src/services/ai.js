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
        model: 'tts-1', // faster generation, slightly lower quality
        input: text,
        voice: 'shimmer', // shimmer sounds more natural for Indonesian
        response_format: 'mp3',
        speed: 1.0, // normal speed for natural flow
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

// Generate detection label from product name using Kolosal Chat Completion
export async function generateDetectionLabel(productName, category) {
  if (!KOLOSAL_API_KEY) {
    console.warn('KOLOSAL_API_KEY not set, skipping detection label generation');
    return null;
  }

  try {
    const response = await axios.post(
      `${KOLOSAL_API_URL}/v1/chat/completions`,
      {
        model: 'global.anthropic.claude-sonnet-4-5-20250929-v1:0',
        messages: [
          {
            role: 'system',
            content: `You are an expert in COCO (Common Objects in Context) dataset labels. Your task is to determine the best COCO detection label for a product based on its name and category.

COCO DATASET LABELS (80 classes):
person, bicycle, car, motorcycle, airplane, bus, train, truck, boat, traffic light, fire hydrant, stop sign, parking meter, bench, bird, cat, dog, horse, sheep, cow, elephant, bear, zebra, giraffe, backpack, umbrella, handbag, tie, suitcase, frisbee, skis, snowboard, sports ball, kite, baseball bat, baseball glove, skateboard, surfboard, tennis racket, bottle, wine glass, cup, fork, knife, spoon, bowl, banana, apple, sandwich, orange, broccoli, carrot, hot dog, pizza, donut, cake, chair, couch, potted plant, bed, dining table, toilet, tv, laptop, mouse, remote, keyboard, cell phone, microwave, oven, toaster, sink, refrigerator, book, clock, vase, scissors, teddy bear, hair drier, toothbrush

RULES:
1. Return ONLY the most appropriate COCO label from the list above
2. If the product doesn't match ANY COCO label, return "null"
3. Choose the most generic label that fits (e.g., "Teh Botol" -> "bottle", not "tea")
4. Be conservative - if unsure, return "null"
5. Return ONLY the label string, nothing else

EXAMPLES:
Input: "Teh Botol Sosro", Category: "Minuman"
Output: bottle

Input: "Indomie Goreng", Category: "Mie & Bihun"
Output: null

Input: "Coca Cola 500ml", Category: "Minuman"
Output: bottle

Input: "Beng Beng", Category: "Makanan Ringan"
Output: null

Input: "Pisang Cavendish", Category: "Buah"
Output: banana

Input: "Roti Tawar", Category: "Makanan"
Output: null`,
          },
          {
            role: 'user',
            content: `Product Name: "${productName}", Category: "${category}"`,
          },
        ],
        max_tokens: 50,
        temperature: 0.1,
      },
      {
        headers: {
          Authorization: `Bearer ${KOLOSAL_API_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const label = response.data.choices?.[0]?.message?.content?.trim().toLowerCase();
    console.log(`Detection label for "${productName}": ${label}`);

    // Return null if the AI says "null" or if it's empty
    if (!label || label === 'null' || label === 'none') {
      return null;
    }

    return label;
  } catch (error) {
    console.error('Error generating detection label:', error.response?.data || error.message);
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
