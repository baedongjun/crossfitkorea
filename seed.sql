-- 유저 생성 (BCrypt: password123)
INSERT INTO users (email, password, name, phone, role, active, created_at, updated_at)
VALUES ('user1@crossfitkorea.com', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lHHy', '김민준', '010-2345-6789', 'ROLE_USER', true, NOW(), NOW())
ON CONFLICT (email) DO NOTHING;

-- 박스 10개
INSERT INTO boxes (name, address, city, district, latitude, longitude, phone, website, instagram, description, monthly_fee, open_time, close_time, rating, review_count, verified, premium, active, created_at, updated_at) VALUES
('크로스핏 강남', '서울특별시 강남구 테헤란로 123', '서울', '강남구', 37.5065, 127.0536, '02-1234-5678', 'https://cfgangnam.com', '@cfgangnam', '강남 한복판에 위치한 프리미엄 크로스핏 박스. 전문 코치진과 함께하는 체계적인 훈련 프로그램으로 초보자부터 선수까지 함께합니다.', 150000, '06:00', '22:00', 4.8, 42, true, true, true, NOW(), NOW()),
('크로스핏 마포', '서울특별시 마포구 홍익로 45', '서울', '마포구', 37.5508, 126.9094, '02-2345-6789', 'https://cfmapo.com', '@cfmapo', '홍대 인근에 위치한 활기찬 크로스핏 박스. 젊고 역동적인 분위기에서 WOD를 즐겨보세요. 매일 새로운 도전이 기다립니다.', 130000, '05:30', '23:00', 4.6, 38, true, false, true, NOW(), NOW()),
('크로스핏 해운대', '부산광역시 해운대구 해운대해변로 78', '부산', '해운대구', 35.1587, 129.1602, '051-3456-7890', 'https://cfhaeundae.com', '@cfhaeundae', '해운대 바다 전망을 즐기며 운동하는 특별한 크로스핏 박스. 바다를 바라보며 하는 WOD는 더욱 특별합니다.', 120000, '06:00', '21:00', 4.7, 29, true, true, true, NOW(), NOW()),
('크로스핏 판교', '경기도 성남시 분당구 판교역로 200', '경기', '성남시', 37.3943, 127.1108, '031-4567-8901', 'https://cfpangyo.com', '@cfpangyo', '판교 IT 밸리의 직장인을 위한 크로스핏 박스. 점심시간 특별 클래스 운영, 퇴근 후 스트레스 날려버리세요.', 140000, '06:30', '22:30', 4.5, 51, true, false, true, NOW(), NOW()),
('크로스핏 송파', '서울특별시 송파구 올림픽로 300', '서울', '송파구', 37.5145, 127.1059, '02-5678-9012', 'https://cfsongpa.com', '@cfsongpa', '잠실 올림픽공원 인근의 넓은 크로스핏 박스. 최신 장비와 넓은 공간에서 쾌적하게 운동하세요. 주차 완비.', 135000, '06:00', '22:00', 4.4, 33, true, false, true, NOW(), NOW()),
('크로스핏 인천연수', '인천광역시 연수구 컨벤시아대로 100', '인천', '연수구', 37.3888, 126.6403, '032-6789-0123', 'https://cfincheon.com', '@cfincheon', '송도국제도시에 위치한 모던 크로스핏 박스. 국제도시에 걸맞은 최첨단 시설과 전문 코칭으로 운동의 즐거움을 경험하세요.', 125000, '06:00', '21:30', 4.3, 22, true, false, true, NOW(), NOW()),
('크로스핏 대구수성', '대구광역시 수성구 달구벌대로 456', '대구', '수성구', 35.8561, 128.6317, '053-7890-1234', 'https://cfdaegu.com', '@cfdaegu', '대구의 중심 수성구에 자리한 크로스핏 박스. 지역 커뮤니티와 함께 성장하는 크로스핏 문화를 만들어갑니다.', 110000, '06:00', '21:00', 4.5, 18, true, false, true, NOW(), NOW()),
('크로스핏 광주상무', '광주광역시 서구 상무중앙로 89', '광주', '서구', 35.1533, 126.8525, '062-8901-2345', 'https://cfgwangju.com', '@cfgwangju', '광주 상무지구의 활기찬 크로스핏 박스. 호남 최고의 코치진과 함께 더 강해지는 나를 만나보세요.', 100000, '06:00', '21:00', 4.6, 25, false, false, true, NOW(), NOW()),
('크로스핏 용인기흥', '경기도 용인시 기흥구 동백중앙로 55', '경기', '용인시', 37.2742, 127.1151, '031-9012-3456', 'https://cfyongin.com', '@cfyongin', '동백 신도시의 크로스핏 박스. 가족 모두가 함께할 수 있는 키즈 크로스핏 프로그램 운영 중. 온가족 건강을 책임집니다.', 115000, '06:30', '21:30', 4.2, 15, false, false, true, NOW(), NOW()),
('크로스핏 제주', '제주특별자치도 제주시 노형로 22', '제주', '제주시', 33.4890, 126.4983, '064-0123-4567', 'https://cfjeju.com', '@cfjeju', '아름다운 제주에서 즐기는 크로스핏. 자연 속에서 운동하는 특별한 경험, 제주 여행 중에도 WOD를 즐겨보세요.', 120000, '07:00', '20:00', 4.9, 47, true, true, true, NOW(), NOW());

-- 커뮤니티 자유게시판 게시물 10개
INSERT INTO posts (user_id, title, content, category, view_count, like_count, comment_count, pinned, active, created_at, updated_at)
VALUES
((SELECT id FROM users WHERE email = 'user1@crossfitkorea.com'),
'처음 크로스핏 시작하는데 이것만은 알고 가세요',
'안녕하세요! 크로스핏 입문한 지 6개월 된 초보입니다. 처음 시작할 때 아무것도 몰라서 고생했는데, 제가 겪은 것들 공유해드릴게요.

1. 스케일링은 부끄러운 게 아닙니다
처음엔 RX로 해야 한다는 압박이 있는데, 스케일링은 정말 중요해요. 부상 없이 오래 하려면 꼭 스케일링 하세요.

2. 움직임 패턴이 먼저입니다
무게보다 폼이 훨씬 중요해요. 스쿼트, 데드리프트 기본 폼을 완벽히 익히고 나서 무게 올리세요.

3. 회복도 훈련입니다
매일 하고 싶은 마음은 알지만, 충분한 수면과 영양 섭취가 없으면 오히려 역효과 나요.

4. 커뮤니티를 즐기세요
크로스핏의 진짜 매력은 박스 사람들과의 유대감이에요. 서로 응원하면서 더 열심히 하게 됩니다.',
'FREE', 324, 28, 5, false, true, NOW() - INTERVAL '10 days', NOW() - INTERVAL '10 days'),

((SELECT id FROM users WHERE email = 'user1@crossfitkorea.com'),
'Fran 처음으로 5분대 완료했습니다!',
'드디어 해냈습니다!! Fran 4:52!!

작년 이맘때 처음 Fran 했을 때 13분이 넘었는데 오늘 드디어 5분 벽을 깼네요.

Thruster 95lb + Pull-up 21-15-9 풀RX로 완료했습니다.

1년 동안 매일 박스 나오면서 풀업 강화, 쓰러스터 폼 교정하고 또 교정하고... 정말 포기하고 싶을 때도 많았는데 코치님이랑 박스 식구들 덕분에 여기까지 왔네요.

다음 목표는 4분대입니다. 같이 화이팅해요!!',
'FREE', 512, 67, 15, false, true, NOW() - INTERVAL '9 days', NOW() - INTERVAL '9 days'),

((SELECT id FROM users WHERE email = 'user1@crossfitkorea.com'),
'오늘 WOD "Murph" 완주 후기',
'매년 Memorial Day에 하는 Murph를 오늘 드디어 완주했습니다.

1마일 런 - 풀업 100개 - 푸시업 200개 - 스쿼트 300개 - 1마일 런

총 타임: 58:34 (조끼 없이)

솔직히 중간에 포기하고 싶었어요. 풀업 50개 넘어가면서 어깨가 불타는 느낌이었고, 푸시업은 3개씩 끊어서 했습니다.

하지만 박스 코치님이 끝까지 응원해주셨고, 같이 하던 분들이 페이스 맞춰줘서 완주할 수 있었어요.

Murph는 단순한 운동이 아니라 정신력 싸움인 것 같아요. 내년엔 조끼 입고 도전해볼 생각입니다!',
'FREE', 445, 53, 12, false, true, NOW() - INTERVAL '8 days', NOW() - INTERVAL '8 days'),

((SELECT id FROM users WHERE email = 'user1@crossfitkorea.com'),
'크로스핏 박스 고르는 기준 공유해요',
'박스 이사 때문에 새로운 곳을 찾고 있는데, 제가 박스 고를 때 보는 기준들 공유할게요.

코치 자격증 확인
CFL1 이상의 자격증 보유 여부 꼭 확인하세요. 자격증이 전부는 아니지만 기본은 됩니다.

체험 수업 분위기
첫 체험 때 코치가 얼마나 세세하게 봐주는지, 기존 회원들 분위기가 편한지 체크하세요.

프로그래밍 퀄리티
무작위로 힘든 운동만 시키는 곳보다 체계적인 프로그래밍이 있는 곳이 훨씬 좋아요.

시설 청결도
바벨, 매트 위생 상태 보시면 박스 전반적인 관리 수준을 알 수 있어요.

회원 유지율
오래된 회원들이 많은 박스가 좋은 박스입니다.',
'FREE', 287, 41, 8, false, true, NOW() - INTERVAL '7 days', NOW() - INTERVAL '7 days'),

((SELECT id FROM users WHERE email = 'user1@crossfitkorea.com'),
'Clean & Jerk 1RM 갱신 100kg 달성!',
'드디어 클린앤저크 100kg 달성했습니다!!

크로스핏 시작한 지 2년 만에 드리머 웨이트인 100kg을 넘었어요.

처음 시작할 때 50kg도 버벅거렸는데... 격세지감이네요.

도움이 됐던 것들:
- 풀 스쿼트 클린 연습 (파워 클린 습관 버리기 진짜 힘들었음)
- 저크 드라이브 드릴 매일 15분씩
- 모빌리티 루틴 꾸준히 (특히 손목, 어깨, 발목)
- 식단 관리 (단백질 체중 x 2g 섭취)

다음 목표는 110kg! 같이 리프팅하는 분들 서로 응원해요~',
'FREE', 398, 89, 23, false, true, NOW() - INTERVAL '6 days', NOW() - INTERVAL '6 days'),

((SELECT id FROM users WHERE email = 'user1@crossfitkorea.com'),
'크로스핏 하면서 다이어트 성공 후기 (6개월)',
'6개월 크로스핏 결과를 공유합니다!

시작 전: 84kg, 체지방 28%
현재: 72kg, 체지방 18%

12kg 감량, 체지방 10% 감소!

제가 했던 것들:
1. 주 5회 박스 출석 (진짜 빠지기 싫어서 돈 걸고 내기도 함)
2. 식단 - 탄수화물 줄이고 단백질 늘리기. 닭가슴살, 계란, 두부 위주로
3. 술 끊기 - 사실 이게 제일 컸음
4. 수면 7시간 확보 - 크로스핏은 수면이 진짜 중요해요

가장 좋은 점은 단순히 체중이 줄었을 뿐만 아니라 힘도 세졌다는 거예요!

예전엔 계단 올라가도 숨찼는데 지금은 산도 막 뛰어다녀요.

크로스핏 망설이시는 분들 어서 시작하세요!',
'FREE', 621, 102, 31, false, true, NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days'),

((SELECT id FROM users WHERE email = 'user1@crossfitkorea.com'),
'더블언더 연습 꿀팁 모음',
'더블언더 때문에 스트레스받는 분들을 위한 팁 공유합니다!

저도 6개월 동안 한 번도 성공 못했다가 어느 날 갑자기 되더라고요.

자세
- 팔꿈치를 옆구리에 붙이고 손목만 사용
- 뛸 때 발끝으로 착지, 점프 높이는 최대한 낮게
- 눈은 정면, 상체는 곧게

줄 세팅
- 줄 길이: 발로 밟았을 때 겨드랑이 높이
- 너무 무거운 줄보다 가벼운 스피드 줄 추천

연습 방법
- 싱글-더블-싱글 패턴으로 시작
- 매일 5분씩 꾸준히 연습 (한 번에 오래하는 것보다 매일이 효과적)

멘탈
- 줄에 맞아도 당황하지 말기
- 리듬을 느끼는 게 중요해요

포기하지 마세요! 반드시 됩니다!',
'FREE', 356, 74, 19, false, true, NOW() - INTERVAL '4 days', NOW() - INTERVAL '4 days'),

((SELECT id FROM users WHERE email = 'user1@crossfitkorea.com'),
'Snatch 배우는 게 이렇게 힘들 줄이야...',
'올림픽 리프팅 중에서 스내치가 제일 어렵다고 들었는데 진짜네요.

3개월째 배우고 있는데 아직도 PVC 파이프 단계를 못 벗어난 것 같아요.

코치님이 계속 오버헤드 스쿼트 유연성이 부족하다고 하시는데, 매일 스트레칭해도 쉽게 늘지가 않네요.

스내치 빨리 늘리신 분들 어떻게 하셨나요?

현재 고민되는 것들:
- 발목 유연성이 너무 없음
- 풀 포지션에서 불안함
- 바 경로가 S자가 아니라 자꾸 앞으로 나감

경험담과 조언 부탁드립니다!',
'FREE', 234, 45, 28, false, true, NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days'),

((SELECT id FROM users WHERE email = 'user1@crossfitkorea.com'),
'크로스핏 대회 처음 나가본 후기',
'지난 주말에 처음으로 크로스핏 대회를 나갔다 왔어요!

지역 소규모 대회였는데, 참가자 120명 규모였습니다.

대회 구성
- 이벤트 1: Amrap 12분 (박스점프 + 케틀벨 스윙 + 버피)
- 이벤트 2: 1RM 클린
- 이벤트 3: 800m 런 + 테이터 + 핸드스탠드 워크

결과는 노바이스 부문 17위 (32명 중)였어요.

솔직한 후기:
좋았던 점: 박스에서 혼자 할 때보다 10배 더 열심히 하게 됨, 다른 박스 사람들 만나서 좋음, 내 레벨을 객관적으로 알 수 있음
아쉬운 점: 대회 전날 긴장해서 잠 못 잠, 생각보다 대기 시간이 길었음

처음 나가보신 분들 있으면 같이 이야기 나눠요!',
'FREE', 489, 93, 27, false, true, NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days'),

((SELECT id FROM users WHERE email = 'user1@crossfitkorea.com'),
'크로스핏 식단 어떻게 하세요? 팔레오 vs 존 다이어트',
'크로스핏 공식 권장 식단이 팔레오와 존 다이어트인데 여러분은 어떻게 하고 계신가요?

팔레오 다이어트
- 가공식품 NO, 자연식품 위주
- 곡물, 유제품, 콩류 제한
- 장점: 심플함, 염증 감소
- 단점: 외식할 때 지키기 어려움

존 다이어트
- 탄수화물:단백질:지방 = 40:30:30 비율
- 블록 단위로 계산
- 장점: 체계적, 과학적
- 단점: 처음 계산 복잡함

저는 개인적으로 너무 엄격히 지키면 오래 못 하더라고요.

지금은 80/20 원칙으로 평일엔 최대한 팔레오식으로, 주말엔 즐기는 방식으로 하고 있어요.

여러분만의 식단 노하우 공유해주세요!',
'FREE', 312, 58, 22, false, true, NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day');

-- ===========================
-- 오늘의 WOD — 2026년 3월 한달치 (공통 WOD, box_id = NULL)
-- ON CONFLICT 없이 WHERE NOT EXISTS 패턴으로 중복 방지
-- ===========================

-- 3/1 (일) 휴식
INSERT INTO wods (box_id, wod_date, title, type, content, score_type, active, created_at, updated_at)
SELECT NULL, '2026-03-01', '휴식의 날', 'REST_DAY',
'오늘은 완전한 휴식을 취하세요.

추천 활동:
- 20~30분 가벼운 걷기
- 폼롤러 근막 이완
- 충분한 수면 (8시간 이상)

회복도 훈련의 일부입니다. 몸이 보내는 신호에 귀를 기울이세요.',
NULL, true, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM wods WHERE wod_date = '2026-03-01' AND box_id IS NULL);

-- 3/2 (월) 근력
INSERT INTO wods (box_id, wod_date, title, type, content, score_type, active, created_at, updated_at)
SELECT NULL, '2026-03-02', '백 스쿼트 5x5', 'STRENGTH',
'웜업: 빈 바 x10 → 50% x5 → 70% x3

본 세트:
Back Squat 5 x 5
→ 지난 주 대비 2.5~5kg 증량 도전

포인트:
- 크리즈가 무릎 아래까지 내려가는 딥 스쿼트
- 허리 중립 유지, 코어 브레이싱 필수
- 무릎이 발끝 방향으로

쿨다운:
- 피전 스트레칭 각 2분
- 햄스트링 스트레칭',
'WEIGHT', true, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM wods WHERE wod_date = '2026-03-02' AND box_id IS NULL);

-- 3/3 (화) Fran
INSERT INTO wods (box_id, wod_date, title, type, content, score_type, active, created_at, updated_at)
SELECT NULL, '2026-03-03', 'Fran', 'FOR_TIME',
'21-15-9 for time:
- Thruster 42.5/30kg
- Pull-up

★ CrossFit 벤치마크 WOD
목표 시간: 서브 10분
엘리트: 서브 5분

RX: 42.5kg(남) / 30kg(여)
Scaled: 30kg(남) / 20kg(여) + Ring Row

포인트:
- 스쿼트 바텀에서 폭발적인 드라이브로 프레스 연결
- 풀업 분할 전략을 미리 세울 것',
'TIME', true, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM wods WHERE wod_date = '2026-03-03' AND box_id IS NULL);

-- 3/4 (수) EMOM
INSERT INTO wods (box_id, wod_date, title, type, content, score_type, active, created_at, updated_at)
SELECT NULL, '2026-03-04', 'EMOM 20 — Power Clean + Box Jump', 'EMOM',
'20분 EMOM (홀수/짝수 분 교대):
홀수 분: Power Clean 3회 (1RM의 70%)
짝수 분: Box Jump 6회 (60/50cm)

총 30회 Power Clean + 60회 Box Jump

포인트:
- 클린: 풀 익스텐션 완성 후 빠른 캐치
- 박스점프: 소프트 랜딩, 무릎 보호
- 각 분당 최소 15초 휴식 확보',
'ROUNDS', true, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM wods WHERE wod_date = '2026-03-04' AND box_id IS NULL);

-- 3/5 (목) AMRAP
INSERT INTO wods (box_id, wod_date, title, type, content, score_type, active, created_at, updated_at)
SELECT NULL, '2026-03-05', 'AMRAP 15 — Triple Threat', 'AMRAP',
'15분 AMRAP:
- Wall Ball 14회 (9/6kg, 10ft/9ft 타겟)
- KB Swing 14회 (24/16kg)
- Burpee 7회

RX: 9kg Wall Ball, 24kg KB
Scaled: 6kg Wall Ball, 16kg KB

목표: 5라운드 이상

포인트:
- 월볼: 스쿼트 바텀에서 폭발 후 공 던지기
- KB 스윙: 힙 힌지, 허리 사용 금지',
'ROUNDS', true, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM wods WHERE wod_date = '2026-03-05' AND box_id IS NULL);

