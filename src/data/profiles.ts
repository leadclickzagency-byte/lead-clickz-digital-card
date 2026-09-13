export type ProfileSlug = 'thomas' | 'tiffany';

export type LeadClickzProfile = {
  slug: ProfileSlug;
  name: string;
  title?: string;
  company?: string;
  mobilePhone?: string;
  officePhone?: string;
  email?: string;
  linkedInUrl?: string;
  website?: string;
  photoPath?: string;
  vcfPath?: string;
};

export const leadClickzProfiles: Record<ProfileSlug, LeadClickzProfile> = {
  thomas: {
    slug: 'thomas',
    name: 'Thomas Lopez',
    title: 'Owner/Founder',
    company: 'Lead Clickz™',
    mobilePhone: '281-770-6927',
    officePhone: '832-585-7538',
    email: 'Thomas@leadclickz.com',
    linkedInUrl: 'https://www.linkedin.com/in/thlopez/',
    website: 'https://leadclickz.com',
    vcfPath: '/contacts/thomas-lopez.vcf',
  },
  tiffany: {
    slug: 'tiffany',
    name: 'Tiffany Lopez',
    title: 'Co-Owner/CEO',
    company: 'Lead Clickz™',
    mobilePhone: '832-444-8398',
    officePhone: '832-585-7538',
    email: 'T.Lopez@leadclickz.com',
    linkedInUrl: 'https://www.linkedin.com/in/tiffany-lopez',
    website: 'https://leadclickz.com',
    vcfPath: '/contacts/tiffany-lopez.vcf',
  },
};

export function getLeadClickzProfile(
  slug: string,
): LeadClickzProfile | undefined {
  return Object.entries(leadClickzProfiles).find(
    ([profileSlug]) => profileSlug === slug,
  )?.[1];
}