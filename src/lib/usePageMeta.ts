import { useEffect } from 'react';

const SITE = 'Taaibosch Organics';
const DEFAULT_DESC =
  'Premium herbal wellness from Cape Town: wildcrafted sea moss, capsules and raw herbs, delivered across South Africa.';

/** Sets a unique title + description per page (helps Google and link previews). */
export function usePageMeta(title?: string, description?: string) {
  useEffect(() => {
    document.title = title ? `${title} | ${SITE}` : `${SITE} | Natural Herbal Wellness, South Africa`;
    const desc = (description || DEFAULT_DESC).slice(0, 160);
    let tag = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    if (!tag) {
      tag = document.createElement('meta');
      tag.name = 'description';
      document.head.appendChild(tag);
    }
    tag.content = desc;
  }, [title, description]);
}
