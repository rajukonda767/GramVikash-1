// src/components/Layout.jsx
import React, { useState } from 'react';
import { Link, useLocation, Outlet } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import {
  LayoutDashboard,
  Wheat,
  ScanLine,
  TrendingUp,
  Droplets,
  Store,
  Bot,
  AlertTriangle,
  User,
  Menu,
  X,
  ChevronLeft,
  Leaf,
  Bell,
  Volume2,
  Mic,
  MapPin,
  Sparkles,
} from 'lucide-react';

import VoiceAssistantButton from './voice/VoiceAssistantButton';
import VoiceInteractionModal from './voice/VoiceInteractionModal';
import OnboardingModal from './onboarding/OnboardingModal';
import { useFarmer } from '../context/FarmerContext';
import { useVoice } from '../context/VoiceContext';

const navItems = [
  { path: '/', icon: LayoutDashboard, labelKey: 'nav.dashboard' },
  { path: '/crop-recommendation', icon: Wheat, labelKey: 'nav.cropRecommendation' },
  { path: '/disease-detection', icon: ScanLine, labelKey: 'nav.diseaseDetection' },
  { path: '/yield-estimation', icon: TrendingUp, labelKey: 'nav.yieldEstimation' },
  { path: '/irrigation', icon: Droplets, labelKey: 'nav.irrigation' },
  { path: '/market-profit', icon: Store, labelKey: 'nav.marketProfit' },
  { path: '/ai-chat', icon: Bot, labelKey: 'nav.aiChat' },
];

const mobileNavItems = [
  { path: '/', icon: LayoutDashboard, labelKey: 'nav.dashboard' },
  { path: '/crop-recommendation', icon: Wheat, labelKey: 'nav.cropRecommendation' },
  { path: '/disease-detection', icon: ScanLine, labelKey: 'nav.diseaseDetection', isCenter: true },
  { path: '/irrigation', icon: Droplets, labelKey: 'nav.irrigation' },
  { path: '/ai-chat', icon: Bot, labelKey: 'nav.aiChat' },
];

