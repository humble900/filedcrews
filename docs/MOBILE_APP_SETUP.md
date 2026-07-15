# React Native (Expo) Mobile App - Setup Guide

## Prerequisites
- Node.js 18+
- Expo CLI (`npx expo`)
- Expo Dev Build (not Expo Go, because background location requires native modules)

## Create the project

```bash
npx create-expo-app Ocrem --template blank-typescript
cd Ocrem
npx expo install expo-location expo-task-manager @supabase/supabase-js react-native-url-polyfill
```

## app.json permissions

Add to `app.json`:
```json
{
  "expo": {
    "name": "Ocrem",
    "plugins": [
      [
        "expo-location",
        {
          "locationAlwaysAndWhenInUsePermission": "Allow Ocrem to access your location for tracking.",
          "locationAlwaysPermission": "Allow Ocrem to access your location in the background.",
          "locationWhenInUsePermission": "Allow Ocrem to access your location.",
          "isAndroidBackgroundLocationEnabled": true,
          "isAndroidForegroundServiceEnabled": true
        }
      ]
    ],
    "android": {
      "permissions": [
        "ACCESS_COARSE_LOCATION",
        "ACCESS_FINE_LOCATION",
        "ACCESS_BACKGROUND_LOCATION",
        "FOREGROUND_SERVICE",
        "FOREGROUND_SERVICE_LOCATION"
      ]
    }
  }
}
```

## lib/supabase.ts

```typescript
import { createClient } from '@supabase/supabase-js';
import 'react-native-url-polyfill/auto';

const SUPABASE_URL = 'YOUR_SUPABASE_URL';
const SUPABASE_ANON_KEY = 'YOUR_SUPABASE_ANON_KEY';

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
```

## screens/LoginScreen.tsx

```tsx
import React, { useState } from 'react';
import { View, TextInput, Button, Text, StyleSheet, Alert } from 'react-native';
import { supabase } from '../lib/supabase';

export default function LoginScreen({ onLogin }: { onLogin: () => void }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    setLoading(true);
    const email = `${username}@internal.local`;
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      Alert.alert('Login Failed', error.message);
    } else {
      onLogin();
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Ocrem</Text>
      <TextInput
        style={styles.input}
        placeholder="Username"
        value={username}
        onChangeText={setUsername}
        autoCapitalize="none"
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />
      <Button title={loading ? 'Signing in...' : 'Sign In'} onPress={handleLogin} disabled={loading} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24 },
  title: { fontSize: 28, fontWeight: 'bold', textAlign: 'center', marginBottom: 32 },
  input: { borderWidth: 1, borderColor: '#ccc', borderRadius: 8, padding: 12, marginBottom: 12, fontSize: 16 },
});
```

## screens/TrackingScreen.tsx

