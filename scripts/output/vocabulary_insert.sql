-- =============================================================
-- Vocabulary INSERT statements
-- Generated from 22 situation JSON files
-- Total vocabulary items: 347
-- =============================================================

-- Vocabulary INSERT for airport_pickup (12 words)
INSERT INTO vocabulary (situation_id, word_ja, reading_hiragana, reading_ko, meaning_ko, pos) VALUES
  ((SELECT id FROM situations WHERE slug = 'airport_pickup'), '失礼', 'しつれい', '시츠레-', '실례', '명사'),
  ((SELECT id FROM situations WHERE slug = 'airport_pickup'), 'ございます', 'ございます', '고자이마스', '있습니다 (정중한 표현)', '동사'),
  ((SELECT id FROM situations WHERE slug = 'airport_pickup'), 'いらっしゃいます', 'いらっしゃいます', '이랏샤이마스', '계시다 (존경어)', '동사'),
  ((SELECT id FROM situations WHERE slug = 'airport_pickup'), '本日', 'ほんじつ', '혼지츠', '오늘', '명사'),
  ((SELECT id FROM situations WHERE slug = 'airport_pickup'), 'よろしく', 'よろしく', '요로시쿠', '잘 부탁드립니다', '표현'),
  ((SELECT id FROM situations WHERE slug = 'airport_pickup'), 'お疲れ様でした', 'おつかれさまでした', '오츠카레사마데시타', '수고하셨습니다', '표현'),
  ((SELECT id FROM situations WHERE slug = 'airport_pickup'), 'フライト', 'フライト', '후라이토', '비행', '명사'),
  ((SELECT id FROM situations WHERE slug = 'airport_pickup'), 'いかが', 'いかが', '이카가', '어떻습니까', '명사'),
  ((SELECT id FROM situations WHERE slug = 'airport_pickup'), 'おかげさまで', 'おかげさまで', '오카게사마데', '덕분에', '표현'),
  ((SELECT id FROM situations WHERE slug = 'airport_pickup'), '快適', 'かいてき', '카이테키', '쾌적함', '형용사'),
  ((SELECT id FROM situations WHERE slug = 'airport_pickup'), 'ご案内', 'ごあんない', '고안나이', '안내', '명사'),
  ((SELECT id FROM situations WHERE slug = 'airport_pickup'), 'いたします', 'いたします', '이타시마스', '합니다 (겸양어)', '동사')
;

-- Vocabulary INSERT for ask_directions (14 words)
INSERT INTO vocabulary (situation_id, word_ja, reading_hiragana, reading_ko, meaning_ko, pos) VALUES
  ((SELECT id FROM situations WHERE slug = 'ask_directions'), '何か', 'なにか', '나니카', '무언가, 뭔가', '명사'),
  ((SELECT id FROM situations WHERE slug = 'ask_directions'), '探す', 'さがす', '사가스', '찾다', '동사'),
  ((SELECT id FROM situations WHERE slug = 'ask_directions'), '駅', 'えき', '에키', '역', '명사'),
  ((SELECT id FROM situations WHERE slug = 'ask_directions'), 'どこ', 'どこ', '도코', '어디', '명사'),
  ((SELECT id FROM situations WHERE slug = 'ask_directions'), '道', 'みち', '미치', '길', '명사'),
  ((SELECT id FROM situations WHERE slug = 'ask_directions'), 'まっすぐ', 'まっすぐ', '맛스구', '똑바로, 곧장', '부사'),
  ((SELECT id FROM situations WHERE slug = 'ask_directions'), '行く', 'いく', '이쿠', '가다', '동사'),
  ((SELECT id FROM situations WHERE slug = 'ask_directions'), '右', 'みぎ', '미기', '오른쪽', '명사'),
  ((SELECT id FROM situations WHERE slug = 'ask_directions'), '曲がる', 'まがる', '마가루', '돌다', '동사'),
  ((SELECT id FROM situations WHERE slug = 'ask_directions'), 'どのくらい', 'どのくらい', '도노쿠라이', '얼마 정도, 얼마나', '표현'),
  ((SELECT id FROM situations WHERE slug = 'ask_directions'), 'かかる', 'かかる', '카카루', '(시간, 돈이) 걸리다, 들다', '동사'),
  ((SELECT id FROM situations WHERE slug = 'ask_directions'), '歩く', 'あるく', '아루쿠', '걷다', '동사'),
  ((SELECT id FROM situations WHERE slug = 'ask_directions'), '分', 'ふん', '훈', '분', '명사'),
  ((SELECT id FROM situations WHERE slug = 'ask_directions'), 'くらい', 'くらい', '쿠라이', '~정도', '부사')
;

-- Vocabulary INSERT for bank_account (22 words)
INSERT INTO vocabulary (situation_id, word_ja, reading_hiragana, reading_ko, meaning_ko, pos) VALUES
  ((SELECT id FROM situations WHERE slug = 'bank_account'), 'いらっしゃいませ', 'いらっしゃいませ', '이랏샤이마세', '어서 오세요', '표현'),
  ((SELECT id FROM situations WHERE slug = 'bank_account'), '本日', 'ほんじつ', '혼지츠', '오늘', '명사'),
  ((SELECT id FROM situations WHERE slug = 'bank_account'), 'どのような', 'どのような', '도노요-나', '어떤', '표현'),
  ((SELECT id FROM situations WHERE slug = 'bank_account'), 'ご用件', 'ごようけん', '고요-켄', '용건', '명사'),
  ((SELECT id FROM situations WHERE slug = 'bank_account'), '口座', 'こうざ', '코-자', '계좌', '명사'),
  ((SELECT id FROM situations WHERE slug = 'bank_account'), '開設', 'かいせつ', '카이세츠', '개설', '명사'),
  ((SELECT id FROM situations WHERE slug = 'bank_account'), 'する', 'する', '스루', '하다', '동사'),
  ((SELECT id FROM situations WHERE slug = 'bank_account'), '外国人', 'がいこくじん', '가이코쿠진', '외국인', '명사'),
  ((SELECT id FROM situations WHERE slug = 'bank_account'), '作る', 'つくる', '츠쿠루', '만들다', '동사'),
  ((SELECT id FROM situations WHERE slug = 'bank_account'), '在留カード', 'ざいりゅうカード', '자이류-카-도', '재류 카드', '명사'),
  ((SELECT id FROM situations WHERE slug = 'bank_account'), '住所', 'じゅうしょ', '쥬-쇼', '주소', '명사'),
  ((SELECT id FROM situations WHERE slug = 'bank_account'), '確認', 'かくにん', '카쿠닌', '확인', '명사'),
  ((SELECT id FROM situations WHERE slug = 'bank_account'), '書類', 'しょるい', '쇼류이', '서류', '명사'),
  ((SELECT id FROM situations WHERE slug = 'bank_account'), '電気', 'でんき', '뎅키', '전기', '명사'),
  ((SELECT id FROM situations WHERE slug = 'bank_account'), '請求書', 'せいきゅうしょ', '세-큐-쇼', '청구서', '명사'),
  ((SELECT id FROM situations WHERE slug = 'bank_account'), '大丈夫', 'だいじょうぶ', '다이죠-부', '괜찮음', '형용사'),
  ((SELECT id FROM situations WHERE slug = 'bank_account'), '用紙', 'ようし', '요-시', '용지', '명사'),
  ((SELECT id FROM situations WHERE slug = 'bank_account'), '記入', 'きにゅう', '키뉴-', '기입', '명사'),
  ((SELECT id FROM situations WHERE slug = 'bank_account'), 'お願い', 'おねがい', '오네가이', '부탁', '명사'),
  ((SELECT id FROM situations WHERE slug = 'bank_account'), 'キャッシュカード', 'キャッシュカード', '캿슈카-도', '현금 카드', '명사'),
  ((SELECT id FROM situations WHERE slug = 'bank_account'), '一週間後', 'いっしゅうかんご', '잇슈-칸고', '일주일 후', '명사'),
  ((SELECT id FROM situations WHERE slug = 'bank_account'), '届く', 'とどく', '토도쿠', '도착하다', '동사')
