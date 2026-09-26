export type ParentReminderPermission = 'default' | 'denied' | 'granted' | 'unsupported';
export type ParentReminderDelivery = 'disabled' | 'in_app_only' | 'browser_ready';

type ParentReminderDeliveryInput = {
  readonly consented: boolean;
  readonly permission: ParentReminderPermission;
};

type ParentReminderVisibilityInput = {
  readonly consented: boolean;
  readonly familyPaused: boolean;
  readonly pendingCount: number;
};

export function resolveParentReminderDelivery(input: ParentReminderDeliveryInput): ParentReminderDelivery {
  if (!input.consented) return 'disabled';
  return input.permission === 'granted' ? 'browser_ready' : 'in_app_only';
}

export function shouldShowParentReminder(input: ParentReminderVisibilityInput): boolean {
  return input.consented && !input.familyPaused && input.pendingCount > 0;
}
