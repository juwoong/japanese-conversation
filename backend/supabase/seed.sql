-- seed.sql
-- 초기 데이터 시딩

-- ============================================
-- Personas (3개 페르소나)
-- ============================================
INSERT INTO personas (slug, name_ko, name_ja, icon, description, sort_order) VALUES
  ('tourist', '관광', '観光', '🧳', '일본 여행자를 위한 기본 회화. 편의점, 카페, 식당, 교통편 등.', 1),
  ('business', '비즈니스', 'ビジネス', '💼', '비즈니스 출장자를 위한 격식 있는 회화. 명함 교환, 회의, 식사 접대 등.', 2),
  ('workingholiday', '워홀/유학', 'ワーホリ・留学', '🎒', '장기 체류자를 위한 생활 밀착형 회화. 은행, 병원, 부동산, 아르바이트 등.', 3)
ON CONFLICT (slug) DO UPDATE SET
  name_ko = EXCLUDED.name_ko,
  name_ja = EXCLUDED.name_ja,
  icon = EXCLUDED.icon,
  description = EXCLUDED.description,
  sort_order = EXCLUDED.sort_order;