;

-- Vocabulary INSERT for business_card (18 words)
INSERT INTO vocabulary (situation_id, word_ja, reading_hiragana, reading_ko, meaning_ko, pos) VALUES
  ((SELECT id FROM situations WHERE slug = 'business_card'), 'はじめまして', 'はじめまして', '하지메마시테', '처음 뵙겠습니다', '표현'),
  ((SELECT id FROM situations WHERE slug = 'business_card'), '株式会社', 'かぶしきがいしゃ', '카부시키가이샤', '주식회사', '명사'),
  ((SELECT id FROM situations WHERE slug = 'business_card'), '山田', 'やまだ', '야마다', '야마다 (성씨)', '명사'),
  ((SELECT id FROM situations WHERE slug = 'business_card'), '田中', 'たなか', '타나카', '다나카 (성씨)', '명사'),
  ((SELECT id FROM situations WHERE slug = 'business_card'), '申します', 'もうします', '모-시마스', '~라고 합니다 (겸양어)', '동사'),
  ((SELECT id FROM situations WHERE slug = 'business_card'), '韓国', 'かんこく', '칸코쿠', '한국', '명사'),
  ((SELECT id FROM situations WHERE slug = 'business_card'), 'キム', 'キム', '키무', '김 (성씨)', '명사'),
  ((SELECT id FROM situations WHERE slug = 'business_card'), '名刺', 'めいし', '메-시', '명함', '명사'),
  ((SELECT id FROM situations WHERE slug = 'business_card'), 'どうぞ', 'どうぞ', '도-조', 'どうぞ (권유, 부탁)', '표현'),
  ((SELECT id FROM situations WHERE slug = 'business_card'), '頂戴いたします', 'ちょうだいいたします', '쵸-다이 이타시마스', '받겠습니다 (겸양어)', '표현'),
  ((SELECT id FROM situations WHERE slug = 'business_card'), 'こちらこそ', 'こちらこそ', '코치라코소', '저야말로', '표현'),
  ((SELECT id FROM situations WHERE slug = 'business_card'), 'よろしく', 'よろしく', '요로시쿠', '잘 부탁드립니다', '표현'),
  ((SELECT id FROM situations WHERE slug = 'business_card'), '今後とも', 'こんごとも', '콘고토모', '앞으로도', '부사'),
  ((SELECT id FROM situations WHERE slug = 'business_card'), '本日', 'ほんじつ', '혼지츠', '오늘', '명사'),
  ((SELECT id FROM situations WHERE slug = 'business_card'), '貴重', 'きちょう', '키쵸-', '귀중함', '형용사'),
  ((SELECT id FROM situations WHERE slug = 'business_card'), '時間', 'じかん', '지칸', '시간', '명사'),
  ((SELECT id FROM situations WHERE slug = 'business_card'), 'いただく', 'いただく', '이타다쿠', '받다 (겸양어, 먹다/마시다/받다의 겸양어)', '동사'),
  ((SELECT id FROM situations WHERE slug = 'business_card'), 'ありがとうございます', 'ありがとうございます', '아리가토-고자이마스', '감사합니다', '표현')
;

-- Vocabulary INSERT for business_dinner (18 words)
INSERT INTO vocabulary (situation_id, word_ja, reading_hiragana, reading_ko, meaning_ko, pos) VALUES
  ((SELECT id FROM situations WHERE slug = 'business_dinner'), 'お口', 'おくち', '오쿠치', '입 (존경어)', '명사'),
  ((SELECT id FROM situations WHERE slug = 'business_dinner'), '合う', 'あう', '아우', '맞다, 어울리다', '동사'),
  ((SELECT id FROM situations WHERE slug = 'business_dinner'), 'どう', 'どう', '도-', '어떻게', '부사'),
  ((SELECT id FROM situations WHERE slug = 'business_dinner'), '召し上がる', 'めしあがる', '메시아가루', '드시다 (존경어)', '동사'),
  ((SELECT id FROM situations WHERE slug = 'business_dinner'), 'いただく', 'いただく', '이타다쿠', '잘 먹겠습니다', '표현'),
  ((SELECT id FROM situations WHERE slug = 'business_dinner'), '乾杯', 'かんぱい', '캄파이', '건배', '명사'),
  ((SELECT id FROM situations WHERE slug = 'business_dinner'), '今日', 'きょう', '쿄-', '오늘', '명사'),
  ((SELECT id FROM situations WHERE slug = 'business_dinner'), 'ご成功', 'ごせいこう', '고세이코-', '성공 (존경어)', '명사'),
  ((SELECT id FROM situations WHERE slug = 'business_dinner'), '祝して', 'いわいして', '이와이시테', '축하하며', '표현'),
  ((SELECT id FROM situations WHERE slug = 'business_dinner'), 'とても', 'とても', '토테모', '매우, 아주', '부사'),
  ((SELECT id FROM situations WHERE slug = 'business_dinner'), 'おいしい', 'おいしい', '오이시이', '맛있다', '형용사'),
  ((SELECT id FROM situations WHERE slug = 'business_dinner'), '料理', 'りょうり', '료-리', '요리', '명사'),
  ((SELECT id FROM situations WHERE slug = 'business_dinner'), '何という', 'なんという', '난토이우', '무슨 ~라고 하는', '표현'),
  ((SELECT id FROM situations WHERE slug = 'business_dinner'), '郷土料理', 'きょうどりょうり', '쿄-도료-리', '향토 요리', '명사'),
  ((SELECT id FROM situations WHERE slug = 'business_dinner'), '京都', 'きょうと', '쿄-토', '교토', '명사'),
  ((SELECT id FROM situations WHERE slug = 'business_dinner'), '気', 'き', '키', '마음, 기분', '명사'),
  ((SELECT id FROM situations WHERE slug = 'business_dinner'), '召す', 'めす', '메스', '드시다, 입다 (존경어)', '동사'),
  ((SELECT id FROM situations WHERE slug = 'business_dinner'), '嬉しい', 'うれしい', '우레시이', '기쁘다', '형용사')
;

