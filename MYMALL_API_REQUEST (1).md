# 자사몰 리뷰 데이터 API 요청서

> **요청 부서**: BM팀 (리뷰윈 운영)
> **요청일**: 2026-03-30
> **대상 시스템**: 쁘띠엘린스토어 (petitelinstore.com) → 이후 에센루에/두두스토리/모유움 확장

---

## 배경

리뷰 분석 시스템(리뷰윈)에서 자사몰 상품 리뷰를 자동 수집하여 AI 분석합니다.
현재 쿠팡/네이버 리뷰는 수집 중이며, 자사몰 리뷰를 추가합니다.

---

## 보안 요건

- **사내망 전용** — 사내 서버에서만 호출 (외부 접근 불가)
- 수집 서버는 사내 네트워크에 위치한 기존 수집 서버 사용
- 인증: API Key 헤더 또는 IP 제한 (IT팀 판단)

---

## API 명세

### `GET /api/reviews`

상품의 리뷰 목록과 상품 정보를 함께 반환합니다.

### Request

| 파라미터 | 필수 | 설명 |
|---------|------|------|
| `pack_content_id` | Y | 상품 ID |
| `page` | N | 페이지 번호 (기본값 1) |
| `size` | N | 페이지당 건수 (기본값 20) |

### Response (JSON)

```json
{
  "product": {
    "packContentId": 19753,
    "productName": "[특별할인]에어씬 팬티 기저귀 8팩(사이즈선택)",
    "brandName": "엘프레리",
    "price": 77000,
    "originalPrice": 160000,
    "thumbnailUrl": "https://www.petitelinstore.com/_vir0001/pack_product_img/middle/P19753_a3.jpg",
    "options": [
      { "optionName": "소형 8팩", "price": 77000, "isOutOfStock": false },
      { "optionName": "중형 8팩", "price": 77000, "isOutOfStock": false },
      { "optionName": "대형 8팩", "price": 82000, "isOutOfStock": true }
    ]
  },
  "totalCount": 285,
  "totalPages": 15,
  "currentPage": 1,
  "reviews": [
    {
      "reviewId": 327346,
      "rating": 5,
      "title": "얇고 좋아요",
      "content": "25개월 14키로 여아 라지 쓰다 사이즈업했어요",
      "writerId": "N906****",
      "reviewDate": "2026-03-29T20:42:57",
      "optionValue": "라지 / 8팩",
      "hasPhoto": true,
      "photoUrls": [
        "https://www.petitelinstore.com/_vir0001/product_after/_20260329204257130.jpg"
      ],
      "source": "direct"
    }
  ]
}
```

---

### 필드 설명

#### product (상품 정보 — 매 요청마다 현재 상태 반환)

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| `packContentId` | number | **필수** | 상품 ID |
| `productName` | string | **필수** | 상품명 |
| `brandName` | string | 선택 | 브랜드명 |
| `price` | number | **필수** | 현재 판매가 |
| `originalPrice` | number | 선택 | 정가 (할인 전) |
| `thumbnailUrl` | string | 선택 | 대표 이미지 URL |
| `options` | array | 선택 | 옵션별 가격/품절 현황 |
| `options[].optionName` | string | **필수** | 옵션명 |
| `options[].price` | number | **필수** | 옵션 가격 |
| `options[].isOutOfStock` | boolean | **필수** | 품절 여부 |

#### reviews (리뷰 목록 — 작성일 내림차순 정렬)

| 필드 | 타입 | 필수 | 설명 |
|------|------|------|------|
| `reviewId` | number | **필수** | 리뷰 고유 ID |
| `rating` | number | **필수** | 별점 (1~5) |
| `title` | string | 선택 | 리뷰 제목 |
| `content` | string | **필수** | 리뷰 본문 |
| `writerId` | string | **필수** | 작성자 ID (마스킹 상태 OK) |
| `reviewDate` | string | **필수** | 작성일시 (ISO 8601) |
| `optionValue` | string | 선택 | 구매 옵션 (사이즈/색상 등) |
| `hasPhoto` | boolean | 선택 | 사진 첨부 여부 |
| `photoUrls` | string[] | 선택 | 사진 URL 목록 |
| `source` | string | 선택 | 출처 구분 (`direct` / `naverpay`) |

> **`reviewDate`가 가장 중요합니다.**
> 날짜 없이는 신규 리뷰 감지, 기간별 분석, 트렌드 추적이 불가능합니다.
> DB에 작성일이 저장되어 있다면 그대로 내려주시면 됩니다.

---

## 운영 정보

| 항목 | 내용 |
|------|------|
| 호출 빈도 | 상품당 하루 1~2회 |
| 호출 규모 | 한 번에 전체 페이지 순회 (분당 수십 건) |
| 데이터 용도 | AI 감성 분석, 내부 보고용 (외부 노출 없음) |
| 우선 대상 | 쁘띠엘린스토어 |
| 확장 예정 | 에센루에 / 두두스토리 / 모유움 (동일 구조 예정) |
| 호출 서버 | 사내 네트워크 내 수집 서버 |

---

## 참고

- 4개 몰이 동일 DB를 사용한다면, API 하나로 전 몰 커버 가능할 수 있습니다 (몰 구분 파라미터 추가)
- 리뷰 정렬은 **작성일 내림차순(최신순)** 고정이면 충분합니다
- 응답이 JSON이면 별도 파싱 없이 바로 처리 가능하여 가장 효율적입니다
