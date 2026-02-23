-- =============================================================
-- Vocabulary INSERT statements (with jlpt_level)
-- Total vocabulary items: 731

-- Vocabulary INSERT for airport_pickup (12 words)
INSERT INTO vocabulary (situation_id, word_ja, reading_hiragana, reading_ko, meaning_ko, pos, jlpt_level) VALUES
  ((SELECT id FROM situations WHERE slug = 'airport_pickup'), '失礼', 'しつれい', '시츠레-', '실례', '명사', NULL),
  ((SELECT id FROM situations WHERE slug = 'airport_pickup'), 'ございます', 'ございます', '고자이마스', '있습니다 (정중한 표현)', '동사', NULL),
  ((SELECT id FROM situations WHERE slug = 'airport_pickup'), 'いらっしゃいます', 'いらっしゃいます', '이랏샤이마스', '계시다 (존경어)', '동사', NULL),
  ((SELECT id FROM situations WHERE slug = 'airport_pickup'), '本日', 'ほんじつ', '혼지츠', '오늘', '명사', NULL),
  ((SELECT id FROM situations WHERE slug = 'airport_pickup'), 'よろしく', 'よろしく', '요로시쿠', '잘 부탁드립니다', '표현', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'airport_pickup'), 'お疲れ様でした', 'おつかれさまでした', '오츠카레사마데시타', '수고하셨습니다', '표현', NULL),
  ((SELECT id FROM situations WHERE slug = 'airport_pickup'), 'フライト', 'フライト', '후라이토', '비행', '명사', NULL),
  ((SELECT id FROM situations WHERE slug = 'airport_pickup'), 'いかが', 'いかが', '이카가', '어떻습니까', '명사', NULL),
  ((SELECT id FROM situations WHERE slug = 'airport_pickup'), 'おかげさまで', 'おかげさまで', '오카게사마데', '덕분에', '표현', NULL),
  ((SELECT id FROM situations WHERE slug = 'airport_pickup'), '快適', 'かいてき', '카이테키', '쾌적함', '형용사', NULL),
  ((SELECT id FROM situations WHERE slug = 'airport_pickup'), 'ご案内', 'ごあんない', '고안나이', '안내', '명사', NULL),
  ((SELECT id FROM situations WHERE slug = 'airport_pickup'), 'いたします', 'いたします', '이타시마스', '합니다 (겸양어)', '동사', NULL)
;

-- Vocabulary INSERT for ask_directions (14 words)
INSERT INTO vocabulary (situation_id, word_ja, reading_hiragana, reading_ko, meaning_ko, pos, jlpt_level) VALUES
  ((SELECT id FROM situations WHERE slug = 'ask_directions'), '何か', 'なにか', '나니카', '무언가, 뭔가', '명사', NULL),
  ((SELECT id FROM situations WHERE slug = 'ask_directions'), '探す', 'さがす', '사가스', '찾다', '동사', NULL),
  ((SELECT id FROM situations WHERE slug = 'ask_directions'), '駅', 'えき', '에키', '역', '명사', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'ask_directions'), 'どこ', 'どこ', '도코', '어디', '명사', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'ask_directions'), '道', 'みち', '미치', '길', '명사', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'ask_directions'), 'まっすぐ', 'まっすぐ', '맛스구', '똑바로, 곧장', '부사', NULL),
  ((SELECT id FROM situations WHERE slug = 'ask_directions'), '行く', 'いく', '이쿠', '가다', '동사', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'ask_directions'), '右', 'みぎ', '미기', '오른쪽', '명사', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'ask_directions'), '曲がる', 'まがる', '마가루', '돌다', '동사', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'ask_directions'), 'どのくらい', 'どのくらい', '도노쿠라이', '얼마 정도, 얼마나', '표현', NULL),
  ((SELECT id FROM situations WHERE slug = 'ask_directions'), 'かかる', 'かかる', '카카루', '(시간, 돈이) 걸리다, 들다', '동사', NULL),
  ((SELECT id FROM situations WHERE slug = 'ask_directions'), '歩く', 'あるく', '아루쿠', '걷다', '동사', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'ask_directions'), '分', 'ふん', '훈', '분', '명사', NULL),
  ((SELECT id FROM situations WHERE slug = 'ask_directions'), 'くらい', 'くらい', '쿠라이', '~정도', '부사', NULL)
;

-- Vocabulary INSERT for ask_directions_v2 (10 words)
INSERT INTO vocabulary (situation_id, word_ja, reading_hiragana, reading_ko, meaning_ko, pos, jlpt_level) VALUES
  ((SELECT id FROM situations WHERE slug = 'ask_directions_v2'), '電車', 'でんしゃ', '덴샤', '전철', '명사', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'ask_directions_v2'), '降りる', 'おりる', '오리루', '내리다', '동사', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'ask_directions_v2'), '乗り換える', 'のりかえる', '노리카에루', '갈아타다', '동사', NULL),
  ((SELECT id FROM situations WHERE slug = 'ask_directions_v2'), '地下鉄', 'ちかてつ', '치카테츠', '지하철', '명사', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'ask_directions_v2'), '切符', 'きっぷ', '킵푸', '표, 승차권', '명사', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'ask_directions_v2'), '買う', 'かう', '카우', '사다', '동사', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'ask_directions_v2'), '左', 'ひだり', '히다리', '왼쪽', '명사', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'ask_directions_v2'), '階段', 'かいだん', '카이단', '계단', '명사', 'N4'),
  ((SELECT id FROM situations WHERE slug = 'ask_directions_v2'), 'バス', 'バス', '바스', '버스', '명사', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'ask_directions_v2'), '乗る', 'のる', '노루', '타다', '동사', 'N5')
;

-- Vocabulary INSERT for bank_account (22 words)
INSERT INTO vocabulary (situation_id, word_ja, reading_hiragana, reading_ko, meaning_ko, pos, jlpt_level) VALUES
  ((SELECT id FROM situations WHERE slug = 'bank_account'), 'いらっしゃいませ', 'いらっしゃいませ', '이랏샤이마세', '어서 오세요', '표현', NULL),
  ((SELECT id FROM situations WHERE slug = 'bank_account'), '本日', 'ほんじつ', '혼지츠', '오늘', '명사', NULL),
  ((SELECT id FROM situations WHERE slug = 'bank_account'), 'どのような', 'どのような', '도노요-나', '어떤', '표현', NULL),
  ((SELECT id FROM situations WHERE slug = 'bank_account'), 'ご用件', 'ごようけん', '고요-켄', '용건', '명사', NULL),
  ((SELECT id FROM situations WHERE slug = 'bank_account'), '口座', 'こうざ', '코-자', '계좌', '명사', NULL),
  ((SELECT id FROM situations WHERE slug = 'bank_account'), '開設', 'かいせつ', '카이세츠', '개설', '명사', NULL),
  ((SELECT id FROM situations WHERE slug = 'bank_account'), 'する', 'する', '스루', '하다', '동사', NULL),
  ((SELECT id FROM situations WHERE slug = 'bank_account'), '外国人', 'がいこくじん', '가이코쿠진', '외국인', '명사', NULL),
  ((SELECT id FROM situations WHERE slug = 'bank_account'), '作る', 'つくる', '츠쿠루', '만들다', '동사', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'bank_account'), '在留カード', 'ざいりゅうカード', '자이류-카-도', '재류 카드', '명사', NULL),
  ((SELECT id FROM situations WHERE slug = 'bank_account'), '住所', 'じゅうしょ', '쥬-쇼', '주소', '명사', NULL),
  ((SELECT id FROM situations WHERE slug = 'bank_account'), '確認', 'かくにん', '카쿠닌', '확인', '명사', 'N4'),
  ((SELECT id FROM situations WHERE slug = 'bank_account'), '書類', 'しょるい', '쇼류이', '서류', '명사', NULL),
  ((SELECT id FROM situations WHERE slug = 'bank_account'), '電気', 'でんき', '뎅키', '전기', '명사', NULL),
  ((SELECT id FROM situations WHERE slug = 'bank_account'), '請求書', 'せいきゅうしょ', '세-큐-쇼', '청구서', '명사', NULL),
  ((SELECT id FROM situations WHERE slug = 'bank_account'), '大丈夫', 'だいじょうぶ', '다이죠-부', '괜찮음', '형용사', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'bank_account'), '用紙', 'ようし', '요-시', '용지', '명사', NULL),
  ((SELECT id FROM situations WHERE slug = 'bank_account'), '記入', 'きにゅう', '키뉴-', '기입', '명사', NULL),
  ((SELECT id FROM situations WHERE slug = 'bank_account'), 'お願い', 'おねがい', '오네가이', '부탁', '명사', NULL),
  ((SELECT id FROM situations WHERE slug = 'bank_account'), 'キャッシュカード', 'キャッシュカード', '캿슈카-도', '현금 카드', '명사', NULL),
  ((SELECT id FROM situations WHERE slug = 'bank_account'), '一週間後', 'いっしゅうかんご', '잇슈-칸고', '일주일 후', '명사', NULL),
  ((SELECT id FROM situations WHERE slug = 'bank_account'), '届く', 'とどく', '토도쿠', '도착하다', '동사', 'N4')
;

-- Vocabulary INSERT for business_card (18 words)
INSERT INTO vocabulary (situation_id, word_ja, reading_hiragana, reading_ko, meaning_ko, pos, jlpt_level) VALUES
  ((SELECT id FROM situations WHERE slug = 'business_card'), 'はじめまして', 'はじめまして', '하지메마시테', '처음 뵙겠습니다', '표현', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'business_card'), '株式会社', 'かぶしきがいしゃ', '카부시키가이샤', '주식회사', '명사', NULL),
  ((SELECT id FROM situations WHERE slug = 'business_card'), '山田', 'やまだ', '야마다', '야마다 (성씨)', '명사', NULL),
  ((SELECT id FROM situations WHERE slug = 'business_card'), '田中', 'たなか', '타나카', '다나카 (성씨)', '명사', NULL),
  ((SELECT id FROM situations WHERE slug = 'business_card'), '申します', 'もうします', '모-시마스', '~라고 합니다 (겸양어)', '동사', NULL),
  ((SELECT id FROM situations WHERE slug = 'business_card'), '韓国', 'かんこく', '칸코쿠', '한국', '명사', NULL),
  ((SELECT id FROM situations WHERE slug = 'business_card'), 'キム', 'キム', '키무', '김 (성씨)', '명사', NULL),
  ((SELECT id FROM situations WHERE slug = 'business_card'), '名刺', 'めいし', '메-시', '명함', '명사', NULL),
  ((SELECT id FROM situations WHERE slug = 'business_card'), 'どうぞ', 'どうぞ', '도-조', 'どうぞ (권유, 부탁)', '표현', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'business_card'), '頂戴いたします', 'ちょうだいいたします', '쵸-다이 이타시마스', '받겠습니다 (겸양어)', '표현', NULL),
  ((SELECT id FROM situations WHERE slug = 'business_card'), 'こちらこそ', 'こちらこそ', '코치라코소', '저야말로', '표현', NULL),
  ((SELECT id FROM situations WHERE slug = 'business_card'), 'よろしく', 'よろしく', '요로시쿠', '잘 부탁드립니다', '표현', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'business_card'), '今後とも', 'こんごとも', '콘고토모', '앞으로도', '부사', NULL),
  ((SELECT id FROM situations WHERE slug = 'business_card'), '本日', 'ほんじつ', '혼지츠', '오늘', '명사', NULL),
  ((SELECT id FROM situations WHERE slug = 'business_card'), '貴重', 'きちょう', '키쵸-', '귀중함', '형용사', NULL),
  ((SELECT id FROM situations WHERE slug = 'business_card'), '時間', 'じかん', '지칸', '시간', '명사', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'business_card'), 'いただく', 'いただく', '이타다쿠', '받다 (겸양어, 먹다/마시다/받다의 겸양어)', '동사', NULL),
  ((SELECT id FROM situations WHERE slug = 'business_card'), 'ありがとうございます', 'ありがとうございます', '아리가토-고자이마스', '감사합니다', '표현', 'N5')
;