-- Vocabulary INSERT for business_taxi (17 words)
INSERT INTO vocabulary (situation_id, word_ja, reading_hiragana, reading_ko, meaning_ko, pos) VALUES
  ((SELECT id FROM situations WHERE slug = 'business_taxi'), 'ご乗車', 'ごじょうしゃ', '고죠-샤', '승차', '명사'),
  ((SELECT id FROM situations WHERE slug = 'business_taxi'), 'ありがとうございます', 'ありがとうございます', '아리가토-고자이마스', '감사합니다', '표현'),
  ((SELECT id FROM situations WHERE slug = 'business_taxi'), 'どちら', 'どちら', '도치라', '어느 쪽, 어디', '명사'),
  ((SELECT id FROM situations WHERE slug = 'business_taxi'), 'まで', 'まで', '마데', '~까지', '조사'),
  ((SELECT id FROM situations WHERE slug = 'business_taxi'), '新宿駅', 'しんじゅくえき', '신쥬쿠에키', '신주쿠역', '명사'),
  ((SELECT id FROM situations WHERE slug = 'business_taxi'), '西口', 'にしぐち', '니시구치', '서쪽 출구', '명사'),
  ((SELECT id FROM situations WHERE slug = 'business_taxi'), 'お願いします', 'おねがいします', '오네가이시마스', '부탁드립니다', '표현'),
  ((SELECT id FROM situations WHERE slug = 'business_taxi'), 'かしこまりました', 'かしこまりました', '카시코마리마시타', '알겠습니다', '표현'),
  ((SELECT id FROM situations WHERE slug = 'business_taxi'), '首都高速', 'しゅとこうそく', '슈토코-소쿠', '수도고속도로', '명사'),
  ((SELECT id FROM situations WHERE slug = 'business_taxi'), '使う', 'つかう', '츠카우', '쓰다, 사용하다', '동사'),
  ((SELECT id FROM situations WHERE slug = 'business_taxi'), 'よろしい', 'よろしい', '요로시이', '좋다, 괜찮다', '형용사'),
  ((SELECT id FROM situations WHERE slug = 'business_taxi'), '領収書', 'りょうしゅうしょ', '료-슈-쇼', '영수증', '명사'),
  ((SELECT id FROM situations WHERE slug = 'business_taxi'), 'もちろん', 'もちろん', '모치론', '물론', '부사'),
  ((SELECT id FROM situations WHERE slug = 'business_taxi'), 'ございます', 'ございます', '고자이마스', '있습니다 (정중한 표현)', '동사'),
  ((SELECT id FROM situations WHERE slug = 'business_taxi'), 'お降り', 'おり', '오리', '내림, 하차', '명사'),
  ((SELECT id FROM situations WHERE slug = 'business_taxi'), '際', 'さい', '사이', '때, 경우', '명사'),
  ((SELECT id FROM situations WHERE slug = 'business_taxi'), '渡す', 'わたす', '와타스', '건네주다, 넘겨주다', '동사')
;

-- Vocabulary INSERT for cafe (13 words)
INSERT INTO vocabulary (situation_id, word_ja, reading_hiragana, reading_ko, meaning_ko, pos) VALUES
  ((SELECT id FROM situations WHERE slug = 'cafe'), 'いらっしゃいませ', 'いらっしゃいませ', '이랏샤이마세', '어서 오세요', '표현'),
  ((SELECT id FROM situations WHERE slug = 'cafe'), 'ご注文', 'ごちゅうもん', '고츄-몬', '주문', '명사'),
  ((SELECT id FROM situations WHERE slug = 'cafe'), 'アイスコーヒー', 'アイスコーヒー', '아이스코-히-', '아이스 커피', '명사'),
  ((SELECT id FROM situations WHERE slug = 'cafe'), 'お願い', 'おねがい', '오네가이', '부탁', '명사'),
  ((SELECT id FROM situations WHERE slug = 'cafe'), 'サイズ', 'サイズ', '사이즈', '사이즈', '명사'),
  ((SELECT id FROM situations WHERE slug = 'cafe'), 'いかが', 'いかが', '이카가', '어떻게', '부사'),
  ((SELECT id FROM situations WHERE slug = 'cafe'), 'なさる', 'なさる', '나사루', '하시다 (する의 존경어)', '동사'),
  ((SELECT id FROM situations WHERE slug = 'cafe'), 'Mサイズ', 'Mサイズ', '엠 사이즈', 'M 사이즈', '명사'),
  ((SELECT id FROM situations WHERE slug = 'cafe'), '四百', 'よんひゃく', '욘햐쿠', '400', '명사'),
  ((SELECT id FROM situations WHERE slug = 'cafe'), '円', 'えん', '엔', '엔 (화폐 단위)', '명사'),
  ((SELECT id FROM situations WHERE slug = 'cafe'), '少々', 'しょうしょう', '쇼-쇼-', '잠시, 잠깐', '부사'),
  ((SELECT id FROM situations WHERE slug = 'cafe'), '待つ', 'まつ', '마츠', '기다리다', '동사'),
  ((SELECT id FROM situations WHERE slug = 'cafe'), 'ください', 'ください', '쿠다사이', '주세요', '표현')
;

-- Vocabulary INSERT for convenience_store (10 words)
INSERT INTO vocabulary (situation_id, word_ja, reading_hiragana, reading_ko, meaning_ko, pos) VALUES
  ((SELECT id FROM situations WHERE slug = 'convenience_store'), 'いらっしゃいませ', 'いらっしゃいませ', '이랏샤이마세', '어서 오세요', '표현'),
  ((SELECT id FROM situations WHERE slug = 'convenience_store'), 'これ', 'これ', '코레', '이것', '명사'),
  ((SELECT id FROM situations WHERE slug = 'convenience_store'), 'ください', 'ください', '쿠다사이', '주세요', '표현'),
  ((SELECT id FROM situations WHERE slug = 'convenience_store'), '袋', 'ふくろ', '후쿠로', '봉투, 가방', '명사'),
  ((SELECT id FROM situations WHERE slug = 'convenience_store'), 'いる', 'いる', '이루', '필요하다, 있다', '동사'),
  ((SELECT id FROM situations WHERE slug = 'convenience_store'), 'いいえ', 'いいえ', '이-에', '아니오', '감탄사'),
  ((SELECT id FROM situations WHERE slug = 'convenience_store'), '大丈夫', 'だいじょうぶ', '다이죠-부', '괜찮음', '형용사'),
  ((SELECT id FROM situations WHERE slug = 'convenience_store'), '三百', 'さんびゃく', '삼뱌쿠', '삼백', '명사'),
  ((SELECT id FROM situations WHERE slug = 'convenience_store'), '円', 'えん', '엔', '엔 (일본 화폐 단위)', '명사'),
  ((SELECT id FROM situations WHERE slug = 'convenience_store'), 'ありがとうございました', 'ありがとうございました', '아리가토-고자이마시타', '감사했습니다', '표현')
;

