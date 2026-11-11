import { Stack } from 'expo-router';
import { useFonts } from 'expo-font';
import { Manrope_700Bold } from '@expo-google-fonts/manrope';
import { DMSans_400Regular, DMSans_500Medium } from '@expo-google-fonts/dm-sans';
import { Fredoka_600SemiBold } from '@expo-google-fonts/fredoka';

export default function RootLayout() {
  const [carregou] = useFonts({
    ManropeBold: Manrope_700Bold,
    DMSans: DMSans_400Regular,
    DMSansMedium: DMSans_500Medium,
    Fredoka: Fredoka_600SemiBold,
  });

  // Espera as fontes carregarem antes de mostrar qualquer tela
  if (!carregou) return null;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="acesso" />
      <Stack.Screen name="principal" />
    </Stack>
  );
}