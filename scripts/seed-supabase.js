import { createClient } from '@supabase/supabase-js';
import 'dotenv/config';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;
console.log('Supabase URL:', supabaseUrl);
console.log('Supabase Service Key:', supabaseServiceKey ? 'Exists' : 'Missing');
if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Mock data
const mockTribes = [
  {
    title: 'SF Tech Innovators',
    description: 'A vibrant community of tech enthusiasts, developers, and entrepreneurs pushing the boundaries of innovation in the Bay Area.',
    city: 'San Francisco, CA',
    is_private: false,
    cover_url: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?w=800',
  },
  {
    title: 'Urban Trail Runners',
    description: 'Explore the city through running! Weekly group runs through parks, waterfronts, and hidden urban trails.',
    city: 'New York, NY',
    is_private: false,
    cover_url: 'https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=800',
  },
  {
    title: 'Creative Canvas Collective',
    description: 'Artists of all levels coming together to create, inspire, and grow. From painting to digital art, all mediums welcome!',
    city: 'Los Angeles, CA',
    is_private: false,
    cover_url: 'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=800',
  },
  {
    title: 'Indie Game Developers',
    description: 'Building the next generation of games! Share your projects, get feedback, and collaborate with fellow game devs.',
    city: 'Austin, TX',
    is_private: false,
    cover_url: 'https://images.unsplash.com/photo-1556438064-2d7646166914?w=800',
  },
  {
    title: 'Foodies United',
    description: 'Discovering the best hidden gems and culinary experiences in the city. From street food to fine dining!',
    city: 'Chicago, IL',
    is_private: false,
    cover_url: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=800',
  },
  {
    title: 'Mountain Seekers',
    description: 'Weekend warriors conquering peaks and trails. All skill levels welcome for hiking, camping, and outdoor adventures.',
    city: 'Denver, CO',
    is_private: false,
    cover_url: 'https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800',
  },
];

const mockEvents = [
  {
    title: 'AI & Machine Learning Workshop',
    description: 'Hands-on workshop covering the latest in AI/ML. Perfect for beginners and intermediate developers looking to level up their skills.',
    location: '123 Tech Hub, San Francisco, CA',
    starts_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    ends_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000).toISOString(),
    capacity: 50,
    price: 0,
    banner_url: 'https://images.unsplash.com/photo-1485827404703-89b55fcc595e?w=800',
  },
  {
    title: 'City Marathon 2024',
    description: 'Join hundreds of runners for the annual city marathon. All levels welcome - walk, jog, or run!',
    location: 'Central Park, New York, NY',
    starts_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
    ends_at: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000 + 4 * 60 * 60 * 1000).toISOString(),
    capacity: 500,
    price: 45,
    banner_url: 'https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=800',
  },
  {
    title: 'Art Exhibition Opening',
    description: 'Opening night of our spring art exhibition. Meet local artists, enjoy refreshments, and celebrate creative expression.',
    location: 'Downtown Art Gallery, Los Angeles, CA',
    starts_at: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000).toISOString(),
    ends_at: new Date(Date.now() + 21 * 24 * 60 * 60 * 1000 + 3 * 60 * 60 * 1000).toISOString(),
    capacity: 200,
    price: 0,
    banner_url: 'https://images.unsplash.com/photo-1460661419201-fd4cecdf8a8b?w=800',
  },
];

async function seedDatabase() {
  try {
    console.log('Starting database seeding...');

    // Get the first authenticated user (or create a dummy one)
    const { data: { users }, error: usersError } = await supabase.auth.admin.listUsers();
    
    if (usersError) {
      console.error('Error fetching users:', usersError);
      return;
    }

    if (users.length === 0) {
      console.error('No users found. Please create a user first via the Signup flow.');
      return;
    }

    const userId = users[0].id;
    console.log(`Using user ID: ${userId}`);

    // Seed tribes
    console.log('Seeding tribes...');
    const tribesWithOwner = mockTribes.map(tribe => ({
      ...tribe,
      owner: userId,
      slug: tribe.title.toLowerCase().replace(/\s+/g, '-'),
    }));

    const { data: tribesData, error: tribesError } = await supabase
      .from('tribes')
      .insert(tribesWithOwner)
      .select();

    if (tribesError) {
      console.error('Error seeding tribes:', tribesError);
    } else {
      console.log(`✓ Seeded ${tribesData?.length || 0} tribes`);
    }

    // Seed events
    console.log('Seeding events...');
    const eventsWithOrganizer = mockEvents.map(event => ({
      ...event,
      organizer: userId,
      slug: event.title.toLowerCase().replace(/\s+/g, '-'),
    }));

    const { data: eventsData, error: eventsError } = await supabase
      .from('events')
      .insert(eventsWithOrganizer)
      .select();

    if (eventsError) {
      console.error('Error seeding events:', eventsError);
    } else {
      console.log(`✓ Seeded ${eventsData?.length || 0} events`);
    }

    // Add user as member to all tribes
    if (tribesData && tribesData.length > 0) {
      console.log('Adding user as member to all tribes...');
      const tribeMemberships = tribesData.map(tribe => ({
        tribe_id: tribe.id,
        user_id: userId,
        role: 'owner',
      }));

      const { error: memberError } = await supabase
        .from('tribe_members')
        .insert(tribeMemberships);

      if (memberError) {
        console.error('Error adding tribe memberships:', memberError);
      } else {
        console.log(`✓ Added user as member to ${tribeMemberships.length} tribes`);
      }
    }

    console.log('✅ Database seeding completed successfully!');
  } catch (error) {
    console.error('Error during seeding:', error);
    process.exit(1);
  }
}

seedDatabase();
