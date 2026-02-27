-- 006_onboarding_fields.sql
-- 온보딩 고도화: 목적지, 출발일 추가

ALTER TABLE profiles ADD COLUMN IF NOT EXISTS onboarding_completed BOOLEAN DEFAULT FALSE;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS destination TEXT;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS departure_date DATE;
