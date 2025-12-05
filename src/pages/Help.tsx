import { motion } from 'framer-motion';
import { Search, HelpCircle, Mail, MessageCircle } from 'lucide-react';
import { Layout } from '@/components/layout/Layout';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';

const faqs = [
  {
    question: 'How do I create a tribe?',
    answer: 'To create a tribe, sign in to your account, click on "Create Tribe" in the navigation menu or your profile dropdown. Fill in the details about your tribe including name, description, category, and location. Once created, you can start inviting members and creating events.',
  },
  {
    question: 'How do I join a tribe?',
    answer: 'Browse tribes using the search or explore features. When you find one you like, click on it to view the tribe page, then click the "Join Tribe" button. Some tribes may be private and require approval from the organizer.',
  },
  {
    question: 'Are there costs to using TribeVibe?',
    answer: 'TribeVibe is free to use for members. You can join tribes, attend events, and participate in discussions at no cost. Some organizers may charge for specific events, but this will always be clearly indicated.',
  },
  {
    question: 'How do I RSVP to an event?',
    answer: 'Find an event you want to attend, click on it to view details, and click the "RSVP Now" button. You\'ll receive a confirmation and the event will be added to your calendar. You can manage your RSVPs from your profile.',
  },
  {
    question: 'Can I create my own events?',
    answer: 'Yes! If you\'re a member of a tribe, you can create events for that tribe. Tribe organizers can also grant event creation permissions to other members. Go to "Create Event" and select the tribe you want to host the event for.',
  },
  {
    question: 'How do I contact an event organizer?',
    answer: 'You can reach out to organizers through the tribe chat feature or by visiting their profile and sending a direct message. Event pages also display organizer information.',
  },
];

export default function Help() {
  return (
    <Layout>
      <div className="container py-12 md:py-20 max-w-3xl">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-12"
        >
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-primary/10 mb-6">
            <HelpCircle className="h-8 w-8 text-primary" />
          </div>
          <h1 className="text-3xl md:text-4xl font-heading font-bold mb-4">
            Help Center
          </h1>
          <p className="text-muted-foreground">
            Find answers to common questions or get in touch with our support team
          </p>
        </motion.div>

        {/* Search */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-12"
        >
          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Search for help..."
              className="pl-12 h-14"
            />
          </div>
        </motion.div>

        {/* FAQs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-12"
        >
          <h2 className="text-xl font-heading font-semibold mb-6">
            Frequently Asked Questions
          </h2>
          <Accordion type="single" collapsible className="space-y-3">
            {faqs.map((faq, index) => (
              <AccordionItem
                key={index}
                value={`item-${index}`}
                className="bg-card rounded-xl border border-border px-6"
              >
                <AccordionTrigger className="text-left hover:no-underline py-4">
                  {faq.question}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground pb-4">
                  {faq.answer}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>

        {/* Contact */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-card rounded-2xl border border-border p-8 text-center"
        >
          <h2 className="text-xl font-heading font-semibold mb-2">
            Still need help?
          </h2>
          <p className="text-muted-foreground mb-6">
            Our support team is here to assist you
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="outline" className="gap-2">
              <Mail className="h-4 w-4" />
              Email Support
            </Button>
            <Button variant="outline" className="gap-2">
              <MessageCircle className="h-4 w-4" />
              Live Chat
            </Button>
          </div>
        </motion.div>
      </div>
    </Layout>
  );
}
