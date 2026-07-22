// scripts/fetch_all_aeds.mjs
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

// .env 파일 로드 설정
dotenv.config();

// __dirname 대체 코드 (ES 모듈에서는 __dirname을 직접 쓸 수 없어서 아래처럼 정의해야 합니다)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 1. 공공데이터포털 API Key 확인
const SERVICE_KEY = process.env.EXPO_PUBLIC_PORTAL_API_KEY;

if (!SERVICE_KEY || SERVICE_KEY.includes("your_api_key")) {
  console.error(
    "❌ 에러: .env 파일에 EXPO_PUBLIC_PORTAL_API_KEY가 올바르게 설정되어 있지 않습니다!"
  );
  process.exit(1);
}

// 2. 저장할 경로 지정 (src/data/aed_data.json)
const OUTPUT_DIR = path.join(__dirname, "../src/data");
const OUTPUT_FILE = path.join(OUTPUT_DIR, "aed_data.json");

// 폴더가 없으면 자동 생성
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// FullData를 가져오는 주소
const url =
  "http://apis.data.go.kr/B552657/AEDInfoInqireService/getAedFullDown";

async function fetchAllAEDs() {
  console.log("🚀 [ES 모듈] 전국 AED 데이터 수집을 시작합니다...");

  // 전국 데이터를 긁어오기 위해 100,000개 요청 파라미터 세팅
  const queryParams = `?serviceKey=${encodeURIComponent(
    SERVICE_KEY
  )}&pageNo=1&numOfRows=100000`;

  try {
    const response = await fetch(url + queryParams);

    if (!response.ok) {
      throw new Error(`HTTP 에러 발생! 상태코드: ${response.status}`);
    }

    const textData = await response.text();
    console.log("📥 데이터 다운로드 완료! 데이터 구조 가공 중...");

    // XML 데이터에서 핵심 태그만 정규식으로 빠르게 파싱
    const items = [];
    const itemRegex = /<item>([\s\S]*?)<\/item>/g;
    let match;

    while ((match = itemRegex.exec(textData)) !== null) {
      const itemContent = match[1];

      const getTagValue = (tag) => {
        const regex = new RegExp(`<${tag}>([\\s\\S]*?)<\/${tag}>`);
        const found = itemContent.match(regex);
        return found ? found[1].trim() : "";
      };

      items.push({
        name: getTagValue("buildPlace"), // 설치기관명
        location: getTagValue("buildLocation"), // 설치장소 상세
        address: getTagValue("wgs84Addr"), // 주소
        latitude: parseFloat(getTagValue("wgs84Lat")) || 0, // 위도 (X)
        longitude: parseFloat(getTagValue("wgs84Lon")) || 0, // 경도 (Y)
        phone: getTagValue("clerkTel"), // 관리자 연락처
        model: getTagValue("mfg"), // 모델명
      });
    }

    if (items.length === 0) {
      console.log(
        "⚠️ 파싱된 데이터가 없습니다. API 응답 확인 필요:",
        textData.substring(0, 500)
      );
      return;
    }

    // 3. 초경량 JSON 파일로 저장
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(items, null, 2), "utf-8");
    console.log(
      `\n✅ 성공! 전국 ${items.length}대의 AED 정보가 저장되었습니다.`
    );
    console.log(`📂 저장 위치: ${OUTPUT_FILE}`);
  } catch (error) {
    console.error("❌ 데이터 수집 실패:", error.message);
  }
}

fetchAllAEDs();