-- Vocabulary INSERT for farewell (20 words)
INSERT INTO vocabulary (situation_id, word_ja, reading_hiragana, reading_ko, meaning_ko, pos) VALUES
  ((SELECT id FROM situations WHERE slug = 'farewell'), '本日', 'ほんじつ', '혼지츠', '오늘 (정중한 표현)', '명사'),
  ((SELECT id FROM situations WHERE slug = 'farewell'), 'お忙しい', 'おいそがしい', '오이소가시이', '바쁘신', '형용사'),
  ((SELECT id FROM situations WHERE slug = 'farewell'), '中', 'なか', '나카', '중', '명사'),
  ((SELECT id FROM situations WHERE slug = 'farewell'), 'お越し', 'おこし', '오코시', '오심 (오다의 존경어)', '명사'),
  ((SELECT id FROM situations WHERE slug = 'farewell'), 'いただき', 'いただき', '이타다키', '받아', '동사'),
  ((SELECT id FROM situations WHERE slug = 'farewell'), 'ありがとう', 'ありがとう', '아리가토-', '감사합니다', '감탄사'),
  ((SELECT id FROM situations WHERE slug = 'farewell'), 'ございました', 'ございました', '고자이마시타', '~였습니다 (존경어)', '조동사'),
  ((SELECT id FROM situations WHERE slug = 'farewell'), 'こちらこそ', 'こちらこそ', '코치라코소', '저야말로', '표현'),
  ((SELECT id FROM situations WHERE slug = 'farewell'), '大変', 'たいへん', '타이헨', '大変 (큰일, 매우)', '형용동사'),
  ((SELECT id FROM situations WHERE slug = 'farewell'), 'お世話', 'おせわ', '오세와', '신세', '명사'),
  ((SELECT id FROM situations WHERE slug = 'farewell'), '気', 'き', '키', '마음, 정신', '명사'),
  ((SELECT id FROM situations WHERE slug = 'farewell'), 'つける', 'つける', '츠케루', '붙이다, 주의하다', '동사'),
  ((SELECT id FROM situations WHERE slug = 'farewell'), 'お帰り', 'おかえり', '오카에리', '돌아감 (돌아가다의 존경어)', '명사'),
  ((SELECT id FROM situations WHERE slug = 'farewell'), 'また', 'また', '마타', '또, 다시', '부사'),
  ((SELECT id FROM situations WHERE slug = 'farewell'), '近いうち', 'ちかいうち', '치카이우치', '조만간', '명사'),
  ((SELECT id FROM situations WHERE slug = 'farewell'), '会う', 'あう', '아우', '만나다', '동사'),
  ((SELECT id FROM situations WHERE slug = 'farewell'), 'できれば', 'できれば', '데키레바', '된다면, 가능하다면', '표현'),
  ((SELECT id FROM situations WHERE slug = 'farewell'), 'ぜひ', 'ぜひ', '제히', '꼭', '부사'),
  ((SELECT id FROM situations WHERE slug = 'farewell'), 'お待ちしております', 'おまちしております', '오마치시테오리마스', '기다리고 있겠습니다 (존경어)', '표현'),
  ((SELECT id FROM situations WHERE slug = 'farewell'), '失礼', 'しつれい', '시츠레-', '실례', '명사')
;

-- Vocabulary INSERT for hospital (17 words)
INSERT INTO vocabulary (situation_id, word_ja, reading_hiragana, reading_ko, meaning_ko, pos) VALUES
  ((SELECT id FROM situations WHERE slug = 'hospital'), '今日', 'きょう', '쿄-', '오늘', '명사'),
  ((SELECT id FROM situations WHERE slug = 'hospital'), 'どう', 'どう', '도-', '어떻게', '부사'),
  ((SELECT id FROM situations WHERE slug = 'hospital'), 'する', 'する', '스루', '하다', '동사'),
  ((SELECT id FROM situations WHERE slug = 'hospital'), '昨日', 'きのう', '키노-', '어제', '명사'),
  ((SELECT id FROM situations WHERE slug = 'hospital'), '頭', 'あたま', '아타마', '머리', '명사'),
  ((SELECT id FROM situations WHERE slug = 'hospital'), '痛い', 'いたい', '이타이', '아프다', '형용사'),
  ((SELECT id FROM situations WHERE slug = 'hospital'), '熱', 'ねつ', '네츠', '열', '명사'),
  ((SELECT id FROM situations WHERE slug = 'hospital'), 'のど', 'のど', '노도', '목', '명사'),
  ((SELECT id FROM situations WHERE slug = 'hospital'), '咳', 'せき', '세키', '기침', '명사'),
  ((SELECT id FROM situations WHERE slug = 'hospital'), '出る', 'でる', '데루', '나오다', '동사'),
  ((SELECT id FROM situations WHERE slug = 'hospital'), '少し', 'すこし', '스코시', '조금, 약간', '부사'),
  ((SELECT id FROM situations WHERE slug = 'hospital'), '風邪', 'かぜ', '카제', '감기', '명사'),
  ((SELECT id FROM situations WHERE slug = 'hospital'), '薬', 'くすり', '쿠스리', '약', '명사'),
  ((SELECT id FROM situations WHERE slug = 'hospital'), '三日分', 'みっかぶん', '밋카분', '3일 분', '명사'),
  ((SELECT id FROM situations WHERE slug = 'hospital'), '出す', 'だす', '다스', '내다, 처방하다', '동사'),
  ((SELECT id FROM situations WHERE slug = 'hospital'), 'ゆっくり', 'ゆっくり', '윳쿠리', '천천히, 푹', '부사'),
  ((SELECT id FROM situations WHERE slug = 'hospital'), '休む', 'やすむ', '야스무', '쉬다', '동사')
;

-- Vocabulary INSERT for hotel_checkin (18 words)
INSERT INTO vocabulary (situation_id, word_ja, reading_hiragana, reading_ko, meaning_ko, pos) VALUES
  ((SELECT id FROM situations WHERE slug = 'hotel_checkin'), 'いらっしゃいませ', 'いらっしゃいませ', '이랏샤이마세', '어서 오세요', '표현'),
  ((SELECT id FROM situations WHERE slug = 'hotel_checkin'), 'ご予約', 'ごよやく', '고요야쿠', '예약', '명사'),
  ((SELECT id FROM situations WHERE slug = 'hotel_checkin'), '名前', 'なまえ', '나마에', '이름', '명사'),
  ((SELECT id FROM situations WHERE slug = 'hotel_checkin'), 'お願いします', 'おねがいします', '오네가이시마스', '부탁드립니다', '표현'),
  ((SELECT id FROM situations WHERE slug = 'hotel_checkin'), '山田', 'やまだ', '야마다', '야마다 (성씨)', '명사'),
  ((SELECT id FROM situations WHERE slug = 'hotel_checkin'), '今日', 'きょう', '쿄-', '오늘', '명사'),
  ((SELECT id FROM situations WHERE slug = 'hotel_checkin'), '二泊', 'にはく', '니하쿠', '2박', '명사'),
  ((SELECT id FROM situations WHERE slug = 'hotel_checkin'), '確認', 'かくにん', '카쿠닌', '확인', '명사'),
  ((SELECT id FROM situations WHERE slug = 'hotel_checkin'), 'できました', 'できました', '데키마시타', '되었습니다, 가능합니다', '표현'),
  ((SELECT id FROM situations WHERE slug = 'hotel_checkin'), 'サイン', 'サイン', '사인', '사인', '명사'),
  ((SELECT id FROM situations WHERE slug = 'hotel_checkin'), 'チェックアウト', 'チェックアウト', '첵쿠아우토', '체크아웃', '명사'),
  ((SELECT id FROM situations WHERE slug = 'hotel_checkin'), '何時', 'なんじ', '난지', '몇 시', '명사'),
  ((SELECT id FROM situations WHERE slug = 'hotel_checkin'), '時', 'じ', '지', '시', '명사'),
  ((SELECT id FROM situations WHERE slug = 'hotel_checkin'), '十時', 'じゅうじ', '쥬-지', '10시', '명사'),
  ((SELECT id FROM situations WHERE slug = 'hotel_checkin'), 'ございます', 'ございます', '고자이마스', '있습니다 (정중)', '동사'),
  ((SELECT id FROM situations WHERE slug = 'hotel_checkin'), '部屋', 'へや', '헤야', '방', '명사'),
  ((SELECT id FROM situations WHERE slug = 'hotel_checkin'), '階', 'かい', '카이', '층', '명사'),
  ((SELECT id FROM situations WHERE slug = 'hotel_checkin'), '号室', 'ごうしつ', '고-시츠', '호실', '명사')
