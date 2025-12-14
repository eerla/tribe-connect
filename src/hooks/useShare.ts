import { toast } from '@/hooks/use-toast';

type ShareParams = {
  title?: string;
  text?: string;
  url?: string;
};

export default function useShare() {
  const share = async ({ title, text, url }: ShareParams) => {
    const shareUrl = url || (typeof window !== 'undefined' ? window.location.href : '');
    const shareTitle = title || '';
    const shareText = text || '';

    try {
      if (navigator && (navigator as any).share) {
        await (navigator as any).share({ title: shareTitle, text: shareText, url: shareUrl });
        toast({ title: 'Shared', description: 'Thanks for sharing!' });
        return;
      }

      if (navigator && navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(shareUrl);
        toast({ title: 'Link copied', description: 'Link copied to clipboard' });
        return;
      }

      // Fallback: prompt the user to copy the link
      // eslint-disable-next-line no-alert
      if (typeof window !== 'undefined') window.prompt('Copy this link', shareUrl);
    } catch (err: any) {
      console.error('Share failed', err);
      toast({ title: 'Unable to share', description: err?.message || 'An error occurred', variant: 'destructive' });
    }
  };

  return { share };
}
