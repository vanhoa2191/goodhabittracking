/** True when the address carries a child pairing link (`?pair=…`), as opened by a camera app from a parent's QR code. */
export function hasPairLink(search: string): boolean {
  return new URLSearchParams(search).has('pair');
}

/**
 * The child block of the entry gate starts closed so a new visitor sees two clear choices. It starts open when the
 * visitor is already pairing a child device: a pairing link was opened, or the pairing dialog is on screen.
 */
export function shouldOpenChildBlock({ pairingOpen, search }: { readonly pairingOpen: boolean; readonly search: string }): boolean {
  return pairingOpen || hasPairLink(search);
}