;

-- Vocabulary INSERT for meeting_response (14 words)
INSERT INTO vocabulary (situation_id, word_ja, reading_hiragana, reading_ko, meaning_ko, pos) VALUES
  ((SELECT id FROM situations WHERE slug = 'meeting_response'), '件', 'けん', '켄', '건, 안건', '명사'),
  ((SELECT id FROM situations WHERE slug = 'meeting_response'), 'いかが', 'いかが', '이카가', '어떻습니까, 어떠신지', '부사'),
  ((SELECT id FROM situations WHERE slug = 'meeting_response'), '考える', 'かんがえる', '캉가에루', '생각하다', '동사'),
  ((SELECT id FROM situations WHERE slug = 'meeting_response'), 'ご提案', 'ごていあん', '고테이안', '제안', '명사'),
  ((SELECT id FROM situations WHERE slug = 'meeting_response'), '内容', 'ないよう', '나이요-', '내용', '명사'),
  ((SELECT id FROM situations WHERE slug = 'meeting_response'), '承知', 'しょうち', '쇼-치', '알겠습니다, 승낙', '명사, 동사(する)'),
  ((SELECT id FROM situations WHERE slug = 'meeting_response'), '検討', 'けんとう', '켄토-', '검토', '명사, 동사(する)'),
  ((SELECT id FROM situations WHERE slug = 'meeting_response'), '社内', 'しゃない', '샤나이', '사내', '명사'),
  ((SELECT id FROM situations WHERE slug = 'meeting_response'), '確認', 'かくにん', '카쿠닌', '확인', '명사, 동사(する)'),
  ((SELECT id FROM situations WHERE slug = 'meeting_response'), '改めて', 'あらためて', '아라타메테', '다시, 재차', '부사'),
  ((SELECT id FROM situations WHERE slug = 'meeting_response'), '連絡', 'れんらく', '렌라쿠', '연락', '명사, 동사(する)'),
  ((SELECT id FROM situations WHERE slug = 'meeting_response'), '忙しい', 'いそがしい', '이소가시이', '바쁘다', '형용사'),
  ((SELECT id FROM situations WHERE slug = 'meeting_response'), '恐れ入ります', 'おそれいります', '오소레이리마스', '죄송합니다, 수고스럽습니다', '표현'),
  ((SELECT id FROM situations WHERE slug = 'meeting_response'), 'よろしくお願いいたします', 'よろしくおねがいいたします', '요로시쿠오네가이이타시마스', '잘 부탁드립니다', '표현')
;

-- Vocabulary INSERT for neighbor_greeting (13 words)
INSERT INTO vocabulary (situation_id, word_ja, reading_hiragana, reading_ko, meaning_ko, pos) VALUES
  ((SELECT id FROM situations WHERE slug = 'neighbor_greeting'), 'お隣', 'おとなり', '오토나리', '이웃', '명사'),
  ((SELECT id FROM situations WHERE slug = 'neighbor_greeting'), '引っ越す', 'ひっこす', '힛코스', '이사하다', '동사'),
  ((SELECT id FROM situations WHERE slug = 'neighbor_greeting'), '方', 'かた', '카타', '분 (사람을 높여 부르는 말)', '명사'),
  ((SELECT id FROM situations WHERE slug = 'neighbor_greeting'), '先週', 'せんしゅう', '센슈-', '지난주', '명사'),
  ((SELECT id FROM situations WHERE slug = 'neighbor_greeting'), '申す', 'もうす', '모-스', '말씀드리다 (言います의 겸양어)', '동사'),
  ((SELECT id FROM situations WHERE slug = 'neighbor_greeting'), 'よろしく', 'よろしく', '요로시쿠', '잘', '부사'),
  ((SELECT id FROM situations WHERE slug = 'neighbor_greeting'), '声', 'こえ', '코에', '소리, 목소리', '명사'),
  ((SELECT id FROM situations WHERE slug = 'neighbor_greeting'), 'かける', 'かける', '카케루', '(말을) 걸다', '동사'),
  ((SELECT id FROM situations WHERE slug = 'neighbor_greeting'), 'いつでも', 'いつでも', '이쯔데모', '언제든지', '부사'),
  ((SELECT id FROM situations WHERE slug = 'neighbor_greeting'), 'つまらない', 'つまらない', '쯔마라나이', '보잘것없는, 시시한', '형용사'),
  ((SELECT id FROM situations WHERE slug = 'neighbor_greeting'), 'ゴミ出し', 'ごみだし', '고미다시', '쓰레기 배출', '명사'),
  ((SELECT id FROM situations WHERE slug = 'neighbor_greeting'), '分からなければ', 'わからなければ', '와카라나케레바', '모르면', '표현'),
  ((SELECT id FROM situations WHERE slug = 'neighbor_greeting'), '聞く', 'きく', '키쿠', '듣다, 묻다', '동사')
;

-- Vocabulary INSERT for office_guide (14 words)
INSERT INTO vocabulary (situation_id, word_ja, reading_hiragana, reading_ko, meaning_ko, pos) VALUES
  ((SELECT id FROM situations WHERE slug = 'office_guide'), 'お待たせいたしました', 'おまたせいたしました', '오마타세 이타시마시타', '기다리게 했습니다', '표현'),
  ((SELECT id FROM situations WHERE slug = 'office_guide'), '会議室', 'かいぎしつ', '카이기시츠', '회의실', '명사'),
  ((SELECT id FROM situations WHERE slug = 'office_guide'), 'ご案内', 'ごあんない', '고안나이', '안내', '명사'),
  ((SELECT id FROM situations WHERE slug = 'office_guide'), 'ご案内いたします', 'ごあんないいたします', '고안나이 이타시마스', '안내하겠습니다', '표현'),
  ((SELECT id FROM situations WHERE slug = 'office_guide'), 'お手数', 'おてすう', '오테스-', '수고, 번거로움', '명사'),
  ((SELECT id FROM situations WHERE slug = 'office_guide'), 'おかけします', 'おかけします', '오카케시마스', '폐를 끼치다', '표현'),
  ((SELECT id FROM situations WHERE slug = 'office_guide'), '足元', 'あしもと', '아시모토', '발밑', '명사'),
  ((SELECT id FROM situations WHERE slug = 'office_guide'), '気をつける', 'きをつける', '키오 츠케루', '조심하다, 주의하다', '동사'),
  ((SELECT id FROM situations WHERE slug = 'office_guide'), '立派', 'りっぱ', '릿파', '훌륭함', '형용사'),
  ((SELECT id FROM situations WHERE slug = 'office_guide'), 'オフィス', 'オフィス', '오피스', '사무실', '명사'),
  ((SELECT id FROM situations WHERE slug = 'office_guide'), '恐れ入ります', 'おそれいります', '오소레이리마스', '죄송합니다 / 감사합니다 (겸양)', '표현'),
  ((SELECT id FROM situations WHERE slug = 'office_guide'), 'お待ちください', 'おまちください', '오마치 쿠다사이', '기다려 주세요', '표현'),
  ((SELECT id FROM situations WHERE slug = 'office_guide'), 'どうぞ', 'どうぞ', '도-조', '어서, 자', '부사'),
  ((SELECT id FROM situations WHERE slug = 'office_guide'), 'こちら', 'こちら', '코치라', '이쪽', '명사')
