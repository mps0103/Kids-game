import React, {useCallback, useEffect, useState} from 'react';
import {BackHandler, StatusBar, StyleSheet} from 'react-native';
import {SafeAreaProvider, SafeAreaView} from 'react-native-safe-area-context';
import {initAds} from './src/ads/ads';
import {ProgressProvider, useProgress} from './src/core/progress';
import {initSounds, setSoundPrefs, setTrack} from './src/core/sound';
import {C} from './src/core/theme';
import {Difficulty} from './src/core/types';
import HomeScreen from './src/screens/HomeScreen';
import LevelsScreen from './src/screens/LevelsScreen';
import PlayScreen from './src/screens/PlayScreen';
import SettingsScreen from './src/screens/SettingsScreen';
import SplashScreen from './src/screens/SplashScreen';
import StickersScreen from './src/screens/StickersScreen';

type Route =
  | {name: 'splash'}
  | {name: 'home'}
  | {name: 'levels'; gameId: string}
  | {name: 'play'; gameId: string; level: number}
  | {name: 'stickers'}
  | {name: 'settings'};

function Root() {
  const [route, setRoute] = useState<Route>({name: 'splash'});
  const [difficulty, setDifficulty] = useState<Difficulty>('easy');
  const {ready, state} = useProgress();

  useEffect(() => {
    initSounds();
    initAds();
  }, []);

  useEffect(() => {
    setSoundPrefs({music: state.music, sfx: state.sfx});
  }, [state.music, state.sfx]);

  // cheerful music on menus, calmer music while playing
  useEffect(() => {
    setTrack(!ready ? null : route.name === 'play' ? 'game' : 'menu');
  }, [route.name, ready]);

  const back = useCallback(() => {
    switch (route.name) {
      case 'play':
        setRoute({name: 'levels', gameId: route.gameId});
        return true;
      case 'levels':
      case 'stickers':
      case 'settings':
        setRoute({name: 'home'});
        return true;
      default:
        return false;
    }
  }, [route]);

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', back);
    return () => sub.remove();
  }, [back]);

  const splashDone = useCallback(() => setRoute({name: 'home'}), []);

  if (route.name === 'splash' || !ready) {
    return <SplashScreen onDone={splashDone} />;
  }

  switch (route.name) {
    case 'home':
      return (
        <HomeScreen
          onOpenGame={id => setRoute({name: 'levels', gameId: id})}
          onStickers={() => setRoute({name: 'stickers'})}
          onSettings={() => setRoute({name: 'settings'})}
        />
      );
    case 'levels':
      return (
        <LevelsScreen
          gameId={route.gameId}
          difficulty={difficulty}
          onDifficulty={setDifficulty}
          onBack={back}
          onPlay={lv => setRoute({name: 'play', gameId: route.gameId, level: lv})}
        />
      );
    case 'play':
      return (
        <PlayScreen
          gameId={route.gameId}
          difficulty={difficulty}
          level={route.level}
          onExit={back}
          onLevel={lv => setRoute({name: 'play', gameId: route.gameId, level: Math.min(lv, 30)})}
        />
      );
    case 'stickers':
      return <StickersScreen onBack={back} />;
    case 'settings':
      return <SettingsScreen onBack={back} />;
  }
}

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar barStyle="dark-content" />
      <ProgressProvider>
        <SafeAreaView style={styles.safe} edges={['top', 'bottom', 'left', 'right']}>
          <Root />
        </SafeAreaView>
      </ProgressProvider>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  safe: {flex: 1, backgroundColor: C.bg},
});
