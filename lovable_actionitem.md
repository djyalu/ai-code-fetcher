# lovable.dev Action Items

이 파일에는 배포/운영 측(운영팀, lovable.dev)에서 반드시 검토하고 직접 반영해야 하는 작업들을 정리합니다.
**명시적 요구사항:** 이 파일에 기록된 모든 항목은 lovable 측에서 검토한 뒤에만 실제 환경에 반영되어야 합니다. 운영 반영 전까지는 로컬/개인 환경에서 임의로 처리하지 마십시오.

---

## 1. 환경 변수(Secrets) 설정 — 필수
설명: Edge Function 및 프론트엔드가 동작하려면 아래 비밀(환경변수)을 lovable.dev의 배포 환경(혹은 Supabase 프로젝트 환경)에 정확히 설정해야 합니다.

- SUPABASE_URL
- SUPABASE_SERVICE_ROLE_KEY (서비스 역할 키, 매우 민감)
- OPENROUTER_API_KEY
- PERPLEXITY_API_KEY (Perplexity 사용 시)
- (프론트 빌드용) VITE_SUPABASE_URL
- (프론트 빌드용) VITE_SUPABASE_PUBLISHABLE_KEY

권장: 서비스 역할 키가 노출된 적이 있으면 즉시 회전(rotate)하세요.

---

## 2. 데이터베이스 마이그레이션 적용 (supabase)
설명: repository에 추가된 마이그레이션을 Supabase에 적용해야 런타임에서 `model_metadata` 테이블이 생성됩니다.

파일:
- `supabase/migrations/20260116000000_create_model_metadata.sql`

Seed file added:
- `supabase/migrations/20260116000100_seed_model_metadata.sql` — 기본 유료/무료 모델 레코드를 upsert 하는 seed. 운영에서 검토 후 실행하세요.

예시 절차 (lovable에서 제공하는 방법/UI를 사용하세요):
1. Supabase Dashboard > SQL Editor에서 파일 내용을 실행하거나
2. CI/CD에서 supabase migration 명령을 실행

초기 seed 예시(운영 DB에 넣기 전 검토 필요):
```sql
insert into public.model_metadata (model_id, is_paid, input_price) values
  ('gpt-4o', true, 2.5),
  ('gpt-4o-mini', true, 0.15),
  ('claude-3-5-sonnet', true, 3),
  ('claude-3-5-haiku', true, 0.25),
  ('gemini-2.0-flash', true, 0.1),
  ('gemini-1.5-pro', true, 1.25),
  ('deepseek-chat', true, 0.14),
  ('google/gemini-2.0-flash-exp:free', false, 0);
```

주의: 위 가격/목록은 코드베이스(`src/constants/models.ts`)를 기준으로 한 권장값입니다. 운영 정책에 맞게 조정하세요.

---

## 3. Edge Functions 배포
설명: 수정된 Edge Functions를 배포해야 변경(유료모델 인증, gemini 매핑, health 체크 TTL 등)이 적용됩니다.

대상 함수:
- `chat` (supabase/functions/chat/index.ts)
- `check-model-health` (supabase/functions/check-model-health/index.ts)

권장 방식:
- lovable.dev에서 Supabase Edge Function 배포 UI 또는 Supabase CLI를 사용해 `functions deploy chat` 및 `functions deploy check-model-health` 실행

검증 (배포 후):
1. `check-model-health`를 수동으로 invoke 하여 `model_health` 테이블이 업데이트되는지 확인
2. 익명(Authorization 없음)으로 `chat` 함수를 유료 모델로 호출 -> 401 응답 확인
3. 인증된 토큰으로 유료 모델 호출 -> 정상 응답 및 `prompt_logs`에 기록 여부 확인

---

## 4. 스케줄링(헬스체크)
설명: 모델 헬스 체크(health-check)는 주기적으로 실행되어야 합니다.
권장 주기: 5~15분 (초기에는 5분 권장)

옵션:
- Supabase Edge Function Scheduler(또는 lovable cron)에서 `check-model-health`를 정기 실행

---

