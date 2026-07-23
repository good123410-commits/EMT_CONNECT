export type ScrollToTopOptions = {
  behavior?: ScrollBehavior;
  root?: HTMLElement | null;
};

const SCROLLABLE_OVERFLOW = /auto|scroll|overlay/;

function isScrollableElement(element: HTMLElement): boolean {
  const { overflowY } = window.getComputedStyle(element);
  return SCROLLABLE_OVERFLOW.test(overflowY) && element.scrollHeight > element.clientHeight;
}

function scrollElementToTop(element: Element, behavior: ScrollBehavior): void {
  if (behavior === 'instant') {
    const node = element as HTMLElement;
    node.scrollTop = 0;
    node.scrollLeft = 0;
    return;
  }

  element.scrollTo({ top: 0, left: 0, behavior });
}

export function resetScrollPosition(options: ScrollToTopOptions = {}): void {
  if (typeof window === 'undefined') return;

  const behavior = options.behavior ?? 'instant';

  if (options.root) {
    scrollElementToTop(options.root, behavior);
    return;
  }

  scrollElementToTop(document.documentElement, behavior);
  scrollElementToTop(document.body, behavior);
  window.scrollTo({ top: 0, left: 0, behavior });

  document.querySelectorAll<HTMLElement>('.site-main, .page-content, [data-scroll-root]').forEach((element) => {
    if (element.scrollTop > 0 || isScrollableElement(element)) {
      scrollElementToTop(element, behavior);
    }
  });
}
