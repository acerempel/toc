import slugify from 'slug';

const hasAriaCurrent = 'ariaCurrent' in document.createElement('a');

// TypeScript doesn't know about the ariaCurrent property yet.
declare global {
  interface Element {
    ariaCurrent: string;
  }
}

const setAriaCurrent = hasAriaCurrent
  ? (el: Element) => el.ariaCurrent = "true"
  : (el: Element) => el.setAttribute("aria-current", "true");

const removeAriaCurrent = hasAriaCurrent
  ? (el: Element) => el.ariaCurrent = "false"
  : (el: Element) => el.removeAttribute("aria-current");

interface HeadingInfo {
  /** The preceding heading becomes the current heading if we have just scrolled
   * above this heading. */
  preceding: HeadingInfo | null;
  /** The `a` element in the table of contents that links to this heading.
   * Needed because we set or remove the `aria-current` attribute on it. */
  link: HTMLAnchorElement;
  /** The heading element itself. This is how we connect
   * [[`IntersectionObserver`]] entries to the corresponding `HeadingInfo`. */
  target: Element;
  /** The order of the heading relative to the other headings. Used for
   * determining which among multiple visible headings is the topmost. */
  order: number;
}

export class TOC extends HTMLElement {

  /** The headings in the table of contents. */
  private readonly knownHeadings: Map<Element,HeadingInfo>;
  /** The currently visible headings. */
  private visibleHeadings: Map<Element,HeadingInfo>;
  /** The heading that is the heading of the section the user is currently
   * viewing, if any. */
  private currentHeading: HeadingInfo | null;

  constructor() {
    super();
    this.knownHeadings = new Map();
    this.visibleHeadings = new Map();
    this.currentHeading = null;
  }

  connectedCallback(): void {
    // For which element are we the table of contents?
    const forAttr = this.getAttribute('for');
    let contentElement, forElement;
    if (forAttr && (forElement = document.getElementById(forAttr))) {
      contentElement = forElement;
    } else {
      // The `?? document.body` is just to please the TypeScript compiler. We
      // definitely have at least the <body> element as an ancestor, since we
      // are inside connectedCallback(), thus in the DOM tree.
      contentElement = this.closest("article, aside, section, blockquote, body") ?? document.body;
    }

    const headings: NodeListOf<Element> = contentElement.querySelectorAll('h2');
    let preceding: HeadingInfo | null = null;
    headings.forEach((heading, order) => {
      let id: string | null;

      // Give each heading an id, if it doesn't already have one.
      if (heading.id) {
        id = heading.id;
      } else if (!heading.id && heading.textContent) {
        id = slugify(heading.textContent);
        heading.id = id;
      } else {
        id = null;
      }

      if (id) {
        const link = document.createElement('a');
        link.href = '#' + id;
        link.innerHTML = heading.innerHTML;
        this.appendChild(link);
        const knownHeading: HeadingInfo = { target: heading, link, preceding, order };
        this.knownHeadings.set(heading, knownHeading);
        preceding = knownHeading;
      }
    })

    if ('IntersectionObserver' in window) {

      const headingObserverCallback = (entries: Array<IntersectionObserverEntry>) => {
        let currentHeadingWhichDisappeared = null;

        // Update the set of visible headings.
        for (const entry of entries) {
          let headingInfo;
          if (entry.isIntersecting && (headingInfo = this.knownHeadings.get(entry.target))) {
            this.visibleHeadings.set(entry.target, headingInfo)
          } else {
            this.visibleHeadings.delete(entry.target)
            if (entry.target === this.currentHeading?.target) {
              currentHeadingWhichDisappeared = entry;
            }
          }
        }

        // If there are any visible headings, the relevant one is the one
        // closest to the top of the viewport.
        let relevantHeading = null;
        let previousHeading = null;
        for (const [target, info] of this.visibleHeadings) {
          if (!previousHeading || info.order < previousHeading.order) {
            relevantHeading = target;
          }
          previousHeading = info;
        }

        // If there are no visible headings, but the previously current heading
        // just disappeared, is it now above the top of the viewport? If so,
        // we are below it, and it is relevant; otherwise, we are above it, so
        // the previous one is the relevant one.
        if (!relevantHeading && currentHeadingWhichDisappeared) {
          relevantHeading =
            currentHeadingWhichDisappeared.boundingClientRect.top < 0
              ? currentHeadingWhichDisappeared.target
              : this.knownHeadings.get(currentHeadingWhichDisappeared.target)?.preceding?.target
        }
        if (relevantHeading) this.setCurrentHeading(relevantHeading)
      }

      const headingObserverOptions = {
        threshold: 1.0,
        rootMargin: "0px 0px 0px 25%",
      };
      const headingObserver = new IntersectionObserver(headingObserverCallback, headingObserverOptions);
      for (const heading of headings) {
        headingObserver.observe(heading);
      }
    }
  }

  /** If the argument is an `Element` that is a known heading, sets the
   * `aria-current` attribute on the link to the new current heading. If it is
   * null, sets the current heading to null (this may happen if we have scrolled
   * above the first heading). */
  setCurrentHeading(newHeadingEntry: Element | null): void {
    if (this.currentHeading) removeAriaCurrent(this.currentHeading.link);
    const newCurrentHeading = newHeadingEntry && (this.knownHeadings.get(newHeadingEntry) ?? null);
    if (newCurrentHeading) { setAriaCurrent(newCurrentHeading.link) }
    this.currentHeading = newCurrentHeading;
  }

}

customElements.define('table-of-contents', TOC);
