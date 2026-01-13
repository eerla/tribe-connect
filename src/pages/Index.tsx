import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { Search, Users, Calendar, MapPin, ArrowRight, Sparkles, MessageCircle, Zap, Globe } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { TribeCard } from '@/components/cards/TribeCard';
import { EventCard } from '@/components/cards/EventCard';
import { CategoryIcon } from '@/components/common/CategoryIcon';
import { categories } from '@/data/categories';
import { OnboardingBadge } from '@/components/onboarding/OnboardingBadge';
import { useState, useEffect } from 'react';
import { useTribes } from '@/hooks/useTribes';
import { useEvents } from '@/hooks/useEvents';
import { useStats } from '@/hooks/useStats';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { SEO } from '@/components/common/SEO';

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.1 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

export default function Index() {
  const [searchQuery, setSearchQuery] = useState('');
  const [showOnboarding, setShowOnboarding] = useState(true);
  const { tribes } = useTribes();
  const { events } = useEvents();
  const { data: stats } = useStats();
  const { user } = useAuth();

  // Fetch new user status
  const { data: profile } = useQuery({
    queryKey: ['profile-new-user', user?.id],
    queryFn: async () => {
      if (!user?.id) return null;
      const { data } = await supabase
        .from('profiles')
        .select('is_new_user')
        .eq('id', user.id)
        .single();
      return data;
    },
    enabled: !!user?.id,
  });

  const fmt = (n?: number) => {
    if (typeof n !== 'number') return null;
    if (n >= 1_000_000) return `${Math.floor(n / 1_000_000)}M+`;
    if (n >= 1_000) return `${Math.floor(n / 1_000)}K+`;
    return `${n}+`;
  };

  const featuredTribes = tribes?.slice(0, 3) || [];
  const upcomingEvents = events?.slice(0, 3) || [];

  return (
    <Layout>
      <SEO
        title="Find Your Tribe"
        description="TribeVibe helps you discover local tribes, join real-time chats, and RSVP to nearby events—all in one place."
        image="/og-image.png"
        url="/"
        type="website"
      />
      
      {/* Show onboarding badge for new users */}
      {showOnboarding && (
        <div className="container pt-6">
          <OnboardingBadge 
            isNewUser={profile?.is_new_user} 
            onDismiss={() => setShowOnboarding(false)}
          />
        </div>
      )}
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-[var(--gradient-hero)]" />
        <div className="absolute inset-0 bg-primary/5 opacity-50" />
        
        <div className="container relative pt-20 pb-24 md:pt-32 md:pb-36">
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            className="max-w-3xl mx-auto text-center"
          >
            <motion.div variants={itemVariants} className="mb-6">
              <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium">
                <Sparkles className="h-4 w-4" />
                {stats?.members ? `Join ${fmt(stats.members)} community members` : 'Join 50K+ community members'}
              </span>
            </motion.div>

            <motion.h1
              variants={itemVariants}
              className="text-4xl md:text-6xl lg:text-7xl font-heading font-bold mb-6 tracking-tight"
            >
              Find Your{' '}
              <span className="gradient-text">Tribe</span>,<br />
              Feel the{' '}
              <span className="gradient-text">Vibe</span>
            </motion.h1>

            <motion.p
              variants={itemVariants}
              className="text-lg md:text-xl text-muted-foreground mb-8 max-w-xl mx-auto"
            >
              Connect with local communities, discover amazing events, and build meaningful friendships with people who share your passions.
            </motion.p>

            {/* Search Bar */}
            <motion.div
              variants={itemVariants}
              className="flex flex-col sm:flex-row gap-3 max-w-xl mx-auto mb-8"
            >
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                <Input
                  placeholder="Search events, tribes, or interests..."
                  className="pl-12 h-14 text-base"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <Button variant="hero" size="xl" asChild>
                <Link to={`/events?q=${searchQuery}`}>
                  Explore <ArrowRight className="h-5 w-5" />
                </Link>
              </Button>
            </motion.div>

            {/* Quick Stats */}
            <motion.div
              variants={itemVariants}
              className="flex flex-wrap justify-center gap-8 text-center"
            >
              <div>
                <p className="text-2xl md:text-3xl font-bold font-heading gradient-text">{fmt(stats?.tribes) ?? '50+'}</p>
                <p className="text-sm text-muted-foreground">Tribes</p>
              </div>
              <div>
                <p className="text-2xl md:text-3xl font-bold font-heading gradient-text">{fmt(stats?.members) ?? '10K+'}</p>
                <p className="text-sm text-muted-foreground">Members</p>
              </div>
              <div>
                <p className="text-2xl md:text-3xl font-bold font-heading gradient-text">{fmt(stats?.eventsPerMonth) ?? '80+'}</p>
                <p className="text-sm text-muted-foreground">Events This Month</p>
              </div>
            </motion.div>
          </motion.div>
        </div>
      </section>

      {/* Why TribeVibe Section */}
      <section className="py-16">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-2xl md:text-3xl font-heading font-bold mb-2">
              Why Choose TribeVibe?
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Built for real human connection. Everything you need to find your people and build lasting communities.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6">
            {/* Card 1 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0 }}
              className="rounded-2xl bg-card border border-border p-8 hover:border-primary/50 hover:shadow-lg transition-all duration-300"
            >
              <div className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center mb-4">
                <MapPin className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Find Locally</h3>
              <p className="text-muted-foreground">
                Discover communities and events happening in your neighborhood. Connect with people who are actually near you, not across the globe.
              </p>
            </motion.div>

            {/* Card 2 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="rounded-2xl bg-card border border-border p-8 hover:border-primary/50 hover:shadow-lg transition-all duration-300"
            >
              <div className="w-12 h-12 rounded-xl bg-secondary/10 text-secondary flex items-center justify-center mb-4">
                <MessageCircle className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Chat Built-In</h3>
              <p className="text-muted-foreground">
                Real-time messaging with your community. No app switching, no friction. Chat, plan, and connect all in one place.
              </p>
            </motion.div>

            {/* Card 3 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="rounded-2xl bg-card border border-border p-8 hover:border-primary/50 hover:shadow-lg transition-all duration-300"
            >
              <div className="w-12 h-12 rounded-xl bg-amber-100/20 text-amber-600 flex items-center justify-center mb-4">
                <Zap className="h-6 w-6" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Always Free</h3>
              <p className="text-muted-foreground">
                Zero fees. No membership charges. Create tribes, organize events, and build your community without paying a cent.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Categories Section */}
      <section className="py-16 bg-muted/30">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-10"
          >
            <h2 className="text-2xl md:text-3xl font-heading font-bold mb-2">
              Explore by Interest
            </h2>
            <p className="text-muted-foreground">
              Find communities that match your passions
            </p>
          </motion.div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-4">
            {categories.slice(0, 10).map((category, index) => (
              <motion.div
                key={category.id}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.05 }}
              >
                <Link
                  to={`/groups?category=${encodeURIComponent(category.name)}`}
                  className="flex flex-col items-center gap-3 p-6 rounded-2xl bg-card border border-border hover:border-primary/50 hover:shadow-lg transition-all duration-300 group"
                >
                  <div className={`p-3 rounded-xl bg-${category.color}/10 text-${category.color} group-hover:scale-110 transition-transform`}>
                    <CategoryIcon icon={category.icon} className="h-6 w-6" />
                  </div>
                  <span className="text-sm font-medium text-center">{category.name}</span>
                </Link>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-16 bg-muted/30">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-2xl md:text-3xl font-heading font-bold mb-2">
              How It Works
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Getting started is simple. Three easy steps to find your community.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {/* Step 1 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0 }}
              className="text-center"
            >
              <div className="w-16 h-16 rounded-full bg-primary/10 text-primary flex items-center justify-center mx-auto mb-6 text-2xl font-bold font-heading">
                1
              </div>
              <h3 className="text-lg font-semibold mb-2">Find Your Interest</h3>
              <p className="text-muted-foreground">
                Browse by category or search for interests you care about. Discover tribes and events that match your passions.
              </p>
            </motion.div>

            {/* Arrow */}
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="hidden md:flex items-center justify-center"
            >
              <ArrowRight className="h-6 w-6 text-muted-foreground" />
            </motion.div>

            {/* Step 2 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="text-center md:col-start-2"
            >
              <div className="w-16 h-16 rounded-full bg-secondary/10 text-secondary flex items-center justify-center mx-auto mb-6 text-2xl font-bold font-heading">
                2
              </div>
              <h3 className="text-lg font-semibold mb-2">Join & Connect</h3>
              <p className="text-muted-foreground">
                Become a member and start connecting. Chat with people who share your interests, make new friends, and build relationships.
              </p>
            </motion.div>

            {/* Arrow */}
            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ delay: 0.3 }}
              className="hidden md:flex items-center justify-center"
            >
              <ArrowRight className="h-6 w-6 text-muted-foreground" />
            </motion.div>

            {/* Step 3 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="text-center md:col-start-3"
            >
              <div className="w-16 h-16 rounded-full bg-amber-100/20 text-amber-600 flex items-center justify-center mx-auto mb-6 text-2xl font-bold font-heading">
                3
              </div>
              <h3 className="text-lg font-semibold mb-2">Discover & RSVP</h3>
              <p className="text-muted-foreground">
                Find upcoming events organized by your community. RSVP, show up, and create unforgettable experiences together.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Featured Tribes */}
      <section className="py-16">
        <div className="container">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl md:text-3xl font-heading font-bold mb-1">
                Featured Tribes
              </h2>
              <p className="text-muted-foreground">
                Popular communities near you
              </p>
            </div>
            <Button variant="ghost" asChild>
              <Link to="/groups" className="hidden sm:flex items-center gap-2">
                View all <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredTribes.map((tribe, index) => (
              <TribeCard key={tribe.id} tribe={tribe} index={index} />
            ))}
          </div>

          <div className="mt-6 text-center sm:hidden">
            <Button variant="outline" asChild>
              <Link to="/groups">View all tribes</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Upcoming Events */}
      <section className="py-16 bg-muted/30">
        <div className="container">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl md:text-3xl font-heading font-bold mb-1">
                Upcoming Events
              </h2>
              <p className="text-muted-foreground">
                Don't miss out on these experiences
              </p>
            </div>
            <Button variant="ghost" asChild>
              <Link to="/events" className="hidden sm:flex items-center gap-2">
                View all <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {upcomingEvents.map((event, index) => (
              <EventCard key={event.id} event={event} index={index} />
            ))}
          </div>

          <div className="mt-6 text-center sm:hidden">
            <Button variant="outline" asChild>
              <Link to="/events">View all events</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-16">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="text-center mb-12"
          >
            <h2 className="text-2xl md:text-3xl font-heading font-bold mb-2">
              What Members Say
            </h2>
            <p className="text-muted-foreground">
              Real stories from people who found their community on TribeVibe
            </p>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {/* Testimonial 1 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0 }}
              className="rounded-2xl bg-card border border-border p-8"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-lg font-semibold">
                  AJ
                </div>
                <div>
                  <p className="font-semibold">Alex J.</p>
                  <p className="text-sm text-muted-foreground">San Francisco, CA</p>
                </div>
              </div>
              <p className="text-muted-foreground mb-4">
                "I moved to SF knowing nobody. Found a hiking tribe on TribeVibe, and now I have my closest friends. The app made it so easy!"
              </p>
              <div className="flex gap-1">
                {'★★★★★'.split('').map((_, i) => (
                  <span key={i} className="text-amber-400">★</span>
                ))}
              </div>
            </motion.div>

            {/* Testimonial 2 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.1 }}
              className="rounded-2xl bg-card border border-border p-8"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-secondary/20 flex items-center justify-center text-lg font-semibold">
                  MJ
                </div>
                <div>
                  <p className="font-semibold">Maya J.</p>
                  <p className="text-sm text-muted-foreground">Brooklyn, NY</p>
                </div>
              </div>
              <p className="text-muted-foreground mb-4">
                "As an event organizer, TribeVibe saved me so much time. No more WhatsApp chaos. Everything is organized in one place!"
              </p>
              <div className="flex gap-1">
                {'★★★★★'.split('').map((_, i) => (
                  <span key={i} className="text-amber-400">★</span>
                ))}
              </div>
            </motion.div>

            {/* Testimonial 3 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: 0.2 }}
              className="rounded-2xl bg-card border border-border p-8"
            >
              <div className="flex items-center gap-4 mb-4">
                <div className="w-12 h-12 rounded-full bg-amber-100/20 text-amber-600 flex items-center justify-center text-lg font-semibold">
                  RK
                </div>
                <div>
                  <p className="font-semibold">Raj K.</p>
                  <p className="text-sm text-muted-foreground">Austin, TX</p>
                </div>
              </div>
              <p className="text-muted-foreground mb-4">
                "Found a tech startup group that led to my co-founder. TribeVibe isn't just an app—it's a community that changed my life!"
              </p>
              <div className="flex gap-1">
                {'★★★★★'.split('').map((_, i) => (
                  <span key={i} className="text-amber-400">★</span>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary to-secondary p-8 md:p-16 text-center"
          >
            <div className="absolute inset-0 bg-primary-foreground/5" />
            
            <div className="relative">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-heading font-bold text-primary-foreground mb-4">
                Ready to Find Your Tribe?
              </h2>
              <p className="text-lg text-primary-foreground/80 mb-8 max-w-xl mx-auto">
                Join thousands of people connecting through shared interests. Start your journey today.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  size="xl"
                  className="bg-background text-foreground hover:bg-background/90"
                  asChild
                >
                  <Link to="/signup">
                    Get Started Free
                  </Link>
                </Button>
                <Button
                  variant="outline"
                  size="xl"
                  className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10"
                  asChild
                >
                  <Link to="/explore">
                    Explore Nearby
                  </Link>
                </Button>
              </div>
            </div>
          </motion.div>
        </div>
      </section>
    </Layout>
  );
}