-- 3/6 (금) For Time
INSERT INTO wods (box_id, wod_date, title, type, content, score_type, active, created_at, updated_at)
SELECT NULL, '2026-03-06', '5 RFT — Run & Deadlift', 'FOR_TIME',
'5 Rounds for time:
- 400m Run
- Deadlift 15회 (102.5/70kg)

Time cap: 25분

RX: 102.5kg(남) / 70kg(여)
Scaled: 70kg(남) / 47.5kg(여)

포인트:
- 데드리프트: 허리 중립, 바를 몸에 붙여서
- 런 페이스: 1~2라운드에서 너무 빠르게 가지 말 것
- 마지막 런은 전력 질주',
'TIME', true, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM wods WHERE wod_date = '2026-03-06' AND box_id IS NULL);

-- 3/7 (토) Cindy
INSERT INTO wods (box_id, wod_date, title, type, content, score_type, active, created_at, updated_at)
SELECT NULL, '2026-03-07', 'Cindy', 'AMRAP',
'20분 AMRAP:
- Pull-up 5회
- Push-up 10회
- Air Squat 15회

★ CrossFit 벤치마크 WOD
목표: 20라운드 이상
엘리트: 30라운드 이상

Scaled: Ring Row / 무릎 푸시업 / 스쿼트

