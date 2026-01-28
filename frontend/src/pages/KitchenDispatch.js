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

function KitchenDispatch() {
  const [orders, setOrders] = useState([]);
  const [activeTab, setActiveTab] = useState('pending');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [checkedItems, setCheckedItems] = useState({});
  const [previousOrderCount, setPreviousOrderCount] = useState(-1);
  const [previousOrderIds, setPreviousOrderIds] = useState(new Set());
  const [newOrderAlert, setNewOrderAlert] = useState(false);
  const soundPlayedRef = React.useRef(false);
  const isFirstLoadRef = React.useRef(true);

  const playNotificationSound = () => {
    try {
      // Create audio context
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      
      // Resume audio context if it's suspended (required by modern browsers)
      if (audioContext.state === 'suspended') {
        audioContext.resume();
      }
      
      const now = audioContext.currentTime;
      
      // Create a hotel bell-like sound with multiple frequencies
      // Bell sound typically has a sharp attack and long decay
      
      // Primary bell tone - higher frequency
      const osc1 = audioContext.createOscillator();
      const gain1 = audioContext.createGain();
      osc1.connect(gain1);
      gain1.connect(audioContext.destination);
      osc1.frequency.value = 1200; // High bell frequency
      osc1.type = 'sine';
      gain1.gain.setValueAtTime(0.3, now);
      gain1.gain.exponentialRampToValueAtTime(0.025, now + 1.5); // Longer decay
      osc1.start(now);
      osc1.stop(now + 1.5);
      
      // Secondary harmonic - slightly lower
      const osc2 = audioContext.createOscillator();
      const gain2 = audioContext.createGain();
      osc2.connect(gain2);
      gain2.connect(audioContext.destination);
      osc2.frequency.value = 900;
      osc2.type = 'sine';
      gain2.gain.setValueAtTime(0.2, now + 0.1);
      gain2.gain.exponentialRampToValueAtTime(0.01, now + 1.5);
      osc2.start(now + 0.1);
      osc2.stop(now + 1.5);
      
      // Add some brightness with a higher harmonic
      const osc3 = audioContext.createOscillator();
      const gain3 = audioContext.createGain();
      osc3.connect(gain3);
      gain3.connect(audioContext.destination);
      osc3.frequency.value = 1600;
      osc3.type = 'sine';
      gain3.gain.setValueAtTime(0.15, now);
      gain3.gain.exponentialRampToValueAtTime(0.005, now + 1.2);
      osc3.start(now);
      osc3.stop(now + 1.2);
      
      console.log('Hotel bell notification sound played');
    } catch (error) {
      console.error('Error playing notification sound:', error);
      // Fallback: try using a simple bell-like sound
      try {
        // Create a simple bell sound using a very basic Web Audio approach
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.frequency.value = 1000;
        gain.gain.setValueAtTime(1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.5);
      } catch (e) {
        console.error('Fallback audio also failed:', e);
      }
    }
  };

  useEffect(() => {
    console.log('KitchenDispatch mounted');
    fetchOrders();
    // Poll for new orders every 3 seconds
    const interval = setInterval(fetchOrders, 3000);
    
    // Enable audio on first user interaction (required by modern browsers)
    const enableAudio = () => {
      const audioContext = new (window.AudioContext || window.webkitAudioContext)();
      if (audioContext.state === 'suspended') {
        audioContext.resume().then(() => {
          console.log('Audio context resumed');
        });
      }
      // Remove listener after first interaction
      document.removeEventListener('click', enableAudio);
      document.removeEventListener('touchstart', enableAudio);
    };
    
    document.addEventListener('click', enableAudio);
    document.addEventListener('touchstart', enableAudio);
    
    return () => {
      clearInterval(interval);
      document.removeEventListener('click', enableAudio);
      document.removeEventListener('touchstart', enableAudio);
    };
  }, []);

  const fetchOrders = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/orders`);
      const newOrders = response.data;
      
      // Get current pending orders
      const currentPendingOrders = newOrders.filter(o => o.status === 'pending');
      const currentPendingCount = currentPendingOrders.length;
      const currentOrderIds = new Set(currentPendingOrders.map(o => o.id));
      
      console.log(`Fetched orders - Current: ${currentPendingCount}, Previous: ${previousOrderCount}`);
      console.log('Current pending order IDs:', Array.from(currentOrderIds));
      console.log('Previous pending order IDs:', Array.from(previousOrderIds));
      
      // Check for new orders (on first load or when new orders are added)
      if (isFirstLoadRef.current) {
        // First load - just initialize without playing sound
        console.log('First load - initializing order tracking');
        isFirstLoadRef.current = false;
        soundPlayedRef.current = false;
      } else if (currentPendingCount > 0) {
        // Check if there are any new order IDs that weren't there before
        const hasNewOrders = Array.from(currentOrderIds).some(id => !previousOrderIds.has(id));
        
        if (hasNewOrders && !soundPlayedRef.current) {
          console.log('New order(s) detected!');
          playNotificationSound();
          soundPlayedRef.current = true;
          setNewOrderAlert(true);
          // Auto-dismiss alert after 3 seconds
          setTimeout(() => setNewOrderAlert(false), 3000);
        }
      }
      
      // Reset sound flag if all orders are completed
      if (currentPendingCount === 0) {
        soundPlayedRef.current = false;
      }
      
      setPreviousOrderCount(currentPendingCount);
      setPreviousOrderIds(currentOrderIds);
      setOrders(newOrders);

      // Initialize checkedItems from server-side `prepared` flags
      const initialChecked = {};
      newOrders.forEach(order => {
        if (order.items && Array.isArray(order.items)) {
          order.items.forEach((item, idx) => {
            if (item.prepared) {
              initialChecked[`${order.id}-${idx}`] = true;
            }
          });
        }
      });
      setCheckedItems(initialChecked);
    } catch (err) {
      setError('Failed to fetch orders');
      console.error(err);
    }
  };

  const handleCompleteOrder = async (orderId) => {
    try {
      await axios.put(`${API_BASE_URL}/orders/${orderId}`, { status: 'completed' });
      fetchOrders();
    } catch (err) {
      setError('Failed to complete order');
      console.error(err);
    }
  };

  const handleResetOrder = async (orderId) => {
    try {
      await axios.put(`${API_BASE_URL}/orders/${orderId}`, { status: 'pending' });
      // Clear checked items for this order
      setCheckedItems(prev => {
        const updated = { ...prev };
        delete updated[orderId];
        return updated;
      });
      fetchOrders();
    } catch (err) {
      setError('Failed to reset order');
      console.error(err);
    }
  };

  const toggleItemCheck = (orderId, itemIndex) => {
    const key = `${orderId}-${itemIndex}`;
    const newValue = !checkedItems[key];

    // Optimistically update UI
    setCheckedItems(prev => ({
      ...prev,
      [key]: newValue
    }));

    // Persist prepared state to backend
    axios.patch(`${API_BASE_URL}/orders/${orderId}/items/${itemIndex}`, { prepared: newValue })
      .then(() => {
        // Refresh orders to keep everything in sync
        fetchOrders();
      })
      .catch(err => {
        console.error('Failed to update item prepared state', err);
        // Revert optimistic update on error
        setCheckedItems(prev => ({ ...prev, [key]: !newValue }));
      });
  };

  const areAllItemsChecked = (orderId, itemCount) => {
    for (let i = 0; i < itemCount; i++) {
      if (!checkedItems[`${orderId}-${i}`]) {
        return false;
      }
    }
    return true;
  };

  const filteredOrders = orders.filter(order => order.status === activeTab);

  return (
    <div className="page-container">
      <h2>Kitchen Dispatch</h2>
      
      {newOrderAlert && (
        <div className="new-order-alert">
          🔔 New Order Received!
        </div>
      )}
      
      {error && <div className="error-message">{error}</div>}

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
        
        {filteredOrders.length === 0 && (
          <div className="empty-state">
            <p>No {activeTab} orders</p>
          </div>
        )}

        {filteredOrders.length > 0 && (
          <div className="orders-list">
            {filteredOrders.map(order => (
              <div key={order.id} className={`order-card order-${order.status} ${order.type === 'takeout' ? 'order-takeout' : ''}`}>
                <div className="order-header">
                  <div className="order-header-content">
                    <h3 className="table-number">{order.type === 'takeout' ? 'Takeout' : `Table ${order.tableNumber}`}</h3>
                    <p className="order-number">{order.orderNumber}</p>
                  </div>
                  <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                    <span className={`status-badge status-${order.status}`}>
                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </span>
                    {order.type === 'takeout' && (
                      <span className="type-badge">Takeout</span>
                    )}
                  </div>
                </div>

                <div className="order-items">
                  <h4>Items:</h4>
                  <ul>
                    {order.items.map((item, idx) => (
                      <li key={idx} className={order.status === 'pending' ? 'kitchen-item' : ''}>
                        {order.status === 'pending' && (
                          <input
                            type="checkbox"
                            id={`item-${order.id}-${idx}`}
                            checked={checkedItems[`${order.id}-${idx}`] || false}
                            onChange={() => toggleItemCheck(order.id, idx)}
                            className="item-checkbox"
                          />
                        )}
                        <label htmlFor={order.status === 'pending' ? `item-${order.id}-${idx}` : ''}>
                          <strong>{item.quantity}x {item.name}</strong>
                          {item.notes && <div className="item-notes-kitchen">Note: {item.notes}</div>}
                        </label>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="order-time">
                  <small>Created: {new Date(order.createdAt).toLocaleString()}</small>
                  {order.status === 'completed' && order.completedAt && (
                    <small>Completed: {new Date(order.completedAt).toLocaleString()}</small>
                  )}
                </div>

                <div className="order-actions">
                  {order.status === 'pending' && (
                    <button
                      className="btn btn-success"
                      onClick={() => handleCompleteOrder(order.id)}
                      disabled={!areAllItemsChecked(order.id, order.items.length)}
                      title={!areAllItemsChecked(order.id, order.items.length) ? 'Check all items first' : ''}
                    >
                      ✓ Mark as Done
                    </button>
                  )}
                  {order.status === 'completed' && (
                    <button
                      className="btn btn-secondary"
                      onClick={() => handleResetOrder(order.id)}
                    >
                      Reset to Pending
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default KitchenDispatch;