```tsx
import React, { useState, useEffect } from 'react';
import { View, Text, Button, StyleSheet, Alert } from 'react-native';
import * as Location from 'expo-location';
import * as TaskManager from 'expo-task-manager';
import { supabase } from '../lib/supabase';

const LOCATION_TASK = 'background-location-task';

// Define the background task
TaskManager.defineTask(LOCATION_TASK, async ({ data, error }) => {
  if (error) {
    console.error('Background location error:', error);
    return;
  }
  if (data) {
    const { locations } = data as { locations: Location.LocationObject[] };
    const loc = locations[0];
    if (loc) {
      const session = await supabase.auth.getSession();
      const token = session.data.session?.access_token;
      if (token) {
        await supabase.functions.invoke('staff_update_location', {
          body: {
            latitude: loc.coords.latitude,
            longitude: loc.coords.longitude,
            accuracy: loc.coords.accuracy,
          },
        });
      }
    }
  }
});

export default function TrackingScreen() {
  const [tracking, setTracking] = useState(false);
  const [lastSent, setLastSent] = useState<string | null>(null);
  const [currentLoc, setCurrentLoc] = useState<{ lat: number; lng: number } | null>(null);

  useEffect(() => {
    checkTracking();
  }, []);

  const checkTracking = async () => {
    const isStarted = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK).catch(() => false);
    setTracking(isStarted);
  };

  const startTracking = async () => {
    const { status: fg } = await Location.requestForegroundPermissionsAsync();
    if (fg !== 'granted') {
      Alert.alert('Permission needed', 'Foreground location permission is required.');
      return;
    }
    const { status: bg } = await Location.requestBackgroundPermissionsAsync();
    if (bg !== 'granted') {
      Alert.alert('Permission needed', 'Background location permission is required.');
      return;
    }

    await Location.startLocationUpdatesAsync(LOCATION_TASK, {
      accuracy: Location.Accuracy.High,
      timeInterval: 120000, // 2 minutes
      distanceInterval: 10,
      showsBackgroundLocationIndicator: true,
      foregroundService: {
        notificationTitle: 'Ocrem',
        notificationBody: 'Tracking your location',
        notificationColor: '#3366cc',
      },
    });

    setTracking(true);

    // Also send immediately
    const loc = await Location.getCurrentPositionAsync({});
    setCurrentLoc({ lat: loc.coords.latitude, lng: loc.coords.longitude });
    await supabase.functions.invoke('staff_update_location', {
      body: {
        latitude: loc.coords.latitude,
        longitude: loc.coords.longitude,
        accuracy: loc.coords.accuracy,
      },
    });
    setLastSent(new Date().toLocaleTimeString());
  };

  const stopTracking = async () => {
    await Location.stopLocationUpdatesAsync(LOCATION_TASK);
    setTracking(false);
  };

  const handleLogout = async () => {
    if (tracking) await stopTracking();
    await supabase.auth.signOut();
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Location Tracking</Text>
      <View style={styles.status}>
        <Text style={styles.label}>Status:</Text>
        <Text style={[styles.value, { color: tracking ? '#22c55e' : '#ef4444' }]}>
          {tracking ? 'Active' : 'Stopped'}
        </Text>
      </View>
      {currentLoc && (
        <View style={styles.status}>
          <Text style={styles.label}>Position:</Text>
          <Text style={styles.value}>{currentLoc.lat.toFixed(5)}, {currentLoc.lng.toFixed(5)}</Text>
        </View>
      )}
      {lastSent && (
        <View style={styles.status}>
          <Text style={styles.label}>Last sent:</Text>
          <Text style={styles.value}>{lastSent}</Text>
        </View>
      )}
      <View style={{ marginTop: 24 }}>
        <Button
          title={tracking ? 'Stop Tracking' : 'Start Tracking'}
          onPress={tracking ? stopTracking : startTracking}
          color={tracking ? '#ef4444' : '#3366cc'}
        />
      </View>
      <View style={{ marginTop: 12 }}>
        <Button title="Sign Out" onPress={handleLogout} color="#888" />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: 'center', padding: 24 },
  title: { fontSize: 24, fontWeight: 'bold', textAlign: 'center', marginBottom: 32 },
  status: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8 },
  label: { fontSize: 16, color: '#666' },
  value: { fontSize: 16, fontWeight: '600' },
});
```

## App.tsx (Main entry)

```tsx
import React, { useEffect, useState } from 'react';
import { supabase } from './lib/supabase';
import LoginScreen from './screens/LoginScreen';
import TrackingScreen from './screens/TrackingScreen';
import { Session } from '@supabase/supabase-js';

export default function App() {
  const [session, setSession] = useState<Session | null>(null);

  useEffect(() => {
    supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
  }, []);

  if (!session) return <LoginScreen onLogin={() => {}} />;
  return <TrackingScreen />;
}
```

## Build & Run

```bash
# Create a dev build (required for background location)
npx expo prebuild
npx expo run:android
# or
npx expo run:ios
```

> **Note:** Background location does NOT work in Expo Go. You must use a dev build.
