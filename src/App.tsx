
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import DashboardLayout from './layouts/DashboardLayout';
import AuthLayout from './layouts/AuthLayout';
import Dashboard from './pages/Dashboard';
import UploadVideo from './pages/UploadVideo';
import Clips from './pages/Clips';
import Login from './pages/Login';
import Register from './pages/Register';
import NotFound from './pages/NotFound';
import ThreadGenerator from './pages/ThreadGenerator';
import TranscriptInput from './pages/TranscriptInput';
import TranscriptView from './pages/TranscriptView';
import Studio from './pages/Studio';
import Index from './pages/Index';
import { Toaster } from '@/components/ui/toaster';
import './App.css';

function App() {
  return (
    <>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<AuthLayout />}>
            <Route index element={<Index />} />
            <Route path="login" element={<Login />} />
            <Route path="register" element={<Register />} />
          </Route>
          <Route path="/" element={<DashboardLayout />}>
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="upload-video" element={<UploadVideo />} />
            <Route path="clips" element={<Clips />} />
            <Route path="thread-generator" element={<ThreadGenerator />} />
            <Route path="transcript-input" element={<TranscriptInput />} />
            <Route path="transcript/:id" element={<TranscriptView />} />
            <Route path="studio" element={<Studio />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
      <Toaster />
    </>
  );
}

export default App;
