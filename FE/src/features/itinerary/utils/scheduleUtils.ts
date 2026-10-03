import type { ItineraryStop, RouteOption } from "../components";
import type { TransportWalk } from "../components/TransportCard";
import type { TransportType } from "@/features/home/types/transport";
import { getCategoryFromKo } from "@/shared/constants/category";
import { resolveDayDate } from "@/shared/utils/resolveDayDate";
import type { components } from "@/shared/api/schema";
import placeImage1 from "@/assets/place/place1.png";
import placeImage2 from "@/assets/place/place2.png";
import placeImage3 from "@/assets/place/place3.png";
import placeImage4 from "@/assets/place/place4.png";
import placeImage5 from "@/assets/place/place5.png";
import placeImage6 from "@/assets/place/place6.png";
import placeImage7 from "@/assets/place/place7.png";
import unSculptureParkImage from "@/assets/place/curated/un-sculpture-park.jpg";
import gadeokdoYeondaebongImage from "@/assets/place/curated/gadeokdo-yeondaebong.jpg";
import huinnyeoulCoastalTunnelImage from "@/assets/place/curated/huinnyeoul-coastal-tunnel.jpg";
import oryukdoSunriseParkImage from "@/assets/place/curated/oryukdo-sunrise-park.jpg";
import gukjeMarketImage from "@/assets/place/curated/gukje-market.jpg";
import hwangnyeongsanObservatoryImage from "@/assets/place/curated/hwangnyeongsan-observatory.jpg";
import yeongjuSkyEyeObservatoryImage from "@/assets/place/curated/yeongju-sky-eye-observatory.jpg";
import cheonmasanSkyObservatoryImage from "@/assets/place/curated/cheonmasan-sky-observatory.jpg";
import jeoryeongCoastalTrailImage from "@/assets/place/curated/jeoryeong-coastal-trail.jpg";
import gamjiBeachImage from "@/assets/place/curated/gamji-beach.jpg";
import sunriseObservatoryImage from "@/assets/place/curated/sunrise-observatory.jpg";
import myeongjiMarketImage from "@/assets/place/curated/myeongji-market.jpg";
import imrangCaravanParkImage from "@/assets/place/curated/imrang-caravan-park.jpg";
import prettyWhaleShopImage from "@/assets/place/curated/pretty-whale-shop.jpg";
import hamjigolYouthCenterImage from "@/assets/place/curated/hamjigol-youth-center.jpg";
import gwangalliSupZoneImage from "@/assets/place/curated/gwangalli-sup-zone.jpg";
import yeongdoShootingRangeImage from "@/assets/place/curated/yeongdo-shooting-range.jpg";
import busanModernHistoryAnnexImage from "@/assets/place/curated/busan-modern-history-annex.jpg";
import busanModernHistoryMainImage from "@/assets/place/curated/busan-modern-history-main.jpg";
import fluniteaImage from "@/assets/place/curated/flunitea.jpg";
import twentyFiveVolunteerCorpsImage from "@/assets/place/curated/twenty-five-volunteer-corps.jpg";
import connectHyundaiBusanImage from "@/assets/place/curated/connect-hyundai-busan.jpg";

type ItineraryDetailResponse = components["schemas"]["ItineraryDetailResponse"];
type TravelLogDetailResponse = components["schemas"]["TravelLogDetailResponse"];
type ItineraryItemResponse = components["schemas"]["ItineraryItemResponse"];
export type SpotSearchResponse = components["schemas"]["SpotSearchResponse"];

// 하루 일정에 추가할 수 있는 관광지 최대 개수. 백엔드 ItineraryService.MAX_ITEMS_PER_DAY와
// 동일한 값으로 맞춰둬야 한다 — 여기선 실시간 편집 중 굳이 "추가" 버튼을 보여줬다가 flush
// 시점에 조용히 저장 실패하는 걸 막기 위한 프론트 쪽 방어선일 뿐, 실제 정원 판단의 기준(source
// of truth)은 항상 백엔드다.
export const MAX_STOPS_PER_DAY = 10;

// 로그 불러오기로 만든 항목의 임시 id. 로그 항목 기준으로 "정해진" 값을 쓴다 — 예전엔
// 브라우저마다 temp-1부터 세는 카운터라, 두 사람이 같은 로그를 동시에 불러오면 서로 다른
// 항목이 같은 id로 섞이고(엉뚱한 항목에 실제 id가 붙음) 관광지가 두 배로 들어가 같은 시각이
// 겹쳐 저장이 거부됐다(2026-09-29 운영). 정해진 id면 동시에 불러와도 두 사람의 항목 id가
// 같아서, node-yjs가 같은 id 중복을 하나로 정리한다(roomFlushManager.dedupeDayItems).
function importedLogStopId(
  logId: string | undefined,
  dayNumber: number,
  index: number,
  itemId?: string,
) {
  return itemId ? `temp-log-${itemId}` : `temp-log-${logId ?? "unknown"}-${dayNumber}-${index}`;
}

// 관광지 썸네일이 없을 때 쓰는 대체 이미지. seed를 안 주면(레거시 호출부 호환용) 항상 같은
// 사진이 나가던 게 문제였음 — thumbnailUrl이 비어있는 관광지 26곳(2026-08-13 확인)이 전부
// 똑같은 사진으로 보였음. spotId처럼 항목마다 달라지는 값을 seed로 넘기면 최소한 관광지별로
// 서로 다른(그리고 매번 같은, 깜빡이지 않는) 대체 사진이 나간다. 실제 사진이 아니므로 근본
// 해결은 아니고, 나중에 이 관광지들 사진을 실제로 확보하면(TourAPI엔 없음, 수동 큐레이션
// 필요 — swipe_image_url 업로드했던 방식 참고) thumbnailUrl을 채워서 이 폴백 자체를 안 타게
// 하는 게 맞다.
const FALLBACK_IMAGES = [
  placeImage1,
  placeImage2,
  placeImage3,
  placeImage4,
  placeImage5,
  placeImage6,
  placeImage7,
];

