import { Tabs } from 'expo-router';

export default function PrincipalLayout() {
  return (
    <Tabs screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="home" options={{ title: 'Home' }} />
      <Tabs.Screen name="evolua" options={{ title: 'Evolua' }} />
      <Tabs.Screen name="chat" options={{ title: 'Chat' }} />
      <Tabs.Screen name="progresso" options={{ title: 'Progresso' }} />
      <Tabs.Screen name="saiba-mais" options={{ title: 'Saiba +' }} />
    </Tabs>
  );
}
