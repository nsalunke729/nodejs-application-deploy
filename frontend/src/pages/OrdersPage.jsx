import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'

const STATUS_STYLES = {
  pending: 'bg-yellow-100 text-yellow-700',
  completed: 'bg-green-100 text-green-700',
  cancelled: 'bg-red-100 text-red-700',
}

export default function OrdersPage() {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetch('/api/orders')
      .then(r => r.json())
      .then(data => setOrders(data.orders || []))
      .catch(() => setError('Failed to load orders'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="h-8 w-40 bg-gray-200 rounded animate-pulse mb-6" />
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white rounded-xl border border-gray-200 h-36 animate-pulse" />
        ))}
      </div>
    )
  }

  if (error) {
    return (
      <div className="text-red-600 bg-red-50 border border-red-200 rounded-lg p-4 text-sm">
        {error}
      </div>
    )
  }

  if (orders.length === 0) {
    return (
      <div className="text-center py-20">
        <p className="text-5xl mb-4 select-none">📋</p>
        <p className="text-xl font-medium text-gray-700 mb-2">No orders yet</p>
        <Link to="/" className="text-indigo-600 hover:underline text-sm">
          Browse the marketplace
        </Link>
      </div>
    )
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">All Orders</h1>
      <div className="space-y-4">
        {orders.map(order => (
          <div
            key={order.id}
            className="bg-white rounded-xl shadow-sm border border-gray-200 p-5"
          >
            <div className="flex items-start justify-between mb-3 gap-4">
              <div>
                <p className="font-semibold text-gray-900">Order #{order.id}</p>
                <p className="text-sm text-gray-500 mt-0.5">
                  {order.user_name}{' '}
                  <span className="text-gray-400">·</span>{' '}
                  {new Date(order.created_at).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric',
                  })}
                </p>
              </div>
              <div className="flex items-center gap-3 flex-shrink-0">
                <span
                  className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                    STATUS_STYLES[order.status] || 'bg-gray-100 text-gray-700'
                  }`}
                >
                  {order.status}
                </span>
                <span className="font-bold text-indigo-700 text-lg">
                  ${parseFloat(order.total).toFixed(2)}
                </span>
              </div>
            </div>

            {order.items && order.items.length > 0 && (
              <div className="border-t border-gray-100 pt-3 mt-3">
                <p className="text-xs text-gray-400 uppercase font-semibold tracking-wide mb-2">
                  Items
                </p>
                <div className="space-y-1.5">
                  {order.items.map((item, idx) => (
                    <div key={idx} className="flex justify-between text-sm">
                      <span className="text-gray-700">
                        {item.product_name}{' '}
                        <span className="text-gray-400">× {item.quantity}</span>
                      </span>
                      <span className="text-gray-600 font-medium">
                        ${(parseFloat(item.price) * item.quantity).toFixed(2)}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
