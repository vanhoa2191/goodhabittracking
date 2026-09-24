import { afterEach, describe, expect, it, vi } from 'vitest';
import { approvalLagBucket, createProductAnalyticsGate, createSessionTracker, parseProductEvent, recordLocalWishlistSelection, sessionMode, trackProductEvent } from '@/lib/product-analytics';

afterEach(() => vi.restoreAllMocks());

describe('product analytics boundary', () => {
  it('stops delivery immediately after consent is revoked', () => {
    const gate = createProductAnalyticsGate();
    const sink = vi.fn();
    const event = { event: 'mascot_letter_read', mode: 'cloud' } as const;

    gate.setSink(sink);
    expect(gate.record(event)).toBe(true);
    gate.setSink(undefined);
    expect(gate.record(event)).toBe(false);
    expect(sink).toHaveBeenCalledExactlyOnceWith(event);
  });

  it('keeps one active session when its destination changes', () => {
    const gate = createProductAnalyticsGate();
    const firstSink = vi.fn();
    const nextSink = vi.fn();
    const session = createSessionTracker((event) => { gate.record(event); });

    gate.setSink(firstSink);
    session.enter('local', 'child-1');
    gate.setSink(nextSink);
    session.enter('local', 'child-1');

    expect(firstSink).toHaveBeenCalledExactlyOnceWith({ event: 'session_started', mode: 'local' });
    expect(nextSink).not.toHaveBeenCalled();
  });

  it('counts each changed local choice even before a rerender', () => {
    const selections = new Map<string, string>();

    expect(recordLocalWishlistSelection(selections, 'child-1', 'reward-a', 'reward-a')).toBe(false);
    expect(recordLocalWishlistSelection(selections, 'child-1', 'reward-b', 'reward-a')).toBe(true);
    expect(recordLocalWishlistSelection(selections, 'child-1', 'reward-a', 'reward-a')).toBe(true);
    expect(recordLocalWishlistSelection(selections, 'child-1', 'reward-a', 'reward-a')).toBe(false);
  });

  it('does nothing without a configured destination', () => {
    const request = vi.spyOn(globalThis, 'fetch');

    expect(trackProductEvent({ event: 'session_started', mode: 'demo' })).toBe(false);
    expect(trackProductEvent({ event: 'mascot_selected', mode: 'local' })).toBe(false);
    expect(trackProductEvent({ event: 'mascot_letter_read', mode: 'cloud' })).toBe(false);
    expect(trackProductEvent({ event: 'wishlist_selected', mode: 'local' })).toBe(false);
    expect(request).not.toHaveBeenCalled();
  });

  it.each([
    { event: 'mascot_selected', mode: 'local' },
    { event: 'mascot_selected', mode: 'cloud' },
    { event: 'mascot_letter_read', mode: 'local' },
    { event: 'mascot_letter_read', mode: 'cloud' },
    { event: 'wishlist_selected', mode: 'local' },
    { event: 'wishlist_selected', mode: 'cloud' },
  ] as const)('forwards only the allowlisted $event payload in $mode mode', (event) => {
    const sink = vi.fn();

    expect(trackProductEvent(event, sink)).toBe(true);
    expect(sink).toHaveBeenCalledExactlyOnceWith(event);
    expect(parseProductEvent({ ...event, childId: 'child-1' })).toBeNull();
    expect(parseProductEvent({ ...event, childName: 'An' })).toBeNull();
    expect(parseProductEvent({ ...event, templateKey: 'leo_1' })).toBeNull();
    expect(parseProductEvent({ ...event, rewardId: 'reward-1' })).toBeNull();
  });

  it('rejects unexpected personal fields and unknown events', () => {
    expect(parseProductEvent({ event: 'task_ticked', action: 'completed', mode: 'cloud', childName: 'An' })).toBeNull();
    expect(parseProductEvent({ event: 'payment_completed', mode: 'cloud' })).toBeNull();
  });

  it('passes only allowlisted event shapes to the destination', () => {
    const sink = vi.fn();
    const event = { event: 'task_ticked', action: 'pending_approval', mode: 'local' } as const;
    expect(trackProductEvent(event, sink)).toBe(true);
    expect(sink).toHaveBeenCalledExactlyOnceWith(event);
  });

  it('does not forward extra fields added to an otherwise typed event', () => {
    const sink = vi.fn();
    const event = { event: 'task_ticked', action: 'completed', mode: 'cloud', childName: 'An' } as const;

    expect(trackProductEvent(event, sink)).toBe(false);
    expect(sink).not.toHaveBeenCalled();
  });

  it('keeps destination failures out of the core habit flow', () => {
    const sink = vi.fn(() => { throw new Error('unavailable'); });
    expect(trackProductEvent({ event: 'session_started', mode: 'demo' }, sink)).toBe(false);
  });

  it('buckets approval delay without exposing timestamps', () => {
    const now = new Date('2026-09-23T12:00:00.000Z');
    expect(approvalLagBucket('2026-09-23T11:30:00.000Z', now)).toBe('under_1h');
    expect(approvalLagBucket('2026-09-22T12:00:00.000Z', now)).toBe('over_1d');
    expect(approvalLagBucket('invalid', now)).toBe('unknown');
  });

  it('counts one child-facing session per entry for demo and cloud modes', () => {
    const sink = vi.fn();
    const session = createSessionTracker(sink);

    session.enter('demo');
    session.enter('demo');
    session.leave();
    session.enter('cloud');

    expect(sink).toHaveBeenCalledTimes(2);
    expect(sink).toHaveBeenNthCalledWith(1, { event: 'session_started', mode: 'demo' });
    expect(sink).toHaveBeenNthCalledWith(2, { event: 'session_started', mode: 'cloud' });
  });

  it('starts a new session when the active child changes without sending the child ID', () => {
    const sink = vi.fn();
    const session = createSessionTracker(sink);

    session.enter('cloud', 'child-one');
    session.enter('cloud', 'child-one');
    session.enter('cloud', 'child-two');

    expect(sink).toHaveBeenCalledTimes(2);
    expect(sink).toHaveBeenLastCalledWith({ event: 'session_started', mode: 'cloud' });
  });

  it('starts only a ready child-facing session and classifies its storage', () => {
    const state = { isLoaded: true, mode: 'kid' as const, activeChildId: 'child-1', isDemoSession: false, isFamilyConnected: false, hasCloudSnapshot: false, storageMode: 'local' as const };

    expect(sessionMode(state)).toBe('local');
    expect(sessionMode({ ...state, isDemoSession: true })).toBe('demo');
    expect(sessionMode({ ...state, isFamilyConnected: true })).toBe('cloud');
    expect(sessionMode({ ...state, hasCloudSnapshot: true })).toBe('local');
    expect(sessionMode({ ...state, storageMode: 'cloud' })).toBeNull();
    expect(sessionMode({ ...state, hasCloudSnapshot: true, storageMode: 'cloud' })).toBe('cloud');
    expect(sessionMode({ ...state, mode: 'parent' })).toBeNull();
    expect(sessionMode({ ...state, isLoaded: false })).toBeNull();
  });
});
