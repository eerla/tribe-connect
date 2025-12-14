import { motion } from 'framer-motion';
import { Shield, Database, Eye, Share2, Lock, Settings, Cookie, Clock, Baby, Globe, FileText, Mail } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';

export default function Privacy() {
  const sections = [
    {
      id: 1,
      title: 'Introduction',
      icon: Shield,
      content: (
        <>
          <p className="text-muted-foreground leading-relaxed">
            Tribe Connect ("we," "our," or "us") is committed to protecting your privacy. This Privacy Policy explains 
            how we collect, use, disclose, and safeguard your information when you use our platform. Please read this 
            policy carefully to understand our practices regarding your personal data.
          </p>
        </>
      ),
    },
    {
      id: 2,
      title: 'Information We Collect',
      icon: Database,
      subsections: [
        {
          title: '2.1 Information You Provide to Us',
          content: (
            <>
              <p className="text-muted-foreground leading-relaxed mb-3">
                We collect information that you provide directly to us, including:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li><strong>Account Information:</strong> Name, email address, password, and other registration details</li>
                <li><strong>Profile Information:</strong> Profile picture, bio, location, and other optional profile details</li>
                <li><strong>Content:</strong> Groups you create, events you organize, posts, comments, and other content you submit</li>
                <li><strong>Communications:</strong> Messages you send through the platform and communications with our support team</li>
              </ul>
            </>
          ),
        },
        {
          title: '2.2 Information We Collect Automatically',
          content: (
            <>
              <p className="text-muted-foreground leading-relaxed mb-3">
                When you use our Service, we automatically collect certain information, including:
              </p>
              <ul className="list-disc list-inside space-y-2 text-muted-foreground">
                <li><strong>Usage Data:</strong> Information about how you interact with the Service, such as pages visited, features used, and time spent</li>
                <li><strong>Device Information:</strong> IP address, browser type, operating system, device identifiers, and mobile network information</li>
                <li><strong>Log Data:</strong> Server logs, including access times, pages viewed, and other system activity</li>
                <li><strong>Location Data:</strong> General location information based on your IP address or device settings (if enabled)</li>
              </ul>
            </>
          ),
        },
        {
          title: '2.3 Information from Third Parties',
          content: (
            <>
              <p className="text-muted-foreground leading-relaxed">
                We may receive information about you from third-party services if you choose to link your account or authenticate 
                through social media platforms or other services.
              </p>
            </>
          ),
        },
      ],
    },
    {
      id: 3,
      title: 'How We Use Your Information',
      icon: Eye,
      content: (
        <>
          <p className="text-muted-foreground leading-relaxed mb-3">We use the information we collect to:</p>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground">
            <li>Provide, maintain, and improve the Service</li>
            <li>Create and manage your account</li>
            <li>Process your transactions and send related information</li>
            <li>Send you technical notices, updates, and support messages</li>
            <li>Respond to your comments, questions, and requests</li>
            <li>Personalize your experience and provide content and features relevant to your interests</li>
            <li>Monitor and analyze trends, usage, and activities in connection with the Service</li>
            <li>Detect, prevent, and address technical issues and fraudulent or illegal activity</li>
            <li>Facilitate communication between users within groups and events</li>
            <li>Send you marketing communications (with your consent, where required)</li>
          </ul>
        </>
      ),
    },
    {
      id: 4,
      title: 'How We Share Your Information',
      icon: Share2,
      subsections: [
        {
          title: '4.1 Public Information',
          content: (
            <>
              <p className="text-muted-foreground leading-relaxed">
                Information you choose to make public, such as your profile information, groups you create, and events you 
                organize, will be visible to other users of the Service.
              </p>
            </>
          ),
        },
        {
          title: '4.2 With Other Users',
          content: (
            <>
              <p className="text-muted-foreground leading-relaxed">
                When you join a group or event, other members of that group or event may see your profile information and 
                the content you post within that context.
              </p>
            </>
          ),
        },
        {
          title: '4.3 Service Providers',
          content: (
            <>
              <p className="text-muted-foreground leading-relaxed">
                We may share your information with third-party service providers who perform services on our behalf, such as 
                hosting, data analysis, payment processing, customer service, and email delivery.
              </p>
            </>
          ),
        },
        {
          title: '4.4 Legal Requirements',
          content: (
            <>
              <p className="text-muted-foreground leading-relaxed">
                We may disclose your information if required to do so by law or in response to valid requests by public 
                authorities (e.g., a court or government agency).
              </p>
            </>
          ),
        },
        {
          title: '4.5 Business Transfers',
          content: (
            <>
              <p className="text-muted-foreground leading-relaxed">
                In the event of a merger, acquisition, or sale of assets, your information may be transferred as part of that 
                transaction.
              </p>
            </>
          ),
        },
        {
          title: '4.6 With Your Consent',
          content: (
            <>
              <p className="text-muted-foreground leading-relaxed">
                We may share your information for any other purpose with your explicit consent.
              </p>
            </>
          ),
        },
      ],
    },
    {
      id: 5,
      title: 'Data Security',
      icon: Lock,
      content: (
        <>
          <p className="text-muted-foreground leading-relaxed mb-4">
            We implement appropriate technical and organizational security measures to protect your personal information 
            against unauthorized access, alteration, disclosure, or destruction. However, no method of transmission over 
            the Internet or electronic storage is 100% secure, and we cannot guarantee absolute security.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            You are responsible for maintaining the confidentiality of your account credentials and for all activities 
            that occur under your account.
          </p>
        </>
      ),
    },
    {
      id: 6,
      title: 'Your Rights and Choices',
      icon: Settings,
      content: (
        <>
          <p className="text-muted-foreground leading-relaxed mb-3">
            Depending on your location, you may have certain rights regarding your personal information:
          </p>
          <ul className="list-disc list-inside space-y-2 text-muted-foreground mb-4">
            <li><strong>Access:</strong> Request access to your personal information</li>
            <li><strong>Correction:</strong> Request correction of inaccurate or incomplete information</li>
            <li><strong>Deletion:</strong> Request deletion of your personal information</li>
            <li><strong>Portability:</strong> Request transfer of your data to another service</li>
            <li><strong>Objection:</strong> Object to processing of your personal information</li>
            <li><strong>Restriction:</strong> Request restriction of processing of your personal information</li>
            <li><strong>Withdraw Consent:</strong> Withdraw consent where processing is based on consent</li>
          </ul>
          <p className="text-muted-foreground leading-relaxed">
            To exercise these rights, please contact us using the information provided in the Contact section below. 
            We will respond to your request in accordance with applicable law.
          </p>
        </>
      ),
    },
    {
      id: 7,
      title: 'Account Settings and Preferences',
      icon: Settings,
      content: (
        <>
          <p className="text-muted-foreground leading-relaxed">
            You can update your account information and privacy preferences at any time through your account settings. 
            You may also opt out of certain communications by following the unsubscribe instructions in those messages.
          </p>
        </>
      ),
    },
    {
      id: 8,
      title: 'Cookies and Tracking Technologies',
      icon: Cookie,
      content: (
        <>
          <p className="text-muted-foreground leading-relaxed mb-4">
            We use cookies and similar tracking technologies to collect and use personal information about you, including 
            to serve interest-based advertising. Cookies are small data files stored on your device that help us improve 
            your experience, analyze usage, and assist with security.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            You can control cookies through your browser settings. However, disabling cookies may limit your ability to 
            use certain features of the Service.
          </p>
        </>
      ),
    },
    {
      id: 9,
      title: 'Data Retention',
      icon: Clock,
      content: (
        <>
          <p className="text-muted-foreground leading-relaxed">
            We retain your personal information for as long as necessary to provide the Service, fulfill the purposes 
            described in this policy, comply with legal obligations, resolve disputes, and enforce our agreements. When 
            you delete your account, we will delete or anonymize your personal information, except where we are required 
            to retain it for legal purposes.
          </p>
        </>
      ),
    },
    {
      id: 10,
      title: "Children's Privacy",
      icon: Baby,
      content: (
        <>
          <p className="text-muted-foreground leading-relaxed">
            The Service is not intended for children under the age of 13 (or the minimum age in your jurisdiction). We do 
            not knowingly collect personal information from children. If you believe we have collected information from a 
            child, please contact us immediately, and we will take steps to delete such information.
          </p>
        </>
      ),
    },
    {
      id: 11,
      title: 'International Data Transfers',
      icon: Globe,
      content: (
        <>
          <p className="text-muted-foreground leading-relaxed">
            Your information may be transferred to and processed in countries other than your country of residence. These 
            countries may have data protection laws that differ from those in your country. By using the Service, you 
            consent to the transfer of your information to these countries.
          </p>
        </>
      ),
    },
    {
      id: 12,
      title: 'California Privacy Rights',
      icon: FileText,
      content: (
        <>
          <p className="text-muted-foreground leading-relaxed">
            If you are a California resident, you have additional rights under the California Consumer Privacy Act (CCPA), 
            including the right to know what personal information we collect, the right to delete personal information, 
            and the right to opt out of the sale of personal information (if applicable).
          </p>
        </>
      ),
    },
    {
      id: 13,
      title: 'European Privacy Rights',
      icon: FileText,
      content: (
        <>
          <p className="text-muted-foreground leading-relaxed">
            If you are located in the European Economic Area (EEA), you have additional rights under the General Data 
            Protection Regulation (GDPR), including the rights listed in Section 6 above. Our legal basis for processing 
            your information includes your consent, performance of a contract, compliance with legal obligations, and our 
            legitimate interests.
          </p>
        </>
      ),
    },
    {
      id: 14,
      title: 'Changes to This Privacy Policy',
      icon: FileText,
      content: (
        <>
          <p className="text-muted-foreground leading-relaxed mb-4">
            We may update this Privacy Policy from time to time. We will notify you of any changes by posting the new 
            Privacy Policy on this page and updating the "Last updated" date. We may also notify you via email or through 
            the Service for material changes.
          </p>
          <p className="text-muted-foreground leading-relaxed">
            You are advised to review this Privacy Policy periodically for any changes. Changes to this Privacy Policy are 
            effective when they are posted on this page.
          </p>
        </>
      ),
    },
    {
      id: 15,
      title: 'Third-Party Links',
      icon: Share2,
      content: (
        <>
          <p className="text-muted-foreground leading-relaxed">
            The Service may contain links to third-party websites or services. We are not responsible for the privacy 
            practices of these third parties. We encourage you to read the privacy policies of any third-party services 
            you visit.
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
            <Shield className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-3xl md:text-4xl font-heading font-bold mb-4">
            Privacy Policy
          </h1>
          <p className="text-muted-foreground text-lg">
            We respect your privacy and are committed to protecting your personal data.
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
                    <h2 className="text-xl font-heading font-semibold mb-4">
                      {section.id}. {section.title}
                    </h2>
                    {section.subsections ? (
                      <div className="space-y-6">
                        {section.subsections.map((subsection, subIndex) => (
                          <div key={subIndex} className="pl-4 border-l-2 border-primary/20">
                            <h3 className="font-heading font-semibold mb-3 text-lg">
                              {subsection.title}
                            </h3>
                            <div className="prose prose-sm dark:prose-invert max-w-none">
                              {subsection.content}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="prose prose-sm dark:prose-invert max-w-none">
                        {section.content}
                      </div>
                    )}
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
          transition={{ delay: 0.75 }}
          className="bg-card rounded-2xl border border-border p-8 text-center mt-8"
        >
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-primary/10 mb-4">
            <Mail className="h-6 w-6 text-primary" />
          </div>
          <h2 className="text-xl font-heading font-semibold mb-2">
            16. Contact Us
          </h2>
          <p className="text-muted-foreground mb-4">
            If you have any questions, concerns, or requests regarding this Privacy Policy or our data practices, please 
            contact us at:
          </p>
          <div className="space-y-2">
            <p className="text-primary font-medium">privacy@tribeconnect.example</p>
            <p className="text-primary font-medium">support@tribeconnect.example</p>
          </div>
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
