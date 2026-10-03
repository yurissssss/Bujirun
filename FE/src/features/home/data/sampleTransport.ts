import type { TransportGroup } from "@/features/home/types/transport";

export const SAMPLE_TRANSPORTS: TransportGroup[] = [
  {
    fromPlace: "광안리 해수욕장",
    toPlace: "광안대교",
    selectedOptionId: "bus-subway",
    options: [
      {
        id: "bus-subway",
        durationText: "30분",
        costText: "1,500원",
        isRecommended: true,
        steps: [
          {
            type: "버스",
            routeName: "2012",
            from: "광안리 해수욕장 정류장",
            to: "광안역 정류장",
            arrivalText: "3분 후 도착 | 2정류장 전",
            // 샘플 정류소 ID — 실제 일정 연동 전까지는 예시 값
            arsId: "12181",
            routeNo: "2012",
          },
          {
            type: "지하철",
            routeName: "2호선",
            from: "광안역",
            to: "광안대교역",
            arrivalText: "5분 후 도착 | 2역 전",
          },
        ],
      },
      {
        id: "taxi",
        durationText: "20분",
        costText: "14,500원",
        steps: [
          {
            type: "택시",
            routeName: "택시",
            from: "광안리 해수욕장",
            to: "광안대교",
          },
        ],
      },
      {
        id: "walk",
        durationText: "1시간 20분",
        costText: "0원",
        steps: [
          {
            type: "도보",
            routeName: "도보",
            from: "광안리 해수욕장",
            to: "광안대교",
          },
        ],
      },
    ],
  },
  {
    fromPlace: "광안대교",
    toPlace: "민락수변공원",
    selectedOptionId: "walk",
    options: [
      {
        id: "walk",
        durationText: "12분",
        costText: "0원",
        isRecommended: true,
        steps: [
          {
            type: "도보",
            routeName: "도보",
            from: "광안대교",
            to: "민락수변공원",
          },
        ],
      },
      {
        id: "taxi",
        durationText: "8분",
        costText: "5,800원",
        steps: [
          {
            type: "택시",
            routeName: "택시",
            from: "광안대교",
            to: "민락수변공원",
          },
        ],
      },
    ],
  },
];

export const DEFAULT_TRANSPORT_GROUP = SAMPLE_TRANSPORTS[0];
export const DEFAULT_TRANSPORT_OPTION =
  DEFAULT_TRANSPORT_GROUP.options.find(
    (option) => option.id === DEFAULT_TRANSPORT_GROUP.selectedOptionId,
  ) ?? DEFAULT_TRANSPORT_GROUP.options[0];

export function findTransportGroupByPlaces(fromPlace: string, toPlace: string) {
  return SAMPLE_TRANSPORTS.find(
    (transport) => transport.fromPlace === fromPlace && transport.toPlace === toPlace,
  );
}

export function getSelectedTransportOption(
  transportGroup: TransportGroup,
  selectedOptionId?: string,
) {
  return (
    transportGroup.options.find(
      (option) => option.id === (selectedOptionId ?? transportGroup.selectedOptionId),
    ) ?? transportGroup.options[0]
  );
}