포인트:
- 처음 5분은 여유있게 시작
- 풀업 피로 전에 나눠서 처리
- 스쿼트는 전체 레인지, 힙 크리즈를 무릎 아래로',
'ROUNDS', true, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM wods WHERE wod_date = '2026-03-07' AND box_id IS NULL);

-- 3/8 (일) 액티브 리커버리
INSERT INTO wods (box_id, wod_date, title, type, content, score_type, active, created_at, updated_at)
SELECT NULL, '2026-03-08', '액티브 리커버리', 'REST_DAY',
'완전 휴식 또는 가벼운 활동:
- 20~30분 걷기 또는 가벼운 조깅
- 요가 / 스트레칭
- 폼롤러 근막 이완 (종아리, 햄스트링, 등)

이번 주 운동 돌아보기:
좋았던 점과 개선할 점을 일지에 기록해보세요.
회복도 훈련의 일부입니다.',
NULL, true, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM wods WHERE wod_date = '2026-03-08' AND box_id IS NULL);

-- 3/9 (월) 데드리프트 1RM
INSERT INTO wods (box_id, wod_date, title, type, content, score_type, active, created_at, updated_at)
SELECT NULL, '2026-03-09', '데드리프트 1RM 도전', 'STRENGTH',
'웜업: 빈 바 x10 → 50% x5 → 70% x3 → 80% x2 → 90% x1

