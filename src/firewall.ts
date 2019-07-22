const SOCIAL_REFERRERS: RegExp[] = [/facebook/i, /instagram/i, /pinterest/i, /twitter/i];
const SOCIAL_REFERRER_KEY = 'social_referrer';

export function persistSocialReferral() {
  if (localStorage) {
    localStorage.setItem(SOCIAL_REFERRER_KEY, 'true');
  }
}

export function checkInitialSocialReferral(): boolean {
  if (localStorage) {
    return JSON.parse(localStorage.getItem(SOCIAL_REFERRER_KEY) || 'false');
  }
  return false;
}

export function isSocialReferral(): boolean {
  // Check if referrer is social
  if (document.referrer && document.referrer != '') {
    const socialReferral = SOCIAL_REFERRERS.filter((socialReferrer) => document.referrer.match(socialReferrer))[0];

    if (socialReferral) {
      persistSocialReferral();
      return true;
    }
  }

  // Since social referral is persisted, check it
  return checkInitialSocialReferral();
}
