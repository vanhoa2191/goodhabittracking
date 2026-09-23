import { describe, expect, it, vi } from 'vitest';
import { approvalLagBucket, createSessionTracker, parseProductEvent, sessionMode, trackProductEvent } from '@/lib/product-analytics';

describe('product analytics boundary', () => {
  it('does nothing without a configured destination', () => {
    expect(trackProductEvent({ event: 'session_started', mode: 'demo' })).toBe(false);
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
