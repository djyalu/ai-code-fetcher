# OpenRouter Available Models Report (2026.01)

이 문서는 OpenRouter에서 현재(2026년 1월 기준) 사용 가능한 주요 모델들을 정리한 리스트입니다.
프로젝트(`ai-code-fetcher`)에서 활용 가능한 고성능 모델과 비용 효율적인 무료 모델을 구분하여 정리했습니다.

> **참고**: 가격은 변동될 수 있으며, `$1 = ~1,400원` 기준으로 환산하여 생각할 수 있습니다. 가격 단위는 대개 **1M Tokens(100만 토큰) 당** 가격입니다.

---

## 🆓 Free Models (무료 모델)
연구 목적이나 테스트, 개인적인 용도로 무료로 제공되는 모델들입니다.

| 모델명 (Model Name) | 모델 ID (Model ID) | 제공사 (Provider) | 특징 및 설명 | 컨텍스트 (Context) |
| :--- | :--- | :--- | :--- | :--- |
| **Gemini 2.0 Flash (Free)** | `google/gemini-2.0-flash-exp:free` | Google | **강력 추천**. 1M 긴 문맥처리와 빠른 속도. 멀티모달 지원. | 1,048,576 |
| **Llama 3.3 70B (Free)** | `meta-llama/llama-3.3-70b-instruct:free` | Meta | 범용적으로 가장 안정적인 오픈소스 모델. 한국어 처리 우수. | 128,000 |
| **DeepSeek R1 (Free)** | `deepseek/deepseek-r1-0528:free` | DeepSeek | **추론 특화**. CoT(Chain of Thought) 능력이 강화된 최신 모델. | 64,000 |
| **Xiaomi MiMo V2 (Free)** | `xiaomi/mimo-v2-flash:free` | Xiaomi | 모바일/엣지 환경 최적화. 가볍고 빠름. | 128,000 |
| **Qwen 3 Coder (Free)** | `qwen/qwen3-coder:free` | Alibaba | **코딩 특화**. 코드 생성 및 분석에 최적화됨. | 32,000 |
| **Mistral Devstral (Free)** | `mistralai/devstral-2512:free` | Mistral | 개발자용 실험 모델. | 32,000 |
| **GPT-OSS 120B (Free)** | `openai/gpt-oss-120b:free` | OpenAI? (Community) | 오픈소스 기반 대형 언어 모델. | 8,192 |
| **Gemma 3 27B (Free)** | `google/gemma-3-27b-it:free` | Google | 구글의 고성능 오픈 웨이트 모델. | 131,072 |

---

## 💎 Premium/Paid Models (유료 모델)
고성능 추론, 복잡한 코딩, 긴 문맥 처리가 필요한 프로덕션 환경용 모델입니다.

### 🌟 Frontier (최상위 성능)

| 모델명 | 모델 ID | 가격 (Input / Output) | 특징 |
| :--- | :--- | :--- | :--- |
| **GPT-5.2** | `openai/gpt-5.2` | (변동) High | **최고 성능**. Agentic Workflow 및 초장문 맥락 이해. |
| **GPT-5.2 Codex** | `openai/gpt-5.2-codex` | (변동) High | **코딩 최강**. 복잡한 엔지니어링 및 아키텍처 설계용. |
| **Claude 3.5 Sonnet** | `anthropic/claude-3-5-sonnet` | $3.0 / $15.0 | 자연스러운 문장력, 코딩, 추론 밸런스가 가장 좋음. |
| **Gemini 3 Flash** | `google/gemini-3-flash-preview` | Low-Mid | 차세대 Gemini. 초고속 추론 및 1M+ 컨텍스트. |
| **Llama 4 Maverick** | `meta-llama/llama-4-maverick` | Mid | 400B MoE 아키텍처. 방대한 지식과 추론 능력. |

### 🚀 High Efficiency (고효율/가성비)

| 모델명 | 모델 ID | 가격 (Input / Output) | 특징 |
| :--- | :--- | :--- | :--- |
| **GPT-4o Mini** | `openai/gpt-4o-mini` | $0.15 / $0.60 | GPT-4o 수준의 지능을 매우 저렴하게 제공. |
| **DeepSeek V3** | `deepseek/deepseek-chat` | $0.14 / $0.28 | **가성비 갑**. 코딩 및 한국어 성능이 매우 뛰어남. |
| **Gemini 2.5 Flash Lite**| `google/gemini-2.5-flash-lite`| $0.075 / $0.30 | 극도로 저렴하고 빠름. 단순 질의응답에 적합. |
| **Claude 3.5 Haiku** | `anthropic/claude-3-5-haiku` | $0.25 / $1.25 | Claude 특유의 톤앤매너를 유지하며 속도 향상. |

---

## 🧩 Special Purpose (특수 목적)

*   **DeepSeek R1 / Chimera**: 복잡한 수학, 논리 퍼즐, 심층 추론(Thinking)이 필요한 경우.
*   **Perplexity Online**: 실시간 웹 검색이 동반되어야 하는 최신 정보 질의.
*   **Grok 4 Fast**: xAI의 모델로, 트위터(X) 데이터 기반의 최신 밈이나 뉴스 이해도가 높을 수 있음.

> *작성일: 2026년 1월 18일*
