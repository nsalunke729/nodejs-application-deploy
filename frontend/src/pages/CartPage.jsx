import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useCart } from '../context/CartContext'

export default function CartPage() {
  const { cart, removeItem, updateQty, clearCart, total } = useCart()
  const [users, setUsers] = useState([])
  const [selectedUser, setSelectedUser] = useState('')
  const [placing, setPlacing] = useState(false)
  const [error, setError] = useState(null)
  const navigate = useNavigate()

  useEffect(() => {
    fetch('/api/users')
      .then(r => r.json())
      .then(data => setUsers(data.users || []))
  }, [])

  if (cart.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-5xl mb-4 select-none">🛒</p>
        <p className="text-xl font-medium text-gray-700 mb-2">Your cart is empty</p>
        <Link to="/" className="text-indigo-600 hover:underline text-sm">
          Browse the marketplace
        </Link>
      </div>
    )
  }

  const placeOrder = async () => {
    if (!selectedUser) return setError('Please select a user to place the order')
    setError(null)
    setPlacing(true)
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: selectedUser,
          items: cart.map(i => ({ productId: i.id, quantity: i.qty })),
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to place order')
      clearCart()
      navigate('/orders')
    } catch (e) {
      setError(e.message)
    } finally {
      setPlacing(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Your Cart</h1>

      <div className="bg-white rounded-xl shadow-sm border border-gray-200 divide-y divide-gray-100">
        {cart.map(item => (
          <div key={item.id} className="p-4 flex items-center gap-4">
            <div className="h-14 w-14 bg-indigo-50 rounded-lg flex items-center justify-center flex-shrink-0 text-2xl select-none">
              📦
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-medium text-gray-900 truncate">{item.name}</p>
              <p className="text-sm text-gray-500">${parseFloat(item.price).toFixed(2)} each</p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => updateQty(item.id, item.qty - 1)}
                className="w-7 h-7 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100 font-bold text-gray-600"
              >
                −
              </button>
              <span className="w-6 text-center font-semibold text-gray-900">{item.qty}</span>
              <button
                onClick={() => updateQty(item.id, item.qty + 1)}
                disabled={item.qty >= item.stock}
                className="w-7 h-7 rounded-full border border-gray-300 flex items-center justify-center hover:bg-gray-100 font-bold text-gray-600 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                +
              </button>
            </div>
            <p className="w-20 text-right font-semibold text-indigo-700">
              ${(parseFloat(item.price) * item.qty).toFixed(2)}
            </p>
            <button
              onClick={() => removeItem(item.id)}
              className="text-gray-300 hover:text-red-500 transition-colors ml-1 text-lg"
              aria-label="Remove item"
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      <div className="mt-6 bg-white rounded-xl shadow-sm border border-gray-200 p-6">
        <div className="flex justify-between text-lg font-bold mb-5 pb-5 border-b border-gray-100">
          <span className="text-gray-800">Total</span>
          <span className="text-indigo-700">${total.toFixed(2)}</span>
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Place order as
          </label>
          <select
            value={selectedUser}
            onChange={e => { setSelectedUser(e.target.value); setError(null) }}
            className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
          >
            <option value="">Select a user...</option>
            {users.map(u => (
              <option key={u.id} value={u.id}>
                {u.name} ({u.email})
              </option>
            ))}
          </select>
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-4">
            {error}
          </p>
        )}

        <button
          onClick={placeOrder}
          disabled={placing}
          className="w-full bg-indigo-600 text-white py-3 rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
        >
          {placing ? 'Placing Order...' : 'Place Order'}
        </button>
      </div>
    </div>
  )
}