-- Vocabulary INSERT for business_dinner (18 words)
INSERT INTO vocabulary (situation_id, word_ja, reading_hiragana, reading_ko, meaning_ko, pos, jlpt_level) VALUES
  ((SELECT id FROM situations WHERE slug = 'business_dinner'), 'お口', 'おくち', '오쿠치', '입 (존경어)', '명사', NULL),
  ((SELECT id FROM situations WHERE slug = 'business_dinner'), '合う', 'あう', '아우', '맞다, 어울리다', '동사', NULL),
  ((SELECT id FROM situations WHERE slug = 'business_dinner'), 'どう', 'どう', '도-', '어떻게', '부사', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'business_dinner'), '召し上がる', 'めしあがる', '메시아가루', '드시다 (존경어)', '동사', 'N4'),
  ((SELECT id FROM situations WHERE slug = 'business_dinner'), 'いただく', 'いただく', '이타다쿠', '잘 먹겠습니다', '표현', NULL),
  ((SELECT id FROM situations WHERE slug = 'business_dinner'), '乾杯', 'かんぱい', '캄파이', '건배', '명사', NULL),
  ((SELECT id FROM situations WHERE slug = 'business_dinner'), '今日', 'きょう', '쿄-', '오늘', '명사', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'business_dinner'), 'ご成功', 'ごせいこう', '고세이코-', '성공 (존경어)', '명사', NULL),
  ((SELECT id FROM situations WHERE slug = 'business_dinner'), '祝して', 'いわいして', '이와이시테', '축하하며', '표현', NULL),
  ((SELECT id FROM situations WHERE slug = 'business_dinner'), 'とても', 'とても', '토테모', '매우, 아주', '부사', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'business_dinner'), 'おいしい', 'おいしい', '오이시이', '맛있다', '형용사', NULL),
  ((SELECT id FROM situations WHERE slug = 'business_dinner'), '料理', 'りょうり', '료-리', '요리', '명사', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'business_dinner'), '何という', 'なんという', '난토이우', '무슨 ~라고 하는', '표현', NULL),
  ((SELECT id FROM situations WHERE slug = 'business_dinner'), '郷土料理', 'きょうどりょうり', '쿄-도료-리', '향토 요리', '명사', NULL),
  ((SELECT id FROM situations WHERE slug = 'business_dinner'), '京都', 'きょうと', '쿄-토', '교토', '명사', NULL),
  ((SELECT id FROM situations WHERE slug = 'business_dinner'), '気', 'き', '키', '마음, 기분', '명사', NULL),
  ((SELECT id FROM situations WHERE slug = 'business_dinner'), '召す', 'めす', '메스', '드시다, 입다 (존경어)', '동사', NULL),
  ((SELECT id FROM situations WHERE slug = 'business_dinner'), '嬉しい', 'うれしい', '우레시이', '기쁘다', '형용사', 'N4')
;

-- Vocabulary INSERT for business_taxi (17 words)
INSERT INTO vocabulary (situation_id, word_ja, reading_hiragana, reading_ko, meaning_ko, pos, jlpt_level) VALUES
  ((SELECT id FROM situations WHERE slug = 'business_taxi'), 'ご乗車', 'ごじょうしゃ', '고죠-샤', '승차', '명사', NULL),
  ((SELECT id FROM situations WHERE slug = 'business_taxi'), 'ありがとうございます', 'ありがとうございます', '아리가토-고자이마스', '감사합니다', '표현', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'business_taxi'), 'どちら', 'どちら', '도치라', '어느 쪽, 어디', '명사', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'business_taxi'), 'まで', 'まで', '마데', '~까지', '조사', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'business_taxi'), '新宿駅', 'しんじゅくえき', '신쥬쿠에키', '신주쿠역', '명사', NULL),
  ((SELECT id FROM situations WHERE slug = 'business_taxi'), '西口', 'にしぐち', '니시구치', '서쪽 출구', '명사', NULL),
  ((SELECT id FROM situations WHERE slug = 'business_taxi'), 'お願いします', 'おねがいします', '오네가이시마스', '부탁드립니다', '표현', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'business_taxi'), 'かしこまりました', 'かしこまりました', '카시코마리마시타', '알겠습니다', '표현', NULL),
  ((SELECT id FROM situations WHERE slug = 'business_taxi'), '首都高速', 'しゅとこうそく', '슈토코-소쿠', '수도고속도로', '명사', NULL),
  ((SELECT id FROM situations WHERE slug = 'business_taxi'), '使う', 'つかう', '츠카우', '쓰다, 사용하다', '동사', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'business_taxi'), 'よろしい', 'よろしい', '요로시이', '좋다, 괜찮다', '형용사', NULL),
  ((SELECT id FROM situations WHERE slug = 'business_taxi'), '領収書', 'りょうしゅうしょ', '료-슈-쇼', '영수증', '명사', NULL),
  ((SELECT id FROM situations WHERE slug = 'business_taxi'), 'もちろん', 'もちろん', '모치론', '물론', '부사', NULL),
  ((SELECT id FROM situations WHERE slug = 'business_taxi'), 'ございます', 'ございます', '고자이마스', '있습니다 (정중한 표현)', '동사', NULL),
  ((SELECT id FROM situations WHERE slug = 'business_taxi'), 'お降り', 'おり', '오리', '내림, 하차', '명사', NULL),
  ((SELECT id FROM situations WHERE slug = 'business_taxi'), '際', 'さい', '사이', '때, 경우', '명사', NULL),
  ((SELECT id FROM situations WHERE slug = 'business_taxi'), '渡す', 'わたす', '와타스', '건네주다, 넘겨주다', '동사', 'N5')
;

-- Vocabulary INSERT for business_v2 (13 words)
INSERT INTO vocabulary (situation_id, word_ja, reading_hiragana, reading_ko, meaning_ko, pos, jlpt_level) VALUES
  ((SELECT id FROM situations WHERE slug = 'business_v2'), '会社', 'かいしゃ', '카이샤', '회사', '명사', 'N4'),
  ((SELECT id FROM situations WHERE slug = 'business_v2'), '社長', 'しゃちょう', '샤쵸-', '사장', '명사', 'N4'),
  ((SELECT id FROM situations WHERE slug = 'business_v2'), '課長', 'かちょう', '카쵸-', '과장', '명사', 'N4'),
  ((SELECT id FROM situations WHERE slug = 'business_v2'), '挨拶', 'あいさつ', '아이사츠', '인사', '명사', 'N4'),
  ((SELECT id FROM situations WHERE slug = 'business_v2'), 'アルバイト', 'アルバイト', '아루바이토', '아르바이트', '명사', 'N4'),
  ((SELECT id FROM situations WHERE slug = 'business_v2'), '経験', 'けいけん', '케-켄', '경험', '명사', 'N4'),
  ((SELECT id FROM situations WHERE slug = 'business_v2'), '仕事', 'しごと', '시고토', '일, 직업', '명사', 'N4'),
  ((SELECT id FROM situations WHERE slug = 'business_v2'), '紹介', 'しょうかい', '쇼-카이', '소개', '명사', 'N4'),
  ((SELECT id FROM situations WHERE slug = 'business_v2'), '相談', 'そうだん', '소-단', '상담', '명사', 'N4'),
  ((SELECT id FROM situations WHERE slug = 'business_v2'), '予定', 'よてい', '요테-', '예정', '명사', 'N4'),
  ((SELECT id FROM situations WHERE slug = 'business_v2'), '予約', 'よやく', '요야쿠', '예약', '명사', 'N4'),
  ((SELECT id FROM situations WHERE slug = 'business_v2'), '約束', 'やくそく', '야쿠소쿠', '약속', '명사', 'N4'),
  ((SELECT id FROM situations WHERE slug = 'business_v2'), '関係', 'かんけい', '칸케-', '관계, 관련', '명사', 'N4')
;

-- Vocabulary INSERT for cafe (13 words)
INSERT INTO vocabulary (situation_id, word_ja, reading_hiragana, reading_ko, meaning_ko, pos, jlpt_level) VALUES
  ((SELECT id FROM situations WHERE slug = 'cafe'), 'いらっしゃいませ', 'いらっしゃいませ', '이랏샤이마세', '어서 오세요', '표현', NULL),
  ((SELECT id FROM situations WHERE slug = 'cafe'), 'ご注文', 'ごちゅうもん', '고츄-몬', '주문', '명사', NULL),
  ((SELECT id FROM situations WHERE slug = 'cafe'), 'アイスコーヒー', 'アイスコーヒー', '아이스코-히-', '아이스 커피', '명사', NULL),
  ((SELECT id FROM situations WHERE slug = 'cafe'), 'お願い', 'おねがい', '오네가이', '부탁', '명사', NULL),
  ((SELECT id FROM situations WHERE slug = 'cafe'), 'サイズ', 'サイズ', '사이즈', '사이즈', '명사', NULL),
  ((SELECT id FROM situations WHERE slug = 'cafe'), 'いかが', 'いかが', '이카가', '어떻게', '부사', NULL),
  ((SELECT id FROM situations WHERE slug = 'cafe'), 'なさる', 'なさる', '나사루', '하시다 (する의 존경어)', '동사', NULL),
  ((SELECT id FROM situations WHERE slug = 'cafe'), 'Mサイズ', 'Mサイズ', '엠 사이즈', 'M 사이즈', '명사', NULL),
  ((SELECT id FROM situations WHERE slug = 'cafe'), '四百', 'よんひゃく', '욘햐쿠', '400', '명사', NULL),
  ((SELECT id FROM situations WHERE slug = 'cafe'), '円', 'えん', '엔', '엔 (화폐 단위)', '명사', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'cafe'), '少々', 'しょうしょう', '쇼-쇼-', '잠시, 잠깐', '부사', NULL),
  ((SELECT id FROM situations WHERE slug = 'cafe'), '待つ', 'まつ', '마츠', '기다리다', '동사', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'cafe'), 'ください', 'ください', '쿠다사이', '주세요', '표현', 'N5')
;

-- Vocabulary INSERT for cafe_v2 (10 words)
INSERT INTO vocabulary (situation_id, word_ja, reading_hiragana, reading_ko, meaning_ko, pos, jlpt_level) VALUES
  ((SELECT id FROM situations WHERE slug = 'cafe_v2'), '暑い', 'あつい', '아츠이', '덥다', '형용사', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'cafe_v2'), '雨', 'あめ', '아메', '비', '명사', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'cafe_v2'), '天気', 'てんき', '텐키', '날씨', '명사', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'cafe_v2'), '涼しい', 'すずしい', '스즈시-', '시원하다, 선선하다', '형용사', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'cafe_v2'), '飲み物', 'のみもの', '노미모노', '음료', '명사', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'cafe_v2'), 'コーヒー', 'コーヒー', '코-히-', '커피', '명사', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'cafe_v2'), '花', 'はな', '하나', '꽃', '명사', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'cafe_v2'), '綺麗', 'きれい', '키레-', '예쁘다, 깨끗하다', '형용사(な)', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'cafe_v2'), '風', 'かぜ', '카제', '바람', '명사', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'cafe_v2'), '気持ちいい', 'きもちいい', '키모치이-', '기분 좋다', '형용사', NULL)
;

-- Vocabulary INSERT for clothing_shop (12 words)
INSERT INTO vocabulary (situation_id, word_ja, reading_hiragana, reading_ko, meaning_ko, pos, jlpt_level) VALUES
  ((SELECT id FROM situations WHERE slug = 'clothing_shop'), '靴', 'くつ', '쿠츠', '신발', '명사', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'clothing_shop'), 'シャツ', 'シャツ', '샤츠', '셔츠', '명사', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'clothing_shop'), '帽子', 'ぼうし', '보-시', '모자', '명사', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'clothing_shop'), '服', 'ふく', '후쿠', '옷', '명사', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'clothing_shop'), '傘', 'かさ', '카사', '우산', '명사', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'clothing_shop'), 'ネクタイ', 'ネクタイ', '네쿠타이', '넥타이', '명사', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'clothing_shop'), '太い', 'ふとい', '후토이', '굵다, 뚱뚱하다', '형용사', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'clothing_shop'), '細い', 'ほそい', '호소이', '가늘다, 날씬하다', '형용사', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'clothing_shop'), '軽い', 'かるい', '카루이', '가볍다', '형용사', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'clothing_shop'), '電話', 'でんわ', '덴와', '전화', '명사', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'clothing_shop'), '丈夫', 'じょうぶ', '죠-부', '튼튼하다', '형용사(な)', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'clothing_shop'), '大切', 'たいせつ', '타이세츠', '소중하다, 중요하다', '형용사(な)', 'N5')
;

-- Vocabulary INSERT for convenience_store (10 words)
INSERT INTO vocabulary (situation_id, word_ja, reading_hiragana, reading_ko, meaning_ko, pos, jlpt_level) VALUES
  ((SELECT id FROM situations WHERE slug = 'convenience_store'), 'いらっしゃいませ', 'いらっしゃいませ', '이랏샤이마세', '어서 오세요', '표현', NULL),
  ((SELECT id FROM situations WHERE slug = 'convenience_store'), 'これ', 'これ', '코레', '이것', '명사', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'convenience_store'), 'ください', 'ください', '쿠다사이', '주세요', '표현', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'convenience_store'), '袋', 'ふくろ', '후쿠로', '봉투, 가방', '명사', NULL),
  ((SELECT id FROM situations WHERE slug = 'convenience_store'), 'いる', 'いる', '이루', '필요하다, 있다', '동사', NULL),
  ((SELECT id FROM situations WHERE slug = 'convenience_store'), 'いいえ', 'いいえ', '이-에', '아니오', '감탄사', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'convenience_store'), '大丈夫', 'だいじょうぶ', '다이죠-부', '괜찮음', '형용사', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'convenience_store'), '三百', 'さんびゃく', '삼뱌쿠', '삼백', '명사', NULL),
  ((SELECT id FROM situations WHERE slug = 'convenience_store'), '円', 'えん', '엔', '엔 (일본 화폐 단위)', '명사', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'convenience_store'), 'ありがとうございました', 'ありがとうございました', '아리가토-고자이마시타', '감사했습니다', '표현', NULL)
;

