import { Link, useLocation } from 'react-router-dom'
import { useCart } from '../context/CartContext'

export default function Navbar() {
  const { count } = useCart()
  const { pathname } = useLocation()

  const navLink = (to, label) => (
    <Link
      to={to}
      className={`px-3 py-2 rounded-md text-sm font-medium transition-colors ${
        pathname === to
          ? 'bg-indigo-700 text-white'
          : 'text-indigo-100 hover:bg-indigo-600'
      }`}
    >
      {label}
    </Link>
  )

  return (
    <nav className="bg-indigo-800 shadow-lg">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link to="/" className="text-white font-bold text-xl tracking-tight">
            ShopApp
          </Link>
          <div className="flex items-center gap-1">
            {navLink('/', 'Marketplace')}
            {navLink('/orders', 'Orders')}
            {navLink('/admin', 'Admin')}
            <Link
              to="/cart"
              className={`relative px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                pathname === '/cart'
                  ? 'bg-indigo-700 text-white'
                  : 'text-indigo-100 hover:bg-indigo-600'
              }`}
            >
              Cart
              {count > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center font-semibold">
                  {count > 99 ? '99+' : count}
                </span>
              )}
            </Link>
          </div>
        </div>
      </div>
    </nav>
  )
}