본 세트: 1RM 도전 (최대 3회 시도)

1RM 달성 후:
- 70% x 5 x 3세트 (볼륨 작업)

포인트:
- 시작 자세: 바가 정강이에 닿은 상태
- 힙 드라이브로 무릎 지나는 순간 마무리
- 내려올 때 바를 몸에 붙여서
- 무거운 무게일수록 벨트 착용 권장',
'WEIGHT', true, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM wods WHERE wod_date = '2026-03-09' AND box_id IS NULL);

-- 3/10 (화) AMRAP
INSERT INTO wods (box_id, wod_date, title, type, content, score_type, active, created_at, updated_at)
SELECT NULL, '2026-03-10', 'AMRAP 12 — Snatch Combo', 'AMRAP',
'12분 AMRAP:
- Hang Power Snatch 5회 (52.5/35kg)
- Box Jump Over 10회 (60/50cm)
- Double Under 30회

Scaled: 35/25kg, Step Over, Single Under 60회

목표: 4라운드 이상

포인트:
- 스내치: 풀 익스텐션 후 빠른 엘보우 회전
- 박스점프 오버: 양발 착지 또는 한발씩 허용
- 더블언더: 리듬을 잃지 않는 것이 핵심',
'ROUNDS', true, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM wods WHERE wod_date = '2026-03-10' AND box_id IS NULL);

-- 3/11 (수) EMOM
INSERT INTO wods (box_id, wod_date, title, type, content, score_type, active, created_at, updated_at)
SELECT NULL, '2026-03-11', 'EMOM 15 — Press & Pull', 'EMOM',
'15분 EMOM (홀수/짝수 분 교대):
홀수 분: Push Press 5회 (1RM의 75%)
짝수 분: Strict Ring Row 10회

총 40회 Push Press + 50회 Ring Row

포인트:
- 푸시 프레스: 딥-드라이브-프레스 타이밍 연결
- 링로우: 몸이 수평에 가깝게 (어려울수록 좋음)
- 완전 록아웃 및 완전 스트레치 확인',
'ROUNDS', true, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM wods WHERE wod_date = '2026-03-11' AND box_id IS NULL);

-- 3/12 (목) Helen
INSERT INTO wods (box_id, wod_date, title, type, content, score_type, active, created_at, updated_at)
SELECT NULL, '2026-03-12', 'Helen', 'FOR_TIME',
'3 Rounds for time:
- 400m Run
- KB Swing 21회 (24/16kg)
- Pull-up 12회

★ CrossFit 벤치마크 WOD
목표 시간: 서브 12분
엘리트: 서브 8분

RX: 24kg(남) / 16kg(여)
Scaled: 16/12kg KB, Ring Row

포인트:
- 런 페이스: 3라운드까지 유지할 수 있는 속도로
- KB 스윙: 힙 파워로, 팔은 그냥 따라오는 것
- 풀업: 마지막 라운드 분할 전략 필요',
'TIME', true, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM wods WHERE wod_date = '2026-03-12' AND box_id IS NULL);

-- 3/13 (금) 스킬
INSERT INTO wods (box_id, wod_date, title, type, content, score_type, active, created_at, updated_at)
SELECT NULL, '2026-03-13', '스낵치 스킬 & OHS', 'SKILL',
'오버헤드 스쿼트:
- OHS 5 x 3 (가벼운 무게, 폼 집중)

