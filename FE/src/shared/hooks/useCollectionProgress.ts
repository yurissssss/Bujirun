import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { keys, searchSpots, SPOT_LIST_STALE_TIME_MS } from "@/shared/api/domains/spot";

type CollectionProgressValue = {
  total: number;
  count: number;
};

type CategoryProgress = Record<string, CollectionProgressValue>;

export function useCollectionProgress() {
  const { data = [], ...query } = useQuery({
    queryKey: keys.search(),
    queryFn: () => searchSpots(),
    staleTime: SPOT_LIST_STALE_TIME_MS,
  });

  const { total, count, categoryProgress } = useMemo(() => {
    return data.reduce(
      (acc, spot) => {
        if (!spot.isCollection) {
          return acc;
        }

        acc.total += 1;

        if (spot.collected) {
          acc.count += 1;
        }

        const category = spot.collectionCategory ?? "UNKNOWN";

        if (!acc.categoryProgress[category]) {
          acc.categoryProgress[category] = {
            total: 0,
            count: 0,
          };
        }

        acc.categoryProgress[category].total += 1;

        if (spot.collected) {
          acc.categoryProgress[category].count += 1;
        }

        return acc;
      },
      {
        total: 0,
        count: 0,
        categoryProgress: {} as CategoryProgress,
      },
    );
  }, [data]);

  return {
    ...query,
    spots: data,
    total,
    count,
    categoryProgress,
  };
}