;

-- Vocabulary INSERT for part_time_interview (20 words)
INSERT INTO vocabulary (situation_id, word_ja, reading_hiragana, reading_ko, meaning_ko, pos) VALUES
  ((SELECT id FROM situations WHERE slug = 'part_time_interview'), '本日', 'ほんじつ', '혼지츠', '오늘', '명사'),
  ((SELECT id FROM situations WHERE slug = 'part_time_interview'), '面接', 'めんせつ', '멘세츠', '면접', '명사'),
  ((SELECT id FROM situations WHERE slug = 'part_time_interview'), 'お越し', 'おこし', '오코시', '오심 (謙譲語)', '명사'),
  ((SELECT id FROM situations WHERE slug = 'part_time_interview'), '自己紹介', 'じこしょうかい', '지코쇼-카이', '자기소개', '명사'),
  ((SELECT id FROM situations WHERE slug = 'part_time_interview'), 'お願い', 'おねがい', '오네가이', '부탁', '명사'),
  ((SELECT id FROM situations WHERE slug = 'part_time_interview'), '申す', 'もうす', '모-스', '말하다 (謙譲語)', '동사'),
  ((SELECT id FROM situations WHERE slug = 'part_time_interview'), '韓国', 'かんこく', '칸코쿠', '한국', '명사'),
  ((SELECT id FROM situations WHERE slug = 'part_time_interview'), '通う', 'かよう', '카요-', '다니다', '동사'),
  ((SELECT id FROM situations WHERE slug = 'part_time_interview'), '週', 'しゅう', '슈-', '주', '명사'),
  ((SELECT id FROM situations WHERE slug = 'part_time_interview'), '何日', 'なんにち', '난니치', '며칠', '명사'),
  ((SELECT id FROM situations WHERE slug = 'part_time_interview'), '入れる', 'いれる', '이레루', '넣다, (시간을) 내다', '동사'),
  ((SELECT id FROM situations WHERE slug = 'part_time_interview'), '土日', 'どにち', '도니치', '주말', '명사'),
  ((SELECT id FROM situations WHERE slug = 'part_time_interview'), '大丈夫', 'だいじょうぶ', '다이죠-부', '괜찮음', '형용사'),
  ((SELECT id FROM situations WHERE slug = 'part_time_interview'), '難しい', 'むずかしい', '무즈카시이', '어렵다', '형용사'),
  ((SELECT id FROM situations WHERE slug = 'part_time_interview'), '分かりました', 'わかりました', '와카리마시타', '알겠습니다', '표현'),
  ((SELECT id FROM situations WHERE slug = 'part_time_interview'), '来週', 'らいしゅう', '라이슈-', '다음 주', '명사'),
  ((SELECT id FROM situations WHERE slug = 'part_time_interview'), '来られる', 'こられる', '코라레루', '오다 (가능형)', '동사'),
  ((SELECT id FROM situations WHERE slug = 'part_time_interview'), '時給', 'じきゅう', '지큐-', '시급', '명사'),
  ((SELECT id FROM situations WHERE slug = 'part_time_interview'), '九百五十円', 'きゅうひゃくごじゅうえん', '큐-햐쿠 고쥬-엔', '950엔', '명사'),
  ((SELECT id FROM situations WHERE slug = 'part_time_interview'), '三日', 'みっか', '밋카', '3일', '명사')
;

-- Vocabulary INSERT for phone_contract (18 words)
INSERT INTO vocabulary (situation_id, word_ja, reading_hiragana, reading_ko, meaning_ko, pos) VALUES
  ((SELECT id FROM situations WHERE slug = 'phone_contract'), 'いらっしゃいませ', 'いらっしゃいませ', '이랏샤이마세', '어서 오세요', '표현'),
  ((SELECT id FROM situations WHERE slug = 'phone_contract'), '新規契約', 'しんきけいやく', '싱키케이야쿠', '신규 계약', '명사'),
  ((SELECT id FROM situations WHERE slug = 'phone_contract'), '機種変更', 'きしゅへんこう', '키슈헨코-', '기종 변경', '명사'),
  ((SELECT id FROM situations WHERE slug = 'phone_contract'), '外国人', 'がいこくじん', '가이코쿠진', '외국인', '명사'),
  ((SELECT id FROM situations WHERE slug = 'phone_contract'), '契約', 'けいやく', '케이야쿠', '계약', '명사'),
  ((SELECT id FROM situations WHERE slug = 'phone_contract'), 'できる', 'できる', '데키루', '할 수 있다', '동사'),
  ((SELECT id FROM situations WHERE slug = 'phone_contract'), '在留カード', 'ざいりゅうカード', '자이류-카-도', '재류 카드', '명사'),
  ((SELECT id FROM situations WHERE slug = 'phone_contract'), '大丈夫', 'だいじょうぶ', '다이죠-부', '괜찮다, 문제없다', '형용사'),
  ((SELECT id FROM situations WHERE slug = 'phone_contract'), 'プラン', 'プラン', '푸란', '요금제, 플랜', '명사'),
  ((SELECT id FROM situations WHERE slug = 'phone_contract'), 'どうされますか', 'どうされますか', '도-사레마스카', '어떻게 하시겠습니까?', '표현'),
  ((SELECT id FROM situations WHERE slug = 'phone_contract'), '一番', 'いちばん', '이치방', '가장, 제일', '부사'),
  ((SELECT id FROM situations WHERE slug = 'phone_contract'), '安い', 'やすい', '야스이', '싸다', '형용사'),
  ((SELECT id FROM situations WHERE slug = 'phone_contract'), '月々', 'つきづき', '츠키즈키', '매달', '명사'),
  ((SELECT id FROM situations WHERE slug = 'phone_contract'), 'いくら', 'いくら', '이쿠라', '얼마', '명사'),
  ((SELECT id FROM situations WHERE slug = 'phone_contract'), '二千円', 'にせんえん', '니센엔', '2000엔', '명사'),
  ((SELECT id FROM situations WHERE slug = 'phone_contract'), 'データ', 'データ', '데-타', '데이터', '명사'),
  ((SELECT id FROM situations WHERE slug = 'phone_contract'), '使える', 'つかえる', '츠카에루', '사용할 수 있다', '동사'),
  ((SELECT id FROM situations WHERE slug = 'phone_contract'), 'ギガ', 'ギガ', '기가', '기가바이트', '명사')
;

