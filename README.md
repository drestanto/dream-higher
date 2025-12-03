# Dream Higher

A smart financial transaction tracking app for small shops (warung) with barcode scanning and an annoying "Kepo Warung" AI that guesses what you're cooking!

## Features

### 1. Barcode Scanner Transaction
- Seamless scanning without confirmation dialogs (scan, scan, scan, done!)
- Real-time transaction panel with WebSocket sync
- Different sound feedback for IN (stock purchase) vs OUT (sales)
- Quantity adjustment and item removal on the fly

### 2. Dashboard & Analytics
- Daily sales summary with revenue charts
- Top-selling products visualization
- Category breakdown (doughnut chart)
- Low stock alerts (rule-based threshold)
- Transaction history with filters

### 3. Receipt Generation
- Print receipts via browser
- Indonesian Rupiah formatting
- Transaction details with itemized list

### 4. "Kepo Warung" - AI Recipe Guessing
The star feature! An annoying Indonesian shopkeeper AI that:
- Triggers when customer buys 5+ items
- Guesses what they're cooking based on purchases
- Speaks the guess out loud in Indonesian
- Example: *"Wah mau bikin bolu ya mas?? Enak tuh!"*
- Stays silent if no confident guess (returns NULL)

## Tech Stack

### Backend
- **Runtime:** Node.js 18+
- **Framework:** Express.js 5
- **Database:** SQLite + Prisma ORM 5
- **Real-time:** Socket.io 4.8

### Frontend
- **Framework:** React 19 + Vite 7
- **Styling:** Tailwind CSS 4
- **State:** Zustand
- **Charts:** Chart.js + react-chartjs-2
- **Icons:** Lucide React

### Barcode Scanning
| Mode | Technology | Description |
|------|------------|-------------|
| Live Camera | `barcode-detector` (ponyfill) | Real-time scanning via browser camera using ZXing-based polyfill |
| Image Upload | `zxing-wasm` (backend) | Upload photo to backend for processing, more reliable for small/blurry barcodes |

**Supported formats:** EAN-13, EAN-8, UPC-A, UPC-E, Code-128, Code-39, Code-93, ITF, QR Code

**Note:** Live camera scanning depends on camera quality. For small barcodes or low-res cameras, use the "Upload Foto" feature.

### AI Services
| Feature | Provider | API |
|---------|----------|-----|
| Recipe Guessing | Kolosal | `/v1/chat/completions` |
| Object Detection | Kolosal | `/v1/segment/base64` |
| Text-to-Speech | OpenAI | `/v1/audio/speech` |

## Quick Start

### Prerequisites
- Node.js 18+
- npm
- Kolosal API key (for AI features)
- OpenAI API key (for TTS)

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/dream-higher.git
cd dream-higher

# Backend setup
cd backend
npm install
npx prisma db push
npm run seed
npm run dev
# Server runs on http://localhost:3001

