/** Waits for a save, but no longer than `ms`: a save that never answers, or fails, counts as not saved. */
export function settleWithin(save: Promise<boolean>, ms: number): Promise<boolean> {
  return new Promise((resolve) => {
    const timer = setTimeout(() => resolve(false), ms);
    save.then(
      (saved) => { clearTimeout(timer); resolve(saved); },
      () => { clearTimeout(timer); resolve(false); },
    );
  });
}
