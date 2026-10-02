'use client';

import dynamic from 'next/dynamic';
import { CircleHelp } from 'lucide-react';
import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import type { HelpTopic } from '@/lib/guide/help-topics';
import type { HelpTopicId } from '@/lib/guide/help-topic-id';
import { loadHelpTopics } from '@/lib/guide/help-topics-loader';
import { useTranslation } from '@/lib/i18n/context';
import { getGuideCopy } from '@/lib/i18n/guide-copy';

const HelpDetailDialog = dynamic(() => import('./HelpDetailDialog').then((module) => module.HelpDetailDialog));

type Props = {
  readonly topic: HelpTopicId;
  readonly className?: string;
};

/**
 * A small "?" next to a feature. Hover, a tap, or Enter/Space on it shows a short explanation (focus alone does not, so a
 * dialog that puts focus on its first control is not interrupted); "See details" opens the matching
 * part of the guide on top of the screen. The texts load the first time one is used.
 */
export function HelpTip({ topic, className = '' }: Props) {
  const { language } = useTranslation();
  const copy = getGuideCopy(language);
  const popoverId = useId();
  const wrapper = useRef<HTMLSpanElement>(null);
  const button = useRef<HTMLButtonElement>(null);
  const popover = useRef<HTMLDivElement>(null);
  const closeTimer = useRef<number | undefined>(undefined);
  const [open, setOpen] = useState(false);
  const [pinned, setPinned] = useState(false);
  const [content, setContent] = useState<HelpTopic | null>(null);
  const [detail, setDetail] = useState(false);
  const [above, setAbove] = useState(false);

  const show = useCallback(() => {
    window.clearTimeout(closeTimer.current);
    setOpen(true);
    void loadHelpTopics().then((topics) => setContent(topics[topic])).catch(() => setContent(null));
  }, [topic]);

  const hide = useCallback(() => {
    window.clearTimeout(closeTimer.current);
    setOpen(false);
    setPinned(false);
  }, []);

  // Keep the explanation inside the screen: slide it back if it would stick out at a side, and open it above the
  // button when there is no room below.
  useLayoutEffect(() => {
    const node = popover.current;
    const trigger = button.current;
    if (!open || !node || !trigger) return;
    node.style.transform = '';
    const rect = node.getBoundingClientRect();
    const margin = 8;
    const triggerRect = trigger.getBoundingClientRect();
    const roomBelow = window.innerHeight - triggerRect.bottom;
    const needsFlip = roomBelow < rect.height + margin && triggerRect.top > rect.height + margin;
    // This only reads layout and places the explanation; there is no other source of truth for it.
    setAbove(needsFlip);
    if (rect.right > window.innerWidth - margin) node.style.transform = `translateX(${window.innerWidth - margin - rect.right}px)`;
    else if (rect.left < margin) node.style.transform = `translateX(${margin - rect.left}px)`;
  }, [open, content]);

  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!wrapper.current?.contains(event.target as Node)) hide();
    };
    document.addEventListener('pointerdown', onPointerDown);
    return () => document.removeEventListener('pointerdown', onPointerDown);
  }, [open, hide]);

  useEffect(() => () => window.clearTimeout(closeTimer.current), []);

  const text = content ? content[language === 'vi' ? 'vi' : 'en'] : null;

  const onPointerEnter = (event: ReactPointerEvent) => {
    if (event.pointerType === 'mouse') show();
  };
  const onPointerLeave = (event: ReactPointerEvent) => {
    if (event.pointerType !== 'mouse' || pinned) return;
    closeTimer.current = window.setTimeout(() => setOpen(false), 150);
  };

  return (
    <>
      <span
        ref={wrapper}
        className={`relative inline-flex align-middle ${className}`}
        onPointerEnter={onPointerEnter}
        onPointerLeave={onPointerLeave}
        onKeyDown={(event) => {
          if (event.key === 'Escape' && open) {
            event.stopPropagation();
            hide();
            button.current?.focus();
          }
        }}
        onBlur={(event) => {
          if (!pinned && !wrapper.current?.contains(event.relatedTarget as Node | null)) setOpen(false);
        }}
      >
        <button
          ref={button}
          type="button"
          aria-label={text ? `${copy.helpOpen}: ${text.title}` : copy.helpOpen}
          aria-expanded={open}
          aria-controls={open ? popoverId : undefined}
          data-help-topic={topic}
          onClick={() => {
            if (open && pinned) hide();
            else { setPinned(true); show(); }
          }}
          className="-my-2 inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-slate-500 hover:text-indigo-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:text-slate-400 dark:hover:text-indigo-300"
        >
          <CircleHelp aria-hidden="true" className="h-[18px] w-[18px]" />
        </button>
        {open && (
          <div
            ref={popover}
            id={popoverId}
            role="dialog"
            aria-modal="false"
            aria-label={text?.title ?? copy.helpOpen}
            className={`absolute left-1/2 z-40 w-72 max-w-[calc(100vw-1rem)] -translate-x-1/2 rounded-2xl ${above ? 'bottom-full mb-1' : 'top-full mt-1'} border border-slate-200 bg-white p-4 text-left shadow-xl dark:border-zinc-700 dark:bg-zinc-900`}
          >
            {text ? (
              <>
                <p className="text-sm font-extrabold text-slate-900 dark:text-white">{text.title}</p>
                <p className="mt-1 text-sm leading-6 font-normal text-slate-700 dark:text-slate-300">{text.text}</p>
                <button
                  type="button"
                  onClick={() => { hide(); setDetail(true); }}
                  className="mt-3 inline-flex min-h-11 items-center rounded-xl bg-indigo-50 px-3 text-sm font-bold text-indigo-800 hover:bg-indigo-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500 dark:bg-indigo-950/50 dark:text-indigo-200"
                >
                  {copy.helpDetails}
                </button>
              </>
            ) : (
              <p role="status" className="text-sm text-slate-600 dark:text-slate-300">{copy.helpLoading}</p>
            )}
          </div>
        )}
      </span>
      {detail && content && (
        <HelpDetailDialog
          title={content[language === 'vi' ? 'vi' : 'en'].title}
          start={{ slug: content.chapter, anchor: content.anchor }}
          onClose={() => { setDetail(false); button.current?.focus(); }}
        />
      )}
    </>
  );
}
