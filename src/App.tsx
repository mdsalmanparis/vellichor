
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './store/useAuthStore';
import { Auth } from './components/Auth';
import { Layout } from './components/Layout';
import { EditorView } from './components/EditorView';

function App() {
  const { user, loading } = useAuthStore();

  if (loading) {
    return <div className="min-h-screen bg-background flex items-center justify-center text-textSecondary">Loading...</div>;
  }

  if (!user) {
    return <Auth />;
  }

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<div className="flex-1 flex items-center justify-center text-textSecondary h-full">Select a page or create a new one to start writing.</div>} />
          <Route path="page/:id" element={<EditorView />} />
        </Route>
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
