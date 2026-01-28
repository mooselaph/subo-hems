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
  const [orderType, setOrderType] = useState('dine-in');
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
  // States for adding items to existing orders
  const [showAddItemsModal, setShowAddItemsModal] = useState(false);
  const [addTargetOrder, setAddTargetOrder] = useState(null);
  const [addCartItems, setAddCartItems] = useState([]);
  const [selectedItemForAdd, setSelectedItemForAdd] = useState(null);
  const [addItemNotes, setAddItemNotes] = useState('');
  const [addItemQuantity, setAddItemQuantity] = useState(1);

  useEffect(() => {
    fetchOrders();
    // Poll orders periodically so ordering view stays in sync with kitchen
    const interval = setInterval(fetchOrders, 3000);
    fetchMenu();

    return () => clearInterval(interval);
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

  const handleAddItemToList = (item) => {
    const existing = addCartItems.find(ci => ci.id === item.id);
    if (existing) {
      setAddCartItems(addCartItems.map(ci => ci.id === item.id ? { ...ci, quantity: ci.quantity + 1 } : ci));
    } else {
      setAddCartItems([...addCartItems, { ...item, quantity: 1, notes: '' }]);
    }
  };

  // --- Add items to existing order flow ---
  const handleOpenAddItems = (order) => {
    setAddTargetOrder(order);
    setAddCartItems([]);
    // close table selector to avoid overlay conflicts
    setShowTableSelection(false);
    setShowAddItemsModal(true);
  };

  const handleAddToOrder = (item) => {
    setSelectedItemForAdd(item);
    setAddItemNotes('');
    setAddItemQuantity(1);
  };

  const handleConfirmAddToOrder = () => {
    if (!selectedItemForAdd) return;
    const existingItem = addCartItems.find(cartItem => cartItem.id === selectedItemForAdd.id);
    const newItem = { ...selectedItemForAdd, quantity: addItemQuantity, notes: addItemNotes };
    if (existingItem) {
      setAddCartItems(addCartItems.map(cartItem =>
        cartItem.id === selectedItemForAdd.id
          ? { ...cartItem, quantity: cartItem.quantity + addItemQuantity }
          : cartItem
      ));
    } else {
      setAddCartItems([...addCartItems, newItem]);
    }
    showToast(`${selectedItemForAdd.name} x${addItemQuantity} added`);
    setSelectedItemForAdd(null);
    setAddItemNotes('');
    setAddItemQuantity(1);
    setShowNotesModal(false);
  };

  const handleSubmitAddToOrder = async () => {
    if (!addTargetOrder) return;
    if (addCartItems.length === 0) {
      alert('Add items first');
      return;
    }
    try {
      // If the order was already completed, set it back to pending
      if (addTargetOrder.status === 'completed') {
        await axios.put(`${API_BASE_URL}/orders/${addTargetOrder.id}`, { status: 'pending' });
      }

      await axios.post(`${API_BASE_URL}/orders/${addTargetOrder.id}/items`, { items: addCartItems });
      setShowAddItemsModal(false);
      setAddTargetOrder(null);
      setAddCartItems([]);
      fetchOrders();
      showToast('Items added to order');
    } catch (err) {
      console.error('Failed to add items to order', err);
      setError('Failed to add items to order');
    }
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

    if (orderType === 'dine-in' && !tableNumber) {
      alert('Please enter a table number for dine-in orders');
      return;
    }

    if (cartItems.length === 0) {
      alert('Please add items to the order');
      return;
    }

    try {
      await axios.post(`${API_BASE_URL}/orders`, {
        items: cartItems,
        tableNumber: tableNumber ? parseInt(tableNumber) : undefined,
        type: orderType
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
            <div style={{ marginBottom: '0.5rem' }}>
              <label style={{ marginRight: '0.5rem', fontWeight: 600 }}>Order Type:</label>
              <button className={`category-tab ${orderType === 'dine-in' ? 'active' : ''}`} onClick={() => setOrderType('dine-in')}>Dine In</button>
              <button className={`category-tab ${orderType === 'takeout' ? 'active' : ''}`} onClick={() => setOrderType('takeout')} style={{ marginLeft: '0.5rem' }}>Takeout</button>
            </div>
            <div className="cart-header">
              <h3>Order Cart</h3>
              <button
                className="toggle-btn"
                onClick={() => setShowTableSelection(!showTableSelection)}
              >
                {showTableSelection ? '▼' : '▶'} Select Table
              </button>
            </div>

            {orderType === 'dine-in' && showTableSelection && (
              <div className="table-selection-wrapper">
                <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '0.5rem' }}>
                  <button className="btn btn-secondary" onClick={() => setShowTableSelection(false)}>Close</button>
                </div>
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

      {showNotesModal && (selectedItemForNotes || selectedItemForAdd) && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h3>Add Notes to {(selectedItemForNotes || selectedItemForAdd).name}</h3>

            <div className="quantity-section">
              <label>Quantity:</label>
              <div className="quantity-input">
                <button 
                  className="qty-btn"
                  onClick={() => {
                    if (selectedItemForNotes) setItemQuantity(Math.max(1, itemQuantity - 1));
                    else setAddItemQuantity(Math.max(1, addItemQuantity - 1));
                  }}
                >
                  −
                </button>
                <input 
                  type="number" 
                  value={selectedItemForNotes ? itemQuantity : addItemQuantity} 
                  onChange={(e) => {
                    if (selectedItemForNotes) setItemQuantity(Math.max(1, parseInt(e.target.value) || 1));
                    else setAddItemQuantity(Math.max(1, parseInt(e.target.value) || 1));
                  }}
                  className="qty-input"
                  min="1"
                />
                <button 
                  className="qty-btn"
                  onClick={() => { if (selectedItemForNotes) setItemQuantity(itemQuantity + 1); else setAddItemQuantity(addItemQuantity + 1); }}
                >
                  +
                </button>
              </div>
            </div>

            <textarea
              value={selectedItemForNotes ? itemNotes : addItemNotes}
              onChange={(e) => { if (selectedItemForNotes) setItemNotes(e.target.value); else setAddItemNotes(e.target.value); }}
              placeholder="Add special requests or notes (optional)..."
              className="notes-textarea"
            />
            <div className="modal-buttons">
              <button
                className="btn btn-secondary"
                onClick={() => {
                  setShowNotesModal(false);
                  if (selectedItemForNotes) {
                    setSelectedItemForNotes(null);
                    setItemNotes('');
                    setItemQuantity(1);
                  } else {
                    setSelectedItemForAdd(null);
                    setAddItemNotes('');
                    setAddItemQuantity(1);
                  }
                }}
              >
                Cancel
              </button>
              <button
                className="btn btn-success"
                onClick={() => {
                  if (selectedItemForNotes) handleConfirmAddToCart();
                  else handleConfirmAddToOrder();
                }}
              >
                {selectedItemForNotes ? 'Add to Cart' : 'Add to Order'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* add-items modal replaced by inline panel rendered inside each order card */}
      {showAddItemsModal && addTargetOrder && (
        <div className="modal-overlay">
          <div className="modal-content" style={{ maxWidth: '900px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
              <h3 style={{ margin: 0 }}>Add Items to {addTargetOrder.orderNumber}</h3>
              <div>
                <button className="btn btn-secondary" onClick={() => { setShowAddItemsModal(false); setAddTargetOrder(null); }}>Close</button>
              </div>
            </div>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <div style={{ flex: 1 }}>
                <div className="search-bar">
                  <input
                    type="text"
                    placeholder="Search menu items..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="search-input"
                  />
                </div>
                <div className="menu-items-grid">
                  {getFilteredMenuItems().map(item => (
                    <div key={item.id} className="menu-item-card">
                      <h4>{item.name}</h4>
                      <p className="menu-item-price">₱{item.price.toFixed(2)}</p>
                      <button className="btn btn-success btn-small" onClick={() => handleAddItemToList(item)}>
                        + Add
                      </button>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ flex: 1 }}>
                <h4>Items to add</h4>
                {addCartItems.length === 0 ? (
                  <p className="empty-cart">No items added</p>
                ) : (
                  <div>
                    {addCartItems.map(item => (
                        <div key={item.id} className="cart-item">
                          <div className="cart-item-info">
                            <p className="cart-item-name">{item.name}</p>
                            <p className="cart-item-price">₱{item.price.toFixed(2)}</p>
                            <textarea
                              className="notes-textarea"
                              placeholder="Notes (optional)"
                              value={item.notes || ''}
                              onChange={(e) => setAddCartItems(addCartItems.map(ci => ci.id === item.id ? { ...ci, notes: e.target.value } : ci))}
                            />
                          </div>
                          <div className="cart-item-controls">
                            <button className="btn-qty" onClick={() => setAddCartItems(addCartItems.map(ci => ci.id === item.id ? { ...ci, quantity: Math.max(1, ci.quantity - 1) } : ci))}>−</button>
                            <span className="qty">{item.quantity}</span>
                            <button className="btn-qty" onClick={() => setAddCartItems(addCartItems.map(ci => ci.id === item.id ? { ...ci, quantity: ci.quantity + 1 } : ci))}>+</button>
                            <button className="btn btn-danger btn-small" onClick={() => setAddCartItems(addCartItems.filter(ci => ci.id !== item.id))}>Remove</button>
                          </div>
                        </div>
                    ))}
                    <div className="cart-total" style={{ marginTop: '0.5rem' }}>
                      <strong>Total: ₱{addCartItems.reduce((s, it) => s + it.price * it.quantity, 0).toFixed(2)}</strong>
                    </div>
                    <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.5rem' }}>
                      <button className="btn btn-success" onClick={handleSubmitAddToOrder}>Add to Order</button>
                      <button className="btn btn-secondary" onClick={() => { setShowAddItemsModal(false); setAddTargetOrder(null); setAddCartItems([]); }}>Cancel</button>
                    </div>
                  </div>
                )}
              </div>
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
                            {item.prepared && (
                              <div className="item-prepared">✓ Prepared</div>
                            )}
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
                    <strong>Total: ₱{order.totalPrice.toFixed(2)}</strong>
                  </div>
                  <div style={{ marginTop: '0.5rem', display: 'flex', gap: '0.5rem', flexDirection: 'column' }}>
                          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                            <button className="btn btn-success btn-small" onClick={() => handleOpenAddItems(order)}>+ Add Items</button>
                            <div className="order-time" style={{ marginLeft: 'auto' }}>
                              <small>Created: {new Date(order.createdAt).toLocaleString()}</small>
                            </div>
                          </div>

                          {/* add-items inline panel removed; selection modal will be used instead */}
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