-- Vocabulary INSERT for convenience_store_v2 (10 words)
INSERT INTO vocabulary (situation_id, word_ja, reading_hiragana, reading_ko, meaning_ko, pos, jlpt_level) VALUES
  ((SELECT id FROM situations WHERE slug = 'convenience_store_v2'), 'お弁当', 'おべんとう', '오벤토-', '도시락', '명사', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'convenience_store_v2'), '肉', 'にく', '니쿠', '고기', '명사', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'convenience_store_v2'), '魚', 'さかな', '사카나', '생선', '명사', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'convenience_store_v2'), '卵', 'たまご', '타마고', '달걀', '명사', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'convenience_store_v2'), '美味しい', 'おいしい', '오이시-', '맛있다', '형용사', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'convenience_store_v2'), '野菜', 'やさい', '야사이', '채소', '명사', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'convenience_store_v2'), '甘い', 'あまい', '아마이', '달다', '형용사', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'convenience_store_v2'), '多い', 'おおい', '오-이', '많다', '형용사', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'convenience_store_v2'), 'お茶', 'おちゃ', '오챠', '차', '명사', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'convenience_store_v2'), 'あちら', 'あちら', '아치라', '저쪽', '명사', NULL)
;

-- Vocabulary INSERT for cooking_v1 (16 words)
INSERT INTO vocabulary (situation_id, word_ja, reading_hiragana, reading_ko, meaning_ko, pos, jlpt_level) VALUES
  ((SELECT id FROM situations WHERE slug = 'cooking_v1'), '牛肉', 'ぎゅうにく', '규-니쿠', '소고기', '명사', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'cooking_v1'), '豚肉', 'ぶたにく', '부타니쿠', '돼지고기', '명사', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'cooking_v1'), '鶏肉', 'とりにく', '토리니쿠', '닭고기', '명사', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'cooking_v1'), '塩', 'しお', '시오', '소금', '명사', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'cooking_v1'), '砂糖', 'さとう', '사토-', '설탕', '명사', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'cooking_v1'), '暖かい', 'あたたかい', '아타타카이', '따뜻하다', '형용사', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'cooking_v1'), '速い', 'はやい', '하야이', '빠르다 (속도)', '형용사', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'cooking_v1'), '掃除する', 'そうじする', '소-지스루', '청소하다', '동사', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'cooking_v1'), '早い', 'はやい', '하야이', '이르다, 빠르다 (시간)', '형용사', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'cooking_v1'), '洗濯する', 'せんたくする', '센타쿠스루', '빨래하다', '동사', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'cooking_v1'), '寒い', 'さむい', '사무이', '춥다', '형용사', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'cooking_v1'), '暗い', 'くらい', '쿠라이', '어둡다', '형용사', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'cooking_v1'), '遅い', 'おそい', '오소이', '늦다, 느리다', '형용사', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'cooking_v1'), '明るい', 'あかるい', '아카루이', '밝다', '형용사', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'cooking_v1'), '上手', 'じょうず', '죠-즈', '잘하다, 능숙하다', '형용사(な)', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'cooking_v1'), '下手', 'へた', '헤타', '서투르다, 못하다', '형용사(な)', 'N5')
;

-- Vocabulary INSERT for daily_advanced_v1 (12 words)
INSERT INTO vocabulary (situation_id, word_ja, reading_hiragana, reading_ko, meaning_ko, pos, jlpt_level) VALUES
  ((SELECT id FROM situations WHERE slug = 'daily_advanced_v1'), '払う', 'はらう', '하라우', '지불하다', '동사', 'N4'),
  ((SELECT id FROM situations WHERE slug = 'daily_advanced_v1'), '足りる', 'たりる', '타리루', '충분하다, 족하다', '동사', 'N4'),
  ((SELECT id FROM situations WHERE slug = 'daily_advanced_v1'), '増える', 'ふえる', '후에루', '늘다, 증가하다', '동사', 'N4'),
  ((SELECT id FROM situations WHERE slug = 'daily_advanced_v1'), '減る', 'へる', '헤루', '줄다, 감소하다', '동사', 'N4'),
  ((SELECT id FROM situations WHERE slug = 'daily_advanced_v1'), '足す', 'たす', '타스', '더하다, 보태다', '동사', 'N4'),
  ((SELECT id FROM situations WHERE slug = 'daily_advanced_v1'), '捨てる', 'すてる', '스테루', '버리다', '동사', 'N4'),
  ((SELECT id FROM situations WHERE slug = 'daily_advanced_v1'), '拾う', 'ひろう', '히로우', '줍다', '동사', 'N4'),
  ((SELECT id FROM situations WHERE slug = 'daily_advanced_v1'), '片付ける', 'かたづける', '카타즈케루', '정리하다', '동사', 'N4'),
  ((SELECT id FROM situations WHERE slug = 'daily_advanced_v1'), '届け出', 'とどけで', '토도케데', '신고서', '명사', 'N4'),
  ((SELECT id FROM situations WHERE slug = 'daily_advanced_v1'), '届ける', 'とどける', '토도케루', '전달하다, 배달하다', '동사', 'N4'),
  ((SELECT id FROM situations WHERE slug = 'daily_advanced_v1'), '洗濯物', 'せんたくもの', '센타쿠모노', '빨래, 세탁물', '명사', 'N4'),
  ((SELECT id FROM situations WHERE slug = 'daily_advanced_v1'), '集める', 'あつめる', '아츠메루', '모으다', '동사', 'N4')
;

-- Vocabulary INSERT for daily_advanced_v2 (13 words)
INSERT INTO vocabulary (situation_id, word_ja, reading_hiragana, reading_ko, meaning_ko, pos, jlpt_level) VALUES
  ((SELECT id FROM situations WHERE slug = 'daily_advanced_v2'), '壊れる', 'こわれる', '코와레루', '고장나다, 부서지다', '동사', 'N4'),
  ((SELECT id FROM situations WHERE slug = 'daily_advanced_v2'), '壊す', 'こわす', '코와스', '부수다, 고장내다', '동사', 'N4'),
  ((SELECT id FROM situations WHERE slug = 'daily_advanced_v2'), '運ぶ', 'はこぶ', '하코부', '운반하다, 나르다', '동사', 'N4'),
  ((SELECT id FROM situations WHERE slug = 'daily_advanced_v2'), '集まる', 'あつまる', '아츠마루', '모이다', '동사', 'N4'),
  ((SELECT id FROM situations WHERE slug = 'daily_advanced_v2'), '決める', 'きめる', '키메루', '정하다, 결정하다', '동사', 'N4'),
  ((SELECT id FROM situations WHERE slug = 'daily_advanced_v2'), '続ける', 'つづける', '츠즈케루', '계속하다', '동사', 'N4'),
  ((SELECT id FROM situations WHERE slug = 'daily_advanced_v2'), '変わる', 'かわる', '카와루', '바뀌다', '동사', 'N4'),
  ((SELECT id FROM situations WHERE slug = 'daily_advanced_v2'), '変える', 'かえる', '카에루', '바꾸다', '동사', 'N4'),
  ((SELECT id FROM situations WHERE slug = 'daily_advanced_v2'), '続く', 'つづく', '츠즈쿠', '계속되다', '동사', 'N4'),
  ((SELECT id FROM situations WHERE slug = 'daily_advanced_v2'), '育てる', 'そだてる', '소다테루', '기르다, 키우다', '동사', 'N4'),
  ((SELECT id FROM situations WHERE slug = 'daily_advanced_v2'), '生きる', 'いきる', '이키루', '살다', '동사', 'N4'),
  ((SELECT id FROM situations WHERE slug = 'daily_advanced_v2'), '亡くなる', 'なくなる', '나쿠나루', '돌아가시다', '동사', 'N4'),
  ((SELECT id FROM situations WHERE slug = 'daily_advanced_v2'), '壁', 'かべ', '카베', '벽', '명사', 'N4')
;

-- Vocabulary INSERT for emotions_v1 (15 words)
INSERT INTO vocabulary (situation_id, word_ja, reading_hiragana, reading_ko, meaning_ko, pos, jlpt_level) VALUES
  ((SELECT id FROM situations WHERE slug = 'emotions_v1'), '悲しい', 'かなしい', '카나시-', '슬프다', '형용사', 'N4'),
  ((SELECT id FROM situations WHERE slug = 'emotions_v1'), '寂しい', 'さびしい', '사비시-', '외롭다, 쓸쓸하다', '형용사', 'N4'),
  ((SELECT id FROM situations WHERE slug = 'emotions_v1'), '気持ち', 'きもち', '키모치', '기분, 느낌', '명사', 'N4'),
  ((SELECT id FROM situations WHERE slug = 'emotions_v1'), '恥ずかしい', 'はずかしい', '하즈카시-', '부끄럽다', '형용사', 'N4'),
  ((SELECT id FROM situations WHERE slug = 'emotions_v1'), '怖い', 'こわい', '코와이', '무섭다', '형용사', 'N4'),
  ((SELECT id FROM situations WHERE slug = 'emotions_v1'), '優しい', 'やさしい', '야사시-', '친절하다, 상냥하다', '형용사', 'N4'),
  ((SELECT id FROM situations WHERE slug = 'emotions_v1'), '厳しい', 'きびしい', '키비시-', '엄격하다, 힘들다', '형용사', 'N4'),
  ((SELECT id FROM situations WHERE slug = 'emotions_v1'), '珍しい', 'めずらしい', '메즈라시-', '드물다, 진귀하다', '형용사', 'N4'),
  ((SELECT id FROM situations WHERE slug = 'emotions_v1'), '素晴らしい', 'すばらしい', '스바라시-', '훌륭하다', '형용사', 'N4'),
  ((SELECT id FROM situations WHERE slug = 'emotions_v1'), '美しい', 'うつくしい', '우츠쿠시-', '아름답다', '형용사', 'N4'),
  ((SELECT id FROM situations WHERE slug = 'emotions_v1'), '酷い', 'ひどい', '히도이', '심하다, 잔인하다', '형용사', 'N4'),
  ((SELECT id FROM situations WHERE slug = 'emotions_v1'), '正しい', 'ただしい', '타다시-', '올바르다', '형용사', 'N4'),
  ((SELECT id FROM situations WHERE slug = 'emotions_v1'), '趣味', 'しゅみ', '슈미', '취미', '명사', 'N4'),
  ((SELECT id FROM situations WHERE slug = 'emotions_v1'), '興味', 'きょうみ', '쿄-미', '관심, 흥미', '명사', 'N4'),
  ((SELECT id FROM situations WHERE slug = 'emotions_v1'), '意見', 'いけん', '이켄', '의견', '명사', 'N4')
;

-- Vocabulary INSERT for emotions_v2 (17 words)
INSERT INTO vocabulary (situation_id, word_ja, reading_hiragana, reading_ko, meaning_ko, pos, jlpt_level) VALUES
  ((SELECT id FROM situations WHERE slug = 'emotions_v2'), '安全', 'あんぜん', '안젠', '안전', '형용사(な)', 'N4'),
  ((SELECT id FROM situations WHERE slug = 'emotions_v2'), '危険', 'きけん', '키켄', '위험', '형용사(な)', 'N4'),
  ((SELECT id FROM situations WHERE slug = 'emotions_v2'), '安心', 'あんしん', '안신', '안심', '명사', 'N4'),
  ((SELECT id FROM situations WHERE slug = 'emotions_v2'), '簡単', 'かんたん', '칸탄', '간단하다', '형용사(な)', 'N4'),
  ((SELECT id FROM situations WHERE slug = 'emotions_v2'), '複雑', 'ふくざつ', '후쿠자츠', '복잡하다', '형용사(な)', 'N4'),
  ((SELECT id FROM situations WHERE slug = 'emotions_v2'), '特別', 'とくべつ', '토쿠베츠', '특별하다', '형용사(な)', 'N4'),
  ((SELECT id FROM situations WHERE slug = 'emotions_v2'), '普通', 'ふつう', '후츠-', '보통, 일반적', '형용사(な)', 'N4'),
  ((SELECT id FROM situations WHERE slug = 'emotions_v2'), '自由', 'じゆう', '지유-', '자유', '형용사(な)', 'N4'),
  ((SELECT id FROM situations WHERE slug = 'emotions_v2'), 'お見舞い', 'おみまい', '오미마이', '문병', '명사', 'N4'),
  ((SELECT id FROM situations WHERE slug = 'emotions_v2'), '歯医者', 'はいしゃ', '하이샤', '치과', '명사', 'N4'),
  ((SELECT id FROM situations WHERE slug = 'emotions_v2'), '退院', 'たいいん', '타이인', '퇴원', '명사', 'N4'),
  ((SELECT id FROM situations WHERE slug = 'emotions_v2'), 'ご主人', 'ごしゅじん', '고슈진', '남편분 (존칭)', '명사', 'N4'),
  ((SELECT id FROM situations WHERE slug = 'emotions_v2'), 'ご存じ', 'ごぞんじ', '고존지', '아시다 (존경)', '표현', 'N4'),
  ((SELECT id FROM situations WHERE slug = 'emotions_v2'), 'いらっしゃる', 'いらっしゃる', '이랏샤루', '계시다/오시다 (존경)', '동사', 'N4'),
  ((SELECT id FROM situations WHERE slug = 'emotions_v2'), 'くださる', 'くださる', '쿠다사루', '주시다 (존경)', '동사', 'N4'),
  ((SELECT id FROM situations WHERE slug = 'emotions_v2'), '致す', 'いたす', '이타스', '하다 (겸양)', '동사', 'N4'),
  ((SELECT id FROM situations WHERE slug = 'emotions_v2'), '差し上がる', 'さしあがる', '사시아가루', '드리다 (겸양)', '동사', NULL)
;

