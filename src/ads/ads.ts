import mobileAds, {
  AdEventType,
  InterstitialAd,
  MaxAdContentRating,
  RewardedAd,
  RewardedAdEventType,
  TestIds,
} from 'react-native-google-mobile-ads';

/**
 * Real AdMob ad unit IDs are in PROD below (App ID is in app.json). Set USE_TEST_ADS
 * = true to show Google test ads while developing; never tap real ads on your own phone.
 */
export const USE_TEST_ADS = false;

const PROD = {
  banner: 'ca-app-pub-2904788540387890/5003786256',
  interstitial: 'ca-app-pub-2904788540387890/1064541249',
  rewarded: 'ca-app-pub-2904788540387890/7438377908',
};

export const AD_UNITS = {
  banner: USE_TEST_ADS ? TestIds.ADAPTIVE_BANNER : PROD.banner,
  interstitial: USE_TEST_ADS ? TestIds.INTERSTITIAL : PROD.interstitial,
  rewarded: USE_TEST_ADS ? TestIds.REWARDED : PROD.rewarded,
};

// Kids app: child-directed, non-personalised, G-rated ads only (Google Play Families policy).
export const REQUEST_OPTIONS = {requestNonPersonalizedAdsOnly: true};

/** Show an interstitial at most once every N wins, with a cool-down. */
export const INTERSTITIAL_EVERY_WINS = 3;
export const INTERSTITIAL_COOLDOWN_MS = 120_000;

let interstitial: InterstitialAd | null = null;
let rewarded: RewardedAd | null = null;
let rewardedLoaded = false;
let interstitialLoaded = false;

export async function initAds() {
  try {
    await mobileAds().setRequestConfiguration({
      maxAdContentRating: MaxAdContentRating.G,
      tagForChildDirectedTreatment: true,
      tagForUnderAgeOfConsent: true,
    });
    await mobileAds().initialize();
    loadInterstitial();
    loadRewarded();
  } catch {
    // ads are optional, the app works without them
  }
}

function loadInterstitial() {
  interstitialLoaded = false;
  interstitial = InterstitialAd.createForAdRequest(AD_UNITS.interstitial, REQUEST_OPTIONS);
  interstitial.addAdEventListener(AdEventType.LOADED, () => {
    interstitialLoaded = true;
  });
  interstitial.addAdEventListener(AdEventType.ERROR, () => {
    interstitialLoaded = false;
    setTimeout(loadInterstitial, 30_000);
  });
  interstitial.load();
}

function loadRewarded() {
  rewardedLoaded = false;
  rewarded = RewardedAd.createForAdRequest(AD_UNITS.rewarded, REQUEST_OPTIONS);
  rewarded.addAdEventListener(RewardedAdEventType.LOADED, () => {
    rewardedLoaded = true;
  });
  rewarded.addAdEventListener(AdEventType.ERROR, () => {
    rewardedLoaded = false;
    setTimeout(loadRewarded, 30_000);
  });
  rewarded.load();
}

/** Shows an interstitial if one is ready, then calls done (always). */
export function showInterstitial(done: () => void): boolean {
  const ad = interstitial;
  if (!ad || !interstitialLoaded) {
    done();
    return false;
  }
  const off = ad.addAdEventListener(AdEventType.CLOSED, () => {
    off();
    done();
    loadInterstitial();
  });
  ad.show().catch(() => {
    off();
    done();
    loadInterstitial();
  });
  return true;
}

export function isRewardedReady() {
  return rewardedLoaded;
}

/** Shows a rewarded ad. done(true) only if the reward was earned. */
export function showRewarded(done: (earned: boolean) => void) {
  const ad = rewarded;
  if (!ad || !rewardedLoaded) {
    done(false);
    if (!ad) {
      loadRewarded();
    }
    return;
  }
  let earned = false;
  const offEarn = ad.addAdEventListener(RewardedAdEventType.EARNED_REWARD, () => {
    earned = true;
  });
  const offClose = ad.addAdEventListener(AdEventType.CLOSED, () => {
    offEarn();
    offClose();
    done(earned);
    loadRewarded();
  });
  ad.show().catch(() => {
    offEarn();
    offClose();
    done(false);
    loadRewarded();
  });
}
