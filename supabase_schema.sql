-- Supabase Database Schema for GramVikas AI Agriculture Platform
-- Copy and paste this entire script into your Supabase SQL Editor and click RUN.

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- 1. PROFILES TABLE (Linked with Supabase Auth)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    full_name TEXT NOT NULL,
    phone TEXT,
    preferred_language TEXT DEFAULT 'te' CHECK (preferred_language IN ('en', 'te', 'hi')),
    avatar_url TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 2. FARMS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.farms (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    farm_name TEXT NOT NULL DEFAULT 'My Farm',
    area NUMERIC(8, 2) NOT NULL DEFAULT 3.5,
    area_unit TEXT NOT NULL DEFAULT 'acres',
    latitude NUMERIC(10, 6) DEFAULT 16.5062,
    longitude NUMERIC(10, 6) DEFAULT 80.6480,
    location_name TEXT DEFAULT 'Vijayawada, Andhra Pradesh',
    district TEXT DEFAULT 'NTR District',
    state TEXT DEFAULT 'Andhra Pradesh',
    soil_type TEXT DEFAULT 'Alluvial Soil',
    irrigation_method TEXT DEFAULT 'Drip & Borewell',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 3. CROPS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.crops (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    farm_id UUID NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
    crop_name TEXT NOT NULL,
    variety TEXT,
    planting_date DATE NOT NULL DEFAULT CURRENT_DATE,
    expected_harvest_date DATE,
    status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'harvested', 'failed')),
    growth_stage TEXT DEFAULT 'Vegetative Stage',
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 4. SOIL RECORDS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.soil_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    farm_id UUID NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
    nitrogen NUMERIC(8, 2) NOT NULL,
    phosphorus NUMERIC(8, 2) NOT NULL,
    potassium NUMERIC(8, 2) NOT NULL,
    ph NUMERIC(4, 2) NOT NULL,
    moisture NUMERIC(5, 2),
    organic_carbon NUMERIC(5, 2),
    source TEXT NOT NULL DEFAULT 'farmer_input' CHECK (source IN ('soil_test', 'farmer_input', 'inferred', 'ocr_card')),
    recorded_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 5. CROP RECOMMENDATIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.crop_recommendations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    farm_id UUID REFERENCES public.farms(id) ON DELETE SET NULL,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    recommendations JSONB NOT NULL,
    input_snapshot JSONB NOT NULL,
    reasoning TEXT,
    location TEXT,
    weather_context JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 6. IRRIGATION RECORDS TABLE (History)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.irrigation_records (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    crop_id UUID REFERENCES public.crops(id) ON DELETE CASCADE,
    farm_id UUID NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
    irrigation_date DATE NOT NULL DEFAULT CURRENT_DATE,
    amount_liters NUMERIC(8, 2),
    method TEXT,
    soil_moisture NUMERIC(5, 2),
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 7. IRRIGATION RECOMMENDATIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.irrigation_recommendations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    crop_id UUID REFERENCES public.crops(id) ON DELETE CASCADE,
    recommended_date DATE NOT NULL,
    timing TEXT NOT NULL,
    water_need_liters NUMERIC(8, 2) NOT NULL,
    urgency TEXT DEFAULT 'high',
    reason TEXT NOT NULL,
    weather_context JSONB,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'dismissed')),
    generated_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 8. DISEASE SCANS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.disease_scans (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    farm_id UUID REFERENCES public.farms(id) ON DELETE SET NULL,
    crop_id UUID REFERENCES public.crops(id) ON DELETE SET NULL,
    image_path TEXT,
    detected_disease TEXT NOT NULL,
    disease_key TEXT NOT NULL,
    confidence NUMERIC(5, 2) NOT NULL,
    severity TEXT NOT NULL DEFAULT 'moderate',
    explanation TEXT,
    treatment_advice JSONB NOT NULL,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 9. YIELD PREDICTIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.yield_predictions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    crop_id UUID REFERENCES public.crops(id) ON DELETE SET NULL,
    farm_id UUID NOT NULL REFERENCES public.farms(id) ON DELETE CASCADE,
    predicted_yield NUMERIC(8, 2) NOT NULL,
    yield_per_acre NUMERIC(8, 2) NOT NULL,
    unit TEXT DEFAULT 'tonnes',
    prediction_context JSONB NOT NULL,
    model_version TEXT DEFAULT 'RandomForestRegressor_v1',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 10. MARKET PRICES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.market_prices (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    crop TEXT NOT NULL,
    market TEXT NOT NULL,
    district TEXT,
    state TEXT DEFAULT 'Andhra Pradesh',
    price_per_quintal NUMERIC(10, 2) NOT NULL,
    previous_price NUMERIC(10, 2),
    change_percent NUMERIC(5, 2) DEFAULT 0.0,
    trend TEXT DEFAULT 'stable',
    min_price NUMERIC(10, 2),
    max_price NUMERIC(10, 2),
    price_date DATE NOT NULL DEFAULT CURRENT_DATE,
    source TEXT DEFAULT 'APMC Mandi Yard',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 11. FARM ACTIVITIES TABLE (Real Action Audit Trail)
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.farm_activities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    farm_id UUID REFERENCES public.farms(id) ON DELETE CASCADE,
    crop_id UUID REFERENCES public.crops(id) ON DELETE SET NULL,
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    activity_type TEXT NOT NULL CHECK (activity_type IN ('irrigation', 'planting', 'disease_scan', 'fertilizer', 'spray', 'harvest', 'recommendation', 'soil_test')),
    description TEXT NOT NULL,
    activity_date DATE NOT NULL DEFAULT CURRENT_DATE,
    metadata JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 12. EMERGENCY ALERTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.emergency_alerts (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    farm_id UUID REFERENCES public.farms(id) ON DELETE SET NULL,
    emergency_type TEXT NOT NULL,
    latitude NUMERIC(10, 6) NOT NULL,
    longitude NUMERIC(10, 6) NOT NULL,
    location_name TEXT,
    message TEXT,
    contacts_alerted_count INT DEFAULT 5,
    status TEXT DEFAULT 'broadcasted',
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 13. AI CONVERSATIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS public.ai_conversations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    session_id TEXT NOT NULL,
    user_message TEXT NOT NULL,
    assistant_message TEXT NOT NULL,
    language TEXT DEFAULT 'te',
    context JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================================
-- 14. ROW LEVEL SECURITY (RLS) POLICIES
-- ============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.farms ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.soil_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.crop_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.irrigation_records ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.irrigation_recommendations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.disease_scans ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.yield_predictions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.market_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.farm_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.emergency_alerts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.ai_conversations ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can select and update their own profile
CREATE POLICY "Users can view own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Farms
CREATE POLICY "Users can view own farms" ON public.farms FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own farms" ON public.farms FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own farms" ON public.farms FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own farms" ON public.farms FOR DELETE USING (auth.uid() = user_id);

-- Crops
CREATE POLICY "Users can view crops on own farms" ON public.crops FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.farms WHERE farms.id = crops.farm_id AND farms.user_id = auth.uid())
);
CREATE POLICY "Users can insert crops on own farms" ON public.crops FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.farms WHERE farms.id = crops.farm_id AND farms.user_id = auth.uid())
);
CREATE POLICY "Users can update crops on own farms" ON public.crops FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.farms WHERE farms.id = crops.farm_id AND farms.user_id = auth.uid())
);