스낵치 드릴 (30분):
1. Snatch Balance 3 x 5
2. Hang Snatch + OHS 복합 3세트
3. Full Snatch 기술 연습 (가벼운 무게)

모빌리티 루틴:
- 흉추 익스텐션 (폼롤러)
- 어깨 외회전 스트레칭 2분씩
- 발목 배측굴곡 개선 드릴

기록보다 움직임의 질에 집중하는 날입니다.',
NULL, true, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM wods WHERE wod_date = '2026-03-13' AND box_id IS NULL);

-- 3/14 (토) Half Murph
INSERT INTO wods (box_id, wod_date, title, type, content, score_type, active, created_at, updated_at)
SELECT NULL, '2026-03-14', 'Half Murph', 'FOR_TIME',
'For time:
- 800m Run
- Pull-up 50회
- Push-up 100회
- Air Squat 150회
- 800m Run

Time cap: 45분

RX+: 9kg 조끼 착용
Scaled: Ring Row, 무릎 푸시업

파티션 허용 (예: 5-10-15 x 10세트)

포인트:
- 초반 런에서 페이스 아끼기
- 운동 구성을 미리 계획하고 시작
- 파트너와 함께하면 더욱 강해집니다',
'TIME', true, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM wods WHERE wod_date = '2026-03-14' AND box_id IS NULL);

-- 3/15 (일) 휴식
INSERT INTO wods (box_id, wod_date, title, type, content, score_type, active, created_at, updated_at)
SELECT NULL, '2026-03-15', '휴식의 날', 'REST_DAY',
'완전 휴식을 취하세요.

추천 활동:
- 충분한 수면 (8시간 이상)
- 단백질 위주 식사로 회복 촉진
- 가벼운 산책

다음 주도 더 강해진 모습으로 만나요!',
NULL, true, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM wods WHERE wod_date = '2026-03-15' AND box_id IS NULL);

-- 3/16 (월) AMRAP
INSERT INTO wods (box_id, wod_date, title, type, content, score_type, active, created_at, updated_at)
SELECT NULL, '2026-03-16', 'Cindy + Dumbbell', 'AMRAP',
'20분 AMRAP:
- Pull-up 5회
- DB Push Press 10회 (22.5/15kg 각)
- Air Squat 15회

RX: 22.5kg 덤벨 각 손
Scaled: Ring Row, 15kg 덤벨

목표: 18라운드 이상

포인트:
- 덤벨 푸시 프레스: 딥-드라이브 활용
- 풀업: 키핑 허용, 근육 피로 전에 분할
- 페이스 조절이 핵심, 처음부터 너무 빠르게 가지 말 것',
'ROUNDS', true, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM wods WHERE wod_date = '2026-03-16' AND box_id IS NULL);

-- 3/17 (화) 근력
INSERT INTO wods (box_id, wod_date, title, type, content, score_type, active, created_at, updated_at)
SELECT NULL, '2026-03-17', 'Clean & Jerk 컴플렉스', 'STRENGTH',
'Clean & Jerk 컴플렉스:
1 Clean + 1 Hang Clean + 1 Jerk

웜업 후 본 세트 5세트:
- 무게를 점진적으로 올리며
- 마지막 세트에서 최대 무게 도전

포인트:
- 클린: 트리플 익스텐션 (발목-무릎-힙) 완성
- 저크: 딥의 깊이 일정하게, 수직 드라이브
- 컴플렉스 내에서 바 내려놓지 않기
- 저크 후 프런트 랙으로 되돌아오는 컨트롤',
'WEIGHT', true, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM wods WHERE wod_date = '2026-03-17' AND box_id IS NULL);

-- 3/18 (수) For Time
INSERT INTO wods (box_id, wod_date, title, type, content, score_type, active, created_at, updated_at)
SELECT NULL, '2026-03-18', '21-15-9 — Snatch & Burpee', 'FOR_TIME',
'21-15-9 for time:
- Hang Power Snatch (52.5/35kg)
- Burpee Over Bar

Time cap: 15분

RX: 52.5kg(남) / 35kg(여)
Scaled: 35/25kg + 스텝 오버

목표 시간: 서브 10분

포인트:
- 스내치: 풀 익스텐션 후 빠른 엘보우 회전
- 버피: 점프 후 양발 착지, 바 위로 넘기
- 21세트는 가능한 한 큰 단위로',
'TIME', true, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM wods WHERE wod_date = '2026-03-18' AND box_id IS NULL);

-- 3/19 (목) EMOM
INSERT INTO wods (box_id, wod_date, title, type, content, score_type, active, created_at, updated_at)
SELECT NULL, '2026-03-19', 'EMOM 18 — HSPU & Heavy Swings', 'EMOM',
'18분 EMOM (홀수/짝수 분 교대):
홀수 분: Strict HSPU 5회
짝수 분: Heavy KB Swing 10회 (32/24kg)

Scaled HSPU: 파이크 푸시업 또는 박스 HSPU
Scaled KB: 24/16kg

포인트:
- HSPU: 전두부 바닥 닿고 완전 록아웃 확인
- KB Swing: 힙 익스텐션, 팔은 몸통 연장선
- 어깨 누적 피로 주의, 스케일링 두려워하지 말 것',
'ROUNDS', true, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM wods WHERE wod_date = '2026-03-19' AND box_id IS NULL);

-- 3/20 (금) AMRAP
INSERT INTO wods (box_id, wod_date, title, type, content, score_type, active, created_at, updated_at)
SELECT NULL, '2026-03-20', 'AMRAP 14 — Skill Combo', 'AMRAP',
'14분 AMRAP:
- Wall Ball 10회 (9/6kg)
- Toes-to-Bar 10회
- Double Under 50회

Scaled: 6kg Wall Ball, Knee-to-Elbow, Single Under 100회

목표: 5라운드 이상

포인트:
- TTB: 어깨 활성화 먼저, 발 모아서 올리기
- 더블언더 실패 후 호흡 가다듬고 재시작
- 세 동작 사이 전환 속도가 점수를 가른다',
'ROUNDS', true, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM wods WHERE wod_date = '2026-03-20' AND box_id IS NULL);

-- 3/21 (토) Annie
INSERT INTO wods (box_id, wod_date, title, type, content, score_type, active, created_at, updated_at)
SELECT NULL, '2026-03-21', 'Annie', 'FOR_TIME',
'50-40-30-20-10 for time:
- Double Under
- Sit-up

