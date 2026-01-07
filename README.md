# Tribe Connect

A community-driven platform for discovering, creating, and attending local events through tribe-based communities.

## 📋 Project Info

**Live URL**: (Add your Vercel deployment URL)
**Repository**: https://github.com/yourusername/tribe-connect
**Backend**: Supabase (PostgreSQL + Edge Functions)
**Hosting**: Vercel (Frontend)

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm
- Supabase account
- Vercel account (for deployment)

### Installation & Development

If you want to work locally using your own IDE, you can clone this repo and push changes. Pushed changes will also be reflected in Lovable.

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd tribe-connect

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

The app will be available at `http://localhost:8080`

## 🛠️ Tech Stack

### Frontend
- **React 18** - UI framework
- **Vite** - Fast build tool
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **shadcn/ui** - Component library
- **Framer Motion** - Animations
- **React Router** - Client-side routing
- **Date-fns** - Date utilities

### Backend
- **Supabase** - PostgreSQL database + Auth
- **Edge Functions** (Deno) - Serverless backend logic
- **PostgreSQL** - Database with RLS policies

### Hosting & DevOps
- **Vercel** - Frontend deployment
- **Supabase** - Database & Edge Functions
- **GitHub Actions** - CI/CD

## 🏗️ Project Structure

```
tribe-connect/
├── src/
│   ├── components/       # Reusable React components
│   ├── pages/           # Page components (routes)
│   ├── hooks/           # Custom React hooks
│   ├── integrations/    # External service integration (Supabase, etc.)
│   └── styles/          # Global styles
├── supabase/
│   ├── functions/       # Edge Functions
│   ├── migrations/      # Database migrations
│   └── seed/           # Database seeding
├── public/              # Static assets
└── package.json
```

## 🔑 Key Features

- **User Authentication** - Sign up/login via Supabase Auth
- **Create & Discover Tribes** - Create communities or join existing ones
- **Event Management** - Create, RSVP, and comment on events
- **Real-time Chat** - Tribe-based messaging with Supabase Realtime
- **Notifications** - Real-time notifications for RSVPs, comments, etc.
- **Event Filtering** - Search by location, category, date
- **User Profiles** - Customizable user profiles with avatars
- **Direct Tribe Deletion** - Edge Function handles tribe deletion with storage cleanup

## 🚢 Deployment

### Frontend (Vercel)
```sh
# Vercel auto-deploys on git push to main
vercel --prod
```

### Environment Variables
Create a `.env` file in the root:
```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
```

### Supabase Setup
1. Create a Supabase project
2. Run migrations: `supabase db push`
3. Set Edge Function secrets (see `.env`)
4. Deploy functions: `supabase functions deploy`

## 📡 Edge Functions

- `delete-tribe-with-storage` - Deletes tribe + all associated storage files
- `geocode` - Geocodes locations using OpenStreetMap Nominatim API

## 🗄️ Database

Key tables:
- `users` (via auth.users)
- `profiles`
- `tribes`
- `tribe_members`
- `events`
- `event_attendees`
- `event_comments`
- `messages` (real-time chat)
- `notifications`

All tables have Row Level Security (RLS) policies enabled.

## 📚 API Documentation

### Authentication
- Sign up, login, logout via Supabase Auth
- JWT tokens for API requests

### Real-time Features
- Tribe chat via `messages` table (Realtime subscription)
- Event comments via `event_comments` table
- Notifications via `notifications` table

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see LICENSE file for details.

## 📧 Contact

For questions or support, please open an issue in the repository.
