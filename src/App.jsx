import AppShell from "./components/AppShell.jsx";
import { useAppController } from "./hooks/useAppController.js";

export default function App() {
  const appState = useAppController();
  return <AppShell {...appState} />;
}