-- Vocabulary INSERT for post_office (18 words)
INSERT INTO vocabulary (situation_id, word_ja, reading_hiragana, reading_ko, meaning_ko, pos) VALUES
  ((SELECT id FROM situations WHERE slug = 'post_office'), 'いらっしゃいませ', 'いらっしゃいませ', '이랏샤이마세', '어서 오세요', '표현'),
  ((SELECT id FROM situations WHERE slug = 'post_office'), 'どのような', 'どのような', '도노요-나', '어떤', '표현'),
  ((SELECT id FROM situations WHERE slug = 'post_office'), 'ご用件', 'ごようけん', '고요-켄', '용건', '명사'),
  ((SELECT id FROM situations WHERE slug = 'post_office'), '韓国', 'かんこく', '칸코쿠', '한국', '명사'),
  ((SELECT id FROM situations WHERE slug = 'post_office'), '荷物', 'にもつ', '니모츠', '짐', '명사'),
  ((SELECT id FROM situations WHERE slug = 'post_office'), '送る', 'おくる', '오쿠루', '보내다', '동사'),
  ((SELECT id FROM situations WHERE slug = 'post_office'), '中身', 'なかみ', '나카미', '내용물', '명사'),
  ((SELECT id FROM situations WHERE slug = 'post_office'), '何', 'なに', '나니', '무엇', '명사'),
  ((SELECT id FROM situations WHERE slug = 'post_office'), '航空便', 'こうくうびん', '코-쿠-빈', '항공편', '명사'),
  ((SELECT id FROM situations WHERE slug = 'post_office'), '船便', 'ふなびん', '후나빈', '배편', '명사'),
  ((SELECT id FROM situations WHERE slug = 'post_office'), 'お菓子', 'おかし', '오카시', '과자', '명사'),
  ((SELECT id FROM situations WHERE slug = 'post_office'), '本', 'ほん', '혼', '책', '명사'),
  ((SELECT id FROM situations WHERE slug = 'post_office'), 'おねがいします', 'おねがいします', '오네가이시마스', '부탁드립니다', '표현'),
  ((SELECT id FROM situations WHERE slug = 'post_office'), '三千五百円', 'さんぜんごひゃくえん', '산젠고햐쿠엔', '3500엔', '명사'),
  ((SELECT id FROM situations WHERE slug = 'post_office'), '円', 'えん', '엔', '엔 (화폐 단위)', '명사'),
  ((SELECT id FROM situations WHERE slug = 'post_office'), '一週間', 'いっしゅうかん', '잇슈-칸', '일주일', '명사'),
  ((SELECT id FROM situations WHERE slug = 'post_office'), '届く', 'とどく', '토도쿠', '도착하다', '동사'),
  ((SELECT id FROM situations WHERE slug = 'post_office'), 'ほど', 'ほど', '호도', '정도', '명사')
;

-- Vocabulary INSERT for real_estate (20 words)
INSERT INTO vocabulary (situation_id, word_ja, reading_hiragana, reading_ko, meaning_ko, pos) VALUES
  ((SELECT id FROM situations WHERE slug = 'real_estate'), 'いらっしゃいませ', 'いらっしゃいませ', '이랏샤이마세', '어서 오세요', '표현'),
  ((SELECT id FROM situations WHERE slug = 'real_estate'), '部屋(へや)', 'へや', '헤야', '방', '명사'),
  ((SELECT id FROM situations WHERE slug = 'real_estate'), '探す(さがす)', 'さがす', '사가스', '찾다', '동사'),
  ((SELECT id FROM situations WHERE slug = 'real_estate'), '駅(えき)', 'えき', '에키', '역', '명사'),
  ((SELECT id FROM situations WHERE slug = 'real_estate'), '近い(ちかい)', 'ちかい', '치카이', '가깝다', '형용사'),
  ((SELECT id FROM situations WHERE slug = 'real_estate'), '家賃(やちん)', 'やちん', '야칭', '집세', '명사'),
  ((SELECT id FROM situations WHERE slug = 'real_estate'), '五万円(ごまんえん)', 'ごまんえん', '고망엔', '5만 엔', '명사'),
  ((SELECT id FROM situations WHERE slug = 'real_estate'), '以下(いか)', 'いか', '이카', '이하', '명사'),
  ((SELECT id FROM situations WHERE slug = 'real_estate'), 'ワンルーム', 'ワンルーム', '완루-무', '원룸', '명사'),
  ((SELECT id FROM situations WHERE slug = 'real_estate'), '物件(ぶっけん)', 'ぶっけん', '붓켄', '물건, 부동산', '명사'),
  ((SELECT id FROM situations WHERE slug = 'real_estate'), 'いかが', 'いかが', '이카가', '어떠신가요?', '표현'),
  ((SELECT id FROM situations WHERE slug = 'real_estate'), '初期費用(しょきひよう)', 'しょきひよう', '쇼키히요-', '초기 비용', '명사'),
  ((SELECT id FROM situations WHERE slug = 'real_estate'), 'どのくらい', 'どのくらい', '도노쿠라이', '어느 정도', '표현'),
  ((SELECT id FROM situations WHERE slug = 'real_estate'), 'かかる', 'かかる', '카카루', '걸리다, 들다', '동사'),
  ((SELECT id FROM situations WHERE slug = 'real_estate'), '敷金(しききん)', 'しききん', '시키킨', '보증금', '명사'),
  ((SELECT id FROM situations WHERE slug = 'real_estate'), '礼金(れいきん)', 'れいきん', '레이킨', '사례금', '명사'),
  ((SELECT id FROM situations WHERE slug = 'real_estate'), '約(やく)', 'やく', '야쿠', '약', '부사'),
  ((SELECT id FROM situations WHERE slug = 'real_estate'), '十五万円(じゅうごまんえん)', 'じゅうごまんえん', '쥬-고망엔', '15만 엔', '명사'),
  ((SELECT id FROM situations WHERE slug = 'real_estate'), '内見(ないけん)', 'ないけん', '나이켄', '방을 미리 봄', '명사'),
  ((SELECT id FROM situations WHERE slug = 'real_estate'), 'する', 'する', '스루', '하다', '동사')
;

-- Vocabulary INSERT for restaurant (13 words)
INSERT INTO vocabulary (situation_id, word_ja, reading_hiragana, reading_ko, meaning_ko, pos) VALUES
  ((SELECT id FROM situations WHERE slug = 'restaurant'), 'いらっしゃいませ', 'いらっしゃいませ', '이랏샤이마세', '어서 오세요', '표현'),
  ((SELECT id FROM situations WHERE slug = 'restaurant'), '何名様', 'なんめいさま', '난메-사마', '몇 분이십니까', '명사'),
  ((SELECT id FROM situations WHERE slug = 'restaurant'), '一人', 'ひとり', '히토리', '한 명', '명사'),
  ((SELECT id FROM situations WHERE slug = 'restaurant'), 'メニュー', 'メニュー', '메뉴-', '메뉴', '명사'),
  ((SELECT id FROM situations WHERE slug = 'restaurant'), 'お願い(する)', 'おねがい(する)', '오네가이(스루)', '부탁(하다)', '동사'),
  ((SELECT id FROM situations WHERE slug = 'restaurant'), 'ご注文', 'ごちゅうもん', '고츄-몬', '주문', '명사'),
  ((SELECT id FROM situations WHERE slug = 'restaurant'), '決まる', 'きまる', '키마루', '정해지다, 결정되다', '동사'),
  ((SELECT id FROM situations WHERE slug = 'restaurant'), 'お呼び(する)', 'および(する)', '오요비(스루)', '부르다', '동사'),
  ((SELECT id FROM situations WHERE slug = 'restaurant'), 'すみません', 'すみません', '스미마센', '죄송합니다, 실례합니다', '표현'),
  ((SELECT id FROM situations WHERE slug = 'restaurant'), 'これ', 'これ', '코레', '이것', '명사'),
  ((SELECT id FROM situations WHERE slug = 'restaurant'), 'かしこまりました', 'かしこまりました', '카시코마리마시타', '알겠습니다, 분부대로 하겠습니다', '표현'),
  ((SELECT id FROM situations WHERE slug = 'restaurant'), '少々', 'しょうしょう', '쇼-쇼-', '잠시, 잠깐', '부사'),
  ((SELECT id FROM situations WHERE slug = 'restaurant'), '待つ', 'まつ', '마츠', '기다리다', '동사')
