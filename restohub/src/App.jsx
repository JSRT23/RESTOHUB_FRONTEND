// src/App.jsx
import AppProvider from "./app/providers/AppProvider";
import RestaurantesList from "./features/menu/components/RestauranteList";

function App() {
  return (
    <AppProvider>
      <RestaurantesList />
    </AppProvider>
  );
}

export default App;