-- Vocabulary INSERT for family_intro (16 words)
INSERT INTO vocabulary (situation_id, word_ja, reading_hiragana, reading_ko, meaning_ko, pos, jlpt_level) VALUES
  ((SELECT id FROM situations WHERE slug = 'family_intro'), '家族', 'かぞく', '카조쿠', '가족', '명사', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'family_intro'), '両親', 'りょうしん', '료-신', '부모님', '명사', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'family_intro'), '父', 'ちち', '치치', '아버지 (자기 가족)', '명사', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'family_intro'), '母', 'はは', '하하', '어머니 (자기 가족)', '명사', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'family_intro'), '兄', 'あに', '아니', '형/오빠 (자기 가족)', '명사', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'family_intro'), '姉', 'あね', '아네', '누나/언니 (자기 가족)', '명사', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'family_intro'), '弟', 'おとうと', '오토-토', '남동생', '명사', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'family_intro'), 'お兄さん', 'おにいさん', '오니-산', '오빠/형님 (타인)', '명사', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'family_intro'), 'お姉さん', 'おねえさん', '오네-산', '언니/누님 (타인)', '명사', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'family_intro'), '結婚する', 'けっこんする', '켓콘스루', '결혼하다', '동사', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'family_intro'), '奥さん', 'おくさん', '오쿠산', '부인, 아내 (타인)', '명사', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'family_intro'), '女', 'おんな', '온나', '여자', '명사', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'family_intro'), '妹', 'いもうと', '이모-토', '여동생', '명사', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'family_intro'), 'お父さん', 'おとうさん', '오토-산', '아버지 (타인/존칭)', '명사', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'family_intro'), 'お母さん', 'おかあさん', '오카-산', '어머니 (타인/존칭)', '명사', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'family_intro'), '男', 'おとこ', '오토코', '남자', '명사', 'N5')
;

-- Vocabulary INSERT for farewell (20 words)
INSERT INTO vocabulary (situation_id, word_ja, reading_hiragana, reading_ko, meaning_ko, pos, jlpt_level) VALUES
  ((SELECT id FROM situations WHERE slug = 'farewell'), '本日', 'ほんじつ', '혼지츠', '오늘 (정중한 표현)', '명사', NULL),
  ((SELECT id FROM situations WHERE slug = 'farewell'), 'お忙しい', 'おいそがしい', '오이소가시이', '바쁘신', '형용사', NULL),
  ((SELECT id FROM situations WHERE slug = 'farewell'), '中', 'なか', '나카', '중', '명사', NULL),
  ((SELECT id FROM situations WHERE slug = 'farewell'), 'お越し', 'おこし', '오코시', '오심 (오다의 존경어)', '명사', NULL),
  ((SELECT id FROM situations WHERE slug = 'farewell'), 'いただき', 'いただき', '이타다키', '받아', '동사', NULL),
  ((SELECT id FROM situations WHERE slug = 'farewell'), 'ありがとう', 'ありがとう', '아리가토-', '감사합니다', '감탄사', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'farewell'), 'ございました', 'ございました', '고자이마시타', '~였습니다 (존경어)', '조동사', NULL),
  ((SELECT id FROM situations WHERE slug = 'farewell'), 'こちらこそ', 'こちらこそ', '코치라코소', '저야말로', '표현', NULL),
  ((SELECT id FROM situations WHERE slug = 'farewell'), '大変', 'たいへん', '타이헨', '大変 (큰일, 매우)', '형용동사', NULL),
  ((SELECT id FROM situations WHERE slug = 'farewell'), 'お世話', 'おせわ', '오세와', '신세', '명사', NULL),
  ((SELECT id FROM situations WHERE slug = 'farewell'), '気', 'き', '키', '마음, 정신', '명사', NULL),
  ((SELECT id FROM situations WHERE slug = 'farewell'), 'つける', 'つける', '츠케루', '붙이다, 주의하다', '동사', NULL),
  ((SELECT id FROM situations WHERE slug = 'farewell'), 'お帰り', 'おかえり', '오카에리', '돌아감 (돌아가다의 존경어)', '명사', NULL),
  ((SELECT id FROM situations WHERE slug = 'farewell'), 'また', 'また', '마타', '또, 다시', '부사', NULL),
  ((SELECT id FROM situations WHERE slug = 'farewell'), '近いうち', 'ちかいうち', '치카이우치', '조만간', '명사', NULL),
  ((SELECT id FROM situations WHERE slug = 'farewell'), '会う', 'あう', '아우', '만나다', '동사', NULL),
  ((SELECT id FROM situations WHERE slug = 'farewell'), 'できれば', 'できれば', '데키레바', '된다면, 가능하다면', '표현', NULL),
  ((SELECT id FROM situations WHERE slug = 'farewell'), 'ぜひ', 'ぜひ', '제히', '꼭', '부사', NULL),
  ((SELECT id FROM situations WHERE slug = 'farewell'), 'お待ちしております', 'おまちしております', '오마치시테오리마스', '기다리고 있겠습니다 (존경어)', '표현', NULL),
  ((SELECT id FROM situations WHERE slug = 'farewell'), '失礼', 'しつれい', '시츠레-', '실례', '명사', NULL)
;

-- Vocabulary INSERT for greetings_v1 (15 words)
INSERT INTO vocabulary (situation_id, word_ja, reading_hiragana, reading_ko, meaning_ko, pos, jlpt_level) VALUES
  ((SELECT id FROM situations WHERE slug = 'greetings_v1'), 'おはよう', 'おはよう', '오하요-', '안녕 (아침, 반말)', '표현', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'greetings_v1'), 'おはようございます', 'おはようございます', '오하요-고자이마스', '안녕하세요 (아침, 존댓말)', '표현', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'greetings_v1'), 'こんにちは', 'こんにちは', '콘니치와', '안녕하세요 (낮)', '표현', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'greetings_v1'), 'こんばんは', 'こんばんは', '콘반와', '안녕하세요 (저녁)', '표현', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'greetings_v1'), 'さようなら', 'さようなら', '사요-나라', '안녕히 가세요/계세요', '표현', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'greetings_v1'), 'ごめんなさい', 'ごめんなさい', '고멘나사이', '미안합니다', '표현', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'greetings_v1'), 'ごちそうさま', 'ごちそうさま', '고치소-사마', '잘 먹었습니다', '표현', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'greetings_v1'), 'お元気ですか', 'おげんきですか', '오겐키데스카', '잘 지내세요?', '표현', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'greetings_v1'), '朝', 'あさ', '아사', '아침', '명사', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'greetings_v1'), '昼', 'ひる', '히루', '낮, 점심', '명사', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'greetings_v1'), '夜', 'よる', '요루', '밤, 저녁', '명사', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'greetings_v1'), '晩', 'ばん', '반', '저녁, 밤', '명사', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'greetings_v1'), '今', 'いま', '이마', '지금', '명사', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'greetings_v1'), '明日', 'あした', '아시타', '내일', '명사', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'greetings_v1'), '元気', 'げんき', '겐키', '건강, 기운', '형용사(な)', 'N5')
;

-- Vocabulary INSERT for home_tour (15 words)
INSERT INTO vocabulary (situation_id, word_ja, reading_hiragana, reading_ko, meaning_ko, pos, jlpt_level) VALUES
  ((SELECT id FROM situations WHERE slug = 'home_tour'), '家', 'いえ', '이에', '집', '명사', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'home_tour'), '玄関', 'げんかん', '겐칸', '현관', '명사', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'home_tour'), '新しい', 'あたらしい', '아타라시-', '새롭다', '형용사', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'home_tour'), 'アパート', 'アパート', '아파-토', '아파트', '명사', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'home_tour'), '台所', 'だいどころ', '다이도코로', '부엌', '명사', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'home_tour'), '冷蔵庫', 'れいぞうこ', '레-조-코', '냉장고', '명사', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'home_tour'), 'エアコン', 'エアコン', '에아콘', '에어컨', '명사', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'home_tour'), '洗濯機', 'せんたくき', '센타쿠키', '세탁기', '명사', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'home_tour'), 'お風呂', 'おふろ', '오후로', '욕실, 목욕', '명사', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'home_tour'), 'トイレ', 'トイレ', '토이레', '화장실', '명사', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'home_tour'), '庭', 'にわ', '니와', '정원, 마당', '명사', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'home_tour'), '喫茶店', 'きっさてん', '킷사텐', '카페, 찻집', '명사', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'home_tour'), 'ホテル', 'ホテル', '호테루', '호텔', '명사', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'home_tour'), 'プール', 'プール', '푸-루', '수영장', '명사', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'home_tour'), '古い', 'ふるい', '후루이', '오래되다, 낡다', '형용사', 'N5')
;

-- Vocabulary INSERT for hospital (17 words)
INSERT INTO vocabulary (situation_id, word_ja, reading_hiragana, reading_ko, meaning_ko, pos, jlpt_level) VALUES
  ((SELECT id FROM situations WHERE slug = 'hospital'), '今日', 'きょう', '쿄-', '오늘', '명사', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'hospital'), 'どう', 'どう', '도-', '어떻게', '부사', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'hospital'), 'する', 'する', '스루', '하다', '동사', NULL),
  ((SELECT id FROM situations WHERE slug = 'hospital'), '昨日', 'きのう', '키노-', '어제', '명사', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'hospital'), '頭', 'あたま', '아타마', '머리', '명사', NULL),
  ((SELECT id FROM situations WHERE slug = 'hospital'), '痛い', 'いたい', '이타이', '아프다', '형용사', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'hospital'), '熱', 'ねつ', '네츠', '열', '명사', 'N4'),
  ((SELECT id FROM situations WHERE slug = 'hospital'), 'のど', 'のど', '노도', '목', '명사', NULL),
  ((SELECT id FROM situations WHERE slug = 'hospital'), '咳', 'せき', '세키', '기침', '명사', NULL),
  ((SELECT id FROM situations WHERE slug = 'hospital'), '出る', 'でる', '데루', '나오다', '동사', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'hospital'), '少し', 'すこし', '스코시', '조금, 약간', '부사', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'hospital'), '風邪', 'かぜ', '카제', '감기', '명사', NULL),
  ((SELECT id FROM situations WHERE slug = 'hospital'), '薬', 'くすり', '쿠스리', '약', '명사', NULL),
  ((SELECT id FROM situations WHERE slug = 'hospital'), '三日分', 'みっかぶん', '밋카분', '3일 분', '명사', NULL),
  ((SELECT id FROM situations WHERE slug = 'hospital'), '出す', 'だす', '다스', '내다, 처방하다', '동사', NULL),
  ((SELECT id FROM situations WHERE slug = 'hospital'), 'ゆっくり', 'ゆっくり', '윳쿠리', '천천히, 푹', '부사', NULL),
  ((SELECT id FROM situations WHERE slug = 'hospital'), '休む', 'やすむ', '야스무', '쉬다', '동사', NULL)
;

-- Vocabulary INSERT for hospital_v2 (10 words)
INSERT INTO vocabulary (situation_id, word_ja, reading_hiragana, reading_ko, meaning_ko, pos, jlpt_level) VALUES
  ((SELECT id FROM situations WHERE slug = 'hospital_v2'), '怪我', 'けが', '케가', '부상, 다침', '명사', 'N4'),
  ((SELECT id FROM situations WHERE slug = 'hospital_v2'), '血', 'ち', '치', '피', '명사', 'N4'),
  ((SELECT id FROM situations WHERE slug = 'hospital_v2'), '転ぶ', 'ころぶ', '코로부', '넘어지다', '동사', NULL),
  ((SELECT id FROM situations WHERE slug = 'hospital_v2'), '階段', 'かいだん', '카이단', '계단', '명사', 'N4'),
  ((SELECT id FROM situations WHERE slug = 'hospital_v2'), '注射', 'ちゅうしゃ', '츄-샤', '주사', '명사', 'N4'),
  ((SELECT id FROM situations WHERE slug = 'hospital_v2'), '必要', 'ひつよう', '히츠요-', '필요', '형용사(な)', 'N4'),
  ((SELECT id FROM situations WHERE slug = 'hospital_v2'), '入院', 'にゅういん', '뉴-인', '입원', '명사', 'N4'),
  ((SELECT id FROM situations WHERE slug = 'hospital_v2'), '来る', 'くる', '쿠루', '오다', '동사', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'hospital_v2'), 'お大事に', 'おだいじに', '오다이지니', '몸 조심하세요', '표현', NULL),
  ((SELECT id FROM situations WHERE slug = 'hospital_v2'), '消毒', 'しょうどく', '쇼-도쿠', '소독', '명사', NULL)
;

