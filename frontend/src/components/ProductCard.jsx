import { useCart } from '../context/CartContext'

export default function ProductCard({ product }) {
  const { cart, addItem } = useCart()
  const inCart = cart.find(i => i.id === product.id)
  const outOfStock = product.stock === 0

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden hover:shadow-md transition-shadow flex flex-col">
      <div className="h-40 bg-gradient-to-br from-indigo-50 to-purple-100 flex items-center justify-center">
        <span className="text-5xl select-none">📦</span>
      </div>
      <div className="p-4 flex flex-col flex-1">
        <h3 className="font-semibold text-gray-900 text-base truncate">{product.name}</h3>
        <p className="text-gray-500 text-sm mt-1 flex-1 line-clamp-2 min-h-[2.5rem]">
          {product.description || 'No description available'}
        </p>
        <div className="mt-3 flex items-center justify-between">
          <span className="text-xl font-bold text-indigo-700">
            ${parseFloat(product.price).toFixed(2)}
          </span>
          <span
            className={`text-xs font-medium px-2 py-1 rounded-full ${
              outOfStock
                ? 'bg-red-100 text-red-700'
                : 'bg-green-100 text-green-700'
            }`}
          >
            {outOfStock ? 'Out of stock' : `${product.stock} left`}
          </span>
        </div>
        <button
          onClick={() => addItem(product)}
          disabled={outOfStock}
          className={`mt-3 w-full py-2 rounded-lg text-sm font-medium transition-colors ${
            outOfStock
              ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
              : inCart
              ? 'bg-indigo-100 text-indigo-700 hover:bg-indigo-200'
              : 'bg-indigo-600 text-white hover:bg-indigo-700'
          }`}
        >
          {outOfStock ? 'Out of Stock' : inCart ? `In Cart (${inCart.qty})` : 'Add to Cart'}
        </button>
      </div>
    </div>
  )
}
