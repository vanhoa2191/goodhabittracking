-- ==============================================================================
-- KidHabit Hero - Supabase PostgreSQL Schema với RLS Phân Quyền Theo Tài Khoản
-- Tích hợp Google OAuth và bảo mật dữ liệu khách hàng theo user_id (auth.uid())
-- Chạy script này trong Supabase Project -> SQL Editor
-- ==============================================================================

-- 1. Profiles (Hồ sơ các con thuộc tài khoản của phụ huynh)
CREATE TABLE IF NOT EXISTS child_profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid(),
  name TEXT NOT NULL,
  nickname TEXT,
  show_real_name_on_leaderboard BOOLEAN NOT NULL DEFAULT false,
  is_public_on_leaderboard BOOLEAN NOT NULL DEFAULT true,
  avatar TEXT NOT NULL DEFAULT '🦁',
  theme_color TEXT NOT NULL DEFAULT '#6366f1',
  points INTEGER NOT NULL DEFAULT 0,
  total_earned INTEGER NOT NULL DEFAULT 0,
  level INTEGER NOT NULL DEFAULT 1,
  streak INTEGER NOT NULL DEFAULT 0,
  last_active_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- Hỗ trợ nâng cấp các cơ sở dữ liệu đã tạo từ trước (Migrations an toàn)
ALTER TABLE child_profiles ADD COLUMN IF NOT EXISTS nickname TEXT;
ALTER TABLE child_profiles ADD COLUMN IF NOT EXISTS show_real_name_on_leaderboard BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE child_profiles ADD COLUMN IF NOT EXISTS is_public_on_leaderboard BOOLEAN NOT NULL DEFAULT true;

-- 2. Activities (Nhiệm vụ / Thói quen do phụ huynh tạo cho con)
CREATE TABLE IF NOT EXISTS habit_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid(),
  child_id UUID REFERENCES child_profiles(id) ON DELETE CASCADE, -- NULL = all children in family
  title TEXT NOT NULL,
  description TEXT,
  icon TEXT NOT NULL DEFAULT '✨',
  category TEXT NOT NULL DEFAULT 'nutrition',
  points INTEGER NOT NULL DEFAULT 10,
  recurrence_type TEXT NOT NULL DEFAULT 'daily',
  recurrence_days JSONB NOT NULL DEFAULT '[0,1,2,3,4,5,6]'::jsonb,
  time_of_day TEXT NOT NULL DEFAULT 'morning',
  duration_minutes INTEGER DEFAULT 0,
  requires_approval BOOLEAN NOT NULL DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 3. Activity Logs (Nhật ký hoàn thành thói quen)
CREATE TABLE IF NOT EXISTS activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid(),
  activity_id UUID NOT NULL REFERENCES habit_activities(id) ON DELETE CASCADE,
  child_id UUID NOT NULL REFERENCES child_profiles(id) ON DELETE CASCADE,
  log_date DATE NOT NULL,
  status TEXT NOT NULL DEFAULT 'completed',
  points_awarded INTEGER NOT NULL DEFAULT 0,
  completed_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  proof_note TEXT,
  CONSTRAINT unique_activity_child_date UNIQUE (activity_id, child_id, log_date)
);

-- 4. Rewards (Kho quà đổi thưởng của gia đình)
CREATE TABLE IF NOT EXISTS rewards (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid(),
  title TEXT NOT NULL,
  description TEXT,
  icon TEXT NOT NULL DEFAULT '🎁',
  cost_points INTEGER NOT NULL DEFAULT 50,
  stock INTEGER NOT NULL DEFAULT -1, -- -1 = vô hạn
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

-- 5. Redemptions (Lịch sử yêu cầu đổi quà)
CREATE TABLE IF NOT EXISTS redemptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid(),
  reward_id UUID NOT NULL REFERENCES rewards(id) ON DELETE CASCADE,
  child_id UUID NOT NULL REFERENCES child_profiles(id) ON DELETE CASCADE,
  points_spent INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  requested_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  resolved_at TIMESTAMPTZ
);

-- 6. Child Badges (Huy hiệu đã đạt)
CREATE TABLE IF NOT EXISTS child_badges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE DEFAULT auth.uid(),
  child_id UUID NOT NULL REFERENCES child_profiles(id) ON DELETE CASCADE,
  badge_id TEXT NOT NULL,
  unlocked_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT unique_child_badge UNIQUE (child_id, badge_id)
);

-- ==============================================================================
-- BẬT ROW LEVEL SECURITY (RLS) ĐỂ PHÂN QUYỀN TRUY CẬP CHẶT CHẼ THEO USER_ID
-- ==============================================================================
ALTER TABLE child_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE habit_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE redemptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE child_badges ENABLE ROW LEVEL SECURITY;

-- 1. Policies cho child_profiles
DROP POLICY IF EXISTS "Users can view their own child profiles" ON child_profiles;
CREATE POLICY "Users can view their own child profiles"
  ON child_profiles FOR SELECT
  USING (auth.uid() = user_id OR auth.uid() IS NULL);

DROP POLICY IF EXISTS "Users can insert their own child profiles" ON child_profiles;
CREATE POLICY "Users can insert their own child profiles"
  ON child_profiles FOR INSERT
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

DROP POLICY IF EXISTS "Users can update their own child profiles" ON child_profiles;
CREATE POLICY "Users can update their own child profiles"
  ON child_profiles FOR UPDATE
  USING (auth.uid() = user_id OR auth.uid() IS NULL);