-- Vocabulary INSERT for hotel_checkin (18 words)
INSERT INTO vocabulary (situation_id, word_ja, reading_hiragana, reading_ko, meaning_ko, pos, jlpt_level) VALUES
  ((SELECT id FROM situations WHERE slug = 'hotel_checkin'), 'いらっしゃいませ', 'いらっしゃいませ', '이랏샤이마세', '어서 오세요', '표현', NULL),
  ((SELECT id FROM situations WHERE slug = 'hotel_checkin'), 'ご予約', 'ごよやく', '고요야쿠', '예약', '명사', NULL),
  ((SELECT id FROM situations WHERE slug = 'hotel_checkin'), '名前', 'なまえ', '나마에', '이름', '명사', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'hotel_checkin'), 'お願いします', 'おねがいします', '오네가이시마스', '부탁드립니다', '표현', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'hotel_checkin'), '山田', 'やまだ', '야마다', '야마다 (성씨)', '명사', NULL),
  ((SELECT id FROM situations WHERE slug = 'hotel_checkin'), '今日', 'きょう', '쿄-', '오늘', '명사', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'hotel_checkin'), '二泊', 'にはく', '니하쿠', '2박', '명사', NULL),
  ((SELECT id FROM situations WHERE slug = 'hotel_checkin'), '確認', 'かくにん', '카쿠닌', '확인', '명사', 'N4'),
  ((SELECT id FROM situations WHERE slug = 'hotel_checkin'), 'できました', 'できました', '데키마시타', '되었습니다, 가능합니다', '표현', NULL),
  ((SELECT id FROM situations WHERE slug = 'hotel_checkin'), 'サイン', 'サイン', '사인', '사인', '명사', NULL),
  ((SELECT id FROM situations WHERE slug = 'hotel_checkin'), 'チェックアウト', 'チェックアウト', '첵쿠아우토', '체크아웃', '명사', NULL),
  ((SELECT id FROM situations WHERE slug = 'hotel_checkin'), '何時', 'なんじ', '난지', '몇 시', '명사', NULL),
  ((SELECT id FROM situations WHERE slug = 'hotel_checkin'), '時', 'じ', '지', '시', '명사', NULL),
  ((SELECT id FROM situations WHERE slug = 'hotel_checkin'), '十時', 'じゅうじ', '쥬-지', '10시', '명사', NULL),
  ((SELECT id FROM situations WHERE slug = 'hotel_checkin'), 'ございます', 'ございます', '고자이마스', '있습니다 (정중)', '동사', NULL),
  ((SELECT id FROM situations WHERE slug = 'hotel_checkin'), '部屋', 'へや', '헤야', '방', '명사', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'hotel_checkin'), '階', 'かい', '카이', '층', '명사', NULL),
  ((SELECT id FROM situations WHERE slug = 'hotel_checkin'), '号室', 'ごうしつ', '고-시츠', '호실', '명사', NULL)
;

-- Vocabulary INSERT for library_v1 (14 words)
INSERT INTO vocabulary (situation_id, word_ja, reading_hiragana, reading_ko, meaning_ko, pos, jlpt_level) VALUES
  ((SELECT id FROM situations WHERE slug = 'library_v1'), '辞書', 'じしょ', '지쇼', '사전', '명사', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'library_v1'), '借りる', 'かりる', '카리루', '빌리다', '동사', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'library_v1'), '雑誌', 'ざっし', '잣시', '잡지', '명사', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'library_v1'), '貸す', 'かす', '카스', '빌려주다', '동사', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'library_v1'), '忘れる', 'わすれる', '와스레루', '잊다', '동사', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'library_v1'), '返す', 'かえす', '카에스', '돌려주다', '동사', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'library_v1'), '易しい', 'やさしい', '야사시-', '쉽다', '형용사', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'library_v1'), '短い', 'みじかい', '미지카이', '짧다', '형용사', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'library_v1'), '覚える', 'おぼえる', '오보에루', '외우다, 기억하다', '동사', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'library_v1'), 'かばん', 'かばん', '카반', '가방', '명사', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'library_v1'), '長い', 'ながい', '나가이', '길다', '형용사', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'library_v1'), '重い', 'おもい', '오모이', '무겁다', '형용사', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'library_v1'), 'カメラ', 'カメラ', '카메라', '카메라', '명사', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'library_v1'), '知る', 'しる', '시루', '알다', '동사', 'N5')
;

-- Vocabulary INSERT for meeting_response (14 words)
INSERT INTO vocabulary (situation_id, word_ja, reading_hiragana, reading_ko, meaning_ko, pos, jlpt_level) VALUES
  ((SELECT id FROM situations WHERE slug = 'meeting_response'), '件', 'けん', '켄', '건, 안건', '명사', NULL),
  ((SELECT id FROM situations WHERE slug = 'meeting_response'), 'いかが', 'いかが', '이카가', '어떻습니까, 어떠신지', '부사', NULL),
  ((SELECT id FROM situations WHERE slug = 'meeting_response'), '考える', 'かんがえる', '캉가에루', '생각하다', '동사', NULL),
  ((SELECT id FROM situations WHERE slug = 'meeting_response'), 'ご提案', 'ごていあん', '고테이안', '제안', '명사', NULL),
  ((SELECT id FROM situations WHERE slug = 'meeting_response'), '内容', 'ないよう', '나이요-', '내용', '명사', NULL),
  ((SELECT id FROM situations WHERE slug = 'meeting_response'), '承知', 'しょうち', '쇼-치', '알겠습니다, 승낙', '명사, 동사(する)', NULL),
  ((SELECT id FROM situations WHERE slug = 'meeting_response'), '検討', 'けんとう', '켄토-', '검토', '명사, 동사(する)', NULL),
  ((SELECT id FROM situations WHERE slug = 'meeting_response'), '社内', 'しゃない', '샤나이', '사내', '명사', NULL),
  ((SELECT id FROM situations WHERE slug = 'meeting_response'), '確認', 'かくにん', '카쿠닌', '확인', '명사, 동사(する)', 'N4'),
  ((SELECT id FROM situations WHERE slug = 'meeting_response'), '改めて', 'あらためて', '아라타메테', '다시, 재차', '부사', NULL),
  ((SELECT id FROM situations WHERE slug = 'meeting_response'), '連絡', 'れんらく', '렌라쿠', '연락', '명사, 동사(する)', 'N4'),
  ((SELECT id FROM situations WHERE slug = 'meeting_response'), '忙しい', 'いそがしい', '이소가시이', '바쁘다', '형용사', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'meeting_response'), '恐れ入ります', 'おそれいります', '오소레이리마스', '죄송합니다, 수고스럽습니다', '표현', NULL),
  ((SELECT id FROM situations WHERE slug = 'meeting_response'), 'よろしくお願いいたします', 'よろしくおねがいいたします', '요로시쿠오네가이이타시마스', '잘 부탁드립니다', '표현', NULL)
;

-- Vocabulary INSERT for meeting_response_v2 (10 words)
INSERT INTO vocabulary (situation_id, word_ja, reading_hiragana, reading_ko, meaning_ko, pos, jlpt_level) VALUES
  ((SELECT id FROM situations WHERE slug = 'meeting_response_v2'), '拝見する', 'はいけんする', '하이켄스루', '보다 (겸양어)', '동사', 'N4'),
  ((SELECT id FROM situations WHERE slug = 'meeting_response_v2'), '伺う', 'うかがう', '우카가우', '묻다, 찾아뵙다 (겸양어)', '동사', 'N4'),
  ((SELECT id FROM situations WHERE slug = 'meeting_response_v2'), 'おっしゃる', 'おっしゃる', '옷샤루', '말씀하시다 (존경어)', '동사', 'N4'),
  ((SELECT id FROM situations WHERE slug = 'meeting_response_v2'), '部長', 'ぶちょう', '부쵸-', '부장', '명사', 'N4'),
  ((SELECT id FROM situations WHERE slug = 'meeting_response_v2'), '説明', 'せつめい', '세츠메-', '설명', '명사', 'N4'),
  ((SELECT id FROM situations WHERE slug = 'meeting_response_v2'), 'ご覧になる', 'ごらんになる', '고란니나루', '보시다 (존경어)', '동사', 'N4'),
  ((SELECT id FROM situations WHERE slug = 'meeting_response_v2'), '会議', 'かいぎ', '카이기', '회의', '명사', 'N4'),
  ((SELECT id FROM situations WHERE slug = 'meeting_response_v2'), '準備', 'じゅんび', '쥰비', '준비', '명사', 'N4'),
  ((SELECT id FROM situations WHERE slug = 'meeting_response_v2'), '参る', 'まいる', '마이루', '가다 (겸양어)', '동사', 'N4'),
  ((SELECT id FROM situations WHERE slug = 'meeting_response_v2'), '質問', 'しつもん', '시츠몬', '질문', '명사', NULL)
;

-- Vocabulary INSERT for morning_routine (15 words)
INSERT INTO vocabulary (situation_id, word_ja, reading_hiragana, reading_ko, meaning_ko, pos, jlpt_level) VALUES
  ((SELECT id FROM situations WHERE slug = 'morning_routine'), '朝ご飯', 'あさごはん', '아사고항', '아침밥', '명사', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'morning_routine'), '新聞', 'しんぶん', '신분', '신문', '명사', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'morning_routine'), '読む', 'よむ', '요무', '읽다', '동사', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'morning_routine'), '起きる', 'おきる', '오키루', '일어나다', '동사', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'morning_routine'), '洗う', 'あらう', '아라우', '씻다', '동사', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'morning_routine'), '飲む', 'のむ', '노무', '마시다', '동사', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'morning_routine'), '牛乳', 'ぎゅうにゅう', '규-뉴-', '우유', '명사', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'morning_routine'), '昼ご飯', 'ひるごはん', '히루고항', '점심밥', '명사', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'morning_routine'), '書く', 'かく', '카쿠', '쓰다', '동사', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'morning_routine'), '時計', 'とけい', '토케-', '시계', '명사', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'morning_routine'), '見る', 'みる', '미루', '보다', '동사', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'morning_routine'), '眼鏡', 'めがね', '메가네', '안경', '명사', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'morning_routine'), '晩ご飯', 'ばんごはん', '반고항', '저녁밥', '명사', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'morning_routine'), '話す', 'はなす', '하나스', '말하다', '동사', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'morning_routine'), '寝る', 'ねる', '네루', '자다', '동사', 'N5')
;

-- Vocabulary INSERT for nature_hike (13 words)
INSERT INTO vocabulary (situation_id, word_ja, reading_hiragana, reading_ko, meaning_ko, pos, jlpt_level) VALUES
  ((SELECT id FROM situations WHERE slug = 'nature_hike'), '晴れ', 'はれ', '하레', '맑음', '명사', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'nature_hike'), '空', 'そら', '소라', '하늘', '명사', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'nature_hike'), '山', 'やま', '야마', '산', '명사', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'nature_hike'), '川', 'かわ', '카와', '강', '명사', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'nature_hike'), '木', 'き', '키', '나무', '명사', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'nature_hike'), '海', 'うみ', '우미', '바다', '명사', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'nature_hike'), '曇り', 'くもり', '쿠모리', '흐림', '명사', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'nature_hike'), '雪', 'ゆき', '유키', '눈', '명사', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'nature_hike'), '本当', 'ほんとう', '혼토-', '정말, 본당', '명사', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'nature_hike'), '多分', 'たぶん', '타분', '아마', '부사', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'nature_hike'), 'いつも', 'いつも', '이츠모', '항상', '부사', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'nature_hike'), '時々', 'ときどき', '토키도키', '가끔', '부사', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'nature_hike'), 'よく', 'よく', '요쿠', '잘, 자주', '부사', 'N5')
;

-- Vocabulary INSERT for neighbor_greeting (13 words)
INSERT INTO vocabulary (situation_id, word_ja, reading_hiragana, reading_ko, meaning_ko, pos, jlpt_level) VALUES
  ((SELECT id FROM situations WHERE slug = 'neighbor_greeting'), 'お隣', 'おとなり', '오토나리', '이웃', '명사', NULL),
  ((SELECT id FROM situations WHERE slug = 'neighbor_greeting'), '引っ越す', 'ひっこす', '힛코스', '이사하다', '동사', 'N4'),
  ((SELECT id FROM situations WHERE slug = 'neighbor_greeting'), '方', 'かた', '카타', '분 (사람을 높여 부르는 말)', '명사', NULL),
  ((SELECT id FROM situations WHERE slug = 'neighbor_greeting'), '先週', 'せんしゅう', '센슈-', '지난주', '명사', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'neighbor_greeting'), '申す', 'もうす', '모-스', '말씀드리다 (言います의 겸양어)', '동사', NULL),
  ((SELECT id FROM situations WHERE slug = 'neighbor_greeting'), 'よろしく', 'よろしく', '요로시쿠', '잘', '부사', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'neighbor_greeting'), '声', 'こえ', '코에', '소리, 목소리', '명사', NULL),
  ((SELECT id FROM situations WHERE slug = 'neighbor_greeting'), 'かける', 'かける', '카케루', '(말을) 걸다', '동사', NULL),
  ((SELECT id FROM situations WHERE slug = 'neighbor_greeting'), 'いつでも', 'いつでも', '이쯔데모', '언제든지', '부사', NULL),
  ((SELECT id FROM situations WHERE slug = 'neighbor_greeting'), 'つまらない', 'つまらない', '쯔마라나이', '보잘것없는, 시시한', '형용사', NULL),
  ((SELECT id FROM situations WHERE slug = 'neighbor_greeting'), 'ゴミ出し', 'ごみだし', '고미다시', '쓰레기 배출', '명사', NULL),
  ((SELECT id FROM situations WHERE slug = 'neighbor_greeting'), '分からなければ', 'わからなければ', '와카라나케레바', '모르면', '표현', NULL),
  ((SELECT id FROM situations WHERE slug = 'neighbor_greeting'), '聞く', 'きく', '키쿠', '듣다, 묻다', '동사', 'N5')
;

