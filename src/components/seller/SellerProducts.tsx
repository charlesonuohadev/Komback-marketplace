import React, { useState } from 'react';
import { 
  Package, 
  Search, 
  Plus, 
  Edit, 
  Trash2, 
  Eye, 
  ExternalLink, 
  Share2, 
  Check, 
  Copy, 
  Filter,
  CheckCircle2,
  AlertCircle,
  X,
  Sliders,
  DollarSign
} from 'lucide-react';
import { Product, Store } from '../../types';
import { formatNaira } from '../../utils/formatters';
import { getProductPermalink } from '../../utils/slug';

interface SellerProductsProps {
  store: Store;
  products: Product[];
  onAddProduct: (product: Product) => void;
  onUpdateProduct: (product: Product) => void;
  onDeleteProduct: (productId: string) => void;
  onViewProduct: (product: Product) => void;
}

export const SellerProducts: React.FC<SellerProductsProps> = ({
  store,
  products,
  onAddProduct,
  onUpdateProduct,
  onDeleteProduct,
  onViewProduct
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [statusFilter, setStatusFilter] = useState<'all' | 'instock' | 'outofstock'>('all');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Form states for Add / Edit product
  const [formTitle, setFormTitle] = useState('');
  const [formCategory, setFormCategory] = useState('Phones & Tablets');
  const [formPrice, setFormPrice] = useState('');
  const [formOriginalPrice, setFormOriginalPrice] = useState('');
  const [formCondition, setFormCondition] = useState<'Brand New' | 'UK Used' | 'Foreign Used' | 'Nigerian Used' | 'Refurbished'>('Brand New');
  const [formDescription, setFormDescription] = useState('');
  const [formImageUrl, setFormImageUrl] = useState('');
  const [formFeatures, setFormFeatures] = useState('');
  const [formInStock, setFormInStock] = useState(true);

  // Filter products
  const filteredProducts = products.filter(p => {
    const matchesSearch = p.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.uniqueId && p.uniqueId.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory || p.categorySlug === selectedCategory;
    const matchesStatus = statusFilter === 'all' || 
      (statusFilter === 'instock' && p.inStock) || 
      (statusFilter === 'outofstock' && !p.inStock);

    return matchesSearch && matchesCategory && matchesStatus;
  });

  const categories = Array.from(new Set(products.map(p => p.category)));

  const handleOpenAddModal = () => {
    setFormTitle('');
    setFormCategory(categories[0] || 'Phones & Tablets');
    setFormPrice('');
    setFormOriginalPrice('');
    setFormCondition('Brand New');
    setFormDescription('');
    setFormImageUrl('https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80');
    setFormFeatures('Komback Verified Quality\nEscrow Protected Transaction\nFast Courier Waybill Available');
    setFormInStock(true);
    setEditingProduct(null);
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (p: Product) => {
    setEditingProduct(p);
    setFormTitle(p.title);
    setFormCategory(p.category);
    setFormPrice(p.price.toString());
    setFormOriginalPrice(p.originalPrice ? p.originalPrice.toString() : '');
    setFormCondition(p.condition);
    setFormDescription(p.description);
    setFormImageUrl(p.images[0] || '');
    setFormFeatures(p.features ? p.features.join('\n') : '');
    setFormInStock(p.inStock);
    setIsAddModalOpen(true);
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();
    const priceNum = parseFloat(formPrice);
    if (!formTitle.trim() || isNaN(priceNum) || priceNum <= 0) return;

    const originalPriceNum = formOriginalPrice ? parseFloat(formOriginalPrice) : undefined;
    const featuresArray = formFeatures
      .split('\n')
      .map(f => f.trim())
      .filter(Boolean);

    const imageUrl = formImageUrl.trim() || 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80';

    if (editingProduct) {
      // Update existing
      const updated: Product = {
        ...editingProduct,
        title: formTitle.trim(),
        price: priceNum,
        originalPrice: originalPriceNum && originalPriceNum > priceNum ? originalPriceNum : undefined,
        category: formCategory,
        condition: formCondition,
        description: formDescription.trim(),
        images: [imageUrl, ...(editingProduct.images.slice(1))],
        features: featuresArray,
        inStock: formInStock,
      };
      onUpdateProduct(updated);
    } else {
      // Create new
      const uniqueId = Math.random().toString(36).substring(2, 8);
      const slug = `${formTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${uniqueId}`;
      const newProduct: Product = {
        id: `wc-${Date.now()}`,
        slug,
        uniqueId,
        title: formTitle.trim(),
        price: priceNum,
        originalPrice: originalPriceNum && originalPriceNum > priceNum ? originalPriceNum : undefined,
        badge: originalPriceNum && originalPriceNum > priceNum ? '15% OFF' : 'New',
        images: [imageUrl],
        category: formCategory,
        categorySlug: formCategory.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
        location: store.location,
        state: store.state,
        seller: {
          id: store.id,
          name: store.name,
          isVerified: true,
          rating: store.rating || 4.9,
          salesCount: store.salesCount || 120,
          location: store.location,
          phone: store.phone,
          avatar: store.avatar,
          joinedYear: '2022',
          responseRate: '98% within 5 mins'
        },
        rating: 5.0,
        reviewsCount: 1,
        condition: formCondition,
        description: formDescription.trim() || 'Genuine verified listing on Komback MultiVendor Marketplace.',
        features: featuresArray,
        inStock: formInStock,
        isTrending: true,
        isDeal: !!originalPriceNum && originalPriceNum > priceNum,
        createdAt: new Date().toISOString().split('T')[0]
      };
      onAddProduct(newProduct);
    }

    setIsAddModalOpen(false);
    setEditingProduct(null);
  };

  const handleCopyPermalink = (p: Product) => {
    const permalink = getProductPermalink(p);
    const fullUrl = typeof window !== 'undefined' ? `${window.location.origin}${permalink}` : permalink;
    navigator.clipboard?.writeText(fullUrl);
    setCopiedId(p.id);
    setTimeout(() => setCopiedId(null), 2500);
  };

  const handleToggleStock = (p: Product) => {
    onUpdateProduct({
      ...p,
      inStock: !p.inStock
    });
  };

  return (
    <div className="space-y-6">
      {/* Header Bar with Action */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 sm:p-6 rounded-3xl border border-slate-200/90 shadow-xs">
        <div>
          <h1 className="text-xl font-black text-slate-900 font-['Plus_Jakarta_Sans',sans-serif]">
            Product & Inventory Management
          </h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Full management of your live store listings and inventory stock levels
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="px-5 py-2.5 bg-emerald-600 hover:bg-emerald-700 active:scale-95 text-white font-extrabold text-xs rounded-xl flex items-center gap-2 shadow-sm shadow-emerald-600/20 transition-all cursor-pointer self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>+ Add New Product</span>
        </button>
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200/90 shadow-xs flex flex-col md:flex-row items-stretch md:items-center gap-3">
        {/* Search */}
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by title, SKU, or category..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        {/* Category Dropdown */}
        <select
          value={selectedCategory}
          onChange={(e) => setSelectedCategory(e.target.value)}
          className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
        >
          <option value="all">All Categories</option>
          {categories.map(cat => (
            <option key={cat} value={cat}>{cat}</option>
          ))}
        </select>

        {/* Stock Filter Pills */}
        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl shrink-0 text-xs font-bold overflow-x-auto no-scrollbar">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
              statusFilter === 'all' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            All ({products.length})
          </button>
          <button
            onClick={() => setStatusFilter('instock')}
            className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
              statusFilter === 'instock' ? 'bg-white text-emerald-700 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            In Stock
          </button>
          <button
            onClick={() => setStatusFilter('outofstock')}
            className={`px-3 py-1 rounded-lg transition-colors cursor-pointer ${
              statusFilter === 'outofstock' ? 'bg-white text-red-600 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Out of Stock
          </button>
        </div>
      </div>

      {/* Mobile Product Cards (sm:hidden) */}
      <div className="sm:hidden space-y-3">
        {filteredProducts.map((p) => {
          const permalink = getProductPermalink(p);
          return (
            <div key={p.id} className="bg-white rounded-2xl border border-slate-200/90 p-4 shadow-xs space-y-3">
              <div className="flex items-center gap-3">
                <img
                  src={p.images[0]}
                  alt={p.title}
                  className="w-14 h-14 rounded-xl object-cover bg-slate-100 border border-slate-200 shrink-0"
                />
                <div className="min-w-0 flex-1">
                  <h4 className="font-bold text-xs text-slate-900 truncate" title={p.title}>
                    {p.title}
                  </h4>
                  <div className="text-sm font-black text-slate-900 font-['Plus_Jakarta_Sans',sans-serif] mt-0.5">
                    {formatNaira(p.price)}
                  </div>
                  <div className="text-[10px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                    <span className="bg-slate-100 text-slate-700 px-1.5 py-0.5 rounded font-medium">{p.category}</span>
                    <span>•</span>
                    <span className="text-emerald-700 font-medium">{p.condition}</span>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs">
                <button
                  onClick={() => handleToggleStock(p)}
                  className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold cursor-pointer transition-colors ${
                    p.inStock
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  <span className={`w-1.5 h-1.5 rounded-full ${p.inStock ? 'bg-emerald-600' : 'bg-red-600'}`} />
                  <span>{p.inStock ? 'In Stock' : 'Out of Stock'}</span>
                </button>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleCopyPermalink(p)}
                    className="p-1.5 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 text-[10px] font-medium flex items-center gap-1 cursor-pointer"
                    title="Copy Permalink"
                  >
                    {copiedId === p.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    onClick={() => onViewProduct(p)}
                    className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 cursor-pointer"
                    title="View on Live Marketplace"
                  >
                    <Eye className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleOpenEditModal(p)}
                    className="p-1.5 rounded-lg bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-700 cursor-pointer"
                    title="Edit Product"
                  >
                    <Edit className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Are you sure you want to remove "${p.title}" from your store?`)) {
                        onDeleteProduct(p.id);
                      }
                    }}
                    className="p-1.5 rounded-lg bg-slate-100 hover:bg-red-50 hover:text-red-700 text-slate-700 cursor-pointer"
                    title="Delete Product"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}

        {filteredProducts.length === 0 && (
          <div className="p-8 text-center bg-white rounded-2xl border border-slate-200">
            <Package className="w-8 h-8 text-slate-300 mx-auto mb-2" />
            <p className="font-bold text-xs text-slate-700">No products match your filters</p>
          </div>
        )}
      </div>

      {/* Desktop Products Table (hidden sm:block) */}
      <div className="hidden sm:block bg-white rounded-3xl border border-slate-200/90 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 border-b border-slate-200/80 text-[11px] font-black uppercase tracking-wider text-slate-500">
              <tr>
                <th className="py-3.5 px-4">Product Details</th>
                <th className="py-3.5 px-4">Category</th>
                <th className="py-3.5 px-4">Price</th>
                <th className="py-3.5 px-4">Stock Status</th>
                <th className="py-3.5 px-4">Permalink</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredProducts.map((p) => {
                const permalink = getProductPermalink(p);
                return (
                  <tr key={p.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={p.images[0]}
                          alt={p.title}
                          className="w-12 h-12 rounded-xl object-cover bg-slate-100 border border-slate-200 shrink-0"
                        />
                        <div className="min-w-0 max-w-xs">
                          <h4 className="font-bold text-slate-900 truncate" title={p.title}>
                            {p.title}
                          </h4>
                          <div className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-0.5">
                            <span className="font-mono">ID: {p.uniqueId || p.id}</span>
                            <span>•</span>
                            <span className="text-emerald-700 font-medium">{p.condition}</span>
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3.5 px-4">
                      <span className="inline-block px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md font-semibold text-[11px]">
                        {p.category}
                      </span>
                    </td>

                    <td className="py-3.5 px-4">
                      <div className="font-black text-slate-900 font-['Plus_Jakarta_Sans',sans-serif]">
                        {formatNaira(p.price)}
                      </div>
                      {p.originalPrice && (
                        <div className="text-[10px] text-slate-400 line-through">
                          {formatNaira(p.originalPrice)}
                        </div>
                      )}
                    </td>

                    <td className="py-3.5 px-4">
                      <button
                        onClick={() => handleToggleStock(p)}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold cursor-pointer transition-colors ${
                          p.inStock
                            ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                            : 'bg-red-100 text-red-800 hover:bg-red-200'
                        }`}
                        title="Click to toggle stock status"
                      >
                        <span className={`w-1.5 h-1.5 rounded-full ${p.inStock ? 'bg-emerald-600' : 'bg-red-600'}`} />
                        <span>{p.inStock ? 'In Stock' : 'Out of Stock'}</span>
                      </button>
                    </td>

                    <td className="py-3.5 px-4">
                      <button
                        onClick={() => handleCopyPermalink(p)}
                        className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 font-mono text-[10px] rounded-lg transition-colors cursor-pointer"
                        title="Copy Product Permalink"
                      >
                        {copiedId === p.id ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-600" />
                            <span className="text-emerald-700 font-bold">Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3" />
                            <span className="truncate max-w-[110px]">{permalink}</span>
                          </>
                        )}
                      </button>
                    </td>

                    <td className="py-3.5 px-4 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <button
                          onClick={() => onViewProduct(p)}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
                          title="View on Live Marketplace"
                        >
                          <Eye className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleOpenEditModal(p)}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-700 transition-colors cursor-pointer"
                          title="Edit Product Details"
                        >
                          <Edit className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`Are you sure you want to remove "${p.title}" from your store?`)) {
                              onDeleteProduct(p.id);
                            }
                          }}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-red-50 hover:text-red-700 text-slate-700 transition-colors cursor-pointer"
                          title="Delete Product"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}

              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-500">
                    <Package className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                    <p className="font-bold text-slate-700">No products match your filters</p>
                    <p className="text-xs text-slate-400 mt-1">Try changing your search keywords or stock filter</p>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Product Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white w-full max-w-2xl rounded-3xl shadow-2xl border border-slate-200 my-8 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            {/* Modal Header */}
            <div className="p-6 bg-slate-900 text-white flex items-center justify-between">
              <div>
                <h3 className="text-base font-black font-['Plus_Jakarta_Sans',sans-serif]">
                  {editingProduct ? 'Edit Marketplace Listing' : 'Post New Product to Your Store'}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Your listing will be instantly visible to buyers across Nigeria with escrow protection.
                </p>
              </div>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSaveProduct} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Product Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Apple iPhone 16 Pro Max 512GB Desert Titanium"
                  value={formTitle}
                  onChange={(e) => setFormTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Category *
                  </label>
                  <select
                    value={formCategory}
                    onChange={(e) => setFormCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                  >
                    {categories.map(c => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Item Condition *
                  </label>
                  <select
                    value={formCondition}
                    onChange={(e) => setFormCondition(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500 cursor-pointer"
                  >
                    <option value="Brand New">Brand New</option>
                    <option value="UK Used">UK Used</option>
                    <option value="Foreign Used">Foreign Used (Tokunbo)</option>
                    <option value="Nigerian Used">Nigerian Used</option>
                    <option value="Refurbished">Refurbished</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Selling Price (₦ Naira) *
                  </label>
                  <input
                    type="number"
                    required
                    min="100"
                    placeholder="e.g. 850000"
                    value={formPrice}
                    onChange={(e) => setFormPrice(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-black text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Original Regular Price (Optional - for discount badge)
                  </label>
                  <input
                    type="number"
                    placeholder="e.g. 950000"
                    value={formOriginalPrice}
                    onChange={(e) => setFormOriginalPrice(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Product Image URL
                </label>
                <input
                  type="url"
                  placeholder="https://images.unsplash.com/..."
                  value={formImageUrl}
                  onChange={(e) => setFormImageUrl(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Key Specifications / Highlights (One per line)
                </label>
                <textarea
                  rows={3}
                  placeholder="256GB Storage NVMe&#10;1 Year Official Warranty&#10;Factory Unlocked"
                  value={formFeatures}
                  onChange={(e) => setFormFeatures(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Full Description & Warranty Terms
                </label>
                <textarea
                  rows={3}
                  placeholder="Provide comprehensive details about the item condition, accessories included, and receipt availability..."
                  value={formDescription}
                  onChange={(e) => setFormDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="modal-in-stock"
                  checked={formInStock}
                  onChange={(e) => setFormInStock(e.target.checked)}
                  className="w-4 h-4 rounded-md text-emerald-600 focus:ring-emerald-500"
                />
                <label htmlFor="modal-in-stock" className="text-xs font-bold text-slate-800 cursor-pointer">
                  Product is currently in-stock and available for immediate dispatch
                </label>
              </div>

              <div className="pt-4 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2.5 rounded-xl border border-slate-200 text-slate-600 font-bold text-xs hover:bg-slate-50 transition-colors cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs shadow-sm shadow-emerald-600/20 transition-all cursor-pointer"
                >
                  {editingProduct ? 'Update Listing' : 'Publish Product to Marketplace'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
