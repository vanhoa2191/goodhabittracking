export type InstallPrompt = Event & {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
};

let installPrompt: InstallPrompt | null = null;
const listeners = new Set<() => void>();

export function setInstallPrompt(prompt: InstallPrompt | null) {
  installPrompt = prompt;
  listeners.forEach((listener) => listener());
}

export function getInstallPrompt() {
  return installPrompt;
}

export function subscribeInstallPrompt(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
