import sparcLines from './sparc-lines.json';

export type ProfileSlug = 'thomas' | 'tiffany';

export type SparcCaption = { at: number; text: string };

export type SparcLine = {
  /** Audio file in /public. Missing audio falls back to captions only. */
  audio?: string;
  captions: SparcCaption[];
};

export type LeadClickzProfile = {
  slug: ProfileSlug;
  name: string;
  firstName: string;
  title: string;
  /** Short credential for headlines, e.g. "Founder". */
  role: string;
  company: string;
  mobilePhone: string;
  officePhone: string;
  email: string;
  linkedInUrl: string;
  website: string;
  vcfPath: string;
  /** What SPARC says once the card has landed. */
  sparc: SparcLine[];
};

type SparcLinesFile = {
  shared: SparcLine;
  profiles: Record<ProfileSlug, SparcLine>;
};

const lines = sparcLines as SparcLinesFile;

export const leadClickzProfiles: Record<ProfileSlug, LeadClickzProfile> = {
  thomas: {
    slug: 'thomas',
    name: 'Thomas Lopez',
    firstName: 'Thomas',
    title: 'Owner / Founder',
    role: 'Founder',
    company: 'Lead Clickz™',
    mobilePhone: '281-770-6927',
    officePhone: '832-585-7538',
    email: 'Thomas@leadclickz.com',
    linkedInUrl: 'https://www.linkedin.com/in/thlopez/',
    website: 'https://leadclickz.com',
    vcfPath: '/contacts/thomas-lopez.vcf',
    sparc: [lines.shared, lines.profiles.thomas],
  },
  tiffany: {
    slug: 'tiffany',
    name: 'Tiffany Lopez',
    firstName: 'Tiffany',
    title: 'Co-Owner / CEO',
    role: 'CEO',
    company: 'Lead Clickz™',
    mobilePhone: '832-444-8398',
    officePhone: '832-585-7538',
    email: 'T.Lopez@leadclickz.com',
    linkedInUrl: 'https://www.linkedin.com/in/tiffany-lopez',
    website: 'https://leadclickz.com',
    vcfPath: '/contacts/tiffany-lopez.vcf',
    sparc: [lines.shared, lines.profiles.tiffany],
  },
};

export function getLeadClickzProfile(slug: string): LeadClickzProfile | undefined {
  const key = slug.toLowerCase() as ProfileSlug;
  return Object.hasOwn(leadClickzProfiles, key) ? leadClickzProfiles[key] : undefined;
}

export function profileUrl(profile: LeadClickzProfile) {
  return `${window.location.origin}/${profile.slug}`;
}
