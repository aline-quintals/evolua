
import { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { useFonts } from 'expo-font';

import { Manrope_700Bold } from '@expo-google-fonts/manrope';
import { DMSans_400Regular, DMSans_500Medium } from '@expo-google-fonts/dm-sans';
import { Fredoka_600SemiBold } from '@expo-google-fonts/fredoka';

import { inicializarPersistenciaEvolua } from './principal/compartilhado';

export default function RootLayout() {
  const [carregou] = useFonts({
    ManropeBold: Manrope_700Bold,
    DMSans: DMSans_400Regular,
    DMSansMedium: DMSans_500Medium,
    Fredoka: Fredoka_600SemiBold,
  });

  const [dadosCarregados, setDadosCarregados] = useState(false);

  useEffect(() => {
    let montado = true;

    async function carregarDados() {
      try {
        await inicializarPersistenciaEvolua();
      } catch (erro) {
        console.warn('Erro ao carregar dados do Evolua:', erro);
      } finally {
        if (montado) {
          setDadosCarregados(true);
        }
      }
    }

    carregarDados();

    return () => {
      montado = false;
    };
  }, []);

  // Aguarda as fontes e os dados salvos antes de mostrar as telas
  if (!carregou || !dadosCarregados) return null;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="acesso" />
      <Stack.Screen name="principal" />
    </Stack>
  );
}
