const express = require('express');
const cors = require('cors');
const os = require('os');

const app = express();
const PORT = 5000;

// Get local IP address
function getLocalIP() {
  const interfaces = os.networkInterfaces();
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      // Skip internal and non-IPv4 addresses
      if (iface.family === 'IPv4' && !iface.internal) {
        return iface.address;
      }
    }
  }
  return 'localhost';
}

// Middleware
app.use(cors());
app.use(express.json());

// Menu items organized by category
const menuItems = {
  appetizers: [
    { id: 1, name: 'Bruschetta', price: 185, category: 'appetizers' },
    { id: 2, name: 'Calamari Fritti', price: 225, category: 'appetizers' },
    { id: 3, name: 'Garlic Bread', price: 120, category: 'appetizers' },
    { id: 4, name: 'Spring Rolls', price: 155, category: 'appetizers' },
    { id: 5, name: 'Chicken Wings', price: 245, category: 'appetizers' },
    { id: 6, name: 'Lumpia Shanghai', price: 135, category: 'appetizers' },
    { id: 7, name: 'Fish Ball Soup', price: 95, category: 'appetizers' },
    { id: 8, name: 'Chicken Empanada', price: 125, category: 'appetizers' },
    { id: 9, name: 'Tuna Tartare', price: 265, category: 'appetizers' },
    { id: 10, name: 'Mushroom Risotto Balls', price: 195, category: 'appetizers' }
  ],
  mains: [
    { id: 11, name: 'Grilled Salmon', price: 595, category: 'mains' },
    { id: 12, name: 'Ribeye Steak', price: 725, category: 'mains' },
    { id: 13, name: 'Pasta Carbonara', price: 425, category: 'mains' },
    { id: 14, name: 'Chicken Parmesan', price: 465, category: 'mains' },
    { id: 15, name: 'Vegetable Stir Fry', price: 350, category: 'mains' },
    { id: 16, name: 'Adobo Chicken', price: 385, category: 'mains' },
    { id: 17, name: 'Sinigang na Pork', price: 420, category: 'mains' },
    { id: 18, name: 'Lechon Kawali', price: 495, category: 'mains' },
    { id: 19, name: 'Tinola na Manok', price: 365, category: 'mains' },
    { id: 20, name: 'Beef Rendang', price: 545, category: 'mains' },
    { id: 21, name: 'Grilled Fish (Lapu-Lapu)', price: 625, category: 'mains' },
    { id: 22, name: 'Pad Thai', price: 395, category: 'mains' }
  ],
  sides: [
    { id: 23, name: 'French Fries', price: 95, category: 'sides' },
    { id: 24, name: 'Sweet Potato Fries', price: 125, category: 'sides' },
    { id: 25, name: 'Caesar Salad', price: 185, category: 'sides' },
    { id: 26, name: 'Roasted Vegetables', price: 155, category: 'sides' },
    { id: 27, name: 'Mashed Potatoes', price: 135, category: 'sides' },
    { id: 28, name: 'Garlic Rice', price: 75, category: 'sides' },
    { id: 29, name: 'Steamed Broccoli', price: 125, category: 'sides' },
    { id: 30, name: 'Mac and Cheese', price: 165, category: 'sides' },
    { id: 31, name: 'Grilled Corn', price: 95, category: 'sides' },
    { id: 32, name: 'Garden Salad', price: 145, category: 'sides' }
  ],
  desserts: [
    { id: 33, name: 'Chocolate Cake', price: 165, category: 'desserts' },
    { id: 34, name: 'Tiramisu', price: 195, category: 'desserts' },
    { id: 35, name: 'Crème Brûlée', price: 215, category: 'desserts' },
    { id: 36, name: 'Cheesecake', price: 195, category: 'desserts' },
    { id: 37, name: 'Ice Cream Sundae', price: 145, category: 'desserts' },
    { id: 38, name: 'Ube Cake', price: 185, category: 'desserts' },
    { id: 39, name: 'Leche Flan', price: 125, category: 'desserts' },
    { id: 40, name: 'Mango Sorbet', price: 135, category: 'desserts' },
    { id: 41, name: 'Chocolate Mousse', price: 175, category: 'desserts' },
    { id: 42, name: 'Panna Cotta', price: 205, category: 'desserts' }
  ],
  drinks: [
    { id: 43, name: 'Coca Cola', price: 65, category: 'drinks' },
    { id: 44, name: 'Fresh Orange Juice', price: 125, category: 'drinks' },
    { id: 45, name: 'Iced Tea', price: 95, category: 'drinks' },
    { id: 46, name: 'Water', price: 50, category: 'drinks' },
    { id: 47, name: 'Espresso', price: 85, category: 'drinks' },
    { id: 48, name: 'Cappuccino', price: 125, category: 'drinks' },
    { id: 49, name: 'Iced Coffee', price: 115, category: 'drinks' },
    { id: 50, name: 'Mango Juice', price: 105, category: 'drinks' },
    { id: 51, name: 'Calamansi Juice', price: 95, category: 'drinks' },
    { id: 52, name: 'Mineral Water (Large)', price: 65, category: 'drinks' }
  ]
};

// In-memory order storage
let orders = [];

let orderIdCounter = 1;

// Routes

// GET menu items
app.get('/api/menu', (req, res) => {
  res.json(menuItems);
});

// GET all orders with optional status filter
app.get('/api/orders', (req, res) => {
  const { status } = req.query;
  
  if (status) {
    const filteredOrders = orders.filter(order => order.status === status);
    return res.json(filteredOrders);
  }
  
  res.json(orders);
});

// GET single order by ID
app.get('/api/orders/:id', (req, res) => {
  const order = orders.find(o => o.id === parseInt(req.params.id));
  
  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }
  
  res.json(order);
});

// POST create new order
app.post('/api/orders', (req, res) => {
  const { items, tableNumber } = req.body;
  
  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Items array is required' });
  }

  if (!tableNumber) {
    return res.status(400).json({ error: 'Table number is required' });
  }
  
  // Calculate total price
  const totalPrice = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
  
  const newOrder = {
    id: orderIdCounter++,
    orderNumber: `ORD${String(orderIdCounter - 1).padStart(3, '0')}`,
    tableNumber: parseInt(tableNumber),
    items,
    totalPrice: parseFloat(totalPrice.toFixed(2)),
    status: 'pending',
    createdAt: new Date(),
    completedAt: null
  };
  
  orders.push(newOrder);
  res.status(201).json(newOrder);
});

// PUT update order status (mark as completed)
app.put('/api/orders/:id', (req, res) => {
  const { status } = req.body;
  const order = orders.find(o => o.id === parseInt(req.params.id));
  
  if (!order) {
    return res.status(404).json({ error: 'Order not found' });
  }
  
  if (status === 'completed' && order.status === 'pending') {
    order.status = 'completed';
    order.completedAt = new Date();
  } else if (status === 'pending') {
    order.status = 'pending';
    order.completedAt = null;
  }
  
  res.json(order);
});

// DELETE order
app.delete('/api/orders/:id', (req, res) => {
  const index = orders.findIndex(o => o.id === parseInt(req.params.id));
  
  if (index === -1) {
    return res.status(404).json({ error: 'Order not found' });
  }
  
  const deletedOrder = orders.splice(index, 1);
  res.json(deletedOrder[0]);
});

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK' });
});

const localIP = getLocalIP();

app.listen(PORT, '0.0.0.0', () => {
  console.log(`\n=================================`);
  console.log(`Server is running!`);
  console.log(`Local:         http://localhost:${PORT}`);
  console.log(`Network:       http://${localIP}:${PORT}`);
  console.log(`=================================\n`);
});
