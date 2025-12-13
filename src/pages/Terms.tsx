import { motion } from 'framer-motion';
import { Layout } from '@/components/layout/Layout';

export default function Terms() {
  return (
    <Layout>
      <div className="container py-12 md:py-20">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-heading font-bold mb-4">Terms of Service</h1>
          <p className="text-muted-foreground mb-6">
            These Terms of Service govern your use of TribeVibe. Please read them carefully before using the platform.
          </p>
          <div className="prose prose-lg dark:prose-invert">
            <h2>Acceptance of Terms</h2>
            <p>By accessing or using the Service you agree to be bound by these Terms.</p>

            <h2>User Conduct</h2>
            <p>Users agree to behave respectfully and follow community guidelines when interacting on the platform.</p>

            <h2>Contact</h2>
            <p>Questions about these Terms can be sent to support@tribevibe.example.</p>
          </div>
        </motion.div>
      </div>
    </Layout>
  );
}
