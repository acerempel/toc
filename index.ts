import slugify from 'slug';

const hasAriaCurrent = 'ariaCurrent' in document.createElement('a');

// TypeScript doesn't know about the ariaCurrent property yet
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
  preceding: HeadingInfo | null;
  link: HTMLAnchorElement;
  target: Element;
}

export class TOC extends HTMLElement {
  private knownHeadings: Map<Element,HeadingInfo>;
  private currentHeading: HeadingInfo | null;
  constructor() {
    super();
    this.knownHeadings = new Map();
    this.currentHeading = null;
  }

  connectedCallback(): void {
    const forAttr = this.getAttribute('for');
    let contentElement, forElement;
    if (forAttr && (forElement = document.getElementById(forAttr))) {
      contentElement = forElement;
    } else if (this.parentElement) {
      contentElement = this.parentElement;
    } else {
      return;
    }
    const headings: NodeListOf<Element> = contentElement.querySelectorAll('h2');
    let preceding = null;
    for (const heading of headings) {
      let id: string;
      if (!heading.id) {
        id = slugify(heading.textContent!);
        heading.id = id;
      } else {
        id = heading.id;
      }
      const link = document.createElement('a');
      link.href = '#' + id;
      link.innerHTML = heading.innerHTML;
      this.appendChild(link);
      const knownHeading: HeadingInfo = { target: heading, link, preceding };
      this.knownHeadings.set(heading, knownHeading);
      preceding = knownHeading;
    }
    if ('IntersectionObserver' in window) {
      const headingObserverCallback = (entries: Array<IntersectionObserverEntry>) => {
        let incumbentEntry: IntersectionObserverEntry | null = null;
        /* relevantEntry is, if at least one entry is intersecting, the
           intersecting entry closest to the top of the viewport, otherwise the
           entry closest to the top of the viewport. */
        let lookingForIncumbent = true;
        const reducer = (acc : IntersectionObserverEntry | null, next: IntersectionObserverEntry) => {
          if (lookingForIncumbent && next.target === this.currentHeading?.target) {
            incumbentEntry = next;
            lookingForIncumbent = false;
          }
          if (next.isIntersecting && !acc?.isIntersecting) {
            return next;
          } else if (next.isIntersecting /* && acc && acc.isIntersecting */) {
            return next.boundingClientRect.top < acc!.boundingClientRect.top ? next : acc;
          } else /* if (!next.isIntersecting) */ {
            return acc;
          }
        }
        const relevantEntry = entries.reduce(reducer, null);
        if (relevantEntry?.isIntersecting) {
          this.setCurrentHeading(relevantEntry);
        } else if (incumbentEntry && (incumbentEntry as IntersectionObserverEntry).boundingClientRect.top > 0) {
          // not intersecting, but positive: below the viewport
          this.setCurrentHeading(this.currentHeading?.preceding ?? null);
        } // otherwise, current heading does not change.
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

  setCurrentHeading(newHeadingEntry: { target: Element } | null): void {
    if (this.currentHeading) removeAriaCurrent(this.currentHeading.link);
    const newCurrentHeading = newHeadingEntry && (this.knownHeadings.get(newHeadingEntry.target) ?? null);
    if (newCurrentHeading) { setAriaCurrent(newCurrentHeading.link) }
    this.currentHeading = newCurrentHeading;
  }

}

customElements.define('table-of-contents', TOC);
