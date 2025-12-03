# Dream Higher

A smart financial transaction tracking app for small shops (warung) with barcode scanning, AI-powered object detection, and an annoying "Kepo Warung" AI that guesses what you're cooking!

## Features

### 1. Barcode Scanner Transaction
- Seamless scanning without confirmation dialogs (scan, scan, scan, done!)
- Real-time transaction panel with WebSocket sync
- Different sound feedback for IN (stock purchase) vs OUT (sales)
- Quantity adjustment and item removal on the fly

### 2. AI Object Detection
- Camera-based product detection using Kolosal AI
- Split-zone tracking (left/right) to detect item movement direction
- Automatic IN/OUT classification based on movement
- Mirror mode for flexible camera setup

### 3. Dashboard & Analytics
- Daily/weekly/monthly sales summary
- Revenue charts and top-selling products
- Low stock alerts (rule-based, no AI needed)
- Transaction history with filters

### 4. Receipt Generation
- Print receipts via browser
- Download as PDF
- Indonesian Rupiah formatting

### 5. "Kepo Warung" - AI Recipe Guessing
The star feature! An annoying Indonesian shopkeeper AI that:
- Triggers when customer buys 5+ items
- Guesses what they're cooking based on purchases
- Speaks the guess out loud in Indonesian
- Example: *"Wah mau bikin bolu ya mas?? Enak tuh!"*

## Tech Stack

### Backend
- Node.js + Express.js
- SQLite + Prisma ORM
- Socket.io (real-time)

### Frontend
- React + Vite
- Tailwind CSS
- Zustand (state management)
- Chart.js
- html5-qrcode

### AI Services (Powered by Kolosal AI)
| Feature | Provider | API |
|---------|----------|-----|
| Recipe Guessing | Kolosal | `/v1/chat/completions` |
| Object Detection | Kolosal | `/v1/segment/base64` |
| Text-to-Speech | OpenAI | `/v1/audio/speech` |

## Quick Start

### Prerequisites
- Node.js 18+
- npm or yarn
- Kolosal API key
- OpenAI API key (for TTS)

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/dream-higher.git
cd dream-higher

# Backend setup
cd backend
npm install
cp .env.example .env  # Configure your API keys
npx prisma migrate dev
npm run seed
npm run dev

# Frontend setup (new terminal)
cd frontend
npm install
npm run dev
```

### Environment Variables

**Backend (.env)**
```bash
DATABASE_URL="file:./dev.db"
PORT=3001
FRONTEND_URL="http://localhost:5173"
KOLOSAL_API_KEY="your-kolosal-api-key"
KOLOSAL_API_URL="https://api.kolosal.ai"
OPENAI_API_KEY="your-openai-api-key"
```

**Frontend (.env)**
```bash
VITE_API_URL="http://localhost:3001"
VITE_WS_URL="ws://localhost:3001"
```

## Project Structure

```
dream-higher/
├── backend/
│   ├── src/
│   │   ├── routes/
│   │   ├── services/
│   │   └── index.js
│   ├── prisma/
│   │   ├── schema.prisma
│   │   └── seed.js
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── stores/
│   │   └── App.jsx
│   └── package.json
│
├── IMPLEMENTATION_PLAN.md
├── LICENSE
└── README.md
```

## API Endpoints

### Products
- `GET /api/products` - List all products
- `GET /api/products/barcode/:code` - Get product by barcode
- `POST /api/products` - Create product
- `PATCH /api/products/:id` - Update product
- `DELETE /api/products/:id` - Delete product

### Transactions
- `GET /api/transactions` - List transactions
- `POST /api/transactions` - Create transaction
- `POST /api/transactions/:id/items` - Add item to transaction
- `PATCH /api/transactions/:id/items/:itemId` - Update item quantity
- `DELETE /api/transactions/:id/items/:itemId` - Remove item
- `POST /api/transactions/:id/complete` - Complete transaction
- `GET /api/transactions/:id/receipt` - Get receipt

### Analytics
- `GET /api/analytics/summary` - Summary stats
- `GET /api/analytics/revenue` - Revenue data
- `GET /api/analytics/top-products` - Top sellers
- `GET /api/analytics/low-stock` - Low stock alerts

### AI
- `POST /api/ai/detect` - Object detection
- `POST /api/ai/kepo/guess` - Recipe guessing
- `POST /api/ai/kepo/speak` - Text-to-speech

## Acknowledgments

- **Kolosal AI** - AI infrastructure sponsor
- Built for hackathon demonstration

## License

MIT License - see [LICENSE](LICENSE) for details.

---

*"Wah mau bikin bolu ya mas?? Enak tuh!"* - Kepo Warung AI
