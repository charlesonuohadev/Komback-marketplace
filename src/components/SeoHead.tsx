import { useEffect, useRef } from 'react';

/**
 * Keeps the document head in sync while the SPA navigates.
 *
 * The server already renders full SEO markup into the HTML on first load, so
 * crawlers never depend on this. This component exists so that in-app navigation
 * (which only calls history.pushState) still updates the title, description,
 * canonical URL and schema.org JSON-LD to match the page the visitor is viewing.
 */

interface SeoMeta {
  title?: string;
  description?: string;
  keywords?: string;
  canonical?: string;
  robots?: string;
  ogType?: string;
  ogImage?: string;
  jsonLd?: unknown[];
}

function setMeta(selector: string, attr: 'name' | 'property', key: string, value?: string) {
  if (!value) return;
  let tag = document.head.querySelector<HTMLMetaElement>(selector);
  if (!tag) {
    tag = document.createElement('meta');
    tag.setAttribute(attr, key);
    document.head.appendChild(tag);
  }
  tag.setAttribute('content', value);
}

function applyMeta(meta: SeoMeta) {
  if (meta.title) document.title = meta.title;

  setMeta('meta[name="description"]', 'name', 'description', meta.description);
  setMeta('meta[name="keywords"]', 'name', 'keywords', meta.keywords);
  setMeta('meta[name="robots"]', 'name', 'robots', meta.robots);

  setMeta('meta[property="og:title"]', 'property', 'og:title', meta.title);
  setMeta('meta[property="og:description"]', 'property', 'og:description', meta.description);
  setMeta('meta[property="og:url"]', 'property', 'og:url', meta.canonical);
  setMeta('meta[property="og:type"]', 'property', 'og:type', meta.ogType);
  setMeta('meta[property="og:image"]', 'property', 'og:image', meta.ogImage);

  setMeta('meta[name="twitter:title"]', 'name', 'twitter:title', meta.title);
  setMeta('meta[name="twitter:description"]', 'name', 'twitter:description', meta.description);
  setMeta('meta[name="twitter:image"]', 'name', 'twitter:image', meta.ogImage);

  if (meta.canonical) {
    let link = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]');
    if (!link) {
      link = document.createElement('link');
      link.rel = 'canonical';
      document.head.appendChild(link);
    }
    link.href = meta.canonical;
  }

  if (Array.isArray(meta.jsonLd)) {
    let script = document.head.querySelector<HTMLScriptElement>('script[data-seo-jsonld]');
    if (!script) {
      script = document.createElement('script');
      script.type = 'application/ld+json';
      script.setAttribute('data-seo-jsonld', 'true');
      document.head.appendChild(script);
    }
    script.textContent = JSON.stringify({ '@context': 'https://schema.org', '@graph': meta.jsonLd });
  }
}

export function SeoHead({ path }: { path: string }) {
  const appliedRef = useRef<string>('');

  useEffect(() => {
    if (!path || appliedRef.current === path) return;
    appliedRef.current = path;

    const controller = new AbortController();

    fetch(`/api/seo?path=${encodeURIComponent(path)}`, {
      credentials: 'include',
      signal: controller.signal,
    })
      .then((response) => (response.ok ? response.json() : null))
      .then((meta: SeoMeta | null) => {
        if (meta) applyMeta(meta);
      })
      .catch(() => {
        /* metadata is an enhancement — never block navigation on it */
      });

    return () => controller.abort();
  }, [path]);

  return null;
}

export default SeoHead;
