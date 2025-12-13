import { motion } from 'framer-motion';
import { FileText, Shield, Users, AlertTriangle, Scale, Mail } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';

export default function Terms() {
  const sections = [
    {
      id: 1,
      title: 'Acceptance of Terms',
      icon: Shield,
      content: (
        <>
          <p className="text-muted-foreground leading-relaxed mb-4">
            By accessing or using Tribe Connect ("the Service"), you agree to be bound by these Terms of Service ("Terms"). 
            If you disagree with any part of these terms, you may not access the Service. These Terms apply to all visitors, 
            users, and others who access or use the Service.
          </p>
        </>
      ),
    },
    {
      id: 2,
      title: 'Description of Service',
      icon: Users,
      content: (
        <>
          <p className="text-muted-foreground leading-relaxed mb-4">
            Tribe Connect is a platform that enables users to create and manage groups, organize events, and connect with 
            other users. The Service allows users to sign up, create accounts, join or leave groups and events, and interact 
            with other members of the community.
          </p>
        </>
      ),
    },
    {
      id: 3,
      title: 'User Accounts and Registration',
      icon: Shield,
      content: (
        <>
          <p className="text-muted-foreground leading-relaxed mb-4">
            To access certain features of the Service, you must register for an account. When you register, you agree to:
          </p>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground mb-4">
            <li>Provide accurate, current, and complete information</li>
            <li>Maintain and promptly update your account information</li>
            <li>Maintain the security of your password and identification</li>
            <li>Accept all responsibility for activities that occur under your account</li>
            <li>Notify us immediately of any unauthorized use of your account</li>
          </ul>
          <p className="text-muted-foreground leading-relaxed">
            You are responsible for maintaining the confidentiality of your account credentials. You may not share your account 
            with others or use another person's account without permission.
          </p>
        </>
      ),
    },
    {
      id: 4,
      title: 'User Conduct and Responsibilities',
      icon: AlertTriangle,
      content: (
        <>
          <p className="text-muted-foreground leading-relaxed mb-4">
            You agree to use the Service only for lawful purposes and in accordance with these Terms. You agree not to:
          </p>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground">
            <li>Violate any applicable laws or regulations</li>
            <li>Infringe upon the rights of others, including intellectual property rights</li>
            <li>Harass, abuse, or harm other users</li>
            <li>Post false, misleading, or defamatory content</li>
            <li>Spam, phish, or engage in any fraudulent activity</li>
            <li>Interfere with or disrupt the Service or servers</li>
            <li>Attempt to gain unauthorized access to any portion of the Service</li>
            <li>Use automated systems to access the Service without permission</li>
            <li>Impersonate any person or entity</li>
          </ul>
        </>
      ),
    },
    {
      id: 5,
      title: 'Groups and Events',
      icon: Users,
      content: (
        <>
          <p className="text-muted-foreground leading-relaxed mb-4">
            Users may create groups and events on the platform. When creating a group or event, you agree that:
          </p>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground mb-4">
            <li>You have the right to create and manage the group or event</li>
            <li>The content you post is accurate and not misleading</li>
            <li>You will comply with all applicable laws and regulations</li>
            <li>You are responsible for moderating content within your groups</li>
          </ul>
          <p className="text-muted-foreground leading-relaxed">
            Users may join or leave groups and events at their discretion. Group and event creators may remove members or 
            cancel events in accordance with the Service's functionality, provided such actions comply with these Terms.
          </p>
        </>
      ),
    },
    {
      id: 6,
      title: 'Content Ownership and License',
      icon: FileText,
      content: (
        <>
          <p className="text-muted-foreground leading-relaxed mb-4">
            You retain ownership of any content you post, upload, or otherwise make available on the Service. By posting content, 
            you grant Tribe Connect a worldwide, non-exclusive, royalty-free license to use, reproduce, modify, and distribute 
            your content solely for the purpose of operating and providing the Service.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            You represent and warrant that you own or have the necessary rights to all content you post and that such content 
            does not violate any third-party rights.
          </p>
        </>
      ),
    },
    {
      id: 7,
      title: 'Prohibited Activities',
      icon: AlertTriangle,
      content: (
        <>
          <p className="text-muted-foreground leading-relaxed mb-4">The following activities are strictly prohibited:</p>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground">
            <li>Creating groups or events for illegal purposes</li>
            <li>Using the Service to promote hate speech, violence, or discrimination</li>
            <li>Collecting user information without consent</li>
            <li>Using the Service to distribute malware or engage in hacking</li>
            <li>Circumventing any security measures or access controls</li>
          </ul>
        </>
      ),
    },
    {
      id: 8,
      title: 'Termination',
      icon: AlertTriangle,
      content: (
        <>
          <p className="text-muted-foreground leading-relaxed mb-4">
            We reserve the right to suspend or terminate your account and access to the Service at our sole discretion, 
            without prior notice, for conduct that we believe violates these Terms or is harmful to other users, us, or 
            third parties, or for any other reason.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            You may terminate your account at any time by contacting us or using the account deletion features provided 
            in the Service. Upon termination, your right to use the Service will immediately cease.
          </p>
        </>
      ),
    },
    {
      id: 9,
      title: 'Disclaimers',
      icon: AlertTriangle,
      content: (
        <>
          <p className="text-muted-foreground leading-relaxed mb-4">
            THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED, 
            INCLUDING BUT NOT LIMITED TO IMPLIED WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND 
            NON-INFRINGEMENT.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            We do not warrant that the Service will be uninterrupted, secure, or error-free, or that defects will be corrected. 
            We are not responsible for the content, accuracy, or opinions expressed in groups or events created by users.
          </p>
        </>
      ),
    },
    {
      id: 10,
      title: 'Limitation of Liability',
      icon: Scale,
      content: (
        <>
          <p className="text-muted-foreground leading-relaxed">
            TO THE MAXIMUM EXTENT PERMITTED BY LAW, TRIBE CONNECT SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, 
            CONSEQUENTIAL, OR PUNITIVE DAMAGES, OR ANY LOSS OF PROFITS OR REVENUES, WHETHER INCURRED DIRECTLY OR INDIRECTLY, 
            OR ANY LOSS OF DATA, USE, GOODWILL, OR OTHER INTANGIBLE LOSSES RESULTING FROM YOUR USE OF THE SERVICE.
          </p>
        </>
      ),
    },
    {
      id: 11,
      title: 'Indemnification',
      icon: Shield,
      content: (
        <>
          <p className="text-muted-foreground leading-relaxed">
            You agree to indemnify and hold harmless Tribe Connect, its officers, directors, employees, and agents from any 
            claims, damages, losses, liabilities, and expenses (including legal fees) arising out of or relating to your use 
            of the Service, your violation of these Terms, or your violation of any rights of another.
          </p>
        </>
      ),
    },
    {
      id: 12,
      title: 'Changes to Terms',
      icon: FileText,
      content: (
        <>
          <p className="text-muted-foreground leading-relaxed mb-4">
            We reserve the right to modify or replace these Terms at any time. If a revision is material, we will provide 
            at least 30 days notice prior to any new terms taking effect. What constitutes a material change will be 
            determined at our sole discretion.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            By continuing to access or use the Service after any revisions become effective, you agree to be bound by the 
            revised terms.
          </p>
        </>
      ),
    },
    {
      id: 13,
      title: 'Governing Law',
      icon: Scale,
      content: (
        <>
          <p className="text-muted-foreground leading-relaxed">
            These Terms shall be governed by and construed in accordance with the laws of the jurisdiction in which Tribe 
            Connect operates, without regard to its conflict of law provisions.
          </p>
        </>
      ),
    },
    {
      id: 14,
      title: 'Severability',
      icon: Scale,
      content: (
        <>
          <p className="text-muted-foreground leading-relaxed">
            If any provision of these Terms is held to be invalid or unenforceable, the remaining provisions will remain 
            in full effect.
          </p>
        </>
      ),
    },
  ];

  return (
    <Layout>
      <div className="container py-12 md:py-20 max-w-4xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-6">
            <FileText className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-3xl md:text-4xl font-heading font-bold mb-4">
            Terms of Service
          </h1>
          <p className="text-muted-foreground text-lg">
            These Terms of Service govern your use of Tribe Connect. Please read them carefully before using the platform.
          </p>
        </motion.div>

        {/* Sections */}
        <div className="space-y-6">
          {sections.map((section, index) => {
            const Icon = section.icon;
            return (
              <motion.div
                key={section.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-card rounded-2xl border border-border p-6 md:p-8 shadow-card"
              >
                <div className="flex gap-4 mb-4">
                  <div className="shrink-0 w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
                    <Icon className="h-6 w-6 text-primary" />
                  </div>
                  <div className="flex-1">
                    <h2 className="text-xl font-heading font-semibold mb-2">
                      {section.id}. {section.title}
                    </h2>
                    <div className="prose prose-sm dark:prose-invert max-w-none">
                      {section.content}
                    </div>
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Contact Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
          className="bg-card rounded-2xl border border-border p-8 text-center mt-8"
        >
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 mb-4">
            <Mail className="h-6 w-6 text-primary" />
          </div>
          <h2 className="text-xl font-heading font-semibold mb-2">
            15. Contact Information
          </h2>
          <p className="text-muted-foreground mb-4">
            If you have any questions about these Terms of Service, please contact us at:
          </p>
          <p className="text-primary font-medium">support@tribeconnect.example</p>
        </motion.div>

        {/* Last Updated */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="text-center mt-8"
        >
          <p className="text-sm text-muted-foreground">
            Last updated: {new Date().toLocaleDateString()}
          </p>
        </motion.div>
      </div>
    </Layout>
  );
}
