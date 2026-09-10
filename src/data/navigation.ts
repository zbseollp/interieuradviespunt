export interface NavItem {
  label: string;
  href: string;
  children?: { label: string; href: string }[];
}

export const mainNavigation: NavItem[] = [
  { label: 'Home', href: '/' },
  {
    label: 'Decoratie',
    href: '/decoratie/',
    children: [
      { label: 'Lightbox', href: '/beste-lightbox/' },
      { label: 'Tekstbord', href: '/beste-tekstbord/' },
      { label: 'Letterbak', href: '/beste-letterbak/' },
      { label: 'Wandbord', href: '/beste-wandbord/' },
      { label: 'Letterbord', href: '/beste-letterbord/' },
      { label: 'Wandkleed', href: '/beste-wandkleed/' },
      { label: 'Spreuktegel', href: '/beste-spreuktegel/' },
      { label: 'Dierenhoofd', href: '/beste-dierenhoofd/' },
      { label: 'Dromenvanger', href: '/beste-dromenvanger/' },
      { label: 'Decoratie ladder', href: '/beste-decoratie-ladder/' },
    ],
  },
  {
    label: 'Slaapruimte',
    href: '/slaapruimte/',
    children: [
      { label: 'Matras', href: '/beste-matras/' },
      { label: 'Wekker', href: '/beste-wekker/' },
      { label: 'Dekbed', href: '/beste-dekbed/' },
      { label: 'Kapstok', href: '/beste-kapstok/' },
      { label: 'Vouwbed', href: '/beste-vouwbed/' },
      { label: 'Ventilator', href: '/beste-ventilator/' },
      { label: 'Boxspring', href: '/beste-boxspring/' },
      { label: 'Stapelbed', href: '/beste-stapelbed/' },
      { label: 'Slaapbank', href: '/beste-slaapbank/' },
      { label: 'Verzwaringsdeken', href: '/beste-verzwaringsdeken/' },
    ],
  },
  {
    label: 'Woonkamer',
    href: '/woonkamer/',
    children: [
      { label: 'Deurmat', href: '/beste-deurmat/' },
      { label: 'Bijzettafel', href: '/beste-bijzettafel/' },
      { label: 'Paraplubak', href: '/beste-paraplubak/' },
      { label: 'Boekenkast', href: '/beste-boekenkast/' },
      { label: 'Kledingkast', href: '/beste-kledingkast/' },
      { label: 'Keukenklok', href: '/beste-keukenklok/' },
      { label: 'Deurstopper', href: '/beste-deurstopper/' },
      { label: 'Boekenplank', href: '/beste-boekenplank/' },
      { label: 'Binnenkussen', href: '/beste-binnenkussen/' },
      { label: 'Kussenvulling', href: '/beste-kussenvulling/' },
    ],
  },
  { label: 'Blog', href: '/blog/' },
  { label: 'Contact', href: '/contact/' },
];

export const socialLinks = [
  { label: 'Facebook', href: 'https://facebook.com', icon: 'facebook' as const },
  { label: 'Instagram', href: 'https://instagram.com', icon: 'instagram' as const },
  { label: 'Twitter', href: 'https://twitter.com', icon: 'twitter' as const },
  { label: 'Youtube', href: 'https://youtube.com', icon: 'youtube' as const },
];

import { footerCategories, homepageCategories } from './categories';

export const allProductSlugs = mainNavigation.flatMap((item) =>
  (item.children ?? []).map((child) => child.href.replace(/^\/|\/$/g, ''))
);

const footerSlugs = footerCategories.flatMap((cat) =>
  cat.links.map((link) => link.href.replace(/^\/|\/$/g, ''))
);

const categorySlugs = homepageCategories.flatMap((cat) =>
  cat.links.map((link) => link.href.replace(/^\/|\/$/g, ''))
);

export const allSiteSlugs = [
  ...new Set([
    ...allProductSlugs,
    ...footerSlugs,
    ...categorySlugs,
    'decoratie',
    'slaapruimte',
    'woonkamer',
    'verlichting',
    'wasruimte',
    'tuin',
    'architectenbureaus',
    'sitemap',
    'blog',
  ]),
];