export default function Layout({ children }) {
  const { t, i18n } = useTranslation();
  const location = useLocation();
  const { profile, setIsOnboardingOpen } = useFarmer();
  const { openVoiceModal, isSpeaking } = useVoice();

  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

  const changeLanguage = (lang) => {
    i18n.changeLanguage(lang);
    localStorage.setItem('language', lang);
  };

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/' || location.pathname === '/dashboard';
    return location.pathname.startsWith(path);
  };

  const currentLang = i18n.language || 'en';

  return (
    <div className="min-h-screen bg-[#f3f9f4] text-gray-900 font-sans antialiased selection:bg-green-200">
      {/* Modals */}
      <VoiceInteractionModal />
      <OnboardingModal />

      {/* === DESKTOP SIDEBAR === */}
      <aside
        className={`fixed top-0 left-0 z-40 h-screen bg-[#114b27] text-white transition-all duration-300 hidden lg:flex flex-col shadow-xl ${
          sidebarCollapsed ? 'w-20' : 'w-64'
        }`}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-5 py-5 border-b border-green-800/80">
          <div className="w-10 h-10 bg-gradient-to-tr from-green-500 to-emerald-400 rounded-2xl flex items-center justify-center flex-shrink-0 shadow-md">
            <Leaf className="w-6 h-6 text-white" />
          </div>
          {!sidebarCollapsed && (
            <div>
              <span className="text-xl font-black tracking-tight flex items-center gap-1.5 text-white">
                GramVikas <span className="text-[10px] bg-green-500/30 text-green-300 font-bold px-1.5 py-0.5 rounded-md">AI</span>
              </span>
              <p className="text-[10px] text-green-200 font-medium">{t('app.tagline')}</p>
            </div>
          )}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="ml-auto p-1.5 hover:bg-green-700/60 rounded-xl transition-colors text-green-200 hover:text-white"
          >
            <ChevronLeft className={`w-4 h-4 transition-transform ${sidebarCollapsed ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {/* Farmer Quick Mini Card */}
        {!sidebarCollapsed && (
          <div className="px-4 py-3 mx-3 mt-3 bg-white/10 rounded-2xl border border-white/10 flex items-center justify-between">
            <div className="truncate">
              <p className="text-xs font-bold text-white truncate">
                {typeof profile?.name === 'string' ? profile.name : 'Farmer Raju'}
              </p>
              <p className="text-[11px] text-green-200 flex items-center gap-1 truncate">
                <MapPin className="w-3.5 h-3.5 text-emerald-300 flex-shrink-0" />
                {typeof profile?.location?.addressString === 'string'
                  ? profile.location.addressString.split(',')[0]
                  : 'Vijayawada'}
              </p>
            </div>
            <button
              onClick={() => setIsOnboardingOpen(true)}
              className="text-[10px] bg-green-500 hover:bg-green-400 text-white font-bold px-2 py-1 rounded-lg transition-colors flex-shrink-0"
            >
              Edit
            </button>
          </div>
        )}

        {/* Nav Items */}
        <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-3.5 py-3 rounded-2xl transition-all duration-200 group ${
                  active
                    ? 'bg-gradient-to-r from-emerald-500 to-green-600 text-white font-bold shadow-lg shadow-green-950/40'
                    : 'text-green-100 hover:bg-white/10 font-medium'
                }`}
                title={sidebarCollapsed ? t(item.labelKey) : undefined}
              >
                <Icon className={`w-5 h-5 flex-shrink-0 ${active ? 'text-white' : 'text-green-300 group-hover:scale-110'} transition-transform`} />
                {!sidebarCollapsed && (
                  <span className="text-sm">{t(item.labelKey)}</span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Voice Trigger & Emergency SOS */}
        <div className="px-3 pb-5 space-y-2">
          {/* Ask AI Voice in Sidebar */}
          {!sidebarCollapsed ? (
            <button
              onClick={openVoiceModal}
              className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-400 hover:to-teal-400 text-white font-bold py-2.5 px-3 rounded-2xl shadow-md transition-all active:scale-95 text-xs"
            >
              <Mic className="w-4 h-4 animate-pulse" />
              <span>{currentLang === 'te' ? 'వాయిస్ ద్వారా అడగండి' : 'Ask by Voice (వాయిస్)'}</span>
            </button>
          ) : (
            <button
              onClick={openVoiceModal}
              className="w-full flex items-center justify-center p-3 bg-emerald-500 text-white rounded-2xl"
              title="Voice Assistant"
            >
              <Mic className="w-5 h-5 animate-pulse" />
            </button>
          )}

          {/* Emergency SOS Button */}
          <Link
            to="/emergency"
            className={`flex items-center justify-center gap-2.5 px-3.5 py-3 bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white rounded-2xl transition-all shadow-lg shadow-red-950/30 font-bold text-sm ${
              isActive('/emergency') ? 'ring-2 ring-white' : ''
            }`}
          >
            <AlertTriangle className="w-5 h-5 flex-shrink-0 animate-bounce" />
            {!sidebarCollapsed && <span>{t('nav.emergency')}</span>}
          </Link>
        </div>
      </aside>

      {/* === MOBILE SIDEBAR OVERLAY === */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-xs" onClick={() => setSidebarOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-72 bg-[#114b27] text-white flex flex-col shadow-2xl">
            <div className="flex items-center gap-3 px-5 py-5 border-b border-green-800">
              <div className="w-10 h-10 bg-green-500 rounded-2xl flex items-center justify-center">
                <Leaf className="w-6 h-6 text-white" />
              </div>
              <span className="text-xl font-bold">GramVikas</span>
              <button onClick={() => setSidebarOpen(false)} className="ml-auto p-1.5 hover:bg-green-700 rounded-xl">
                <X className="w-5 h-5" />
              </button>
            </div>
            <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
              {navItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.path);
                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    onClick={() => setSidebarOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-2xl transition-all ${
                      active ? 'bg-green-600 text-white font-bold' : 'text-green-100 hover:bg-white/10'
                    }`}
                  >
                    <Icon className="w-5 h-5" />
                    <span className="text-sm">{t(item.labelKey)}</span>
                  </Link>
                );
              })}
            </nav>
            <div className="p-4 border-t border-green-800 space-y-2">
              <Link
                to="/emergency"
                onClick={() => setSidebarOpen(false)}
                className="flex items-center justify-center gap-2 w-full py-3 bg-red-600 text-white rounded-2xl font-bold text-sm"
              >
                <AlertTriangle className="w-5 h-5" />
                <span>{t('nav.emergency')}</span>
              </Link>
            </div>
          </aside>
        </div>
      )}

      {/* === TOP HEADER === */}
      <header
        className={`fixed top-0 right-0 z-30 bg-white/90 backdrop-blur-md border-b border-green-100 transition-all duration-300 ${
          sidebarCollapsed ? 'lg:left-20' : 'lg:left-64'
        } left-0`}
      >
        <div className="flex items-center justify-between px-4 lg:px-8 py-3.5 max-w-7xl mx-auto">
          {/* Left: Mobile hamburger & Logo */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(true)}
              className="p-2 hover:bg-green-50 rounded-xl lg:hidden transition-colors"
            >
              <Menu className="w-6 h-6 text-green-900" />
            </button>

            <div className="lg:hidden flex items-center gap-2">
              <div className="w-8 h-8 bg-green-600 rounded-xl flex items-center justify-center">
                <Leaf className="w-5 h-5 text-white" />
              </div>
              <span className="text-lg font-black text-green-900">GramVikas</span>
            </div>

            {/* Desktop Farm Switcher / Location Indicator */}
            <div className="hidden lg:flex items-center gap-2 bg-green-50 px-3.5 py-1.5 rounded-xl border border-green-200/70 text-xs font-semibold text-green-900">
              <MapPin className="w-3.5 h-3.5 text-green-600" />
              <span>{profile?.location?.addressString || 'Vijayawada, Andhra Pradesh'}</span>
              <span className="text-gray-300">•</span>
              <span className="text-green-700 font-bold">{profile?.farm?.sizeAcres || 3.5} {t('common.acres')}</span>
            </div>
          </div>

          {/* Right: Language Toggle, Voice trigger, Profile */}
          <div className="flex items-center gap-2 sm:gap-4">
            {/* Language Switcher Toggle: English | తెలుగు */}
            <div className="flex items-center bg-gray-100/90 rounded-2xl p-1 border border-gray-200 shadow-inner">
              {[
                { code: 'en', label: 'English' },
                { code: 'te', label: 'తెలుగు' },
              ].map((lang) => (
                <button
                  key={lang.code}
                  onClick={() => changeLanguage(lang.code)}
                  className={`px-3 py-1 text-xs font-bold rounded-xl transition-all ${
                    currentLang === lang.code
                      ? 'bg-green-600 text-white shadow-sm scale-105'
                      : 'text-gray-600 hover:text-green-800'
                  }`}
                >
                  {lang.label}
                </button>
              ))}
            </div>

            {/* Quick Ask AI Voice Button (Header) */}
            <button
              onClick={openVoiceModal}
              className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-300 rounded-xl font-bold text-xs transition-all shadow-xs active:scale-95"
            >
              <Mic className="w-3.5 h-3.5 text-emerald-600 animate-pulse" />
              <span>Voice</span>
            </button>

            {/* Profile Avatar */}
            <Link
              to="/profile"
              className="flex items-center gap-2.5 p-1 sm:px-3 sm:py-1.5 hover:bg-green-50 rounded-2xl transition-colors border border-transparent hover:border-green-200"
            >
              <div className="w-9 h-9 bg-gradient-to-tr from-green-700 to-emerald-500 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-sm">
                {typeof profile?.name === 'string' && profile.name.length > 0 ? profile.name.charAt(0).toUpperCase() : 'R'}
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-xs font-bold text-gray-900 leading-tight">
                  {typeof profile?.name === 'string' ? profile.name : 'Raju'}
                </p>
                <p className="text-[10px] text-gray-500">Farmer</p>
              </div>
            </Link>
          </div>
        </div>
      </header>

      {/* === MAIN CONTENT === */}
      <main
        className={`pt-18 pb-28 lg:pb-12 transition-all duration-300 ${
          sidebarCollapsed ? 'lg:pl-20' : 'lg:pl-64'
        }`}
      >
        <div className="p-4 sm:p-6 lg:p-8 max-w-6xl mx-auto">
          {children || <Outlet />}
        </div>
      </main>

      {/* Floating Action Button for Voice Assistant */}
      <VoiceAssistantButton />

      {/* === MOBILE BOTTOM NAV (Matching User Hand-Drawn Sketch) === */}
      <nav className="fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-green-100 lg:hidden bottom-nav shadow-lg">
        <div className="flex items-center justify-around px-2 py-1">
          {mobileNavItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);

            if (item.isCenter) {
              return (
                <Link
                  key={item.path}
                  to={item.path}
                  className="relative -top-5"
                  title={t(item.labelKey)}
                >
                  <div
                    className={`w-14 h-14 rounded-full flex items-center justify-center shadow-xl transition-all ${
                      active
                        ? 'bg-green-700 ring-4 ring-green-200 scale-105'
                        : 'bg-gradient-to-tr from-green-600 to-emerald-500 hover:scale-105'
                    }`}
                  >
                    <Icon className="w-7 h-7 text-white" />
                  </div>
                </Link>
              );
            }

            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-xl transition-all ${
                  active ? 'text-green-700 font-bold' : 'text-gray-400 hover:text-green-600 font-medium'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-[10px] tracking-tight truncate max-w-[64px]">
                  {t(item.labelKey).split(' ')[0]}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