★ CrossFit 벤치마크 WOD
목표 시간: 서브 12분
엘리트: 서브 7분

Scaled: Single Under (횟수 x2)

포인트:
- 더블언더: 리듬 유지가 핵심
- 싯업: 앱매트 사용, 발을 고정
- 빠른 인터셋 전환으로 시간 단축
- 50개는 쉬지 않고 도전해볼 것',
'TIME', true, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM wods WHERE wod_date = '2026-03-21' AND box_id IS NULL);

-- 3/22 (일) 휴식
INSERT INTO wods (box_id, wod_date, title, type, content, score_type, active, created_at, updated_at)
SELECT NULL, '2026-03-22', '주간 회복의 날', 'REST_DAY',
'한 주의 고된 훈련을 마무리하는 날입니다.

이번 주 돌아보기:
- 잘 한 점과 개선할 점을 운동 일지에 기록
- 수분 섭취와 영양 보충에 신경 쓰기
- 충분한 수면으로 회복

추천 활동:
- 폼롤러 전신 이완 20분
- 가벼운 요가 또는 스트레칭',
NULL, true, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM wods WHERE wod_date = '2026-03-22' AND box_id IS NULL);

-- 3/23 (월) 근력
INSERT INTO wods (box_id, wod_date, title, type, content, score_type, active, created_at, updated_at)
SELECT NULL, '2026-03-23', '프론트 스쿼트 5x3', 'STRENGTH',
'웜업: 빈 바 x10 → 50% x5 → 70% x3

본 세트:
Front Squat 5 x 3
→ 1RM의 80~85% 수준

보조 운동:
- Romanian Deadlift 3 x 8 (적당한 무게)

포인트:
- 엘보우를 높게 유지 (프런트 랙 포지션)
- 가슴이 앞으로 무너지지 않도록
- 코어 브레이싱: 숨을 들이마시고 잠근 상태에서 하강
- 드라이브: 힙과 어깨가 동시에 올라오도록',
'WEIGHT', true, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM wods WHERE wod_date = '2026-03-23' AND box_id IS NULL);

-- 3/24 (화) Diane
INSERT INTO wods (box_id, wod_date, title, type, content, score_type, active, created_at, updated_at)
SELECT NULL, '2026-03-24', 'Diane', 'FOR_TIME',
'21-15-9 for time:
- Deadlift (102.5/70kg)
- Handstand Push-up

★ CrossFit 벤치마크 WOD
목표 시간: 서브 8분
엘리트: 서브 4분

RX: 102.5kg(남) / 70kg(여)
Scaled: 70/47.5kg + 파이크 푸시업 or 박스 HSPU

포인트:
- 데드리프트: 세트 사이 호흡 관리
- HSPU: 머리 위치 일정하게 (트라이앵글 만들기)
- 21세트에서 무너지지 않는 것이 관건',
'TIME', true, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM wods WHERE wod_date = '2026-03-24' AND box_id IS NULL);

-- 3/25 (수) Tabata
INSERT INTO wods (box_id, wod_date, title, type, content, score_type, active, created_at, updated_at)
SELECT NULL, '2026-03-25', 'Tabata — Box Jump & Burpee', 'TABATA',
'Tabata (20초 운동 / 10초 휴식, 각 8라운드):

Block 1: Box Jump (60/50cm) x 8라운드
→ 1분 휴식
Block 2: Burpee x 8라운드

점수: 각 블록의 최저 라운드 횟수 합산
(Lowest Round Score)

포인트:
- 박스점프: 소프트 랜딩, 스텝다운 허용
- 버피: 가슴 바닥 닿고 완전 점프
- 마지막 라운드까지 같은 횟수 유지가 목표
- 전신 지구력 + 무산소 능력 훈련',
'REPS', true, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM wods WHERE wod_date = '2026-03-25' AND box_id IS NULL);

-- 3/26 (목) AMRAP
INSERT INTO wods (box_id, wod_date, title, type, content, score_type, active, created_at, updated_at)
SELECT NULL, '2026-03-26', 'AMRAP 16 — Power Combo', 'AMRAP',
'16분 AMRAP:
- Power Clean 5회 (70/47.5kg)
- Ring Dip 7회
- Assault Bike 10 Cal

Scaled: 52.5/35kg, Box Dip, 에어바이크 7 Cal

목표: 6라운드 이상

포인트:
- 파워 클린: 힙 드라이브 후 빠른 엘보우 회전
- 링딥: 어깨 중립 유지, 완전 록아웃 확인
- 바이크: 다리와 팔 동시 사용으로 효율 극대화
- 링딥 누적 피로가 클 수 있으니 초반 분할 전략 필요',
'ROUNDS', true, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM wods WHERE wod_date = '2026-03-26' AND box_id IS NULL);

-- 3/27 (금) 근력
INSERT INTO wods (box_id, wod_date, title, type, content, score_type, active, created_at, updated_at)
SELECT NULL, '2026-03-27', '벤치 프레스 + 상체 보강', 'STRENGTH',
'벤치 프레스:
- 5 x 5 (1RM의 75~80%)

보조 운동 3세트:
- Dumbbell Row 10회 (각 팔)
- Tricep Dip 15회
- Face Pull 15회 (밴드 또는 케이블)

포인트:
- 견갑골 리트랙션 (등을 짜는 느낌) 유지
- 발은 바닥에 평평하게
- 바 경로: 낮은 가슴 방향
- 스팟 없이 실패 가능 무게 금지',
'WEIGHT', true, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM wods WHERE wod_date = '2026-03-27' AND box_id IS NULL);

-- 3/28 (토) Grace
INSERT INTO wods (box_id, wod_date, title, type, content, score_type, active, created_at, updated_at)
SELECT NULL, '2026-03-28', 'Grace', 'FOR_TIME',
'For time:
30 Clean & Jerk (61/43kg)

★ CrossFit 벤치마크 WOD
목표 시간: 서브 5분
엘리트: 서브 3분

RX: 61kg(남) / 43kg(여)
Scaled: 43/30kg

포인트:
- 가능하면 바를 내려놓지 않고 진행
- 저크 분할: 스플릿 또는 파워 저크 모두 허용
- 호흡 패턴: 클린 전 들이마시고, 저크 전 잠금
- 마지막 5개: 전력으로 마무리',
'TIME', true, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM wods WHERE wod_date = '2026-03-28' AND box_id IS NULL);