-- Soil Records
CREATE POLICY "Users can view soil records for own farms" ON public.soil_records FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.farms WHERE farms.id = soil_records.farm_id AND farms.user_id = auth.uid())
);
CREATE POLICY "Users can insert soil records for own farms" ON public.soil_records FOR INSERT WITH CHECK (
    EXISTS (SELECT 1 FROM public.farms WHERE farms.id = soil_records.farm_id AND farms.user_id = auth.uid())
);

-- Recommendations & Scans
CREATE POLICY "Users can view own crop recommendations" ON public.crop_recommendations FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can view own disease scans" ON public.disease_scans FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can view own emergency alerts" ON public.emergency_alerts FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can view own AI conversations" ON public.ai_conversations FOR ALL USING (auth.uid() = user_id);
CREATE POLICY "Users can view own farm activities" ON public.farm_activities FOR ALL USING (auth.uid() = user_id);

-- Market Prices: Public Read Access
CREATE POLICY "Public market prices read access" ON public.market_prices FOR SELECT TO authenticated, anon USING (true);

-- ============================================================================
-- 15. AUTOMATIC PROFILE TRIGGER ON AUTH SIGNUP
-- ============================================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, phone, preferred_language)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'full_name', 'Farmer'),
    COALESCE(NEW.raw_user_meta_data->>'phone', NEW.phone, ''),
    COALESCE(NEW.raw_user_meta_data->>'preferred_language', 'te')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE PROCEDURE public.handle_new_user();

-- Seed initial APMC market data
INSERT INTO public.market_prices (crop, market, district, state, price_per_quintal, previous_price, change_percent, trend, min_price, max_price)
VALUES 
('Paddy (వరి)', 'Vijayawada APMC', 'NTR District', 'Andhra Pradesh', 2320.00, 2280.00, 1.75, 'up', 2180.00, 2450.00),
('Tomato (టమాటో)', 'Madanapalle APMC', 'Annamayya District', 'Andhra Pradesh', 3800.00, 3400.00, 11.76, 'up', 3200.00, 4200.00),
('Cotton (పత్తి)', 'Guntur APMC', 'Guntur District', 'Andhra Pradesh', 7450.00, 7500.00, -0.67, 'down', 7100.00, 7800.00),
('Chilli (ఎర్ర మిరప)', 'Guntur APMC', 'Guntur District', 'Andhra Pradesh', 18500.00, 18000.00, 2.78, 'up', 16000.00, 21000.00),
('Maize (మొక్కజొన్న)', 'Vijayawada APMC', 'NTR District', 'Andhra Pradesh', 2150.00, 2150.00, 0.00, 'stable', 2000.00, 2250.00)
ON CONFLICT DO NOTHING;
