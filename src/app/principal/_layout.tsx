
import { Tabs } from 'expo-router';

export default function PrincipalLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: { display: 'none' },
      }}
    >
      <Tabs.Screen name="home" />
      <Tabs.Screen name="evolua" />
      <Tabs.Screen name="chat" />
      <Tabs.Screen name="progresso" />
      <Tabs.Screen name="saiba-mais" />

      <Tabs.Screen name="exercicios" />
      <Tabs.Screen name="bem-estar" />
      <Tabs.Screen name="questionarios" />
      <Tabs.Screen name="metas" />
      <Tabs.Screen name="configuracoes" />
      <Tabs.Screen name="notificacoes" />
    </Tabs>
  );
}
