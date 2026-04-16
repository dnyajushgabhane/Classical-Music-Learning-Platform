import { useEffect } from 'react';

export function useSEO({ title, description, ogImage, ogType = 'website' }) {
  useEffect(() => {
    if (title) {
      document.title = `${title} | RaagVidya`;
    }

    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription && description) {
      metaDescription.setAttribute('content', description);
    }

    // Update Open Graph tags
    const updateOGTag = (property, content) => {
      let tag = document.querySelector(`meta[property="${property}"]`);
      if (!tag) {
        tag = document.createElement('meta');
        tag.setAttribute('property', property);
        document.head.appendChild(tag);
      }
      tag.setAttribute('content', content);
    };

    if (title) updateOGTag('og:title', `${title} | RaagVidya`);
    if (description) updateOGTag('og:description', description);
    if (ogImage) updateOGTag('og:image', ogImage);
    updateOGTag('og:type', ogType);

  }, [title, description, ogImage, ogType]);
}
