// src/App.jsx
import React from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import CropRecommendation from './pages/CropRecommendation';
import DiseaseDetection from './pages/DiseaseDetection';
import YieldEstimation from './pages/YieldEstimation';
import Irrigation from './pages/Irrigation';
import MarketProfit from './pages/MarketProfit';
import AIChat from './pages/AIChat';
import Emergency from './pages/Emergency';
import Login from './pages/Login';
import Register from './pages/Register';
import Profile from './pages/Profile';

import { FarmerProvider } from './context/FarmerContext';
import { VoiceProvider } from './context/VoiceContext';
import './i18n';

// Layout wrapper rendering child route outlet
function LayoutWrapper() {
  return (
    <Layout>
      <Outlet />
    </Layout>
  );
}

function App() {
  return (
    <FarmerProvider>
      <VoiceProvider>
        <BrowserRouter>
          <Routes>
            {/* Standalone Auth Routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Application Main Layout with Nested Child Routes */}
            <Route element={<LayoutWrapper />}>
              <Route path="/" element={<Dashboard />} />
              <Route path="/dashboard" element={<Dashboard />} />

              {/* Crop Recommendation Aliases */}
              <Route path="/crop-recommendation" element={<CropRecommendation />} />
              <Route path="/crop%20recommendation" element={<CropRecommendation />} />
              <Route path="/crop recommendation" element={<CropRecommendation />} />

              {/* Disease Detection Aliases */}
              <Route path="/disease-detection" element={<DiseaseDetection />} />
              <Route path="/disease%20detection" element={<DiseaseDetection />} />
              <Route path="/disease detection" element={<DiseaseDetection />} />

              {/* Yield Estimation Aliases */}
              <Route path="/yield-estimation" element={<YieldEstimation />} />
              <Route path="/yield%20estimation" element={<YieldEstimation />} />
              <Route path="/yield estimation" element={<YieldEstimation />} />

              {/* Irrigation Aliases */}
              <Route path="/irrigation" element={<Irrigation />} />
              <Route path="/irrigation-plan" element={<Irrigation />} />
              <Route path="/irrigation%20plan" element={<Irrigation />} />

              {/* Market Profit Aliases */}
              <Route path="/market-profit" element={<MarketProfit />} />
              <Route path="/market%20profit" element={<MarketProfit />} />
              <Route path="/market prices" element={<MarketProfit />} />

              {/* AI Chat Assistant Aliases */}
              <Route path="/ai-chat" element={<AIChat />} />
              <Route path="/ai%20chat" element={<AIChat />} />
              <Route path="/ai chat" element={<AIChat />} />

              {/* Emergency SOS & Profile */}
              <Route path="/emergency" element={<Emergency />} />
              <Route path="/profile" element={<Profile />} />

              {/* Fallback */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </VoiceProvider>
    </FarmerProvider>
  );
}

export default App;