-- Vocabulary INSERT for office_guide (14 words)
INSERT INTO vocabulary (situation_id, word_ja, reading_hiragana, reading_ko, meaning_ko, pos, jlpt_level) VALUES
  ((SELECT id FROM situations WHERE slug = 'office_guide'), 'お待たせいたしました', 'おまたせいたしました', '오마타세 이타시마시타', '기다리게 했습니다', '표현', NULL),
  ((SELECT id FROM situations WHERE slug = 'office_guide'), '会議室', 'かいぎしつ', '카이기시츠', '회의실', '명사', NULL),
  ((SELECT id FROM situations WHERE slug = 'office_guide'), 'ご案内', 'ごあんない', '고안나이', '안내', '명사', NULL),
  ((SELECT id FROM situations WHERE slug = 'office_guide'), 'ご案内いたします', 'ごあんないいたします', '고안나이 이타시마스', '안내하겠습니다', '표현', NULL),
  ((SELECT id FROM situations WHERE slug = 'office_guide'), 'お手数', 'おてすう', '오테스-', '수고, 번거로움', '명사', NULL),
  ((SELECT id FROM situations WHERE slug = 'office_guide'), 'おかけします', 'おかけします', '오카케시마스', '폐를 끼치다', '표현', NULL),
  ((SELECT id FROM situations WHERE slug = 'office_guide'), '足元', 'あしもと', '아시모토', '발밑', '명사', NULL),
  ((SELECT id FROM situations WHERE slug = 'office_guide'), '気をつける', 'きをつける', '키오 츠케루', '조심하다, 주의하다', '동사', NULL),
  ((SELECT id FROM situations WHERE slug = 'office_guide'), '立派', 'りっぱ', '릿파', '훌륭함', '형용사', NULL),
  ((SELECT id FROM situations WHERE slug = 'office_guide'), 'オフィス', 'オフィス', '오피스', '사무실', '명사', NULL),
  ((SELECT id FROM situations WHERE slug = 'office_guide'), '恐れ入ります', 'おそれいります', '오소레이리마스', '죄송합니다 / 감사합니다 (겸양)', '표현', NULL),
  ((SELECT id FROM situations WHERE slug = 'office_guide'), 'お待ちください', 'おまちください', '오마치 쿠다사이', '기다려 주세요', '표현', NULL),
  ((SELECT id FROM situations WHERE slug = 'office_guide'), 'どうぞ', 'どうぞ', '도-조', '어서, 자', '부사', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'office_guide'), 'こちら', 'こちら', '코치라', '이쪽', '명사', NULL)
;

-- Vocabulary INSERT for part_time_interview (20 words)
INSERT INTO vocabulary (situation_id, word_ja, reading_hiragana, reading_ko, meaning_ko, pos, jlpt_level) VALUES
  ((SELECT id FROM situations WHERE slug = 'part_time_interview'), '本日', 'ほんじつ', '혼지츠', '오늘', '명사', NULL),
  ((SELECT id FROM situations WHERE slug = 'part_time_interview'), '面接', 'めんせつ', '멘세츠', '면접', '명사', NULL),
  ((SELECT id FROM situations WHERE slug = 'part_time_interview'), 'お越し', 'おこし', '오코시', '오심 (謙譲語)', '명사', NULL),
  ((SELECT id FROM situations WHERE slug = 'part_time_interview'), '自己紹介', 'じこしょうかい', '지코쇼-카이', '자기소개', '명사', NULL),
  ((SELECT id FROM situations WHERE slug = 'part_time_interview'), 'お願い', 'おねがい', '오네가이', '부탁', '명사', NULL),
  ((SELECT id FROM situations WHERE slug = 'part_time_interview'), '申す', 'もうす', '모-스', '말하다 (謙譲語)', '동사', NULL),
  ((SELECT id FROM situations WHERE slug = 'part_time_interview'), '韓国', 'かんこく', '칸코쿠', '한국', '명사', NULL),
  ((SELECT id FROM situations WHERE slug = 'part_time_interview'), '通う', 'かよう', '카요-', '다니다', '동사', 'N4'),
  ((SELECT id FROM situations WHERE slug = 'part_time_interview'), '週', 'しゅう', '슈-', '주', '명사', NULL),
  ((SELECT id FROM situations WHERE slug = 'part_time_interview'), '何日', 'なんにち', '난니치', '며칠', '명사', NULL),
  ((SELECT id FROM situations WHERE slug = 'part_time_interview'), '入れる', 'いれる', '이레루', '넣다, (시간을) 내다', '동사', NULL),
  ((SELECT id FROM situations WHERE slug = 'part_time_interview'), '土日', 'どにち', '도니치', '주말', '명사', NULL),
  ((SELECT id FROM situations WHERE slug = 'part_time_interview'), '大丈夫', 'だいじょうぶ', '다이죠-부', '괜찮음', '형용사', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'part_time_interview'), '難しい', 'むずかしい', '무즈카시이', '어렵다', '형용사', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'part_time_interview'), '分かりました', 'わかりました', '와카리마시타', '알겠습니다', '표현', NULL),
  ((SELECT id FROM situations WHERE slug = 'part_time_interview'), '来週', 'らいしゅう', '라이슈-', '다음 주', '명사', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'part_time_interview'), '来られる', 'こられる', '코라레루', '오다 (가능형)', '동사', NULL),
  ((SELECT id FROM situations WHERE slug = 'part_time_interview'), '時給', 'じきゅう', '지큐-', '시급', '명사', NULL),
  ((SELECT id FROM situations WHERE slug = 'part_time_interview'), '九百五十円', 'きゅうひゃくごじゅうえん', '큐-햐쿠 고쥬-엔', '950엔', '명사', NULL),
  ((SELECT id FROM situations WHERE slug = 'part_time_interview'), '三日', 'みっか', '밋카', '3일', '명사', NULL)
;

-- Vocabulary INSERT for phone_contract (18 words)
INSERT INTO vocabulary (situation_id, word_ja, reading_hiragana, reading_ko, meaning_ko, pos, jlpt_level) VALUES
  ((SELECT id FROM situations WHERE slug = 'phone_contract'), 'いらっしゃいませ', 'いらっしゃいませ', '이랏샤이마세', '어서 오세요', '표현', NULL),
  ((SELECT id FROM situations WHERE slug = 'phone_contract'), '新規契約', 'しんきけいやく', '싱키케이야쿠', '신규 계약', '명사', NULL),
  ((SELECT id FROM situations WHERE slug = 'phone_contract'), '機種変更', 'きしゅへんこう', '키슈헨코-', '기종 변경', '명사', NULL),
  ((SELECT id FROM situations WHERE slug = 'phone_contract'), '外国人', 'がいこくじん', '가이코쿠진', '외국인', '명사', NULL),
  ((SELECT id FROM situations WHERE slug = 'phone_contract'), '契約', 'けいやく', '케이야쿠', '계약', '명사', NULL),
  ((SELECT id FROM situations WHERE slug = 'phone_contract'), 'できる', 'できる', '데키루', '할 수 있다', '동사', NULL),
  ((SELECT id FROM situations WHERE slug = 'phone_contract'), '在留カード', 'ざいりゅうカード', '자이류-카-도', '재류 카드', '명사', NULL),
  ((SELECT id FROM situations WHERE slug = 'phone_contract'), '大丈夫', 'だいじょうぶ', '다이죠-부', '괜찮다, 문제없다', '형용사', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'phone_contract'), 'プラン', 'プラン', '푸란', '요금제, 플랜', '명사', NULL),
  ((SELECT id FROM situations WHERE slug = 'phone_contract'), 'どうされますか', 'どうされますか', '도-사레마스카', '어떻게 하시겠습니까?', '표현', NULL),
  ((SELECT id FROM situations WHERE slug = 'phone_contract'), '一番', 'いちばん', '이치방', '가장, 제일', '부사', NULL),
  ((SELECT id FROM situations WHERE slug = 'phone_contract'), '安い', 'やすい', '야스이', '싸다', '형용사', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'phone_contract'), '月々', 'つきづき', '츠키즈키', '매달', '명사', NULL),
  ((SELECT id FROM situations WHERE slug = 'phone_contract'), 'いくら', 'いくら', '이쿠라', '얼마', '명사', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'phone_contract'), '二千円', 'にせんえん', '니센엔', '2000엔', '명사', NULL),
  ((SELECT id FROM situations WHERE slug = 'phone_contract'), 'データ', 'データ', '데-타', '데이터', '명사', NULL),
  ((SELECT id FROM situations WHERE slug = 'phone_contract'), '使える', 'つかえる', '츠카에루', '사용할 수 있다', '동사', NULL),
  ((SELECT id FROM situations WHERE slug = 'phone_contract'), 'ギガ', 'ギガ', '기가', '기가바이트', '명사', NULL)
;

-- Vocabulary INSERT for post_office (18 words)
INSERT INTO vocabulary (situation_id, word_ja, reading_hiragana, reading_ko, meaning_ko, pos, jlpt_level) VALUES
  ((SELECT id FROM situations WHERE slug = 'post_office'), 'いらっしゃいませ', 'いらっしゃいませ', '이랏샤이마세', '어서 오세요', '표현', NULL),
  ((SELECT id FROM situations WHERE slug = 'post_office'), 'どのような', 'どのような', '도노요-나', '어떤', '표현', NULL),
  ((SELECT id FROM situations WHERE slug = 'post_office'), 'ご用件', 'ごようけん', '고요-켄', '용건', '명사', NULL),
  ((SELECT id FROM situations WHERE slug = 'post_office'), '韓国', 'かんこく', '칸코쿠', '한국', '명사', NULL),
  ((SELECT id FROM situations WHERE slug = 'post_office'), '荷物', 'にもつ', '니모츠', '짐', '명사', NULL),
  ((SELECT id FROM situations WHERE slug = 'post_office'), '送る', 'おくる', '오쿠루', '보내다', '동사', NULL),
  ((SELECT id FROM situations WHERE slug = 'post_office'), '中身', 'なかみ', '나카미', '내용물', '명사', NULL),
  ((SELECT id FROM situations WHERE slug = 'post_office'), '何', 'なに', '나니', '무엇', '명사', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'post_office'), '航空便', 'こうくうびん', '코-쿠-빈', '항공편', '명사', NULL),
  ((SELECT id FROM situations WHERE slug = 'post_office'), '船便', 'ふなびん', '후나빈', '배편', '명사', NULL),
  ((SELECT id FROM situations WHERE slug = 'post_office'), 'お菓子', 'おかし', '오카시', '과자', '명사', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'post_office'), '本', 'ほん', '혼', '책', '명사', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'post_office'), 'おねがいします', 'おねがいします', '오네가이시마스', '부탁드립니다', '표현', NULL),
  ((SELECT id FROM situations WHERE slug = 'post_office'), '三千五百円', 'さんぜんごひゃくえん', '산젠고햐쿠엔', '3500엔', '명사', NULL),
  ((SELECT id FROM situations WHERE slug = 'post_office'), '円', 'えん', '엔', '엔 (화폐 단위)', '명사', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'post_office'), '一週間', 'いっしゅうかん', '잇슈-칸', '일주일', '명사', NULL),
  ((SELECT id FROM situations WHERE slug = 'post_office'), '届く', 'とどく', '토도쿠', '도착하다', '동사', 'N4'),
  ((SELECT id FROM situations WHERE slug = 'post_office'), 'ほど', 'ほど', '호도', '정도', '명사', NULL)
;

-- Vocabulary INSERT for question_practice (15 words)
INSERT INTO vocabulary (situation_id, word_ja, reading_hiragana, reading_ko, meaning_ko, pos, jlpt_level) VALUES
  ((SELECT id FROM situations WHERE slug = 'question_practice'), '誰', 'だれ', '다레', '누구', '명사', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'question_practice'), 'いつ', 'いつ', '이츠', '언제', '부사', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'question_practice'), 'どの', 'どの', '도노', '어느 (관형사)', '연체사', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'question_practice'), 'どれ', 'どれ', '도레', '어느 것', '명사', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'question_practice'), 'ちょっと', 'ちょっと', '쵸또', '잠깐, 좀', '부사', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'question_practice'), 'いくつ', 'いくつ', '이쿠츠', '몇 개, 몇 살', '명사', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'question_practice'), 'なぜ', 'なぜ', '나제', '왜', '부사', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'question_practice'), 'たくさん', 'たくさん', '타쿠산', '많이', '부사', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'question_practice'), 'どうして', 'どうして', '도-시테', '왜', '부사', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'question_practice'), '全部', 'ぜんぶ', '젠부', '전부', '명사', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'question_practice'), 'だから', 'だから', '다카라', '그래서', '접속사', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'question_practice'), 'そして', 'そして', '소시테', '그리고', '접속사', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'question_practice'), 'それから', 'それから', '소레카라', '그리고 나서', '접속사', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'question_practice'), 'まだ', 'まだ', '마다', '아직', '부사', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'question_practice'), 'もう', 'もう', '모-', '이제, 벌써', '부사', 'N5')
;