## 5. 키 회전(권장 보안 조치)
설명: 과거에 `.env` 파일 등으로 키가 노출되었을 가능성이 있으므로 다음 키는 회전 권장:
- SUPABASE_SERVICE_ROLE_KEY
- OPENROUTER_API_KEY
- PERPLEXITY_API_KEY

절차(예): Supabase Dashboard에서 서비스 역할 키 재발급 후 lovable 환경변수 업데이트.

---

## 6. 로그/프라이버시 정책 확인
설명: Edge Function이 `prompt_logs`에 prompt 텍스트와 owner_email을 저장합니다. 이 데이터는 민감 정보를 포함할 수 있으므로 다음을 검토하세요:
- 데이터 보관 기간(예: 30일) 정책
- 민감 데이터(토큰, 비밀번호 등) 마스킹 또는 저장 불가 처리
- 접근 권한 및 RLS 정책

권장: 민감 정보는 암호화 또는 마스킹 후 저장.

---

## 7. 캐시 무효화 / 관리자 변경 반영
설명: `model_metadata`가 변경될 경우(예: 특정 모델의 is_paid 플래그 변경) 캐시가 최대 1분 동안 유지됩니다. 즉시 반영을 원하면 캐시 무효화가 필요합니다.

권장: 운영자가 즉시 무효화할 수 있는 간단한 관리 API(인증 필요) 또는 관리 UI(서브스크립션/모델 관리)를 추가하세요.

---

## 8. 테스트 스크립트 (예시)
- 비인증 요청(유료 모델) 테스트
```powershell
$body = @{ messages = @(@{ role='user'; content='hi' }); model='gpt-4o' } | ConvertTo-Json
Invoke-RestMethod -Method Post -Uri "https://<PROJECT>.supabase.co/functions/v1/chat" -Body $body -ContentType 'application/json'
# 기대: 401 또는 403
```

- 인증 요청(유료 모델) 테스트
```powershell
$token = '<USER_ACCESS_TOKEN>'
$headers = @{ Authorization = "Bearer $token" }
$body = @{ messages = @(@{ role='user'; content='hello' }); model='gpt-4o' } | ConvertTo-Json
Invoke-RestMethod -Method Post -Uri "https://<PROJECT>.supabase.co/functions/v1/chat" -Headers $headers -Body $body -ContentType 'application/json'
# 기대: 정상 응답 및 model/content 포함
```

---

## 9. 검토/승인 절차
1. lovable 운영팀이 이 문서의 항목을 검토합니다.
2. 각 항목을 적용(마이그레이션/환경변수 설정/함수 배포 등)하기 전, PR 또는 운영 변경 요청서에 목록과 적용 시간을 기록합니다.
3. 적용 완료 후 이 문서에 적용일자와 담당자 이름(또는 역할)을 기록하고 체크박스(완료)를 표시합니다.

---

## 체크리스트 (운영 반영 상태 기록)
- [ ] ENV: SUPABASE_URL 설정 — 검토 필요
- [ ] ENV: SUPABASE_SERVICE_ROLE_KEY 설정 — 검토 필요
- [ ] ENV: OPENROUTER_API_KEY 설정 — 검토 필요
- [ ] ENV: PERPLEXITY_API_KEY 설정 — 검토 필요
- [ ] DB Migration: `model_metadata` 적용 — 검토 필요
- [ ] DB Seed: `model_metadata` 초기 레코드 삽입 — 검토 필요
- [ ] Edge Function: `chat` 배포 — 검토 필요
- [ ] Edge Function: `check-model-health` 배포 및 스케줄링 — 검토 필요
- [ ] Health check: `model_health` 데이터 확인 — 검토 필요
- [ ] Prompt logs: 보존/마스킹 정책 검토 — 검토 필요

---

문서 갱신 규칙:
- 이 파일은 운영 관련 필수 작업 목록입니다. 운영팀에서 항목을 검토하고 반영할 때마다 상태(체크박스, 날짜, 담당자)를 업데이트하세요.
- 이 파일에 기록된 항목은 반드시 lovable 팀에서 검토 후 반영되어야 합니다.

---

문의: 변경 적용에서 도움이 필요하면 커밋된 코드를 기반으로 제가 추가 스크립트(마이그레이션 seed, 배포 스크립트, 테스트 스크립트)를 준비해 드리겠습니다.
