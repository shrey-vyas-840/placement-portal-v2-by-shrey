import { useEffect, useState } from "react";
import { loadingMessages, type LoadingPage } from "@/constants/loadingMessages";

export function useLoadingMessages(page: LoadingPage) {
  const messages = loadingMessages[page];
  const [index, setIndex] = useState(0);

  useEffect(() => {
    setIndex(0)
  }, [page]);

  useEffect(() => {
   const timer = window.setInterval(() => {
  setIndex((current) => (current + 1) % messages.length);
}, 1500);

    return () => window.clearInterval(timer);
  }, [messages.length, page]);

  return messages[index] ?? messages[0] ?? "";
}