-- 3/29 (일) 휴식
INSERT INTO wods (box_id, wod_date, title, type, content, score_type, active, created_at, updated_at)
SELECT NULL, '2026-03-29', '3월 마지막 휴식의 날', 'REST_DAY',
'월말 리뷰를 해보세요.

이번 달 체크리스트:
- 출석 목표 달성?
- 1RM 기록 갱신?
- 벤치마크 WOD 기록 개선?
- 영양 & 수면 관리?

3월 한 달 동안 수고 많으셨습니다.
4월에도 더 강해진 모습으로 만나요!',
NULL, true, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM wods WHERE wod_date = '2026-03-29' AND box_id IS NULL);

-- 3/30 (월) EMOM
INSERT INTO wods (box_id, wod_date, title, type, content, score_type, active, created_at, updated_at)
SELECT NULL, '2026-03-30', 'EMOM 21 — Triathlon', 'EMOM',
'21분 EMOM (3가지 동작 1분씩 순환):
분 1: Squat Snatch 3회 (1RM의 65%)
분 2: Burpee Box Jump Over 6회 (60/50cm)
분 3: Double Under 30회

총 7라운드 순환

Scaled: Hang Power Snatch / Step Over / Single Under 60회

포인트:
- 각 분당 최소 15초 휴식 확보
- 스내치 무게는 기술적으로 완벽한 수준으로
- 후반 라운드에서도 스내치 폼이 무너지지 않도록',
'ROUNDS', true, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM wods WHERE wod_date = '2026-03-30' AND box_id IS NULL);

-- 3/31 (화) Karen
INSERT INTO wods (box_id, wod_date, title, type, content, score_type, active, created_at, updated_at)
SELECT NULL, '2026-03-31', 'Karen', 'FOR_TIME',
'For time:
150 Wall Ball Shots (9/6kg)

★ CrossFit 벤치마크 WOD
목표 시간: 서브 10분
엘리트: 서브 7분

RX: 9kg(남) 10ft 타겟 / 6kg(여) 9ft 타겟
Scaled: 6/4kg, 타겟 높이 동일

분할 전략 (예시):
- 30 x 5세트
- 25 x 6세트
- 초반 30개는 쉬지 않고 도전

포인트:
- 스쿼트 바텀에서 공을 잡지 말고 반동 활용
- 타겟에서 눈을 떼지 말 것
- 3월 마지막 WOD! 강하게 마무리하세요.',
'TIME', true, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM wods WHERE wod_date = '2026-03-31' AND box_id IS NULL);

-- ===========================
-- 대회 데이터 (2026년 3~5월, 12개)
-- ===========================

INSERT INTO competitions (name, description, start_date, end_date, location, city, registration_deadline, registration_url, organizer, level, status, max_participants, entry_fee, active, created_at, updated_at)
SELECT '2026 CrossFit Korea Spring Open', '전국 크로스핏 선수들이 한자리에 모이는 봄 시즌 오픈 대회. RX 및 Scaled 부문으로 나뉘며 개인전과 팀전을 동시 진행합니다. 서울 최대 규모의 크로스핏 경기장에서 개최됩니다.', '2026-04-05', '2026-04-06', '서울특별시 강남구 테헤란로 456 COEX 홀', '서울', '2026-03-25', 'https://crossfitkorea.com/register', 'CrossFit Korea', 'RX', 'OPEN', 200, 50000, true, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM competitions WHERE name = '2026 CrossFit Korea Spring Open');

INSERT INTO competitions (name, description, start_date, end_date, location, city, registration_deadline, registration_url, organizer, level, status, max_participants, entry_fee, active, created_at, updated_at)
SELECT '제5회 강남 크로스핏 챌린지', '강남구 크로스핏 박스들이 연합 주최하는 지역 최대 대회. 초보자부터 엘리트까지 모든 레벨이 참여 가능합니다. 이번 시즌은 팀 이벤트 2개를 포함한 총 4개 이벤트로 구성됩니다.', '2026-03-22', '2026-03-22', '서울특별시 강남구 봉은사로 324 박스킹 강남', '서울', '2026-03-15', 'https://gangnam-cf.kr/challenge', 'CF 강남 연합', 'SCALED', 'OPEN', 120, 35000, true, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM competitions WHERE name = '제5회 강남 크로스핏 챌린지');

INSERT INTO competitions (name, description, start_date, end_date, location, city, registration_deadline, registration_url, organizer, level, status, max_participants, entry_fee, active, created_at, updated_at)
SELECT '부산 CrossFit Games 2026', '부산 해운대를 배경으로 펼쳐지는 대한민국 최고의 크로스핏 대회. 2일간 총 6개 이벤트를 통해 최강자를 가립니다. 국제 선수 초청전 및 시범 경기도 함께 개최됩니다.', '2026-05-16', '2026-05-17', '부산광역시 해운대구 해운대해변로 30 벡스코', '부산', '2026-04-30', 'https://busan-cf-games.kr', 'Busan CrossFit Alliance', 'ELITE', 'UPCOMING', 300, 80000, true, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM competitions WHERE name = '부산 CrossFit Games 2026');

INSERT INTO competitions (name, description, start_date, end_date, location, city, registration_deadline, registration_url, organizer, level, status, max_participants, entry_fee, active, created_at, updated_at)
SELECT '2026 판교 IT 크로스핏 대회', '판교 테크 밸리의 IT 직장인들을 위한 특별 대회. 회사별 팀전으로 진행되며 평일 저녁 시간대에 진행합니다. 기업 후원 대회로 참가비 무료.', '2026-04-18', '2026-04-18', '경기도 성남시 분당구 판교역로 235 에이치스퀘어', '경기', '2026-04-10', NULL, '판교 크로스핏 클럽', 'INTERMEDIATE', 'UPCOMING', 80, 0, true, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM competitions WHERE name = '2026 판교 IT 크로스핏 대회');

INSERT INTO competitions (name, description, start_date, end_date, location, city, registration_deadline, registration_url, organizer, level, status, max_participants, entry_fee, active, created_at, updated_at)
SELECT '제3회 인천 크로스핏 클래식', '인천 송도국제도시에서 개최되는 클래식 대회. 전통적인 CrossFit 벤치마크 WOD 위주로 구성된 정통 대회입니다. 개인전 RX/Scaled/Beginner 3부문 운영.', '2026-04-26', '2026-04-26', '인천광역시 연수구 컨벤시아대로 165 송도 스포츠파크', '인천', '2026-04-15', 'https://incheon-cf-classic.kr', '인천 크로스핏 연맹', 'BEGINNER', 'UPCOMING', 150, 30000, true, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM competitions WHERE name = '제3회 인천 크로스핏 클래식');

