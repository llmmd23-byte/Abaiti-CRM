const CHANNEL_NAME = "marketing-assets-updated";
const STORAGE_KEY = "marketing-assets-updated-at";

export function notifyMarketingAssetsChanged() {
  if (typeof window === "undefined") return;

  const stamp = String(Date.now());
  try {
    window.localStorage.setItem(STORAGE_KEY, stamp);
  } catch {
    // Ignore storage failures and still try the broadcast channel.
  }

  try {
    const channel = new BroadcastChannel(CHANNEL_NAME);
    channel.postMessage(stamp);
    channel.close();
  } catch {
    // BroadcastChannel is not available in every browser.
  }
}

export function subscribeMarketingAssetsChanged(onChange: () => void) {
  if (typeof window === "undefined") return () => {};

  const handleStorage = (event: StorageEvent) => {
    if (event.key === STORAGE_KEY) {
      onChange();
    }
  };

  let channel: BroadcastChannel | null = null;
  const handleMessage = () => onChange();

  window.addEventListener("storage", handleStorage);

  if (typeof BroadcastChannel !== "undefined") {
    channel = new BroadcastChannel(CHANNEL_NAME);
    channel.addEventListener("message", handleMessage);
  }

  return () => {
    window.removeEventListener("storage", handleStorage);
    if (channel) {
      channel.removeEventListener("message", handleMessage);
      channel.close();
    }
  };
}
