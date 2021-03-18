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
  order: number;
}

export class TOC extends HTMLElement {
  private knownHeadings: Map<Element,HeadingInfo>;
  private visibleHeadings: Map<Element,HeadingInfo>;
  private currentHeading: HeadingInfo | null;
  constructor() {
    super();
    this.knownHeadings = new Map();
    this.visibleHeadings = new Map();
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
    let preceding: HeadingInfo | null = null;
    headings.forEach((heading, order) => {
      let id: string | null;
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
        let relevantHeading = null;
        let previousHeading = null;
        for (const [target, info] of this.visibleHeadings) {
          if (!previousHeading || info.order < previousHeading.order) {
            relevantHeading = target;
          }
          previousHeading = info;
        }
        if (!relevantHeading && currentHeadingWhichDisappeared) {
          relevantHeading =
            currentHeadingWhichDisappeared.boundingClientRect.top < 0
              ? currentHeadingWhichDisappeared.target
              : this.knownHeadings.get(currentHeadingWhichDisappeared.target)?.preceding?.target
        }
        if (relevantHeading) { this.setCurrentHeading(relevantHeading) }
        else { console.log("No relevant heading") }
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

  setCurrentHeading(newHeadingEntry: Element | null): void {
    if (this.currentHeading) removeAriaCurrent(this.currentHeading.link);
    const newCurrentHeading = newHeadingEntry && (this.knownHeadings.get(newHeadingEntry) ?? null);
    if (newCurrentHeading) { setAriaCurrent(newCurrentHeading.link) }
    this.currentHeading = newCurrentHeading;
  }

}

customElements.define('table-of-contents', TOC);
