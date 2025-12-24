import { useState, useRef, useCallback, useEffect } from "react";

type PollStatus = "idle" | "pending" | "ready" | "error";

export function useSnapshotPoll(projectId: string) {
  const [status, setStatus] = useState<PollStatus>("idle");
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [snapshot, setSnapshot] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const attempts = useRef(0);
  const running = useRef(false);
  const timer = useRef<number | null>(null);
  const initialCheckDone = useRef(false);

  const fetchOnce = useCallback(async () => {
    try {
      const res = await fetch(`/api/student/project/${projectId}/snapshot?mode=latest`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || JSON.stringify(data));
      if (data.ready) {
        setSnapshot(data.snapshot);
        setStatus("ready");
        running.current = false;
        if (timer.current) window.clearTimeout(timer.current);
      } else {
        // still pending
        setStatus("pending");
        attempts.current++;
        scheduleNext();
      }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } catch (err: any) {
      setError(err.message || String(err));
      setStatus("error");
      running.current = false;
    }
  }, [projectId]);

  const scheduleNext = () => {
    if (!running.current) return;
    if (attempts.current >= 25) {
      setStatus("error");
      setError("snapshot poll timeout");
      running.current = false;
      return;
    }
    const delay = Math.min(200 + attempts.current * 300, 2000);
    timer.current = window.setTimeout(fetchOnce, delay);
  };

  const startPolling = useCallback(() => {
    if (running.current) return;
    running.current = true;
    attempts.current = 0;
    setStatus("pending");
    fetchOnce();
  }, [fetchOnce]);

  const stopPolling = useCallback(() => {
    running.current = false;
    if (timer.current) {
      window.clearTimeout(timer.current);
      timer.current = null;
    }
    setStatus(prev => (prev === "ready" ? prev : "idle"));
  }, []);

  // Auto-check snapshot on mount
  useEffect(() => {
    if (initialCheckDone.current) return;
    initialCheckDone.current = true;
    
    // Do one initial fetch to check snapshot status
    (async () => {
      try {
        const res = await fetch(`/api/student/project/${projectId}/snapshot?mode=latest`);
        const data = await res.json();
        if (data.ok && data.ready && data.snapshot) {
          setSnapshot(data.snapshot);
          setStatus("ready");
        } else {
          setStatus("idle");
        }
      } catch (err) {
        console.error("Initial snapshot check failed:", err);
        setStatus("idle");
      }
    })();
  }, [projectId]);

  return { status, snapshot, error, startPolling, stopPolling, attempts: attempts.current };
}