// TourAPI에 대표 이미지가 없는 관광지는 실제 장소 사진을 이름으로 매칭한다. API 이미지가
// 생기면 호출부의 thumbnailUrl이 항상 우선하므로 이 목록은 자동으로 폴백 역할만 한다.
const CURATED_SPOT_IMAGES: Record<string, string> = {
  "2945389": unSculptureParkImage.src,
  un조각공원: unSculptureParkImage.src,
  유엔조각공원: unSculptureParkImage.src,
  "2726843": gadeokdoYeondaebongImage.src,
  가덕도연대봉: gadeokdoYeondaebongImage.src,
  "2606221": huinnyeoulCoastalTunnelImage.src,
  흰여울해안터널: huinnyeoulCoastalTunnelImage.src,
  영도흰여울해안터널: huinnyeoulCoastalTunnelImage.src,
  "2870289": oryukdoSunriseParkImage.src,
  오륙도해맞이공원: oryukdoSunriseParkImage.src,
  "132191": gukjeMarketImage.src,
  국제시장: gukjeMarketImage.src,
  국제시장먹자골목: gukjeMarketImage.src,
  "2733472": hwangnyeongsanObservatoryImage.src,
  황령산전망대: hwangnyeongsanObservatoryImage.src,
  "2721157": yeongjuSkyEyeObservatoryImage.src,
  영주하늘눈전망대: yeongjuSkyEyeObservatoryImage.src,
  "2721158": cheonmasanSkyObservatoryImage.src,
  천마산하늘전망대: cheonmasanSkyObservatoryImage.src,
  "252561": jeoryeongCoastalTrailImage.src,
  절영해안산책로: jeoryeongCoastalTrailImage.src,
  "2785289": gamjiBeachImage.src,
  감지해변: gamjiBeachImage.src,
  "3017347": sunriseObservatoryImage.src,
  해돋이전망대: sunriseObservatoryImage.src,
  "2742601": myeongjiMarketImage.src,
  명지시장: myeongjiMarketImage.src,
  "2741535": imrangCaravanParkImage.src,
  임랑카라반파크: imrangCaravanParkImage.src,
  부산카라반파크: imrangCaravanParkImage.src,
  "3336600": prettyWhaleShopImage.src,
  고래서이뻐: prettyWhaleShopImage.src,
  고래서이뻐해리단길: prettyWhaleShopImage.src,
  "131452": hamjigolYouthCenterImage.src,
  함지골청소년수련관: hamjigolYouthCenterImage.src,
  "2708019": gwangalliSupZoneImage.src,
  "2814084": gwangalliSupZoneImage.src,
  광안리supzone: gwangalliSupZoneImage.src,
  광안리섭존: gwangalliSupZoneImage.src,
  "131943": yeongdoShootingRangeImage.src,
  영도관광실탄사격장: yeongdoShootingRangeImage.src,
  영도관광사격장: yeongdoShootingRangeImage.src,
  "2784363": busanModernHistoryAnnexImage.src,
  부산근현대역사관별관: busanModernHistoryAnnexImage.src,
  부산근대역사관: busanModernHistoryAnnexImage.src,
  "3083767": busanModernHistoryMainImage.src,
  부산근현대역사관: busanModernHistoryMainImage.src,
  부산근현대역사관본관: busanModernHistoryMainImage.src,
  "2999905": fluniteaImage.src,
  플루니티: fluniteaImage.src,
  "126814": twentyFiveVolunteerCorpsImage.src,
  "25의용단": twentyFiveVolunteerCorpsImage.src,
  이십오의용단: twentyFiveVolunteerCorpsImage.src,
  "3452166": connectHyundaiBusanImage.src,
  커넥트현대: connectHyundaiBusanImage.src,
  커넥트현대부산: connectHyundaiBusanImage.src,
  현대백화점부산점: connectHyundaiBusanImage.src,
};

function normalizeSpotName(value?: string): string {
  return (value ?? "")
    .normalize("NFC")
    .toLocaleLowerCase("ko-KR")
    .replace(/[\s·()\-_]/g, "");
}

// 예전엔 picsum.photos(외부 랜덤 이미지)를 썼는데, 외부 서비스가 느리거나 죽으면
// 대체 이미지마저 안 뜬다 — 관광공사 썸네일(tong.visitkorea.or.kr)이 503을 뱉는
// 상황에서 폴백까지 외부에 의존할 이유가 없어서 로컬 에셋으로 바꿨다.
// seed(보통 spotId)로 고르기 때문에 같은 관광지는 항상 같은 사진이 나가고 깜빡이지 않는다.
export function getFallbackImage(seed?: string, spotName?: string): string {
  const curatedImage =
    CURATED_SPOT_IMAGES[normalizeSpotName(spotName)] ??
    CURATED_SPOT_IMAGES[normalizeSpotName(seed)];
  if (curatedImage) return curatedImage;

  const key = seed || "busan";
  let hash = 0;
  for (let i = 0; i < key.length; i += 1) {
    hash = (hash * 31 + key.charCodeAt(i)) >>> 0;
  }
  return FALLBACK_IMAGES[hash % FALLBACK_IMAGES.length].src;
}

export const FALLBACK_IMAGE = getFallbackImage();

export type BaseStop = Omit<
  ItineraryStop,
  "onDelete" | "onClick" | "onTimeClick" | "onTimeConfirm" | "onTransportClick" | "onVerify"
>;

