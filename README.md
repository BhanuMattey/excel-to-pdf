# ExcelfromPDF

A modern web application to convert PDF tables to Excel spreadsheets using AI-powered extraction.

![ExcelfromPDF](https://via.placeholder.com/800x400?text=ExcelfromPDF+Screenshot)

## Features

- 🎯 **AI-Powered Extraction** - Intelligently recognizes table structures, merged cells, and headers
- 🔒 **Secure & Private** - Files processed with 256-bit SSL encryption
- ⚡ **Lightning Fast** - Convert hundreds of pages in seconds
- 📱 **Responsive Design** - Works on desktop, tablet, and mobile
- 👤 **User Authentication** - Secure login with Supabase
- 📊 **Conversion Tracking** - Track your usage and conversion history

## Tech Stack

### Frontend

- React.js (Vite)
- Tailwind CSS
- Framer Motion
- React Router
- Axios
- React Dropzone

### Backend

- Python (FastAPI)
- pdfplumber
- pandas
- openpyxl

### Database & Auth

- Supabase

## Getting Started

### Prerequisites

- Node.js 18+
- Python 3.9+
- Supabase account

### Installation

1. **Clone the repository**

   ```bash
   cd Exelfrompdf
   ```

2. **Install frontend dependencies**

   ```bash
   npm install
   ```

3. **Install backend dependencies**

   ```bash
   cd backend
   pip install -r requirements.txt
   cd ..
   ```

4. **Set up environment variables**

   Create a `.env` file in the root directory:

   ```env
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   VITE_API_URL=http://localhost:8000
   VITE_MAX_FILE_SIZE=52428800
   VITE_FREE_CONVERSION_LIMIT=500
   ```

5. **Set up Supabase database**

   Run the SQL schema in your Supabase SQL Editor:

   - Go to your Supabase dashboard
   - Navigate to SQL Editor
   - Copy and paste the contents of `supabase/schema.sql`
   - Run the query

### Running the Application

1. **Start the backend server**

   ```bash
   cd backend
   uvicorn main:app --reload --port 8000
   ```

2. **Start the frontend development server**

   ```bash
   npm run dev
   ```

3. **Open your browser**

   Navigate to `http://localhost:3000`

## Project Structure

```
Exelfrompdf/
├── backend/
│   ├── main.py              # FastAPI server
│   └── requirements.txt     # Python dependencies
├── src/
│   ├── components/
│   │   ├── auth/            # Authentication components
│   │   ├── dashboard/       # Dashboard components
│   │   ├── home/            # Landing page components
│   │   ├── layout/          # Layout components (Navbar, Footer)
│   │   └── upload/          # Upload components
│   ├── context/
│   │   └── AuthContext.jsx  # Authentication context
│   ├── hooks/
│   │   └── useUpload.js     # Upload hook
│   ├── pages/
│   │   ├── DashboardPage.jsx
│   │   ├── LandingPage.jsx
│   │   ├── LoginPage.jsx
│   │   └── SignupPage.jsx
│   ├── services/
│   │   ├── api.js           # API service
│   │   └── supabase.js      # Supabase service
│   ├── utils/
│   │   └── helpers.js       # Utility functions
│   ├── App.jsx
│   ├── index.css
│   └── main.jsx
├── supabase/
│   └── schema.sql           # Database schema
├── public/
│   └── favicon.svg
├── index.html
├── package.json
├── tailwind.config.js
├── postcss.config.js
├── vite.config.js
└── README.md
```

## API Endpoints

### Health Check

```
GET /api/health
```

Returns API status.

### Convert PDF to Excel

```
POST /api/convert
Content-Type: multipart/form-data
Body: file (PDF file)
```

Returns the converted Excel file.

## Environment Variables

| Variable                     | Description            | Default                 |
| ---------------------------- | ---------------------- | ----------------------- |
| `VITE_SUPABASE_URL`          | Supabase project URL   | Required                |
| `VITE_SUPABASE_ANON_KEY`     | Supabase anonymous key | Required                |
| `VITE_API_URL`               | Backend API URL        | `http://localhost:8000` |
| `VITE_MAX_FILE_SIZE`         | Max file size in bytes | `52428800` (50MB)       |
| `VITE_FREE_CONVERSION_LIMIT` | Free conversion limit  | `500`                   |

## Deployment

### Frontend (Vercel/Netlify)

1. Connect your repository
2. Set environment variables
3. Deploy

### Backend (Railway/Render/Fly.io)

1. Deploy the `backend` directory
2. Set up the environment
3. Configure CORS for your frontend domain

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License.

## Support

For support, email support@excelfromspdf.com or open an issue.
