import { motion } from 'framer-motion';
import { Heart, Users, Globe, Sparkles } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';

export default function About() {
  const values = [
    {
      icon: Users,
      title: 'Community First',
      description: 'We believe in the power of bringing people together around shared interests and passions.',
    },
    {
      icon: Heart,
      title: 'Authentic Connections',
      description: 'Real friendships happen in person. We facilitate meaningful face-to-face interactions.',
    },
    {
      icon: Globe,
      title: 'Local Impact',
      description: 'Strong local communities create a better world. We help neighborhoods thrive.',
    },
    {
      icon: Sparkles,
      title: 'Joy & Discovery',
      description: 'Life is more fun when you try new things with great people. Adventure awaits!',
    },
  ];

  return (
    <Layout>
      <div className="container py-12 md:py-20">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center max-w-3xl mx-auto mb-16"
        >
          <h1 className="text-4xl md:text-5xl font-heading font-bold mb-6">
            About <span className="gradient-text">TribeVibe</span>
          </h1>
          <p className="text-xl text-muted-foreground leading-relaxed">
            We're on a mission to help people find their tribe — communities of like-minded individuals who share their passions, interests, and dreams.
          </p>
        </motion.div>

        {/* Story */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-card rounded-3xl border border-border p-8 md:p-12 mb-16"
        >
          <h2 className="text-2xl font-heading font-bold mb-4">Our Story</h2>
          <div className="prose prose-lg dark:prose-invert max-w-none">
            <p className="text-muted-foreground leading-relaxed">
              TribeVibe was born from a simple observation: despite being more connected than ever online, many people feel increasingly isolated in their daily lives. We wanted to change that.
            </p>
            <p className="text-muted-foreground leading-relaxed mt-4">
              We built TribeVibe to make it effortless to discover local communities, join exciting events, and meet people who genuinely share your interests. Whether you're into hiking, coding, cooking, or crafting — there's a tribe waiting for you.
            </p>
            <p className="text-muted-foreground leading-relaxed mt-4">
              Today, TribeVibe connects thousands of people every day, helping them build real friendships and find belonging in their local communities.
            </p>
          </div>
        </motion.div>

        {/* Values */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h2 className="text-2xl font-heading font-bold text-center mb-10">Our Values</h2>
          <div className="grid md:grid-cols-2 gap-6">
            {values.map((value, index) => (
              <motion.div
                key={value.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + index * 0.1 }}
                className="bg-card rounded-2xl border border-border p-6 flex gap-4"
              >
                <div className="shrink-0 w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                  <value.icon className="h-6 w-6 text-primary" />
                </div>
                <div>
                  <h3 className="font-heading font-semibold mb-2">{value.title}</h3>
                  <p className="text-muted-foreground">{value.description}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </Layout>
  );
}
