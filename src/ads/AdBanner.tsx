import React from 'react';
import {View} from 'react-native';
import {BannerAd, BannerAdSize} from 'react-native-google-mobile-ads';
import {AD_UNITS, REQUEST_OPTIONS} from './ads';

/** Bottom banner — used only on menu screens, never during gameplay. */
export default function AdBanner() {
  return (
    <View style={{alignItems: 'center', backgroundColor: 'transparent'}}>
      <BannerAd
        unitId={AD_UNITS.banner}
        size={BannerAdSize.ANCHORED_ADAPTIVE_BANNER}
        requestOptions={REQUEST_OPTIONS}
      />
    </View>
  );
}