# Frontend setup (new terminal)
cd frontend
npm install
npm run dev
# App runs on http://localhost:5173
```

### Environment Variables

**Backend (`backend/.env`)**
```bash
DATABASE_URL="file:./dev.db"
PORT=3001
FRONTEND_URL="http://localhost:5173"
KOLOSAL_API_KEY="your-kolosal-api-key"
KOLOSAL_API_URL="https://api.kolosal.ai"
OPENAI_API_KEY="your-openai-api-key"
```

**Frontend (`frontend/.env`)**
```bash
VITE_API_URL=http://localhost:3001
VITE_WS_URL=ws://localhost:3001
```

## Project Structure

```
dream-higher/
├── backend/
│   ├── src/
│   │   ├── routes/
│   │   │   ├── products.js      # Product CRUD + barcode lookup
│   │   │   ├── transactions.js  # Transaction management
│   │   │   ├── analytics.js     # Dashboard data
│   │   │   └── ai.js            # Kepo Warung + detection
│   │   ├── services/
│   │   │   ├── ai.js            # Kolosal & OpenAI integration
│   │   │   └── socket.js        # WebSocket handler
│   │   └── index.js             # Express + Socket.io server
│   ├── prisma/
│   │   ├── schema.prisma        # Database schema
│   │   └── seed.js              # 38 Indonesian products
│   ├── public/audio/            # Generated TTS files
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Layout.jsx           # 3-panel layout
│   │   │   ├── BarcodeScanner.jsx   # barcode-detector + upload
│   │   │   ├── TransactionPanel.jsx # Right panel
│   │   │   ├── KepoPopup.jsx        # AI guess popup
│   │   │   └── Receipt.jsx          # Print receipt
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx    # Charts & stats
│   │   │   ├── ScanPage.jsx     # Scanner + transaction
│   │   │   ├── History.jsx      # Transaction history
│   │   │   └── Products.jsx     # Product catalog
│   │   ├── stores/
│   │   │   └── transactionStore.js  # Zustand store
│   │   ├── services/
│   │   │   ├── api.js           # Axios instance
│   │   │   ├── socket.js        # Socket.io client
│   │   │   └── sound.js         # Web Audio beeps
│   │   ├── App.jsx              # React Router
│   │   ├── main.jsx             # Entry point
│   │   └── index.css            # Tailwind + custom styles
│   └── package.json
│
├── IMPLEMENTATION_PLAN.md
├── TESTING_GUIDE.md
├── TRACABLE_AI_GENERATED_CODE.md
├── CONTINUE_FROM_HERE.md
├── LICENSE
└── README.md
```

## API Endpoints

### Products
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/products` | List all products |
| GET | `/api/products/barcode/:code` | Get by barcode |
| POST | `/api/products/scan-image` | Scan barcode from base64 image (zxing-wasm) |
| POST | `/api/products` | Create product |
| PATCH | `/api/products/:id` | Update product |
| DELETE | `/api/products/:id` | Delete product |

### Transactions
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/transactions` | List with pagination |
| POST | `/api/transactions` | Create (IN/OUT) |
| POST | `/api/transactions/:id/items` | Add item by barcode |
| PATCH | `/api/transactions/:id/items/:itemId` | Update quantity |
| DELETE | `/api/transactions/:id/items/:itemId` | Remove item |
| POST | `/api/transactions/:id/complete` | Complete & trigger Kepo |
| DELETE | `/api/transactions/:id` | Cancel transaction |
| GET | `/api/transactions/:id/receipt` | Get receipt data |

### Analytics
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/analytics/summary` | Today's stats |
| GET | `/api/analytics/revenue` | 30-day revenue |
| GET | `/api/analytics/top-products` | Best sellers |
| GET | `/api/analytics/categories` | Sales by category |
| GET | `/api/analytics/low-stock` | Low stock items |

### AI
| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | `/api/ai/detect` | Object detection |
| POST | `/api/ai/kepo/guess` | Recipe guessing |
| POST | `/api/ai/kepo/speak` | Generate TTS |

## WebSocket Events

| Event | Direction | Description |
|-------|-----------|-------------|
| `transaction:created` | Server → Client | New transaction started |
| `transaction:item-added` | Server → Client | Item added to transaction |
| `transaction:item-updated` | Server → Client | Item quantity changed |
| `transaction:item-removed` | Server → Client | Item removed |
| `transaction:completed` | Server → Client | Transaction completed |
| `transaction:cancelled` | Server → Client | Transaction cancelled |

## Seeded Products (38 items)

Categories included in seed data:
- **Minuman** - Teh Botol, Aqua, Pocari Sweat, etc.
- **Makanan Ringan** - Chitato, Oreo, Indomie, etc.
- **Mie & Bihun** - Indomie variants, Mie Sedaap
- **Bumbu Dapur** - Kecap, Sambal, Minyak Goreng, etc.
- **Rokok** - Gudang Garam, Sampoerna, Djarum
- **Kebutuhan Rumah Tangga** - Rinso, Sunlight, Baygon

## Acknowledgments

- **Kolosal AI** - AI infrastructure sponsor
- Built for hackathon demonstration

## License

MIT License - see [LICENSE](LICENSE) for details.

---

*"Wah mau bikin bolu ya mas?? Enak tuh!"* - Kepo Warung AI
