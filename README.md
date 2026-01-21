# Restaurant Hybrid Enterprise Management System (HEMS)

A web-based restaurant management system built with React (frontend) and Node.js/Express (backend). The system includes order management and kitchen dispatch functionality for managing restaurant orders.

## Project Structure

```
subo-hems/
├── backend/          # Node.js/Express server
│   ├── server.js     # Main server file with API endpoints
│   └── package.json  # Backend dependencies
├── frontend/         # React application
│   ├── public/       # Static files
│   ├── src/
│   │   ├── pages/    # Page components (OrderManagement, KitchenDispatch)
│   │   ├── styles/   # CSS stylesheets
│   │   ├── App.js    # Main app component with routing
│   │   ├── index.js  # React entry point
│   │   └── App.css   # App styles
│   └── package.json  # Frontend dependencies
└── README.md         # This file
```

## Features

### Current Features
- **Order Management Page**: Create new orders, view pending and completed orders
- **Kitchen Dispatch Page**: View pending orders and mark them as completed
- **Tab Navigation**: Switch between pending and completed orders on both pages
- **Real-time Updates**: Kitchen dispatch auto-refreshes every 3 seconds
- **Responsive Design**: Works on desktop and mobile devices
- **In-memory Storage**: Temporary order storage (will migrate to PostgreSQL later)

### Future Enhancements
- PostgreSQL database integration
- User authentication
- Order history and analytics
- Kitchen display system (KDS)
- Mobile app (React Native)
- Order notifications

## Tech Stack

- **Frontend**: React 18, React Router, Axios
- **Backend**: Node.js, Express, CORS
- **Styling**: CSS3 with responsive design
- **Storage**: In-memory (temporary)

## Installation

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Backend Setup

```bash
cd backend
npm install
```

### Frontend Setup

```bash
cd frontend
npm install
```

## Running the Application

### Start Backend Server

```bash
cd backend
npm start
```
The backend server will run on `http://localhost:5000`

### Start Frontend Application

In a new terminal:

```bash
cd frontend
npm start
```
The frontend will open in your browser at `http://localhost:3000`

## API Endpoints

### Orders
- `GET /api/orders` - Get all orders (query param: `?status=pending` or `?status=completed`)
- `GET /api/orders/:id` - Get a specific order by ID
- `POST /api/orders` - Create a new order
- `PUT /api/orders/:id` - Update order status (mark as completed/pending)
- `DELETE /api/orders/:id` - Delete an order
- `GET /api/health` - Health check endpoint

### Request/Response Examples

**Create Order**
```bash
POST /api/orders
Content-Type: application/json

{
  "items": [
    { "name": "Burger", "quantity": 2, "price": 12.99 },
    { "name": "Fries", "quantity": 1, "price": 4.99 }
  ]
}
```

**Update Order Status**
```bash
PUT /api/orders/1
Content-Type: application/json

{
  "status": "completed"
}
```

## Usage

### Order Management Page
1. Navigate to the Order Management page (default page)
2. Click "Create New Order" to add items
3. Fill in item name, quantity, and price
4. Click "Create Order" to save
5. Switch between "Pending Orders" and "Completed Orders" tabs to view orders

### Kitchen Dispatch Page
1. Navigate to the Kitchen Dispatch page via navigation menu
2. View all pending orders that need to be prepared
3. Click "Mark as Done" to complete an order
4. Switch to "Completed Orders" tab to see finished orders
5. Page auto-refreshes every 3 seconds for new orders

## Development Notes

- Backend uses in-memory array for order storage
- All orders are lost when the server restarts (intentional for now)
- CORS is enabled for frontend to communicate with backend
- Automatic polling in Kitchen Dispatch ensures kitchen staff sees new orders quickly

## Next Steps

1. Integrate PostgreSQL database
2. Add user authentication and authorization
3. Implement order tracking and timestamps
4. Add kitchen display system improvements
5. Implement order notifications
6. Add order editing capabilities
7. Implement order search and filtering

## License

ISC
