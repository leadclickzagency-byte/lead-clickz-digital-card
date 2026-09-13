import { useState } from 'react';
import {
  Check,
  Download,
  ExternalLink,
  Mail,
  Phone,
  Share2,
} from 'lucide-react';
import type { LeadClickzProfile } from '@/data/profiles';
import { PrimaryButtonPerimeter } from '@/components/primary-button-perimeter';

type ContactCardSectionProps = {
  profile: LeadClickzProfile;
  onSaveContact?: () => void;
};

function phoneHref(phone: string) {
  return `tel:${phone.replace(/[^\d+]/g, '')}`;
}

async function copyCurrentUrl(url: string) {
  if (navigator.clipboard) {
    await navigator.clipboard.writeText(url);
    return;
  }

  const temporaryInput = document.createElement('textarea');
  temporaryInput.value = url;
  temporaryInput.setAttribute('readonly', '');
  temporaryInput.style.position = 'fixed';
  temporaryInput.style.opacity = '0';
  document.body.appendChild(temporaryInput);
  temporaryInput.select();
  const copied = document.execCommand('copy');
  temporaryInput.remove();

  if (!copied) {
    throw new Error('Copy is unavailable');
  }
}

export function ContactCardSection({
  profile,
  onSaveContact,
}: ContactCardSectionProps) {
  const [shareStatus, setShareStatus] = useState('');

  const shareCard = async () => {
    const currentUrl = window.location.href;

    if (navigator.share) {
      try {
        await navigator.share({
          title: `${profile.name} | ${profile.company ?? 'Lead Clickz™'}`,
          url: currentUrl,
        });
        setShareStatus('Card ready to share');
      } catch (error) {
        if (error instanceof DOMException && error.name === 'AbortError') {
          return;
        }
        setShareStatus('Sharing is unavailable');
      }
      return;
    }

    try {
      await copyCurrentUrl(currentUrl);
      setShareStatus('Card link copied');
    } catch {
      setShareStatus('Copy the card link from your browser');
    }
  };

  return (
    <section
      className="contact-card-section"
      aria-label={`${profile.name} contact card`}
    >
      <div className="contact-card-section__inner">
        <article className="contact-card">
          <header className="contact-card__header">
            <p className="contact-card__eyebrow">Contact</p>
            <h1 className="contact-card__name">{profile.name}</h1>
            {profile.title && (
              <p className="contact-card__title">{profile.title}</p>
            )}
            <img
              className="contact-card__logo"
              src="/assets/leadclickz-logo.png"
              alt="Lead Clickz™"
            />
          </header>

          <dl className="contact-card__details">
            {profile.mobilePhone && (
              <div className="contact-card__detail">
                <dt>Mobile</dt>
                <dd>{profile.mobilePhone}</dd>
              </div>
            )}
            {profile.officePhone && (
              <div className="contact-card__detail">
                <dt>Office</dt>
                <dd>{profile.officePhone}</dd>
              </div>
            )}
            {profile.email && (
              <div className="contact-card__detail">
                <dt>Email</dt>
                <dd>{profile.email}</dd>
              </div>
            )}
          </dl>

          <div className="contact-card__actions">
            {profile.vcfPath ? (
              <button
                className="contact-card__action contact-card__action--primary lead-clickz-primary-button"
                type="button"
                onClick={() => {
                  if (onSaveContact) {
                    window.setTimeout(onSaveContact, 180);
                  }
                }}
              >
                <PrimaryButtonPerimeter />
                <Download size={15} strokeWidth={1.8} aria-hidden="true" />
                 SAVE CONTACT
              </button>
            ) : (
              <button
                className="contact-card__action contact-card__action--disabled"
                type="button"
                disabled
                title="A profile-specific VCF file is not available yet"
              >
                <Download size={15} strokeWidth={1.8} aria-hidden="true" />
                SAVE CONTACT
              </button>
            )}

            {profile.mobilePhone && (
              <a
                className="contact-card__action"
                href={phoneHref(profile.mobilePhone)}
              >
                <Phone size={15} strokeWidth={1.8} aria-hidden="true" />
                CALL
              </a>
            )}

            {profile.email && (
              <a
                className="contact-card__action"
                href={`mailto:${profile.email}`}
              >
                <Mail size={15} strokeWidth={1.8} aria-hidden="true" />
                EMAIL
              </a>
            )}

            {profile.website && (
              <a
                className="contact-card__action"
                href={profile.website}
                target="_blank"
                rel="noreferrer"
              >
                <ExternalLink size={15} strokeWidth={1.8} aria-hidden="true" />
                VISIT LEAD CLICKZ™
              </a>
            )}
          </div>

          <footer className="contact-card__footer">
            {profile.linkedInUrl ? (
              <a
                className="contact-card__action"
                href={profile.linkedInUrl}
                target="_blank"
                rel="noreferrer"
              >
                LINKEDIN
              </a>
            ) : (
              <button
                className="contact-card__action contact-card__action--disabled"
                type="button"
                disabled
                title="LinkedIn is not available for this profile"
              >
                LINKEDIN
              </button>
            )}
            <button
              className="contact-card__action"
              type="button"
              onClick={shareCard}
            >
              {shareStatus === 'Card link copied' ? (
                <Check size={15} strokeWidth={1.8} aria-hidden="true" />
              ) : (
                <Share2 size={15} strokeWidth={1.8} aria-hidden="true" />
              )}
              SHARE CARD
            </button>
            <p className="contact-card__share-status" role="status" aria-live="polite">
              {shareStatus}
            </p>
          </footer>
        </article>
      </div>
    </section>
  );
}