-- Vocabulary INSERT for real_estate (20 words)
INSERT INTO vocabulary (situation_id, word_ja, reading_hiragana, reading_ko, meaning_ko, pos, jlpt_level) VALUES
  ((SELECT id FROM situations WHERE slug = 'real_estate'), 'いらっしゃいませ', 'いらっしゃいませ', '이랏샤이마세', '어서 오세요', '표현', NULL),
  ((SELECT id FROM situations WHERE slug = 'real_estate'), '部屋(へや)', 'へや', '헤야', '방', '명사', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'real_estate'), '探す(さがす)', 'さがす', '사가스', '찾다', '동사', NULL),
  ((SELECT id FROM situations WHERE slug = 'real_estate'), '駅(えき)', 'えき', '에키', '역', '명사', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'real_estate'), '近い(ちかい)', 'ちかい', '치카이', '가깝다', '형용사', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'real_estate'), '家賃(やちん)', 'やちん', '야칭', '집세', '명사', 'N4'),
  ((SELECT id FROM situations WHERE slug = 'real_estate'), '五万円(ごまんえん)', 'ごまんえん', '고망엔', '5만 엔', '명사', NULL),
  ((SELECT id FROM situations WHERE slug = 'real_estate'), '以下(いか)', 'いか', '이카', '이하', '명사', NULL),
  ((SELECT id FROM situations WHERE slug = 'real_estate'), 'ワンルーム', 'ワンルーム', '완루-무', '원룸', '명사', NULL),
  ((SELECT id FROM situations WHERE slug = 'real_estate'), '物件(ぶっけん)', 'ぶっけん', '붓켄', '물건, 부동산', '명사', NULL),
  ((SELECT id FROM situations WHERE slug = 'real_estate'), 'いかが', 'いかが', '이카가', '어떠신가요?', '표현', NULL),
  ((SELECT id FROM situations WHERE slug = 'real_estate'), '初期費用(しょきひよう)', 'しょきひよう', '쇼키히요-', '초기 비용', '명사', NULL),
  ((SELECT id FROM situations WHERE slug = 'real_estate'), 'どのくらい', 'どのくらい', '도노쿠라이', '어느 정도', '표현', NULL),
  ((SELECT id FROM situations WHERE slug = 'real_estate'), 'かかる', 'かかる', '카카루', '걸리다, 들다', '동사', NULL),
  ((SELECT id FROM situations WHERE slug = 'real_estate'), '敷金(しききん)', 'しききん', '시키킨', '보증금', '명사', NULL),
  ((SELECT id FROM situations WHERE slug = 'real_estate'), '礼金(れいきん)', 'れいきん', '레이킨', '사례금', '명사', NULL),
  ((SELECT id FROM situations WHERE slug = 'real_estate'), '約(やく)', 'やく', '야쿠', '약', '부사', NULL),
  ((SELECT id FROM situations WHERE slug = 'real_estate'), '十五万円(じゅうごまんえん)', 'じゅうごまんえん', '쥬-고망엔', '15만 엔', '명사', NULL),
  ((SELECT id FROM situations WHERE slug = 'real_estate'), '内見(ないけん)', 'ないけん', '나이켄', '방을 미리 봄', '명사', NULL),
  ((SELECT id FROM situations WHERE slug = 'real_estate'), 'する', 'する', '스루', '하다', '동사', NULL)
;

-- Vocabulary INSERT for real_estate_v2 (10 words)
INSERT INTO vocabulary (situation_id, word_ja, reading_hiragana, reading_ko, meaning_ko, pos, jlpt_level) VALUES
  ((SELECT id FROM situations WHERE slug = 'real_estate_v2'), 'ガス', 'ガス', '가스', '가스', '명사', 'N4'),
  ((SELECT id FROM situations WHERE slug = 'real_estate_v2'), '水道', 'すいどう', '스이도-', '수도', '명사', 'N4'),
  ((SELECT id FROM situations WHERE slug = 'real_estate_v2'), '暖房', 'だんぼう', '단보-', '난방', '명사', 'N4'),
  ((SELECT id FROM situations WHERE slug = 'real_estate_v2'), '冷房', 'れいぼう', '레-보-', '냉방', '명사', 'N4'),
  ((SELECT id FROM situations WHERE slug = 'real_estate_v2'), '布団', 'ふとん', '후톤', '이불, 요', '명사', 'N4'),
  ((SELECT id FROM situations WHERE slug = 'real_estate_v2'), '畳', 'たたみ', '타타미', '다다미 (일본 전통 바닥)', '명사', 'N4'),
  ((SELECT id FROM situations WHERE slug = 'real_estate_v2'), 'ゴミ', 'ゴミ', '고미', '쓰레기', '명사', 'N4'),
  ((SELECT id FROM situations WHERE slug = 'real_estate_v2'), '案内', 'あんない', '안나이', '안내', '명사', 'N4'),
  ((SELECT id FROM situations WHERE slug = 'real_estate_v2'), '月曜日', 'げつようび', '게츠요-비', '월요일', '명사', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'real_estate_v2'), '木曜日', 'もくようび', '모쿠요-비', '목요일', '명사', 'N5')
;

-- Vocabulary INSERT for restaurant (13 words)
INSERT INTO vocabulary (situation_id, word_ja, reading_hiragana, reading_ko, meaning_ko, pos, jlpt_level) VALUES
  ((SELECT id FROM situations WHERE slug = 'restaurant'), 'いらっしゃいませ', 'いらっしゃいませ', '이랏샤이마세', '어서 오세요', '표현', NULL),
  ((SELECT id FROM situations WHERE slug = 'restaurant'), '何名様', 'なんめいさま', '난메-사마', '몇 분이십니까', '명사', NULL),
  ((SELECT id FROM situations WHERE slug = 'restaurant'), '一人', 'ひとり', '히토리', '한 명', '명사', NULL),
  ((SELECT id FROM situations WHERE slug = 'restaurant'), 'メニュー', 'メニュー', '메뉴-', '메뉴', '명사', NULL),
  ((SELECT id FROM situations WHERE slug = 'restaurant'), 'お願い(する)', 'おねがい(する)', '오네가이(스루)', '부탁(하다)', '동사', NULL),
  ((SELECT id FROM situations WHERE slug = 'restaurant'), 'ご注文', 'ごちゅうもん', '고츄-몬', '주문', '명사', NULL),
  ((SELECT id FROM situations WHERE slug = 'restaurant'), '決まる', 'きまる', '키마루', '정해지다, 결정되다', '동사', 'N4'),
  ((SELECT id FROM situations WHERE slug = 'restaurant'), 'お呼び(する)', 'および(する)', '오요비(스루)', '부르다', '동사', NULL),
  ((SELECT id FROM situations WHERE slug = 'restaurant'), 'すみません', 'すみません', '스미마센', '죄송합니다, 실례합니다', '표현', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'restaurant'), 'これ', 'これ', '코레', '이것', '명사', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'restaurant'), 'かしこまりました', 'かしこまりました', '카시코마리마시타', '알겠습니다, 분부대로 하겠습니다', '표현', NULL),
  ((SELECT id FROM situations WHERE slug = 'restaurant'), '少々', 'しょうしょう', '쇼-쇼-', '잠시, 잠깐', '부사', NULL),
  ((SELECT id FROM situations WHERE slug = 'restaurant'), '待つ', 'まつ', '마츠', '기다리다', '동사', 'N5')
;

-- Vocabulary INSERT for restaurant_v2 (10 words)
INSERT INTO vocabulary (situation_id, word_ja, reading_hiragana, reading_ko, meaning_ko, pos, jlpt_level) VALUES
  ((SELECT id FROM situations WHERE slug = 'restaurant_v2'), '子供', 'こども', '코도모', '아이, 어린이', '명사', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'restaurant_v2'), '人', 'にん', '닌', '명 (사람 세는 단위)', '명사', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'restaurant_v2'), '椅子', 'いす', '이스', '의자', '명사', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'restaurant_v2'), 'お父さん', 'おとうさん', '오토-상', '아버지, 아빠', '명사', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'restaurant_v2'), '食べる', 'たべる', '타베루', '먹다', '동사', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'restaurant_v2'), 'ご飯', 'ごはん', '고항', '밥, 식사', '명사', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'restaurant_v2'), '魚', 'さかな', '사카나', '생선', '명사', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'restaurant_v2'), '友達', 'ともだち', '토모다치', '친구', '명사', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'restaurant_v2'), 'メニュー', 'メニュー', '메뉴-', '메뉴', '명사', NULL),
  ((SELECT id FROM situations WHERE slug = 'restaurant_v2'), '用意', 'ようい', '요-이', '준비', '명사', NULL)
;

-- Vocabulary INSERT for room_actions (14 words)
INSERT INTO vocabulary (situation_id, word_ja, reading_hiragana, reading_ko, meaning_ko, pos, jlpt_level) VALUES
  ((SELECT id FROM situations WHERE slug = 'room_actions'), '入る', 'はいる', '하이루', '들어가다', '동사', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'room_actions'), 'ドア', 'ドア', '도아', '문', '명사', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'room_actions'), '開ける', 'あける', '아케루', '열다', '동사', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'room_actions'), '座る', 'すわる', '스와루', '앉다', '동사', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'room_actions'), 'テレビ', 'テレビ', '테레비', '텔레비전', '명사', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'room_actions'), '付ける', 'つける', '츠케루', '켜다, 붙이다', '동사', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'room_actions'), '机', 'つくえ', '츠쿠에', '책상', '명사', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'room_actions'), '窓', 'まど', '마도', '창문', '명사', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'room_actions'), 'ベッド', 'ベッド', '벳도', '침대', '명사', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'room_actions'), '立つ', 'たつ', '타츠', '서다', '동사', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'room_actions'), 'テーブル', 'テーブル', '테-부루', '테이블', '명사', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'room_actions'), '出かける', 'でかける', '데카케루', '외출하다', '동사', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'room_actions'), '消す', 'けす', '케스', '끄다', '동사', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'room_actions'), '閉める', 'しめる', '시메루', '닫다', '동사', 'N5')
;

-- Vocabulary INSERT for school_v1 (16 words)
INSERT INTO vocabulary (situation_id, word_ja, reading_hiragana, reading_ko, meaning_ko, pos, jlpt_level) VALUES
  ((SELECT id FROM situations WHERE slug = 'school_v1'), '学校', 'がっこう', '각코-', '학교', '명사', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'school_v1'), '先生', 'せんせい', '센세-', '선생님', '명사', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'school_v1'), '学生', 'がくせい', '가쿠세-', '학생', '명사', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'school_v1'), '火曜日', 'かようび', '카요-비', '화요일', '명사', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'school_v1'), '水曜日', 'すいようび', '스이요-비', '수요일', '명사', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'school_v1'), '勉強する', 'べんきょうする', '벤쿄-스루', '공부하다', '동사', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'school_v1'), '金曜日', 'きんようび', '킨요-비', '금요일', '명사', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'school_v1'), '教える', 'おしえる', '오시에루', '가르치다', '동사', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'school_v1'), 'ノート', 'ノート', '노-토', '노트', '명사', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'school_v1'), '鉛筆', 'えんぴつ', '엔피츠', '연필', '명사', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'school_v1'), '土曜日', 'どようび', '도요-비', '토요일', '명사', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'school_v1'), '日曜日', 'にちようび', '니치요-비', '일요일', '명사', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'school_v1'), 'ペン', 'ペン', '펜', '펜', '명사', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'school_v1'), '質問する', 'しつもんする', '시츠몬스루', '질문하다', '동사', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'school_v1'), '習う', 'ならう', '나라우', '배우다', '동사', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'school_v1'), '練習する', 'れんしゅうする', '렌슈-스루', '연습하다', '동사', 'N5')
;

-- Vocabulary INSERT for shopping_market (12 words)
INSERT INTO vocabulary (situation_id, word_ja, reading_hiragana, reading_ko, meaning_ko, pos, jlpt_level) VALUES
  ((SELECT id FROM situations WHERE slug = 'shopping_market'), '店', 'みせ', '미세', '가게', '명사', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'shopping_market'), '買い物', 'かいもの', '카이모노', '쇼핑, 장보기', '명사', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'shopping_market'), '果物', 'くだもの', '쿠다모노', '과일', '명사', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'shopping_market'), '大きい', 'おおきい', '오-키-', '크다', '형용사', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'shopping_market'), '高い', 'たかい', '타카이', '비싸다, 높다', '형용사', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'shopping_market'), 'お金', 'おかね', '오카네', '돈', '명사', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'shopping_market'), '少ない', 'すくない', '스쿠나이', '적다', '형용사', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'shopping_market'), 'パン', 'パン', '판', '빵', '명사', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'shopping_market'), 'お酒', 'おさけ', '오사케', '술', '명사', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'shopping_market'), '売る', 'うる', '우루', '팔다', '동사', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'shopping_market'), '辛い', 'からい', '카라이', '맵다', '형용사', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'shopping_market'), '不味い', 'まずい', '마즈이', '맛없다', '형용사', 'N5')
;

-- Vocabulary INSERT for supermarket (14 words)
INSERT INTO vocabulary (situation_id, word_ja, reading_hiragana, reading_ko, meaning_ko, pos, jlpt_level) VALUES
  ((SELECT id FROM situations WHERE slug = 'supermarket'), 'ポイントカード', 'ポイントカード', '포인토카-도', '포인트 카드', '명사', NULL),
  ((SELECT id FROM situations WHERE slug = 'supermarket'), '持つ', 'もつ', '모츠', '가지다', '동사', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'supermarket'), '袋', 'ふくろ', '후쿠로', '봉투, 봉지', '명사', NULL),
  ((SELECT id FROM situations WHERE slug = 'supermarket'), '有料', 'ゆうりょう', '유-료-', '유료', '명사', NULL),
  ((SELECT id FROM situations WHERE slug = 'supermarket'), '要る', 'いる', '이루', '필요하다', '동사', NULL),
  ((SELECT id FROM situations WHERE slug = 'supermarket'), '小さい', 'ちいさい', '치-사이', '작다', '형용사', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'supermarket'), '一枚', 'いちまい', '이치마이', '한 장', '명사', NULL),
  ((SELECT id FROM situations WHERE slug = 'supermarket'), 'お願い(します)', 'おねがい(します)', '오네가이(시마스)', '부탁(드립니다)', '표현', NULL),
  ((SELECT id FROM situations WHERE slug = 'supermarket'), '千', 'せん', '센', '천', '명사', NULL),
  ((SELECT id FROM situations WHERE slug = 'supermarket'), '二百', 'にひゃく', '니햐쿠', '이백', '명사', NULL),
  ((SELECT id FROM situations WHERE slug = 'supermarket'), '円', 'えん', '엔', '엔 (화폐 단위)', '명사', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'supermarket'), 'Paypay', 'ペイペイ', '페-페이', '페이페이', '명사', NULL),
  ((SELECT id FROM situations WHERE slug = 'supermarket'), '使う', 'つかう', '츠카우', '사용하다', '동사', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'supermarket'), 'いいえ', 'いいえ', '이-에', '아니오', '감탄사', 'N5')