INSERT INTO competitions (name, description, start_date, end_date, location, city, registration_deadline, registration_url, organizer, level, status, max_participants, entry_fee, active, created_at, updated_at)
SELECT '대구 CrossFit Throwdown 2026', '대구 수성구에서 개최되는 영남권 최대 크로스핏 대회. 개인전 및 파트너팀(2인)으로 진행. 대구·경북·부산·울산 선수들의 열전이 기대됩니다.', '2026-05-09', '2026-05-10', '대구광역시 수성구 동대구로 447 엑스코', '대구', '2026-04-25', 'https://daegu-cf.kr/throwdown', 'CrossFit 대구 연합', 'RX', 'UPCOMING', 160, 55000, true, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM competitions WHERE name = '대구 CrossFit Throwdown 2026');

INSERT INTO competitions (name, description, start_date, end_date, location, city, registration_deadline, registration_url, organizer, level, status, max_participants, entry_fee, active, created_at, updated_at)
SELECT '제주 CrossFit Festival 2026', '아름다운 제주에서 펼쳐지는 크로스핏 축제. 경쟁보다는 참가와 즐김에 초점을 맞춘 페스티벌 형식으로 진행됩니다. 관광과 운동을 동시에 즐길 수 있는 특별한 행사입니다.', '2026-05-23', '2026-05-24', '제주특별자치도 제주시 노형로 50 제주 스포츠 콤플렉스', '제주', '2026-05-10', 'https://jeju-cf-festival.kr', '제주 크로스핏 협회', 'ALL', 'UPCOMING', 250, 45000, true, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM competitions WHERE name = '제주 CrossFit Festival 2026');

INSERT INTO competitions (name, description, start_date, end_date, location, city, registration_deadline, registration_url, organizer, level, status, max_participants, entry_fee, active, created_at, updated_at)
SELECT '2026 광주 크로스핏 오픈', '호남권 선수들의 실력을 겨루는 광주 대회. 전통 크로스핏 무브먼트와 올림픽 리프팅이 조화된 6개 이벤트로 구성됩니다. 지역 박스 자존심을 건 팀전도 병행됩니다.', '2026-03-29', '2026-03-29', '광주광역시 서구 상무중앙로 110 상무 시민공원 체육관', '광주', '2026-03-20', 'https://gwangju-cf-open.kr', '광주 크로스핏 연맹', 'INTERMEDIATE', 'OPEN', 100, 40000, true, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM competitions WHERE name = '2026 광주 크로스핏 오픈');

INSERT INTO competitions (name, description, start_date, end_date, location, city, registration_deadline, registration_url, organizer, level, status, max_participants, entry_fee, active, created_at, updated_at)
SELECT 'Seoul CrossFit Summit 2026', '서울의 모든 크로스핏 박스가 참여하는 연간 최대 규모 서밋 대회. 올해는 특별히 국제 CrossFit 공인 심판진이 참여하여 국제 규격으로 진행됩니다. Masters 부문(35세 이상) 별도 운영.', '2026-05-30', '2026-05-31', '서울특별시 송파구 올림픽로 424 올림픽 체조경기장', '서울', '2026-05-15', 'https://seoul-cf-summit.kr', 'Seoul CrossFit Association', 'ELITE', 'UPCOMING', 400, 90000, true, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM competitions WHERE name = 'Seoul CrossFit Summit 2026');

INSERT INTO competitions (name, description, start_date, end_date, location, city, registration_deadline, registration_url, organizer, level, status, max_participants, entry_fee, active, created_at, updated_at)
SELECT '2026 CrossFit Korea Open (온라인)', 'CrossFit Open 형식의 온라인 대회. 전국 어디서나 참가 가능하며, 3주간 매주 1개씩 WOD가 공개됩니다. 각 박스에서 영상 촬영 후 제출하는 방식으로 진행됩니다.', '2026-03-01', '2026-03-21', '전국 온라인 (각 소속 박스)', '서울', '2026-03-05', 'https://crossfitkorea.com/online-open', 'CrossFit Korea', 'ALL', 'CLOSED', 1000, 15000, true, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM competitions WHERE name = '2026 CrossFit Korea Open (온라인)');

INSERT INTO competitions (name, description, start_date, end_date, location, city, registration_deadline, registration_url, organizer, level, status, max_participants, entry_fee, active, created_at, updated_at)
SELECT '제4회 수원 크로스핏 배틀', '경기 남부권 최대 크로스핏 대회. 수원·화성·오산 지역 박스들이 연합하여 주최합니다. 개인전 Beginner/Scaled/RX 3부문 및 팀전(4인) 부문으로 나뉩니다.', '2026-04-12', '2026-04-12', '경기도 수원시 팔달구 효원로 307 수원월드컵경기장', '경기', '2026-04-01', 'https://suwon-cf-battle.kr', '경기남부 크로스핏 연합', 'SCALED', 'UPCOMING', 180, 38000, true, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM competitions WHERE name = '제4회 수원 크로스핏 배틀');

INSERT INTO competitions (name, description, start_date, end_date, location, city, registration_deadline, registration_url, organizer, level, status, max_participants, entry_fee, active, created_at, updated_at)
SELECT '대전 CrossFit Championships 2026', '충청권 대표 크로스핏 대회. 대전·세종·충남·충북 선수들이 참여하는 지역 챔피언십입니다. 우승자에게는 CrossFit Korea 전국 대회 시드권을 부여합니다.', '2026-05-03', '2026-05-03', '대전광역시 유성구 대학로 99 충남대학교 체육관', '대전', '2026-04-20', 'https://daejeon-cf-champs.kr', '충청 크로스핏 협회', 'RX', 'UPCOMING', 120, 45000, true, NOW(), NOW()
WHERE NOT EXISTS (SELECT 1 FROM competitions WHERE name = '대전 CrossFit Championships 2026');

SELECT '=== 결과 ===' AS result;
SELECT 'users: ' || COUNT(*) FROM users;
SELECT 'boxes: ' || COUNT(*) FROM boxes;
SELECT 'posts: ' || COUNT(*) FROM posts;
SELECT 'wods: ' || COUNT(*) FROM wods;
SELECT 'competitions: ' || COUNT(*) FROM competitions;
