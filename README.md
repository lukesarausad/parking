# Seattle Parking Enforcement Tracker

Real-time web application to track and visualize parking enforcement activity in Seattle. View citation locations, monitor enforcement patterns, and analyze parking violation statistics.

## Features

- **Interactive Map**: View parking citations on an interactive map with clustering for dense areas
- **Real-time Updates**: WebSocket-powered live updates as new citations are issued
- **Heat Map Overlay**: Visualize high-enforcement zones
- **Officer Tracking**: Monitor active enforcement officers' locations
- **Statistics Dashboard**: Real-time stats including total citations, revenue, and top violation types
- **Filtering**: Filter by time range, violation type, and neighborhood
- **Mobile Responsive**: Works on desktop and mobile devices

## Tech Stack

### Frontend
- React 18 + TypeScript
- Tailwind CSS
- Leaflet for maps
- Vite build system

### Backend
- Node.js + Express
- TypeScript
- WebSocket for real-time updates
- Node-cache for performance

### Data Source
- Seattle Open Data Portal API
- Parking transaction data from `data.seattle.gov`

## Project Structure

```
seattle-parking-tracker/
├── frontend/          # React frontend application
│   ├── src/
│   │   ├── components/  # React components
│   │   ├── hooks/       # Custom React hooks
│   │   └── services/    # API services
│   └── ...
├── backend/           # Express API server
│   ├── src/
│   │   ├── routes/      # API endpoints
│   │   └── services/    # Business logic
│   └── ...
├── shared/            # Shared TypeScript types
│   └── src/
└── package.json       # Root workspace config
```

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repo-url>
cd seattle-parking-tracker
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
```bash
# Backend
cp backend/.env.example backend/.env

# Frontend (optional)
cp frontend/.env.example frontend/.env
```

4. Build the shared package:
```bash
npm run build --workspace=shared
```

5. Start the development servers:
```bash
npm run dev
```

This will start:
- Backend API at http://localhost:3001
- Frontend dev server at http://localhost:5173

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/citations` | GET | Get parking citations with filters |
| `/api/citations/:id` | GET | Get a specific citation |
| `/api/statistics/today` | GET | Get today's statistics |
| `/api/heatmap` | GET | Get heatmap data |
| `/api/officers/active` | GET | Get active officer locations |
| `/ws/live-updates` | WS | WebSocket for real-time updates |

### Query Parameters

**GET /api/citations**
- `from` - Start timestamp (ISO 8601)
- `to` - End timestamp (ISO 8601)
- `type` - Violation type filter
- `neighborhood` - Neighborhood filter
- `limit` - Number of results (default: 100)
- `offset` - Pagination offset

## Configuration

### Environment Variables

**Backend (.env)**
- `PORT` - Server port (default: 3001)
- `SEATTLE_OPEN_DATA_API_KEY` - Optional API key for higher rate limits
- `CORS_ORIGIN` - Allowed CORS origin
- `REDIS_URL` - Optional Redis connection string

**Frontend (.env)**
- `VITE_API_URL` - Backend API URL
- `VITE_MAPBOX_ACCESS_TOKEN` - Optional Mapbox token for premium maps

## Seattle Neighborhoods

The application focuses on high-enforcement areas:
- Downtown
- Capitol Hill
- University District
- Ballard
- Fremont
- Queen Anne
- South Lake Union
- Pioneer Square
- International District
- Belltown

## Violation Types

Common parking violations tracked:
- Expired Meter ($47)
- No Parking Zone ($47)
- Street Cleaning ($65)
- Fire Hydrant ($250)
- Handicap Zone ($450)
- Loading Zone ($47)
- Double Parking ($47)
- Overtime Parking ($47)

## Development

### Running Tests
```bash
npm test
```

### Building for Production
```bash
npm run build
```

### Linting
```bash
npm run lint
```

## Deployment

### Frontend
Deploy to Vercel, Netlify, or any static hosting:
```bash
cd frontend && npm run build
# Upload dist/ folder
```

### Backend
Deploy to Railway, Render, or any Node.js hosting:
```bash
cd backend && npm run build
npm start
```

## Privacy Considerations

- Vehicle plate numbers are automatically anonymized (last 3 digits hidden)
- No personal data is stored
- All data comes from public records

## License

MIT

## Acknowledgments

- Seattle Open Data Portal for providing public parking data
- OpenStreetMap for map tiles
