import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import ScanPage from './pages/ScanPage';
import History from './pages/History';
import Products from './pages/Products';
import ReceiptPage from './pages/ReceiptPage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Isolated receipt page - no layout, opens in new tab */}
        <Route path="receipt/:id" element={<ReceiptPage />} />

        {/* Main app with layout */}
        <Route path="/" element={<Layout />}>
          <Route index element={<Dashboard />} />
          <Route path="scan/:type" element={<ScanPage />} />
          <Route path="history" element={<History />} />
          <Route path="products" element={<Products />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}

export default App;
