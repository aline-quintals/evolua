import { Platform } from "react-native";

// Rode ipconfig e confira o IPv4 do PC
const IP_DO_PC = "192.168.5.105";

export const API_URL =
  Platform.OS === "web" ? "http://127.0.0.1:8000" : `http://${IP_DO_PC}:8000`;
