import type { ReactNode, SVGProps } from 'react';

export type Brand = 'amazon' | 'shopee' | 'mercado_livre' | 'shein' | 'instagram' | 'facebook' | 'x' | 'tiktok' | 'telegram' | 'discord';

const paths: Record<Brand, (props: SVGProps<SVGSVGElement>) => ReactNode> = {
  amazon: (props) => <svg {...props} viewBox="0 0 32 32"><text x="5" y="23" fill="currentColor" fontFamily="Arial,sans-serif" fontSize="23" fontWeight="700">a</text><path d="M8 25c6 4 14 4 20 0M23 22l5 3-5 3" fill="none" stroke="#ffad33" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.8" /></svg>,
  shopee: (props) => <svg {...props} viewBox="0 0 32 32"><path d="M8 12h16l-1.2 15H9.2L8 12Z" fill="none" stroke="currentColor" strokeLinejoin="round" strokeWidth="2" /><path d="M12 12a4 4 0 0 1 8 0" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="2" /><text x="11.5" y="23" fill="currentColor" fontFamily="Arial,sans-serif" fontSize="10" fontWeight="700">S</text></svg>,
  mercado_livre: (props) => <svg {...props} viewBox="0 0 32 32"><path d="M5 15.5 9.5 11l5 1.5 3 3-2.2 2.2-3-1.5-2.1 2.1 5.3 5.2 2.4-2.3 2.7.7 5.3-5.3-3-3 2.5-2.5 5.1 5.1-9.2 9.2-4.1-1.1-3.1 3.1L5 19.8l3.2-3.2-3.2-1.1Z" fill="none" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.7" /><path d="m11 13 3.2 3.2m4.5-3 3.2 3.2m-5.7 5.5 2.7-2.7" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="1.7" /></svg>,
  shein: (props) => <svg {...props} viewBox="0 0 32 32"><text x="4" y="22" fill="currentColor" fontFamily="Arial,sans-serif" fontSize="13" fontWeight="800" letterSpacing="-1">SHEIN</text><path d="M5 25h21" stroke="currentColor" strokeLinecap="round" strokeWidth="1.5" /></svg>,
  instagram: (props) => <svg {...props} viewBox="0 0 32 32"><rect x="5" y="5" width="22" height="22" rx="6.5" fill="none" stroke="currentColor" strokeWidth="2.3" /><circle cx="16" cy="16" r="5.2" fill="none" stroke="currentColor" strokeWidth="2.3" /><circle cx="23" cy="9.5" r="1.5" fill="currentColor" /></svg>,
  facebook: (props) => <svg {...props} viewBox="0 0 32 32"><path d="M18.5 28V17.2h3.7l.6-4.2h-4.3v-2.7c0-1.2.4-2 2.1-2H23V4.5c-.4-.1-1.8-.2-3.4-.2-3.4 0-5.7 2.1-5.7 5.9V13H10v4.2h3.9V28h4.6Z" fill="currentColor" /></svg>,
  x: (props) => <svg {...props} viewBox="0 0 32 32"><path d="M6 5h6.2l13.8 22h-6.2L6 5Zm0 22 8.6-10.2m2.8-3.3L26 5" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="2.8" /></svg>,
  tiktok: (props) => <svg {...props} viewBox="0 0 32 32"><path d="M18 5v14.2a5.2 5.2 0 1 1-4-5.1" fill="none" stroke="#ff477e" strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" /><path d="M20 5c.4 3.5 2.3 5.6 5.5 6.5" fill="none" stroke="#00f0ff" strokeLinecap="round" strokeWidth="3" /><path d="M16 5v14.2a5.2 5.2 0 1 1-4-5.1M18 5c.4 3.5 2.3 5.6 5.5 6.5" fill="none" stroke="currentColor" strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.7" /></svg>,
  telegram: (props) => <svg {...props} viewBox="0 0 32 32"><path d="m4 15 23-9-5 21-7-6-4 4-.3-7L24 10l-11 7-9-2Z" fill="none" stroke="currentColor" strokeLinejoin="round" strokeWidth="2" /></svg>,
  discord: (props) => <svg {...props} viewBox="0 0 32 32"><path d="M9 8.5a21 21 0 0 1 4-1.2l.8 1.5a18 18 0 0 1 4.4 0l.8-1.5a21 21 0 0 1 4 1.2c2.6 3.8 3.5 7.6 3.1 11.4a20 20 0 0 1-6.2 3.1l-1.3-2a13 13 0 0 0 2-.9c-3.1 1.4-6.6 1.4-9.7 0l2 .9-1.3 2a20 20 0 0 1-6.2-3.1C5 16.1 6 12.3 9 8.5Z" fill="none" stroke="currentColor" strokeLinejoin="round" strokeWidth="1.8" /><circle cx="12" cy="15.3" r="1.3" fill="currentColor" /><circle cx="20" cy="15.3" r="1.3" fill="currentColor" /></svg>,
};

export function BrandEmblem({ brand, className = 'h-5 w-5', ...props }: SVGProps<SVGSVGElement> & { brand: Brand }) {
  const Icon = paths[brand];
  return <Icon className={className} aria-hidden="true" focusable="false" {...props} />;
}