// GET /api/logs/{id}(다른 사람의 여행 로그) 응답을 타임라인 UI가 쓰는 BaseStop[][]로
// 변환한다. 로그 응답의 각 항목엔 spotId/주소/카테고리/썸네일이 이미 내려오므로
// (2026-07-23 백엔드에 추가됨) 그대로 사용한다 — 예전엔 spotId가 없어서 장소 이름으로
// 관광지를 다시 검색해 매칭했었는데, 이름이 안 맞으면 엉뚱한 스팟에 매칭되거나 spotId가
// 비어 REST addItem(=DB 저장) 자체가 안 되는 문제가 있어 제거함.
// isBookmarked(북마크 여부)만 로그 응답에 없는 정보라 여기선 알 수 없음 — 일정에 저장된
// 뒤 실제 일정 상세를 다시 불러오면(mapItineraryDetailToDays) 정확한 값으로 채워진다.
// 로그 항목의 방문 시각은 "믿을 수 있을 때만" 그대로 쓴다.
//
// 확정(finalize)으로 만들어진 일정은 백엔드가 arrivalTime을 아예 채우지 않아 비어 있고
// (ItineraryVoteService), 그 일정으로 만든 로그도 시간이 빈 채 내려온다. 예전 버그로
// 하루 전체가 00:00으로 뭉개진 일정에서 만들어진 로그도 있다.
//
// 이걸 항목마다 따로 기본값으로 채우면 그 날 전체가 같은 시각이 되는데, 백엔드는 같은 날
// 같은 시각을 400으로 막기 때문에(ItineraryService.validateArrivalTimeAvailable) 저장 시
// 첫 항목만 통과하고 나머지는 조용히 사라진다. 그래서 하루치를 한 번에 정한다 —
// 저장된 시각이 (1) 전부 있고 (2) 오름차순이면 그대로 쓰고, 하나라도 어긋나면 그 날을
// 통째로 다시 매긴다(mapItineraryDetailToDays의 resolveDayTimes와 같은 규칙).
function resolveImportedLogTimes(arrivalTimes: (string | undefined)[]): number[] {
  const stored = arrivalTimes.map((raw) => {
    if (!raw) return undefined;
    const minutes = timeToMinutes(normalizeTime(raw));
    // 00:00은 실제 자정이 아니라 "시간 없음"이 잘못 저장된 값으로 본다(boundMinutes와 같은 기준).
    return minutes === 0 ? undefined : minutes;
  });

  const isUsable =
    stored.every((minute) => minute !== undefined) &&
    stored.every((minute, idx) => idx === 0 || minute! > stored[idx - 1]!);
  if (isUsable) return stored as number[];

  // 기본 간격(120분)을 그대로 쓰면 8번째 항목부터 전부 23:50으로 몰린다 — 위 주석대로
  // 같은 날 같은 시각은 백엔드가 400으로 막아서(validateArrivalTimeAvailable) 그 항목들은
  // 저장 자체가 안 된다. clamp가 "하루치를 한 번에 정한다"는 이 함수의 목적을 도로
  // 깨뜨리고 있었다. 하루 안에 다 들어가도록 항목 수에 맞춰 간격을 좁힌다(10분 단위 유지).
  const span = LAST_MINUTE_OF_DAY - IMPORTED_LOG_DAY_START_MIN;
  const defaultStep = DEFAULT_STAY_MIN + DEFAULT_TRAVEL_MIN;
  const fittingStep =
    arrivalTimes.length > 1 ? Math.floor(span / (arrivalTimes.length - 1) / 10) * 10 : defaultStep;
  const step = Math.max(MIN_IMPORTED_LOG_GAP_MIN, Math.min(defaultStep, fittingStep));

  return arrivalTimes.map((_, idx) =>
    Math.min(LAST_MINUTE_OF_DAY, IMPORTED_LOG_DAY_START_MIN + idx * step),
  );
}

export function buildDaysFromTravelLogDetail(
  log: TravelLogDetailResponse,
  // 로그 응답의 spotThumbnailUrl이 비어 있는 스팟을 위해 호출부가 관광지 단건 조회로
  // 따로 받아온 썸네일(spotId 기준). 없으면 폴백 이미지로 간다.
  spotThumbnails?: ReadonlyMap<string, string>,
): {
  days: BaseStop[][];
  dates: string[];
} {
  const sortedDays = [...(log.days ?? [])].sort((a, b) => (a.dayNumber ?? 0) - (b.dayNumber ?? 0));

  const days = sortedDays.map((day) => {
    const items = [...(day.items ?? [])].sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0));
    // toStopId(다음 스팟 id)를 rebuildTransport()가 참조하려면 순서대로 미리 확정돼있어야
    // 해서, map 안에서 그때그때 만드는 대신 배열로 먼저 뽑아둔다.
    const ids = items.map((item, idx) =>
      importedLogStopId(log.id, day.dayNumber ?? 0, idx, item.id),
    );
    // 시각은 항목마다 따로 채우지 않고 하루치를 한 번에 정한다(resolveImportedLogTimes 주석 참고).
    const dayMinutes = resolveImportedLogTimes(items.map((item) => item.arrivalTime));

    return items.map((item, idx): BaseStop => {
      const placeName = item.spotName ?? "장소 미정";

      return {
        id: ids[idx],
        spotId: item.spotId,
        time: minutesToTime(dayMinutes[idx]),
        placeName,
        // 로그에 달린 사진(item.photos)은 작성자가 찍은 개인 사진이라 관광지 이미지 자리에
        // 쓰지 않는다. 로그 응답에 spotId도 spotThumbnailUrl도 없던 시절(이름으로 관광지를
        // 검색해 매칭하던 때)의 잔재였는데, 그 탓에 담아온 일정에 남의 인증샷이 관광지
        // 대표 이미지로 박혀 있었다.
        imageUrl:
          item.spotThumbnailUrl ||
          (item.spotId ? spotThumbnails?.get(item.spotId) : undefined) ||
          getFallbackImage(item.spotId, placeName),
        category: getCategoryFromKo(item.spotCollectionCategory ?? "", placeName),
        status: "verify",
        // description/운영시간/문의처는 TimelinePlaceDetailPopup이 spotId로 실제 데이터를
        // 조회해서 보여준다(useSpotDetail) — 여기서 가짜 문구로 채우지 않는다.
        address: item.spotAddress ?? "부산광역시",
        lat: item.spotLat,
        lng: item.spotLng,
        mapUrl: `https://map.kakao.com/link/search/${encodeURIComponent(placeName)}`,
        isBookmarked: undefined,
        // 여행 로그엔 실제 이동수단/경로 데이터가 없어서(스팟 이름·시간만 내려옴) "버스"로
        // 지어내지 않는다. 일정에 반영된 뒤 최적화/이동수단 변경을 거치면 실제 값으로 채워진다.
        transport: undefined,
        recommendedTransport: undefined,
      };
    });
  });

  const dates = sortedDays.map((day) => {
    if (!day.date) return "";
    const [year, month, dayNum] = day.date.split("-");
    return `${year}.${month}.${dayNum}`;
  });

  return { days, dates };
}

// 백엔드가 "H:mm:ss" 같은 형태로 시간을 내려줄 때가 있어서, 화면에는 항상
// 초 없이 0으로 패딩된 "HH:mm" 형태로 통일해서 보여준다.
// AI 생성/최적화 결과가 10분 단위가 아닌 값(예: 10:01)을 내려줄 수 있어서,
// 여기서 항상 10분 단위로 반올림한다 — 일정 시간은 무조건 10분 단위로 맞추기로 함.
export function normalizeTime(raw: string | undefined, fallback = "00:00"): string {
  if (!raw) return fallback;
  const [hour, minute] = raw.split(":");
  const h = Number(hour);
  const m = Number(minute);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return fallback;
  return minutesToTime(roundToNearest10(h * 60 + m));
}