;

-- Vocabulary INSERT for supermarket (14 words)
INSERT INTO vocabulary (situation_id, word_ja, reading_hiragana, reading_ko, meaning_ko, pos) VALUES
  ((SELECT id FROM situations WHERE slug = 'supermarket'), 'ポイントカード', 'ポイントカード', '포인토카-도', '포인트 카드', '명사'),
  ((SELECT id FROM situations WHERE slug = 'supermarket'), '持つ', 'もつ', '모츠', '가지다', '동사'),
  ((SELECT id FROM situations WHERE slug = 'supermarket'), '袋', 'ふくろ', '후쿠로', '봉투, 봉지', '명사'),
  ((SELECT id FROM situations WHERE slug = 'supermarket'), '有料', 'ゆうりょう', '유-료-', '유료', '명사'),
  ((SELECT id FROM situations WHERE slug = 'supermarket'), '要る', 'いる', '이루', '필요하다', '동사'),
  ((SELECT id FROM situations WHERE slug = 'supermarket'), '小さい', 'ちいさい', '치-사이', '작다', '형용사'),
  ((SELECT id FROM situations WHERE slug = 'supermarket'), '一枚', 'いちまい', '이치마이', '한 장', '명사'),
  ((SELECT id FROM situations WHERE slug = 'supermarket'), 'お願い(します)', 'おねがい(します)', '오네가이(시마스)', '부탁(드립니다)', '표현'),
  ((SELECT id FROM situations WHERE slug = 'supermarket'), '千', 'せん', '센', '천', '명사'),
  ((SELECT id FROM situations WHERE slug = 'supermarket'), '二百', 'にひゃく', '니햐쿠', '이백', '명사'),
  ((SELECT id FROM situations WHERE slug = 'supermarket'), '円', 'えん', '엔', '엔 (화폐 단위)', '명사'),
  ((SELECT id FROM situations WHERE slug = 'supermarket'), 'Paypay', 'ペイペイ', '페-페이', '페이페이', '명사'),
  ((SELECT id FROM situations WHERE slug = 'supermarket'), '使う', 'つかう', '츠카우', '사용하다', '동사'),
  ((SELECT id FROM situations WHERE slug = 'supermarket'), 'いいえ', 'いいえ', '이-에', '아니오', '감탄사')
;

-- Vocabulary INSERT for taxi (12 words)
INSERT INTO vocabulary (situation_id, word_ja, reading_hiragana, reading_ko, meaning_ko, pos) VALUES
  ((SELECT id FROM situations WHERE slug = 'taxi'), 'どちら', 'どちら', '도치라', '어느 쪽, 어디', '명사'),
  ((SELECT id FROM situations WHERE slug = 'taxi'), '行く', 'いく', '이쿠', '가다', '동사'),
  ((SELECT id FROM situations WHERE slug = 'taxi'), '住所', 'じゅうしょ', '쥬-쇼', '주소', '명사'),
  ((SELECT id FROM situations WHERE slug = 'taxi'), '急ぐ', 'いそぐ', '이소구', '서두르다', '동사'),
  ((SELECT id FROM situations WHERE slug = 'taxi'), '分かりました', 'わかりました', '와카리마시타', '알겠습니다', '표현'),
  ((SELECT id FROM situations WHERE slug = 'taxi'), '道', 'みち', '미치', '길', '명사'),
  ((SELECT id FROM situations WHERE slug = 'taxi'), '混む', 'こむ', '코무', '붐비다', '동사'),
  ((SELECT id FROM situations WHERE slug = 'taxi'), '頑張る', 'がんばる', '감바루', '힘내다', '동사'),
  ((SELECT id FROM situations WHERE slug = 'taxi'), 'クレジットカード', 'クレジットカード', '쿠레짓토카-도', '신용카드', '명사'),
  ((SELECT id FROM situations WHERE slug = 'taxi'), '使う', 'つかう', '츠카우', '사용하다', '동사'),
  ((SELECT id FROM situations WHERE slug = 'taxi'), '大丈夫', 'だいじょうぶ', '다이죠-부', '괜찮습니다', '형용사'),
  ((SELECT id FROM situations WHERE slug = 'taxi'), '二千五百円', 'にせんごひゃくえん', '니센고햐쿠엔', '2500엔', '명사')
;

-- Vocabulary INSERT for train_station (12 words)
INSERT INTO vocabulary (situation_id, word_ja, reading_hiragana, reading_ko, meaning_ko, pos) VALUES
  ((SELECT id FROM situations WHERE slug = 'train_station'), 'いらっしゃいませ', 'いらっしゃいませ', '이랏샤이마세', '어서 오세요', '표현'),
  ((SELECT id FROM situations WHERE slug = 'train_station'), 'どちら', 'どちら', '도치라', '어디', '명사'),
  ((SELECT id FROM situations WHERE slug = 'train_station'), 'まで', 'まで', '마데', '~까지', '조사'),
  ((SELECT id FROM situations WHERE slug = 'train_station'), '東京駅', 'とうきょうえき', '토-쿄-에키', '도쿄역', '명사'),
  ((SELECT id FROM situations WHERE slug = 'train_station'), 'お願い(おねがい)します', 'おねがいします', '오네가이시마스', '부탁합니다', '표현'),
  ((SELECT id FROM situations WHERE slug = 'train_station'), '片道(かたみち)', 'かたみち', '카타미치', '편도', '명사'),
  ((SELECT id FROM situations WHERE slug = 'train_station'), '往復(おうふく)', 'おうふく', '오-후쿠', '왕복', '명사'),
  ((SELECT id FROM situations WHERE slug = 'train_station'), 'ですか', 'ですか', '데스카', '~입니까?', '조사'),
  ((SELECT id FROM situations WHERE slug = 'train_station'), '一枚(いちまい)', 'いちまい', '이치마이', '한 장', '명사'),
  ((SELECT id FROM situations WHERE slug = 'train_station'), '五百円(ごひゃくえん)', 'ごひゃくえん', '고햐쿠엔', '500엔', '명사'),
  ((SELECT id FROM situations WHERE slug = 'train_station'), '番線(ばんせん)', 'ばんせん', '반센', '승강장 번호', '명사'),
  ((SELECT id FROM situations WHERE slug = 'train_station'), 'どうぞ', 'どうぞ', '도-조', '어서, 자', '표현')
;

