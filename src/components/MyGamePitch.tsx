import { useCallback, useEffect, useRef, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { useBlocker } from "@tanstack/react-router";
import { MyGamePitchView } from "@/components/MyGamePitchView";
import { getPitchRatings, savePitchRating } from "@/lib/pitch-ratings.functions";
import type { MyGameLineup } from "@/lib/my-games";
import type { PitchRatingInput, PitchRatings, PitchSaveResult } from "@/lib/pitch-rating";

export function MyGamePitch({
  detail,
  onDirtyChange,
  onBusyChange,
}: {
  detail: MyGameLineup;
  onDirtyChange: (dirty: boolean) => void;
  onBusyChange: (busy: boolean) => void;
}) {
  const load = useServerFn(getPitchRatings);
  const save = useServerFn(savePitchRating);
  const loadingRequest = useRef(0);
  const [data, setData] = useState<PitchRatings>({ reviewStatus: null, ratings: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  useBlocker({
    shouldBlockFn: () => busy || !window.confirm("Há notas ainda não salvas. Deseja sair?"),
    disabled: !dirty && !busy,
    enableBeforeUnload: false,
  });
  const refresh = useCallback(async () => {
    const token = ++loadingRequest.current;
    setLoading(true);
    try {
      const next = await load({ data: { fixtureId: detail.game.id } });
      if (loadingRequest.current === token) {
        setData(next);
        setError(false);
      }
    } catch {
      if (loadingRequest.current === token) setError(true);
    } finally {
      if (loadingRequest.current === token) setLoading(false);
    }
  }, [load, detail.game.id]);
  useEffect(() => {
    void refresh();
    return () => {
      loadingRequest.current += 1;
    };
  }, [refresh]);
  useEffect(() => {
    onDirtyChange(dirty);
    return () => onDirtyChange(false);
  }, [dirty, onDirtyChange]);
  useEffect(() => {
    onBusyChange(busy);
    return () => onBusyChange(false);
  }, [busy, onBusyChange]);
  async function persist(input: PitchRatingInput): Promise<PitchSaveResult> {
    const result = await save({ data: input });
    if (result.ok)
      setData((current) => ({
        reviewStatus: current.reviewStatus ?? "PENDING",
        ratings: [
          ...current.ratings.filter((r) => r.playerId !== result.rating.playerId),
          result.rating,
        ],
      }));
    return result;
  }
  return (
    <MyGamePitchView
      detail={detail}
      state={data}
      loading={loading}
      loadError={error}
      onReload={() => void refresh()}
      onSave={persist}
      onDirtyChange={setDirty}
      onBusyChange={setBusy}
    />
  );
}
