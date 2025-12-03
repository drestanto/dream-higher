import { useEffect, useState } from 'react';
import { Search, Plus, Edit, Trash2, Package, AlertTriangle } from 'lucide-react';
import api from '../services/api';

function formatRupiah(amount) {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(amount);
}

export default function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await api.get('/products');
      setProducts(response.data);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  // Get unique categories
  const categories = [...new Set(products.map((p) => p.category))].sort();

  // Filter products
  const filteredProducts = products.filter((product) => {
    const matchesSearch =
      product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.barcode.includes(searchQuery);
    const matchesCategory = !selectedCategory || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Group by category
  const groupedProducts = filteredProducts.reduce((acc, product) => {
    if (!acc[product.category]) {
      acc[product.category] = [];
    }
    acc[product.category].push(product);
    return acc;
  }, {});

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Produk</h1>
          <p className="text-gray-500">{products.length} produk terdaftar</p>
        </div>
      </div>

      {/* Search and Filter */}
      <div className="flex items-center gap-4 mb-6">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Cari nama produk atau barcode..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none"
          />
        </div>

        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-4 py-2 border rounded-lg bg-white text-gray-700"
        >
          <option value="">Semua Kategori</option>
          {categories.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>
      </div>

      {/* Products Grid */}
      {Object.keys(groupedProducts).length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
          <p>Tidak ada produk ditemukan</p>
        </div>
      ) : (
        <div className="space-y-8">
          {Object.entries(groupedProducts)
            .sort(([a], [b]) => a.localeCompare(b))
            .map(([category, categoryProducts]) => (
              <div key={category}>
                <h2 className="text-lg font-semibold text-gray-700 mb-3 flex items-center gap-2">
                  <Package className="w-5 h-5" />
                  {category}
                  <span className="text-sm font-normal text-gray-400">
                    ({categoryProducts.length})
                  </span>
                </h2>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                  {categoryProducts.map((product) => (
                    <div
                      key={product.id}
                      className={`bg-white rounded-lg shadow-sm border p-4 ${
                        product.stock <= product.lowStockThreshold
                          ? 'border-orange-300 bg-orange-50'
                          : ''
                      }`}
                    >
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h3 className="font-medium text-gray-800 line-clamp-1">
                            {product.name}
                          </h3>
                          <p className="text-xs text-gray-400 font-mono">
                            {product.barcode}
                          </p>
                        </div>
                        {product.stock <= product.lowStockThreshold && (
                          <AlertTriangle className="w-5 h-5 text-orange-500 flex-shrink-0" />
                        )}
                      </div>

                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span className="text-gray-500">Beli:</span>
                          <span className="text-gray-700">
                            {formatRupiah(product.buyPrice)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Jual:</span>
                          <span className="text-green-600 font-medium">
                            {formatRupiah(product.sellPrice)}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-500">Stok:</span>
                          <span
                            className={`font-medium ${
                              product.stock <= product.lowStockThreshold
                                ? 'text-orange-600'
                                : 'text-gray-700'
                            }`}
                          >
                            {product.stock} pcs
                          </span>
                        </div>
                      </div>

                      <div className="mt-3 pt-3 border-t flex justify-between items-center">
                        <span className="text-xs text-gray-400">
                          Margin: {formatRupiah(product.sellPrice - product.buyPrice)}
                        </span>
                        <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                          {Math.round(
                            ((product.sellPrice - product.buyPrice) / product.buyPrice) * 100
                          )}
                          %
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
        </div>
      )}
    </div>
  );
}