DROP POLICY IF EXISTS "Users can delete their own child profiles" ON child_profiles;
CREATE POLICY "Users can delete their own child profiles"
  ON child_profiles FOR DELETE
  USING (auth.uid() = user_id OR auth.uid() IS NULL);

-- 2. Policies cho habit_activities
DROP POLICY IF EXISTS "Users can manage their own activities" ON habit_activities;
CREATE POLICY "Users can manage their own activities"
  ON habit_activities FOR ALL
  USING (auth.uid() = user_id OR auth.uid() IS NULL)
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- 3. Policies cho activity_logs
DROP POLICY IF EXISTS "Users can manage their own logs" ON activity_logs;
CREATE POLICY "Users can manage their own logs"
  ON activity_logs FOR ALL
  USING (auth.uid() = user_id OR auth.uid() IS NULL)
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- 4. Policies cho rewards
DROP POLICY IF EXISTS "Users can manage their own rewards" ON rewards;
CREATE POLICY "Users can manage their own rewards"
  ON rewards FOR ALL
  USING (auth.uid() = user_id OR auth.uid() IS NULL)
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- 5. Policies cho redemptions
DROP POLICY IF EXISTS "Users can manage their own redemptions" ON redemptions;
CREATE POLICY "Users can manage their own redemptions"
  ON redemptions FOR ALL
  USING (auth.uid() = user_id OR auth.uid() IS NULL)
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- 6. Policies cho child_badges
DROP POLICY IF EXISTS "Users can manage their own badges" ON child_badges;
CREATE POLICY "Users can manage their own badges"
  ON child_badges FOR ALL
  USING (auth.uid() = user_id OR auth.uid() IS NULL)
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- ==============================================================================
-- BẢNG XẾP HẠNG CỘNG ĐỒNG TOÀN CẦU (CHỈ XEM NICKNAME & ĐIỂM, KHÔNG LỘ EMAIL)
-- Tự động áp dụng tùy chọn của phụ huynh: Tên thật hoặc chỉ Biệt danh (Nickname)
-- ==============================================================================
CREATE OR REPLACE VIEW public_leaderboard AS
  SELECT 
    id AS child_id,
    CASE 
      WHEN show_real_name_on_leaderboard = true THEN name
      WHEN nickname IS NOT NULL AND length(trim(nickname)) > 0 THEN trim(nickname)
      ELSE 'Bé ' || split_part(name, ' ', -1)
    END AS nickname,
    avatar,
    theme_color,
    points,
    streak,
    level,
    created_at
  FROM child_profiles
  WHERE is_public_on_leaderboard IS NOT FALSE;

-- Enable Realtime (Idempotent: an toàn khi chạy lại nhiều lần)
DO $$ 
BEGIN
  IF EXISTS (SELECT 1 FROM pg_publication WHERE pubname = 'supabase_realtime') THEN
    BEGIN
      ALTER PUBLICATION supabase_realtime ADD TABLE child_profiles, habit_activities, activity_logs, rewards, redemptions;
    EXCEPTION
      WHEN duplicate_object THEN NULL;
      WHEN others THEN NULL;
    END;
  END IF;
END $$;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_child_profiles_user ON child_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_habit_activities_user ON habit_activities(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_user ON activity_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_logs_date ON activity_logs(log_date);

-- ==============================================================================
-- 7. Subscriptions & PayOS Payments
-- ==============================================================================
CREATE TABLE IF NOT EXISTS user_subscriptions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  plan TEXT NOT NULL DEFAULT 'free', -- 'free' | 'trial' | 'monthly' | 'yearly' | 'lifetime'
  status TEXT NOT NULL DEFAULT 'active', -- 'active' | 'expired' | 'cancelled'
  trial_ends_at TIMESTAMPTZ,
  subscription_ends_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE TABLE IF NOT EXISTS payment_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_code BIGINT UNIQUE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  plan_id TEXT NOT NULL,
  amount INTEGER NOT NULL,
  description TEXT,
  status TEXT NOT NULL DEFAULT 'PENDING', -- 'PENDING' | 'PAID' | 'CANCELLED'
  payment_url TEXT,
  qr_code TEXT,
  paid_at TIMESTAMPTZ,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE user_subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE payment_orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own subscriptions" ON user_subscriptions;
CREATE POLICY "Users can view their own subscriptions"
  ON user_subscriptions FOR ALL
  USING (auth.uid() = user_id OR auth.uid() IS NULL)
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

DROP POLICY IF EXISTS "Users can view their own payment orders" ON payment_orders;
CREATE POLICY "Users can view their own payment orders"
  ON payment_orders FOR ALL
  USING (auth.uid() = user_id OR auth.uid() IS NULL)
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

CREATE INDEX IF NOT EXISTS idx_user_subscriptions_user ON user_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_payment_orders_code ON payment_orders(order_code);

-- ==============================================================================
-- 8. Family Device Access Codes (Ghép nối thiết bị trẻ em qua mã duy nhất)
-- ==============================================================================
CREATE TABLE IF NOT EXISTS family_access_codes (
  code TEXT PRIMARY KEY,
  family_id TEXT NOT NULL,
  family_name TEXT DEFAULT 'Gia đình Siêu Nhân',
  data_snapshot JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

ALTER TABLE family_access_codes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public access to family access codes" ON family_access_codes;
CREATE POLICY "Public access to family access codes"
  ON family_access_codes FOR ALL
  USING (true)
  WITH CHECK (true);

CREATE INDEX IF NOT EXISTS idx_family_access_codes_family ON family_access_codes(family_id);