;

-- Vocabulary INSERT for taxi (12 words)
INSERT INTO vocabulary (situation_id, word_ja, reading_hiragana, reading_ko, meaning_ko, pos, jlpt_level) VALUES
  ((SELECT id FROM situations WHERE slug = 'taxi'), 'どちら', 'どちら', '도치라', '어느 쪽, 어디', '명사', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'taxi'), '行く', 'いく', '이쿠', '가다', '동사', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'taxi'), '住所', 'じゅうしょ', '쥬-쇼', '주소', '명사', NULL),
  ((SELECT id FROM situations WHERE slug = 'taxi'), '急ぐ', 'いそぐ', '이소구', '서두르다', '동사', NULL),
  ((SELECT id FROM situations WHERE slug = 'taxi'), '分かりました', 'わかりました', '와카리마시타', '알겠습니다', '표현', NULL),
  ((SELECT id FROM situations WHERE slug = 'taxi'), '道', 'みち', '미치', '길', '명사', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'taxi'), '混む', 'こむ', '코무', '붐비다', '동사', NULL),
  ((SELECT id FROM situations WHERE slug = 'taxi'), '頑張る', 'がんばる', '감바루', '힘내다', '동사', NULL),
  ((SELECT id FROM situations WHERE slug = 'taxi'), 'クレジットカード', 'クレジットカード', '쿠레짓토카-도', '신용카드', '명사', NULL),
  ((SELECT id FROM situations WHERE slug = 'taxi'), '使う', 'つかう', '츠카우', '사용하다', '동사', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'taxi'), '大丈夫', 'だいじょうぶ', '다이죠-부', '괜찮습니다', '형용사', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'taxi'), '二千五百円', 'にせんごひゃくえん', '니센고햐쿠엔', '2500엔', '명사', NULL)
;

-- Vocabulary INSERT for taxi_v1 (15 words)
INSERT INTO vocabulary (situation_id, word_ja, reading_hiragana, reading_ko, meaning_ko, pos, jlpt_level) VALUES
  ((SELECT id FROM situations WHERE slug = 'taxi_v1'), '地図', 'ちず', '치즈', '지도', '명사', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'taxi_v1'), '遠い', 'とおい', '토-이', '멀다', '형용사', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'taxi_v1'), '近い', 'ちかい', '치카이', '가깝다', '형용사', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'taxi_v1'), '車', 'くるま', '쿠루마', '차', '명사', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'taxi_v1'), '橋', 'はし', '하시', '다리', '명사', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'taxi_v1'), '北', 'きた', '키타', '북쪽', '명사', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'taxi_v1'), '信号', 'しんごう', '신고-', '신호등', '명사', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'taxi_v1'), '交差点', 'こうさてん', '코-사텐', '교차로', '명사', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'taxi_v1'), '真っ直ぐ', 'まっすぐ', '맛스구', '똑바로, 직진', '부사', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'taxi_v1'), '南', 'みなみ', '미나미', '남쪽', '명사', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'taxi_v1'), '東', 'ひがし', '히가시', '동쪽', '명사', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'taxi_v1'), '西', 'にし', '니시', '서쪽', '명사', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'taxi_v1'), '走る', 'はしる', '하시루', '달리다', '동사', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'taxi_v1'), '帰る', 'かえる', '카에루', '돌아가다', '동사', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'taxi_v1'), 'タクシー', 'タクシー', '타쿠시-', '택시', '명사', 'N5')
;

-- Vocabulary INSERT for town_guide (16 words)
INSERT INTO vocabulary (situation_id, word_ja, reading_hiragana, reading_ko, meaning_ko, pos, jlpt_level) VALUES
  ((SELECT id FROM situations WHERE slug = 'town_guide'), '便利', 'べんり', '벤리', '편리하다', '형용사(な)', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'town_guide'), '病院', 'びょういん', '뵤-인', '병원', '명사', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'town_guide'), '銀行', 'ぎんこう', '긴코-', '은행', '명사', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'town_guide'), '郵便局', 'ゆうびんきょく', '유-빈쿄쿠', '우체국', '명사', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'town_guide'), '交番', 'こうばん', '코-반', '파출소', '명사', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'town_guide'), '公園', 'こうえん', '코-엔', '공원', '명사', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'town_guide'), '広い', 'ひろい', '히로이', '넓다', '형용사', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'town_guide'), '図書館', 'としょかん', '토쇼칸', '도서관', '명사', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'town_guide'), '静か', 'しずか', '시즈카', '조용하다', '형용사(な)', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'town_guide'), '映画館', 'えいがかん', '에-가칸', '영화관', '명사', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'town_guide'), 'スーパー', 'スーパー', '스-파-', '슈퍼마켓', '명사', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'town_guide'), 'デパート', 'デパート', '데파-토', '백화점', '명사', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'town_guide'), 'レストラン', 'レストラン', '레스토란', '레스토랑', '명사', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'town_guide'), '賑やか', 'にぎやか', '니기야카', '번화하다, 활기찬', '형용사(な)', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'town_guide'), '不便', 'ふべん', '후벤', '불편하다', '형용사(な)', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'town_guide'), '狭い', 'せまい', '세마이', '좁다', '형용사', 'N5')
;

-- Vocabulary INSERT for train_station (12 words)
INSERT INTO vocabulary (situation_id, word_ja, reading_hiragana, reading_ko, meaning_ko, pos, jlpt_level) VALUES
  ((SELECT id FROM situations WHERE slug = 'train_station'), 'いらっしゃいませ', 'いらっしゃいませ', '이랏샤이마세', '어서 오세요', '표현', NULL),
  ((SELECT id FROM situations WHERE slug = 'train_station'), 'どちら', 'どちら', '도치라', '어디', '명사', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'train_station'), 'まで', 'まで', '마데', '~까지', '조사', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'train_station'), '東京駅', 'とうきょうえき', '토-쿄-에키', '도쿄역', '명사', NULL),
  ((SELECT id FROM situations WHERE slug = 'train_station'), 'お願い(おねがい)します', 'おねがいします', '오네가이시마스', '부탁합니다', '표현', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'train_station'), '片道(かたみち)', 'かたみち', '카타미치', '편도', '명사', NULL),
  ((SELECT id FROM situations WHERE slug = 'train_station'), '往復(おうふく)', 'おうふく', '오-후쿠', '왕복', '명사', NULL),
  ((SELECT id FROM situations WHERE slug = 'train_station'), 'ですか', 'ですか', '데스카', '~입니까?', '조사', NULL),
  ((SELECT id FROM situations WHERE slug = 'train_station'), '一枚(いちまい)', 'いちまい', '이치마이', '한 장', '명사', NULL),
  ((SELECT id FROM situations WHERE slug = 'train_station'), '五百円(ごひゃくえん)', 'ごひゃくえん', '고햐쿠엔', '500엔', '명사', NULL),
  ((SELECT id FROM situations WHERE slug = 'train_station'), '番線(ばんせん)', 'ばんせん', '반센', '승강장 번호', '명사', NULL),
  ((SELECT id FROM situations WHERE slug = 'train_station'), 'どうぞ', 'どうぞ', '도-조', '어서, 자', '표현', 'N5')
;

-- Vocabulary INSERT for transport_advanced (11 words)
INSERT INTO vocabulary (situation_id, word_ja, reading_hiragana, reading_ko, meaning_ko, pos, jlpt_level) VALUES
  ((SELECT id FROM situations WHERE slug = 'transport_advanced'), '空港', 'くうこう', '쿠-코-', '공항', '명사', 'N4'),
  ((SELECT id FROM situations WHERE slug = 'transport_advanced'), '急行', 'きゅうこう', '큐-코-', '급행', '명사', 'N4'),
  ((SELECT id FROM situations WHERE slug = 'transport_advanced'), '特急', 'とっきゅう', '톳큐-', '특급', '명사', 'N4'),
  ((SELECT id FROM situations WHERE slug = 'transport_advanced'), '飛行場', 'ひこうじょう', '히코-죠-', '비행장', '명사', 'N4'),
  ((SELECT id FROM situations WHERE slug = 'transport_advanced'), '島', 'しま', '시마', '섬', '명사', 'N4'),
  ((SELECT id FROM situations WHERE slug = 'transport_advanced'), '港', 'みなと', '미나토', '항구', '명사', 'N4'),
  ((SELECT id FROM situations WHERE slug = 'transport_advanced'), '乗り換え', 'のりかえ', '노리카에', '환승', '명사', 'N4'),
  ((SELECT id FROM situations WHERE slug = 'transport_advanced'), '坂', 'さか', '사카', '언덕, 비탈', '명사', 'N4'),
  ((SELECT id FROM situations WHERE slug = 'transport_advanced'), '通る', 'とおる', '토-루', '지나가다', '동사', 'N4'),
  ((SELECT id FROM situations WHERE slug = 'transport_advanced'), '進む', 'すすむ', '스스무', '나아가다', '동사', 'N4'),
  ((SELECT id FROM situations WHERE slug = 'transport_advanced'), '戻る', 'もどる', '모도루', '돌아가다, 되돌아가다', '동사', 'N4')
;

-- Vocabulary INSERT for travel_plan (14 words)
INSERT INTO vocabulary (situation_id, word_ja, reading_hiragana, reading_ko, meaning_ko, pos, jlpt_level) VALUES
  ((SELECT id FROM situations WHERE slug = 'travel_plan'), '飛行機', 'ひこうき', '히코-키', '비행기', '명사', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'travel_plan'), '夏休み', 'なつやすみ', '나츠야스미', '여름방학', '명사', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'travel_plan'), '来月', 'らいげつ', '라이게츠', '다음 달', '명사', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'travel_plan'), '今月', 'こんげつ', '콘게츠', '이번 달', '명사', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'travel_plan'), '休み', 'やすみ', '야스미', '휴일, 쉬는 날', '명사', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'travel_plan'), '先月', 'せんげつ', '센게츠', '지난달', '명사', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'travel_plan'), '春', 'はる', '하루', '봄', '명사', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'travel_plan'), '夏', 'なつ', '나츠', '여름', '명사', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'travel_plan'), '秋', 'あき', '아키', '가을', '명사', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'travel_plan'), '今週', 'こんしゅう', '콘슈-', '이번 주', '명사', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'travel_plan'), '冬', 'ふゆ', '후유', '겨울', '명사', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'travel_plan'), '午前', 'ごぜん', '고젠', '오전', '명사', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'travel_plan'), '午後', 'ごご', '고고', '오후', '명사', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'travel_plan'), '自転車', 'じてんしゃ', '지텐샤', '자전거', '명사', 'N5')
;

-- Vocabulary INSERT for weekend_plans (15 words)
INSERT INTO vocabulary (situation_id, word_ja, reading_hiragana, reading_ko, meaning_ko, pos, jlpt_level) VALUES
  ((SELECT id FROM situations WHERE slug = 'weekend_plans'), '暇', 'ひま', '히마', '한가하다', '형용사(な)', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'weekend_plans'), '好き', 'すき', '스키', '좋아하다', '형용사(な)', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'weekend_plans'), '泳ぐ', 'およぐ', '오요구', '수영하다', '동사', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'weekend_plans'), '大好き', 'だいすき', '다이스키', '매우 좋아하다', '형용사(な)', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'weekend_plans'), '遊ぶ', 'あそぶ', '아소부', '놀다', '동사', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'weekend_plans'), '思う', 'おもう', '오모우', '생각하다', '동사', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'weekend_plans'), '散歩する', 'さんぽする', '산포스루', '산책하다', '동사', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'weekend_plans'), '楽しい', 'たのしい', '타노시-', '즐겁다', '형용사', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'weekend_plans'), '嫌い', 'きらい', '키라이', '싫어하다', '형용사(な)', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'weekend_plans'), '面白い', 'おもしろい', '오모시로이', '재미있다', '형용사', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'weekend_plans'), '電話する', 'でんわする', '덴와스루', '전화하다', '동사', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'weekend_plans'), '言う', 'いう', '이우', '말하다', '동사', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'weekend_plans'), '分かる', 'わかる', '와카루', '알다, 이해하다', '동사', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'weekend_plans'), '呼ぶ', 'よぶ', '요부', '부르다', '동사', 'N5'),
  ((SELECT id FROM situations WHERE slug = 'weekend_plans'), '答える', 'こたえる', '코타에루', '대답하다', '동사', 'N5')
;
