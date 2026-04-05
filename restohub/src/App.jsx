// src/App.jsx
import AppProvider from "./app/providers/AppProvider";
import MainLayout from "./shared/components/layout/MainLayout";
import RestaurantesList from "./features/menu/components/RestauranteList";

function App() {
  return (
    <AppProvider>
      <MainLayout>
        <RestaurantesList />
      </MainLayout>
    </AppProvider>
  );
}

export default App;
