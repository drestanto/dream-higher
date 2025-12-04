# Dream Higher

A smart financial transaction tracking app for small shops (warung) with barcode scanning, AI object detection, and manual cashier system.

## Features

### 1. Multi-Mode Transaction Input
Three ways to add items to a transaction:

| Mode | Description |
|------|-------------|
| **Barcode Scanner** | Live camera scanning using ZXing-based detector |
| **AI Object Detection** | Kolosal AI detects products via camera movement (dalam → luar = jual, luar → dalam = beli) |
| **Manual Cashier** | Click product cards from a searchable grid |

### 2. Transaction Types
- **Customer Beli (OUT)** - Selling to customers, uses sell price
- **Beli ke Vendor (IN)** - Buying from suppliers, uses buy price

### 3. Dashboard & Analytics
- Daily sales summary with revenue charts
- Top-selling products visualization
- Category breakdown (doughnut chart)
- Low stock alerts (rule-based threshold)
- Transaction history with filters

### 4. Receipt System
- 2-step flow: Summary view → Isolated print page (new tab)
- Print receipts via browser
- Indonesian Rupiah formatting
- Transaction details with itemized list

### 5. Manual Quantity Input
- Click quantity number to edit directly
- Supports +/- buttons or manual typing
- Validates on blur (invalid input reverts)

## Tech Stack

### Backend
- **Runtime:** Node.js 18+
- **Framework:** Express.js
- **Database:** SQLite + Prisma ORM

### Frontend
- **Framework:** React 19 + Vite
- **Styling:** Tailwind CSS
- **State:** Zustand
- **Charts:** Chart.js + react-chartjs-2
- **Icons:** Lucide React

### Barcode Scanning
| Mode | Technology | Description |
|------|------------|-------------|
| Live Camera | `barcode-detector` (ponyfill) | Real-time scanning via browser camera using ZXing-based polyfill |
| Image Upload | `zxing-wasm` (backend) | Upload photo to backend for processing, more reliable for small/blurry barcodes |

**Supported formats:** EAN-13, EAN-8, UPC-A, UPC-E, Code-128, Code-39, Code-93, ITF, QR Code

### AI Services
| Feature | Provider | API |
|---------|----------|-----|
| Object Detection | Kolosal | `/v1/segment/base64` |
| Recipe Guessing (planned) | Kolosal | `/v1/chat/completions` |
| Text-to-Speech (planned) | OpenAI | `/v1/audio/speech` |

## Quick Start

### Prerequisites
- Node.js 18+
- npm
- Kolosal API key (for AI features)
- OpenAI API key (for TTS - optional)

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
│   │   │   └── ai.js            # AI detection endpoints
│   │   ├── services/
│   │   │   └── ai.js            # Kolosal & OpenAI integration
│   │   └── index.js             # Express server
│   ├── prisma/
│   │   ├── schema.prisma        # Database schema
│   │   └── seed.js              # 41 Indonesian products
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── components/
│   │   │   ├── Layout.jsx              # 3-panel layout
│   │   │   ├── BarcodeScanner.jsx      # barcode-detector + upload
│   │   │   ├── ObjectDetectionScanner.jsx  # AI detection
│   │   │   ├── TransactionPanel.jsx    # Right panel
│   │   │   ├── KepoPopup.jsx           # AI guess popup
│   │   │   └── Receipt.jsx             # Receipt component
│   │   ├── pages/
│   │   │   ├── Dashboard.jsx    # Charts & stats
│   │   │   ├── ScanPage.jsx     # 3 modes: Barcode, AI, Manual
│   │   │   ├── ReceiptPage.jsx  # Isolated print page
│   │   │   ├── History.jsx      # Transaction history
│   │   │   └── Products.jsx     # Product catalog
│   │   ├── stores/
│   │   │   └── transactionStore.js  # Zustand store
│   │   ├── services/
│   │   │   ├── api.js           # Axios instance
│   │   │   └── sound.js         # Web Audio beeps
│   │   ├── App.jsx              # React Router
│   │   ├── main.jsx             # Entry point
│   │   └── index.css            # Tailwind + custom styles
│   └── package.json
│
├── IMPLEMENTATION_PLAN.md
├── CONTINUE_FROM_HERE.md        # For AI assistants to continue dev
└── README.md
```

## API Endpoints

### Products
| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/api/products` | List all products |
| GET | `/api/products/barcode/:code` | Get by barcode |
| GET | `/api/products/for-detection` | Get products for AI detection |
| POST | `/api/products/scan-image` | Scan barcode from base64 image |
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
| POST | `/api/transactions/:id/complete` | Complete transaction |
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
| POST | `/api/ai/detect` | Object detection via Kolosal |

## Seeded Products (41 items)

Categories included in seed data:
- **Minuman** - Teh Botol, Aqua, Pocari Sweat, etc.
- **Makanan Ringan** - Chitato, Oreo, etc.
- **Mie & Bihun** - Indomie variants, Mie Sedaap
- **Bumbu Dapur** - Kecap, Sambal, Minyak Goreng, etc.
- **Rokok** - Gudang Garam, Sampoerna, Djarum
- **Kebutuhan Rumah Tangga** - Rinso, Sunlight, Baygon

## Continuing Development

See `CONTINUE_FROM_HERE.md` for:
- Current backlog items
- File structure reference
- Context for AI assistants

## Acknowledgments

- **Kolosal AI** - AI infrastructure sponsor
- **Imphnen x Kolosal Hackathon**

## License

MIT License