// 백엔드 LocalTime은 "09:20:00"처럼 초까지, 혹은 "9:20"처럼 0패딩 없이 내려올 수 있다.
// 화면 표시와 문자열 비교("09:20" < "10:00")가 둘 다 이 형식에 의존하므로,
// 여행 시작/종료 시간처럼 그대로 노출되는 값은 반드시 "HH:mm"으로 맞춰서 쓴다.
// (normalizeTime과 달리 10분 단위 반올림은 하지 않는다 — 경계값은 그대로 지켜야 한다.)
export function toHourMinute(raw: string | undefined): string | undefined {
  if (!raw) return raw;
  const [hour, minute] = raw.split(":");
  const h = Number(hour);
  const m = Number(minute);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return raw;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

export function timeToMinutes(time: string): number {
  const [hour, minute] = time.split(":");
  return (Number(hour) || 0) * 60 + (Number(minute) || 0);
}

export function minutesToTime(totalMinutes: number): string {
  const clamped = Math.max(0, Math.min(23 * 60 + 59, totalMinutes));
  const h = Math.floor(clamped / 60);
  const m = clamped % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

// 여행 시작/종료 시각이 자정(00:00)으로 저장돼 있으면 "설정 안 됨"으로 본다.
// 실제로 자정에 시작하거나 끝나는 여행을 고르는 사람은 없고, 시간이 비어 있는 일정을
// 여행 수정 모달에서 저장하면 이 값이 들어온다(모달이 빈 시간을 00:00으로 보여주고
// 그대로 PATCH한다). 그걸 경계로 그대로 쓰면 마지막 날 항목이 전부 00:00으로 붙는다.
export function boundMinutes(value: string | undefined): number | undefined {
  const hourMinute = toHourMinute(value);
  if (!hourMinute || hourMinute === "00:00") return undefined;
  return timeToMinutes(hourMinute);
}

// 자동으로 계산되는 시간(AI 생성/최적화/새 항목 추가 등)이 여행 시작/종료 시간을
// 절대 벗어나지 않도록 첫날은 시작 시간 이상, 마지막날은 종료 시간 이하로 강제한다.
export function clampToTripBounds(
  totalMinutes: number,
  dayIdx: number,
  totalDays: number,
  bounds?: TripTimeBoundsLike | null,
): number {
  let clamped = totalMinutes;
  const startMin = dayIdx === 0 ? boundMinutes(bounds?.startTime) : undefined;
  const endMin = dayIdx === totalDays - 1 ? boundMinutes(bounds?.endTime) : undefined;
  if (startMin !== undefined) clamped = Math.max(clamped, startMin);
  if (endMin !== undefined) clamped = Math.min(clamped, endMin);
  return clamped;
}

// 교통수단을 바꿔서 자동으로 밀리는 시간은 10분 단위로 맞춘다 — 원래 있던 시간(예:
// 10:13)은 그대로 두고, 이번에 새로 계산되는 시간만 10분 단위로 반올림한다.
export function roundToNearest10(totalMinutes: number): number {
  return Math.round(totalMinutes / 10) * 10;
}

const API_TRAVEL_MODE_MAP: Record<string, TransportType> = {
  transit: "버스",
  bus: "버스",
  walk: "도보",
  taxi: "택시",
};

const TRANSPORT_TYPES: readonly TransportType[] = ["버스", "지하철", "도보", "택시"];

// 백엔드가 내려주는 routeType("버스"/"지하철"/"도보"/"택시")이 있으면 그대로 쓰고,
// 없으면(예전 데이터 등) travelMode 기반 매핑으로 대체한다. routeType이 travelMode보다
// 더 정확하다 — travelMode="transit"만으로는 버스/지하철을 구분 못 한다.
function resolveTransportType(
  routeType: string | undefined,
  travelMode: string | undefined,
): TransportType | undefined {
  if (routeType && (TRANSPORT_TYPES as readonly string[]).includes(routeType)) {
    return routeType as TransportType;
  }
  return travelMode ? API_TRAVEL_MODE_MAP[travelMode] : undefined;
}

// 버스/지하철은 실제 역명이 없으면 표시하지 않는다 — placeName으로 "OO역" 같은 이름을
// 지어내면 실제로 존재하지 않는 역이 나올 수 있다(예: UN조각공원 → 실제로는 대연역인데
// "UN조각공원역"이 표시되던 사건). 도보/택시는 애초에 역 개념이 없어 장소명을 그대로
// 써도 지어낸 게 아니다.
function hasDisplayableTransport(
  type: TransportType,
  startStationName?: string,
  endStationName?: string,
): boolean {
  if (type !== "버스" && type !== "지하철") return true;
  return Boolean(startStationName) && Boolean(endStationName);
}

interface TravelModeItemLike {
  travelMode?: string;
  travelTimeMin?: number;
  // 백엔드가 저장한 구간 요금. 요금을 모르는 구간(컬럼 추가 전 저장된 항목 등)은 비어 있다.
  travelFare?: number;
  routeType?: string;
  routeNo?: string;
  startStationName?: string;
  endStationName?: string;
  transitDetail?: components["schemas"]["TransitDetail"];
}

// 대중교통 구간 바로 다음이 도보 구간이면 그 소요시간(분)을, 아니면(또는 0분이면) undefined를 돌려준다.
// TransitDetailSegment(trafficType)와 SubPath(type)의 필드명 차이를 둘 다 받는다.
function walkMinAfter(
  next: { type?: string; trafficType?: string; sectionTime?: number } | undefined,
): number | undefined {
  const isWalk = (next?.trafficType ?? next?.type) === "도보";
  return isWalk && next?.sectionTime ? next.sectionTime : undefined;
}

// 도보 구간이면 경로 카드에 그릴 거리(m)·소요시간(분)을, 아니면 undefined를 돌려준다.
// ODsay가 환승 사이에 넣는 10m 미만 도보는 숨기고, distance가 없는 기존 저장 데이터는
// 소요시간만으로 표시한다(그마저 0분이면 숨김).
function toWalk(
  segment:
    | { type?: string; trafficType?: string; sectionTime?: number; distance?: number }
    | undefined,
): TransportWalk | undefined {
  if ((segment?.trafficType ?? segment?.type) !== "도보") return undefined;
  const { distance, sectionTime } = segment ?? {};
  if (distance != null ? distance < 10 : !sectionTime) return undefined;
  return { distanceM: distance ?? undefined, min: sectionTime || undefined };
}

// transitDetail(subPath 배열 전체)이 있으면 실제 다구간(버스+지하철 조합 등 환승 포함)으로,
// 없으면(레거시 데이터·계산 실패 등) undefined를 돌려줘서 호출부가 대표값 1구간으로 폴백하게 한다.
function legsFromTransitDetail(
  transitDetail: components["schemas"]["TransitDetail"] | undefined,
  fallbackFrom: string,
  fallbackTo: string,
):
  | {
      type: TransportType;
      routeName: string;
      from: string;
      to: string;
      arsId?: string;
      routeNo?: string;
      stationId?: number;
      wayCode?: number;
      walkBefore?: TransportWalk;
      walkAfter?: TransportWalk;
    }[]
  | undefined {
  const allSegments = transitDetail?.segments ?? []; // 추가: 도보 구간 조회용 원본 배열
  // 원본 배열에서 도보 구간 제외
  const segments = allSegments.filter(
    (s): s is typeof s & { trafficType: TransportType } =>
      !!s.trafficType &&
      s.trafficType !== "도보" &&
      TRANSPORT_TYPES.includes(s.trafficType as TransportType),
  );
  if (segments.length === 0) return undefined;

  return segments.map((s) => ({
    type: s.trafficType,
    routeName: s.routeNo || s.trafficType,
    from: s.startName || fallbackFrom,
    to: s.endName || fallbackTo,
    // 버스 실시간 도착정보 폴링용. 버스 구간에만 값이 있고 지하철 등은 빈 문자열일 수 있음
    arsId: s.startArsId,
    routeNo: s.routeNo,
    // 지하철 도착정보 폴링용(GET /api/transit/arrival/subway). 지하철 구간에만 값이 있고,
    // 역코드를 못 찾은 경우(stationId=0)엔 상수 스캔에서 걸러지도록 undefined로 비워둔다.
    stationId: s.subwaySchedule?.stationId || undefined,
    wayCode: s.subwaySchedule?.wayCode,
    // 도보 구간 자체는 legs에서 빠지므로(combo 판정·legs[0] 타입이 틀어지지 않게) 앞뒤 leg에 붙인다.
    // walkBefore는 출발지 → 첫 탑승 구간이라 첫 leg에만 둔다.
    walkBefore: allSegments.indexOf(s) === 1 ? toWalk(allSegments[0]) : undefined,
    walkAfter: toWalk(allSegments[allSegments.indexOf(s) + 1]),
  }));
}

// GET .../travel-mode/options 응답의 TransitOption.subPaths(필드명이 trafficType이 아니라 type)를
// 다구간으로 변환한다 — legsFromTransitDetail과 로직은 같지만 필드명이 달라 별도로 둔다.
function legsFromSubPaths(
  subPaths: components["schemas"]["SubPath"][] | undefined,
  fallbackFrom: string,
  fallbackTo: string,
):
  | {
      type: TransportType;
      routeName: string;
      from: string;
      to: string;
      arsId?: string;
      routeNo?: string;
      stationId?: number;
      wayCode?: number;
      walkAfterMin?: number;
      walkBefore?: TransportWalk;
      walkAfter?: TransportWalk;
    }[]
  | undefined {
  const allSubPaths = subPaths ?? []; // 도보 구간 조회용 원본 배열
  // 원본 배열에서 도보 구간 제외
  const nonWalk = allSubPaths.filter(
    (sp): sp is typeof sp & { type: TransportType } =>
      !!sp.type && sp.type !== "도보" && TRANSPORT_TYPES.includes(sp.type as TransportType),
  );
  if (nonWalk.length === 0) return undefined;

  return nonWalk.map((sp) => ({
    type: sp.type,
    routeName: sp.routeNo || sp.type,
    from: sp.startName || fallbackFrom,
    to: sp.endName || fallbackTo,
    // 버스 실시간 도착정보 폴링용. 버스 구간에만 값이 있고 지하철 등은 빈 문자열일 수 있음
    arsId: sp.startArsId,
    routeNo: sp.routeNo,
    // 지하철 도착정보 폴링용. SubPath의 startId/wayCode가 TransitDetail의
    // subwaySchedule.stationId/wayCode와 같은 값이다. 역코드를 못 찾은 경우(startId=0)엔
    // legsFromTransitDetail과 동일하게 undefined로 비워둔다.
    stationId: sp.startId || undefined,
    wayCode: sp.wayCode,
    // 하차 후 바로 이어지는 도보 구간의 소요시간(분) — legsFromTransitDetail과 동일
    walkAfterMin: walkMinAfter(allSubPaths[allSubPaths.indexOf(sp) + 1]),
    walkBefore: allSubPaths.indexOf(sp) === 1 ? toWalk(allSubPaths[0]) : undefined,
    walkAfter: toWalk(allSubPaths[allSubPaths.indexOf(sp) + 1]),
  }));
}

// PATCH .../travel-mode 응답(ItineraryItemResponse)을 화면이 쓰는 TransportInfo로 변환한다.
// buildTransportOptionsFromApi()가 만드는 카드 미리보기와 달리 이건 백엔드가 ODsay로 실제
// 재계산한 값이라 역명/노선번호가 진짜다 — 사용자가 이동수단을 확정한 뒤에만 쓴다.
// 요금도 옵션 카드 값이 아니라 백엔드가 항목에 저장한 travelFare를 쓴다 — 일정 조회로 그린 카드와 기준이 같다.
export function buildTransportFromItem(
  item: TravelModeItemLike,
  fromPlaceName: string,
  toPlaceName: string,
  toStopId: string,
  fallbackDurationMin: number,
): BaseStop["transport"] {
  const transportType = resolveTransportType(item.routeType, item.travelMode);
  if (!transportType) return undefined;
  if (!hasDisplayableTransport(transportType, item.startStationName, item.endStationName)) {
    return undefined;
  }

  const from = item.startStationName ?? fromPlaceName;
  const to = item.endStationName ?? toPlaceName;
  const durationMin = item.travelTimeMin ?? fallbackDurationMin;

  const legs = legsFromTransitDetail(item.transitDetail, from, to) ?? [
    { type: transportType, routeName: item.routeNo || transportType, from, to },
  ];

  return {
    from: fromPlaceName,
    to: toPlaceName,
    durationMin,
    baseDurationMin: durationMin,
    cost: item.travelFare,
    legs,
    toStopId,
  };
}

export interface TripTimeBoundsLike {
  startTime: string;
  endTime: string;
}

// 관광지 방문 시각은 3시간 간격으로 배치한다 — 기본은 10:00 / 13:00 / 16:00.
//
// AI 생성·투표 확정이 채워주는 시각은 체류시간+이동시간을 누적한 값이라 간격이 촘촘해서
// 하루 일정이 오전에 몰려 보인다. 어차피 사용자가 편집하면서 고치는 값이라, 화면에는
// 우리가 정한 간격으로 보여주는 게 낫다.
//
// 여행 시작/종료 시각은 첫날/마지막날에만 적용한다(백엔드 ItineraryTimeUtils와 같은 규칙).
//  - 첫날 시작이 늦으면 그 시각부터 3시간 간격 (20:00 시작, 2곳 → 20:00 / 23:00)
//  - 관광지가 1곳이면 그 시작 시각 그대로
//  - 마지막날은 종료 시각을 넘길 수 없으니, 3시간이 안 들어가면 들어가는 만큼 간격을 좁힌다
const DEFAULT_DAY_START_MIN = 10 * 60;
const DEFAULT_STOP_GAP_MIN = 3 * 60;
// 간격을 좁히더라도 이보다 붙이지는 않는다 — 같은 날 같은 시각은 백엔드가 400으로 막는다.
const MIN_STOP_GAP_MIN = 10;
const LAST_MINUTE_OF_DAY = 23 * 60 + 50;

export function getDefaultDayMinutes(
  dayIdx: number,
  totalDays: number,
  itemCount: number,
  bounds?: TripTimeBoundsLike | null,
): number[] {
  if (itemCount <= 0) return [];

  const startMin = dayIdx === 0 ? boundMinutes(bounds?.startTime) : undefined;
  const endMin = dayIdx === totalDays - 1 ? boundMinutes(bounds?.endTime) : undefined;

  let lower =
    startMin === undefined ? DEFAULT_DAY_START_MIN : Math.max(DEFAULT_DAY_START_MIN, startMin);
  // 상한은 마지막 날의 여행 종료 시각, 그 외의 날은 하루의 마지막 슬롯(23:50).
  const ceiling = Math.min(endMin ?? LAST_MINUTE_OF_DAY, LAST_MINUTE_OF_DAY);
  if (itemCount === 1) return [Math.max(0, Math.min(lower, ceiling))];

  // 3시간이 다 안 들어가면 들어가는 만큼 좁힌다. 같은 날 같은 시각은 백엔드가 400으로
  // 막으므로(저장 자체가 실패한다) 경계를 조금 벗어나더라도 겹치게 두지는 않는다.
  let gap = DEFAULT_STOP_GAP_MIN;
  const span = ceiling - lower;
  if (span < gap * (itemCount - 1)) {
    gap = Math.max(MIN_STOP_GAP_MIN, roundToNearest10(span / (itemCount - 1)));
  }
  // 마지막 항목이 상한(마지막 날의 여행 종료 시각, 그 외에는 23:50)을 넘으면 간격은
  // 그대로 두고 하루를 통째로 앞당긴다 — 늦게 시작하는 날도 순서와 간격이 유지된다.
  lower = Math.max(0, Math.min(lower, ceiling - gap * (itemCount - 1)));

  return Array.from({ length: itemCount }, (_, idx) =>
    Math.min(LAST_MINUTE_OF_DAY, roundToNearest10(lower + gap * idx)),
  );
}

export function getDefaultItemTime(
  dayIdx: number,
  totalDays: number,
  itemIdx: number,
  itemCount: number,
  bounds?: TripTimeBoundsLike | null,
): string {
  const minutes = getDefaultDayMinutes(dayIdx, totalDays, itemCount, bounds);
  return minutesToTime(minutes[itemIdx] ?? minutes[minutes.length - 1] ?? DEFAULT_DAY_START_MIN);
}

// 관광지 기본 체류시간과, 이동시간을 모르는 구간에 쓰는 기본 이동시간.
// 로그를 불러올 때 시간을 다시 매기는 기준 시각 — 일정 탭의 하루 기본 시작(10:00)과 맞춘다.
const IMPORTED_LOG_DAY_START_MIN = 10 * 60;
// 간격을 좁히더라도 이보다 붙이지는 않는다(일정 시각은 10분 단위).
const MIN_IMPORTED_LOG_GAP_MIN = 10;
const DEFAULT_STAY_MIN = 90;
const DEFAULT_TRAVEL_MIN = 30;

// 하루치 방문 시각을 정한다.
//
// 저장된 arrivalTime이 (1) 전부 있고 (2) 오름차순이고 (3) 여행 시작/종료 시간 안에
// 있으면 그대로 쓴다 — AI가 잡아준 시간을 건드릴 이유가 없다.
//
// 하나라도 어긋나면 그날 시작 시각부터 [체류시간 + 다음 장소까지 이동시간]을 더해가며
// 순차적으로 다시 계산한다. 관광지 구성은 그대로 두고 시간만 다시 매긴다.
//   09:00 / 11:00 / 13:00  →(시작 18:00)→  18:00 / 20:00 / 22:00
// 예전엔 항목마다 따로 clamp해서 시작 시간을 늦추면 그날 전부가 같은 시각으로 뭉개졌고
// (18:00 / 18:00 / 18:00), 그 값이 실시간편집 flush를 타고 DB에까지 저장됐다.
function resolveDayTimes(
  items: ItineraryItemResponse[],
  dayIdx: number,
  totalDays: number,
  bounds?: TripTimeBoundsLike | null,
): number[] {
  if (items.length === 0) return [];

  const startMin = dayIdx === 0 ? boundMinutes(bounds?.startTime) : undefined;
  const endMin = dayIdx === totalDays - 1 ? boundMinutes(bounds?.endTime) : undefined;

  const stored = items.map((item) =>
    item.arrivalTime ? timeToMinutes(normalizeTime(item.arrivalTime)) : undefined,
  );
  // 확정 직후에는 도착시간이 비어 있다. 추천 화면과 같은 3시간 간격 배치를 써야
  // 메인 진입 시 일정이 오전에 몰리지 않는다. 저장된 사용자 편집은 유지한다.
  if (stored.every((minute) => minute === undefined)) {
    return getDefaultDayMinutes(dayIdx, totalDays, items.length, bounds);
  }
  // 저장된 시각이 다 있고 순서대로 늘어나면 그 값을 쓴다. 여행 시작/종료 밖으로 나간
  // 경우에도 "버리고 다시 계산"하지 않는다 — 그러면 사용자가 직접 정한 시각까지 함께
  // 사라지고, 다시 계산한 값은 기준선과 같아서 서버로 저장되지도 않아 화면과 DB가 계속
  // 갈린다(백엔드 최적화가 종료 시각을 넘겨 저장하는 경우에 실제로 그렇게 됐다).
  // 간격은 유지한 채 여행 시간 안으로 옮기면, 옮긴 값이 기준선과 달라 저장까지 이어져
  // 다음 조회부터는 화면과 DB가 같아진다.
  const hasAllStored = stored.every((minute) => minute !== undefined);
  const isIncreasing = stored.every((minute, idx) => idx === 0 || minute! > stored[idx - 1]!);
  if (hasAllStored && isIncreasing) {
    let usable = stored as number[];
    if (startMin !== undefined && usable[0] < startMin) {
      const behind = startMin - usable[0];
      usable = usable.map((minute) => Math.min(LAST_MINUTE_OF_DAY, minute + behind));
    }
    if (endMin !== undefined && usable[usable.length - 1] > endMin) {
      const over = usable[usable.length - 1] - endMin;
      usable = usable.map((minute) => Math.max(0, minute - over));
    }
    return usable;
  }

  // items[idx].travelTimeMin은 "이전 장소 → 이 장소" 이동시간이다(다음 구간 표시에
  // nextItem.travelTimeMin을 쓰는 것과 같은 기준).
  const times: number[] = [];
  let cursor = startMin ?? DEFAULT_DAY_START_MIN;
  items.forEach((item, idx) => {
    if (idx > 0) {
      cursor = roundToNearest10(
        cursor + DEFAULT_STAY_MIN + (item.travelTimeMin ?? DEFAULT_TRAVEL_MIN),
      );
    }
    times.push(Math.min(LAST_MINUTE_OF_DAY, cursor));
  });

  // 마지막 날은 종료 시간을 넘길 수 없다 — 간격은 유지한 채 하루를 통째로 앞당긴다.
  if (endMin !== undefined) {
    const over = times[times.length - 1] - endMin;
    if (over > 0) return times.map((minute) => Math.max(0, minute - over));
  }
  return times;
}

// GET /api/itineraries/{id} 응답을 타임라인 UI가 쓰는 BaseStop[][] 구조로 변환한다.
// dayIds는 stopsPerDay와 같은 인덱스로 대응하는 실제 dayId — 일차별 쓰기 API(PATCH/DELETE)에 필요.
// day 하나의 항목 목록을 화면이 쓰는 BaseStop[]로 변환한다. mapItineraryDetailToDays(전체
// 일정 조회 응답)와 낙관적 락 충돌(409) 응답의 day 하나를 화면에 반영하는 경로가 이 로직을
// 공유한다 — 후자는 응답 바디에 이미 최신 day 상태가 실려 있어(ItineraryService의
// DayVersionConflictException) 별도 조회 없이 바로 이 함수로 reconcile할 수 있다.
export function mapDayItemsToStops(
  dayId: string,
  rawItems: ItineraryItemResponse[] | undefined,
  dayIdx: number,
  totalDays: number,
  timeBounds?: TripTimeBoundsLike | null,
): BaseStop[] {
  const items = [...(rawItems ?? [])].sort((a, b) => (a.orderIndex ?? 0) - (b.orderIndex ?? 0));

  // 시각은 항목마다 따로 맞추지 않고 하루치를 한 번에 정한다(resolveDayTimes 주석 참고).
  const dayMinutes = resolveDayTimes(items, dayIdx, totalDays, timeBounds);

  return items.map((item, idx): BaseStop => {
    const nextItem = items[idx + 1];
    const placeName = item.spot?.name ?? "장소 미정";
    const nextPlaceName = nextItem?.spot?.name ?? "";
    const nextStopId = nextItem?.id ?? `${dayId}-${idx + 1}`;
    // travelMode/routeType은 최적화가 실행된 뒤에만 채워진다 — 값이 없으면(방금 추가한
    // 스팟 등) "버스"로 임의 확정하지 않고 transport 자체를 비워서 아직 계산 전임을
    // 그대로 반영한다.
    const transportType = resolveTransportType(nextItem?.routeType, nextItem?.travelMode);
    const legFrom = nextItem?.startStationName ?? placeName;
    const legTo = nextItem?.endStationName ?? nextPlaceName;
    const recommendedTransport =
      nextItem &&
      transportType &&
      hasDisplayableTransport(transportType, nextItem.startStationName, nextItem.endStationName)
        ? {
            from: placeName,
            to: nextPlaceName,
            durationMin: nextItem.travelTimeMin ?? 30,
            baseDurationMin: nextItem.travelTimeMin ?? 30,
            cost: nextItem.travelFare,
            // transitDetail이 있으면(버스+지하철 조합 등 환승 포함) 실제 다구간으로,
            // 없으면 대표값 1구간(routeNo가 있으면 실제 값, 없으면(도보/택시 등) 타입 이름)으로 표시한다.
            legs: legsFromTransitDetail(nextItem.transitDetail, legFrom, legTo) ?? [
              {
                type: transportType,
                routeName: nextItem.routeNo || transportType,
                from: legFrom,
                to: legTo,
              },
            ],
            toStopId: nextStopId,
          }
        : undefined;

    return {
      id: item.id ?? `${dayId}-${idx}`,
      spotId: item.spot?.id,
      time: minutesToTime(dayMinutes[idx]),
      placeName,
      imageUrl: item.spot?.thumbnailUrl || getFallbackImage(item.spot?.id, placeName),
      category: getCategoryFromKo(item.spot?.collectionCategory ?? "", placeName),
      // item.spot.visited는 "나(현재 로그인한 사용자)"의 방문인증 여부다(백엔드가
      // userId 기준으로 계산해서 내려줌) — 그룹 일정이어도 다른 멤버의 인증 여부가
      // 섞이지 않는다.
      status: item.spot?.visited ? "completed" : "verify",
      // 여행 메모(실데이터)만 우선 보여준다 — 없으면 TimelinePlaceDetailPopup이
      // spotId로 실제 관광지 소개글을 조회해서 보여준다(useSpotDetail).
      description: item.memo,
      address: item.spot?.address,
      lat: item.spot?.lat,
      lng: item.spot?.lng,
      mapUrl: item.spot
        ? `https://map.kakao.com/link/map/${encodeURIComponent(placeName)},${item.spot.lat},${item.spot.lng}`
        : `https://map.kakao.com/link/search/${encodeURIComponent(placeName)}`,
      isBookmarked: item.spot?.collected,
      transport: recommendedTransport,
      recommendedTransport,
    };
  });
}

export function mapItineraryDetailToDays(
  detail: ItineraryDetailResponse,
  timeBounds?: TripTimeBoundsLike | null,
): {
  days: BaseStop[][];
  dates: string[];
  dayIds: string[];
  versions: (number | undefined)[];
} {
  const sortedDays = [...(detail.days ?? [])].sort(
    (a, b) => (a.dayNumber ?? 0) - (b.dayNumber ?? 0),
  );
  const totalDays = sortedDays.length;

  const days = sortedDays.map((day, dayIdx) =>
    mapDayItemsToStops(day.id ?? "", day.items, dayIdx, totalDays, timeBounds),
  );

  const dates = sortedDays.map((day, dayIdx) => {
    const date = resolveDayDate(day.date, dayIdx, detail.startAt);
    if (!date) return "";
    const [year, month, dayNum] = date.split("-");
    return `${year}.${month}.${dayNum}`;
  });

  const dayIds = sortedDays.map((day) => day.id ?? "");
  // 낙관적 락(version) — 프론트가 보관해뒀다가 replaceDayItems/reorderItems 호출 시
  // expectedVersion으로 실어 보낸다. 서버가 아직 안 내려주면(과거 응답 캐시 등) undefined로
  // 두고, 호출부는 undefined면 버전 체크를 건너뛰는 걸로 취급한다(구버전 호환과 동일 규칙).
  const versions = sortedDays.map((day) => day.version);

  return { days, dates, dayIds, versions };
}

export function rebuildTransport(stops: BaseStop[]): BaseStop[] {
  return stops.map((stop, idx) => {
    const nextStop = stops[idx + 1];
    if (!nextStop) return { ...stop, transport: undefined };

    const existing = stop.transport;
    const type = existing?.legs[0]?.type;
    // 기존에 계산된 이동수단이 없으면(아직 최적화 전) "버스"로 지어내지 않고 그대로 비워둔다.
    if (!type) return { ...stop, transport: undefined };

    // 이웃(다음 스팟)이 바뀌지 않았으면 백엔드/추천 경로가 이미 준 실제 값(정류장명·역명
    // 등)이 여전히 유효하므로 그대로 둔다. placeName 기준으로 다시 만들면 실제 역명이
    // "OO역"처럼 지어낸 이름으로 덮어써진다(예: UN조각공원 → 실제로는 대연역인데
    // "UN조각공원역"이라는 존재하지 않는 역이 표시되던 버그).
    if (existing.toStopId && existing.toStopId === nextStop.id) {
      return stop;
    }

    // 이웃이 바뀐 경우엔 이 정보가 더 이상 이 구간의 것이 아니므로, 가짜 이름으로
    // 다시 만들어내지 않고 비워서 재계산 전임을 그대로 반영한다(다음 최적화/이동수단
    // 변경 시 실제 값으로 채워짐).
    return { ...stop, transport: undefined };
  });
}

// ODsay가 pathType별로 계산해준 옵션 타입("지하철"/"버스"/"버스+지하철"/"도보"/"택시")을
// PATCH .../travel-mode 요청의 travelMode 값으로 매핑한다.
const OPTION_TYPE_TO_TRAVEL_MODE: Record<string, string> = {
  지하철: "subway",
  버스: "bus",
  "버스+지하철": "combo",
  도보: "walk",
  택시: "taxi",
};

// RouteOption.id(화면용: walk/taxi/bus/subway/combo)를 백엔드
// travelMode(walk/transit/taxi)로 변환한다.
export function toBackendTravelMode(id: string): "walk" | "transit" | "taxi" {
  if (id === "walk") return "walk";
  if (id === "taxi") return "taxi";
  return "transit";
}

type ApiTransitOption = components["schemas"]["TransitOption"];

// GET .../travel-mode/options 응답(TransitOption[])을 화면 카드(RouteOption[])로 변환한다.
// 예전엔 이미 확정된 경로 하나로 4개 카드(버스/지하철/택시/도보)를 추정해서 만들고 요금도
// 하드코딩(1500/1600/14500원)했는데, 이젠 ODsay가 지하철 전용/버스 전용/버스+지하철 조합을
// 각각 실제로 계산해서 주기 때문에 그 값을 그대로 쓴다. 추정/하드코딩 없음.
export function buildTransportOptionsFromApi(
  options: ApiTransitOption[] | undefined,
  fallbackFrom: string,
  fallbackTo: string,
): RouteOption[] {
  if (!options || options.length === 0) return [];

  // 대중교통(도보/택시 제외) 중 가장 빠른 옵션에 추천 표시를 붙인다.
  const transitTimes = options
    .filter((option) => option.type !== "도보" && option.type !== "택시")
    .map((option) => option.totalTime ?? Infinity);
  const fastestTransitTime = transitTimes.length > 0 ? Math.min(...transitTimes) : undefined;

  return options.map((option): RouteOption => {
    const type = option.type ?? "";
    const id = OPTION_TYPE_TO_TRAVEL_MODE[type] ?? type;

    // 버스+지하철 조합처럼 실제 환승 구간이 있으면 subPath 전체로 다구간 표시,
    // 없으면(도보/택시처럼 subPath가 비어있는 경우) 옵션 타입 자체를 1구간으로 표시.
    const legs =
      legsFromSubPaths(option.subPaths, fallbackFrom, fallbackTo) ??
      (TRANSPORT_TYPES.includes(type as TransportType)
        ? [{ type: type as TransportType, routeName: type, from: fallbackFrom, to: fallbackTo }]
        : []);

    return {
      id,
      legs,
      durationMin: option.totalTime ?? 0,
      cost: option.totalFare ?? 0,
      isRecommended: fastestTransitTime !== undefined && option.totalTime === fastestTransitTime,
    };
  });
}

// buildTransportOptionsFromApi()가 만드는 옵션(subway/bus/combo/taxi/walk) 중 이 스팟이
// 지금 실제로 어떤 걸 쓰고 있는지 id로 알려준다. 이걸 별도 state로 들고 있으면(예전 방식)
// 스팟마다 다른 값인데 전역 state 하나를 공유하게 돼서, 다른 스팟을 지하철로 바꾼 뒤
// 버스인 스팟을 열어도 지하철이 선택된 것처럼 보이는 문제가 있었다 — 그래서 매번
// activeStop에서 직접 계산한다.
export function getActiveTransportOptionId(stop: BaseStop | undefined): string {
  const legs = stop?.transport?.legs ?? [];
  if (legs.length === 0) return "none"; // 아직 이동수단이 계산되지 않음 — 어떤 카드도 선택 표시하지 않는다

  // 같은 타입으로만 환승(버스→버스 등)한 경우는 legs가 여러 개여도 combo가 아니라
  // 해당 타입 하나로 본다 — 서로 다른 교통수단이 섞였을 때만 combo(2026-08-21 버그 리포트).
  const types = new Set(legs.map((leg) => leg.type));
  if (types.size > 1) return "combo";

  switch (legs[0]?.type) {
    case "지하철":
      return "subway";
    case "버스":
      return "bus";
    case "택시":
      return "taxi";
    case "도보":
      return "walk";
    default:
      return "none";
  }
}
