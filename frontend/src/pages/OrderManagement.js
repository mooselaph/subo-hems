import React, { useState, useEffect } from 'react';
import axios from 'axios';
import '../styles/pages.css';

// Use the current hostname/IP for API calls
const getAPIBaseURL = () => {
  const host = window.location.hostname;
  const port = 5000;
  return `http://${host}:${port}/api`;
};

const API_BASE_URL = getAPIBaseURL();

function OrderManagement() {
  const [orders, setOrders] = useState([]);
  const [menu, setMenu] = useState({});
  const [activeTab, setActiveTab] = useState('pending');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('appetizers');
  const [searchTerm, setSearchTerm] = useState('');
  const [tableNumber, setTableNumber] = useState('');
  const [cartItems, setCartItems] = useState([]);
  const [showTableSelection, setShowTableSelection] = useState(true);
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [selectedItemForNotes, setSelectedItemForNotes] = useState(null);
  const [itemNotes, setItemNotes] = useState('');
  const [itemQuantity, setItemQuantity] = useState(1);
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    fetchOrders();
    fetchMenu();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.get(`${API_BASE_URL}/orders`);
      setOrders(response.data);
    } catch (err) {
      setError('Failed to fetch orders');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchMenu = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/menu`);
      setMenu(response.data);
    } catch (err) {
      console.error('Failed to fetch menu', err);
    }
  };

  const categories = ['all', 'appetizers', 'mains', 'sides', 'desserts', 'drinks'];

  const showToast = (message) => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 3000);
  };

  const tableGroups = {
    'Main Hall': Array.from({ length: 8 }, (_, i) => ({ id: i + 1, name: `MH${i + 1}` })),
    'Side Hall': Array.from({ length: 7 }, (_, i) => ({ id: i + 9, name: `SH${i + 9}` })),
    'Round Table': [{ id: 16, name: 'Round Table' }],
    'Garden': Array.from({ length: 9 }, (_, i) => ({ id: i + 17, name: `Garden${i + 1}` }))
  };

  const getFilteredMenuItems = () => {
    let items = [];
    if (selectedCategory === 'all') {
      items = Object.values(menu).flat();
    } else {
      items = menu[selectedCategory] || [];
    }
    return items.filter(item =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  };

  const handleAddToCart = (item) => {
    setSelectedItemForNotes(item);
    setItemNotes('');
    setItemQuantity(1);
    setShowNotesModal(true);
  };

  const handleConfirmAddToCart = () => {
    if (!selectedItemForNotes) return;
    
    const existingItem = cartItems.find(cartItem => cartItem.id === selectedItemForNotes.id);
    const newItem = { ...selectedItemForNotes, quantity: itemQuantity, notes: itemNotes };
    
    if (existingItem) {
      setCartItems(cartItems.map(cartItem =>
        cartItem.id === selectedItemForNotes.id
          ? { ...cartItem, quantity: cartItem.quantity + itemQuantity }
          : cartItem
      ));
    } else {
      setCartItems([...cartItems, newItem]);
    }
    
    showToast(`${selectedItemForNotes.name} x${itemQuantity} added to cart`);
    setShowNotesModal(false);
    setSelectedItemForNotes(null);
    setItemNotes('');
    setItemQuantity(1);
  };

  const handleRemoveFromCart = (itemId) => {
    setCartItems(cartItems.filter(item => item.id !== itemId));
  };

  const handleUpdateQuantity = (itemId, quantity) => {
    if (quantity <= 0) {
      handleRemoveFromCart(itemId);
    } else {
      setCartItems(cartItems.map(item =>
        item.id === itemId ? { ...item, quantity } : item
      ));
    }
  };

  const handleCreateOrder = async (e) => {
    e.preventDefault();

    if (!tableNumber) {
      alert('Please enter a table number');
      return;
    }

    if (cartItems.length === 0) {
      alert('Please add items to the order');
      return;
    }

    try {
      await axios.post(`${API_BASE_URL}/orders`, {
        items: cartItems,
        tableNumber: parseInt(tableNumber)
      });
      setTableNumber('');
      setCartItems([]);
      setShowCreateForm(false);
      fetchOrders();
    } catch (err) {
      setError('Failed to create order');
      console.error(err);
    }
  };

  const cartTotal = cartItems.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  const filteredOrders = orders.filter(order => order.status === activeTab);

  return (
    <div className="page-container">
      <h2>Order Management</h2>

      {error && <div className="error-message">{error}</div>}

      <button
        className="btn btn-primary"
        onClick={() => setShowCreateForm(!showCreateForm)}
      >
        {showCreateForm ? 'Cancel' : '+ Create New Order'}
      </button>

      {showCreateForm && (
        <div className="create-order-section">
          <div className="cart-section">
            <div className="cart-header">
              <h3>Order Cart</h3>
              <button
                className="toggle-btn"
                onClick={() => setShowTableSelection(!showTableSelection)}
              >
                {showTableSelection ? '▼' : '▶'} Select Table
              </button>
            </div>

            {showTableSelection && (
              <div className="table-selection-wrapper">
                <div className="form-section">
                  <div className="table-selection">
                    {Object.entries(tableGroups).map(([groupName, tables]) => (
                      <div key={groupName} className="table-group">
                        <p className="table-group-label">{groupName}</p>
                        <div className="table-buttons">
                          {tables.map(table => (
                            <button
                              key={table.id}
                              className={`table-btn ${tableNumber === table.id ? 'selected' : ''}`}
                              onClick={() => {
                                setTableNumber(table.id);
                                setShowTableSelection(false);
                              }}
                            >
                              {table.name}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {tableNumber && (
              <div className="selected-table-info">
                Selected: <strong>{tableGroups[Object.keys(tableGroups).find(group => tableGroups[group].some(t => t.id === tableNumber))]?.find(t => t.id === tableNumber)?.name || 'Table ' + tableNumber}</strong>
              </div>
            )}

            {cartItems.length === 0 ? (
              <p className="empty-cart">No items in cart</p>
            ) : (
              <>
                <div className="cart-items">
                  {cartItems.map(item => (
                    <div key={item.id} className="cart-item">
                      <div className="cart-item-info">
                        <p className="cart-item-name">{item.name}</p>
                        <p className="cart-item-price">₱{item.price.toFixed(2)}</p>
                        {item.notes && <p className="cart-item-notes">Note: {item.notes}</p>}
                      </div>
                      <div className="cart-item-controls">
                        <button
                          className="btn-qty"
                          onClick={() => handleUpdateQuantity(item.id, item.quantity - 1)}
                        >
                          −
                        </button>
                        <span className="qty">{item.quantity}</span>
                        <button
                          className="btn-qty"
                          onClick={() => handleUpdateQuantity(item.id, item.quantity + 1)}
                        >
                          +
                        </button>
                        <button
                          className="btn btn-danger btn-small"
                          onClick={() => handleRemoveFromCart(item.id)}
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="cart-total">
                  <strong>Total: ₱{cartTotal.toFixed(2)}</strong>
                </div>

                <button
                  type="submit"
                  className="btn btn-success"
                  onClick={handleCreateOrder}
                  style={{ width: '100%' }}
                >
                  Place Order
                </button>
              </>
            )}
          </div>

          <div className="menu-section">
            <div className="search-bar">
              <input
                type="text"
                placeholder="Search menu items..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>

            <div className="category-tabs">
              {categories.map(category => (
                <button
                  key={category}
                  className={`category-tab ${selectedCategory === category ? 'active' : ''}`}
                  onClick={() => setSelectedCategory(category)}
                >
                  {category === 'all' ? 'All' : category.charAt(0).toUpperCase() + category.slice(1)}
                </button>
              ))}
            </div>

            <div className="menu-items-grid">
              {getFilteredMenuItems().map(item => (
                <div key={item.id} className="menu-item-card">
                  <h4>{item.name}</h4>
                  <p className="menu-item-price">₱{item.price.toFixed(2)}</p>
                  <button
                    className="btn btn-success btn-small"
                    onClick={() => handleAddToCart(item)}
                  >
                    + Add to Cart
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {showNotesModal && selectedItemForNotes && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Add Notes to {selectedItemForNotes.name}</h3>
            
            <div className="quantity-section">
              <label>Quantity:</label>
              <div className="quantity-input">
                <button 
                  className="qty-btn"
                  onClick={() => setItemQuantity(Math.max(1, itemQuantity - 1))}
                >
                  −
                </button>
                <input 
                  type="number" 
                  value={itemQuantity} 
                  onChange={(e) => setItemQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="qty-input"
                  min="1"
                />
                <button 
                  className="qty-btn"
                  onClick={() => setItemQuantity(itemQuantity + 1)}
                >
                  +
                </button>
              </div>
            </div>

            <textarea
              value={itemNotes}
              onChange={(e) => setItemNotes(e.target.value)}
              placeholder="Add special requests or notes (optional)..."
              className="notes-textarea"
            />
            <div className="modal-buttons">
              <button
                className="btn btn-secondary"
                onClick={() => {
                  setShowNotesModal(false);
                  setSelectedItemForNotes(null);
                  setItemNotes('');
                  setItemQuantity(1);
                }}
              >
                Cancel
              </button>
              <button
                className="btn btn-success"
                onClick={handleConfirmAddToCart}
              >
                Add to Cart
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="tabs">
        <button
          className={`tab ${activeTab === 'pending' ? 'active' : ''}`}
          onClick={() => setActiveTab('pending')}
        >
          Pending Orders ({orders.filter(o => o.status === 'pending').length})
        </button>
        <button
          className={`tab ${activeTab === 'completed' ? 'active' : ''}`}
          onClick={() => setActiveTab('completed')}
        >
          Completed Orders ({orders.filter(o => o.status === 'completed').length})
        </button>
      </div>

      <div className="orders-container">
        {loading && <div className="loading">Loading orders...</div>}

        {!loading && filteredOrders.length === 0 && (
          <div className="empty-state">
            <p>No {activeTab} orders</p>
          </div>
        )}

        {!loading && filteredOrders.length > 0 && (
          <div className="orders-list">
            {filteredOrders.map(order => (
              <div key={order.id} className={`order-card order-${order.status}`}>
                <div className="order-header">
                  <div className="order-header-content">
                    <h3 className="table-number">Table {order.tableNumber}</h3>
                    <p className="order-number">{order.orderNumber}</p>
                  </div>
                  <span className={`status-badge status-${order.status}`}>
                    {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                  </span>
                </div>

                <div className="order-items">
                  <h4>Items:</h4>
                  <ul>
                    {order.items.map((item, idx) => (
                      <li key={idx}>
                        <div className="item-summary">
                          {item.quantity}x {item.name} - ₱{(item.price * item.quantity).toFixed(2)}
                        </div>
                        {item.notes && (
                          <div className="item-notes-display">
                            Note: {item.notes}
                          </div>
                        )}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="order-footer">
                  <div className="order-total">
                    <strong>Total: ${order.totalPrice.toFixed(2)}</strong>
                  </div>
                  <div className="order-time">
                    <small>Created: {new Date(order.createdAt).toLocaleString()}</small>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="toast-container">
        {toasts.map(toast => (
          <div key={toast.id} className="toast toast-fade-out">
            {toast.message}
          </div>
        ))}
      </div>
    </div>
  );
}

export default OrderManagement;
