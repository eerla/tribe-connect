import { motion } from 'framer-motion';
import { Layout } from '@/components/layout/Layout';

export default function Privacy() {
  return (
    <Layout>
      <div className="container py-12 md:py-20">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="max-w-3xl mx-auto">
          <h1 className="text-3xl font-heading font-bold mb-4">Privacy Policy</h1>
          <p className="text-muted-foreground mb-6">
            This is the Privacy Policy for TribeVibe. We respect your privacy and are committed to protecting your personal data.
          </p>
          <div className="prose prose-lg dark:prose-invert">
            <h2>Information We Collect</h2>
            <p>We collect information to provide, improve, and protect our services. This may include account information, profile data, and activity logs.</p>

            <h2>How We Use Information</h2>
            <p>We use the information to operate the service, personalize user experience, and for safety and security.
            </p>

            <h2>Contact</h2>
            <p>If you have questions about this policy, contact us at support@tribevibe.example.</p>
          </div>
        </motion.div>
      </div>
    </Layout>
  );
}
