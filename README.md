This package provides a custom element `<table-of-contents>` that
populates itself with a list of links to the headings in another element,
and applies the [`aria-current`][aria-current] attribute to the heading
representing the section that is currently visible within the viewport.
It uses the [IntersectionObserver API][IntersectionObserver] to
accomplish this.

[aria-current]: https://www.w3.org/TR/wai-aria-1.1/#aria-current
  "aria-current attribute - WAI-ARIA 1.1"

[IntersectionObserver]: https://developer.mozilla.org/en-US/docs/Web/API/Intersection_Observer_API
  "IntersectionObserver API | Mozilla Developer Network"


This project is in a state of flux. It works as described, but I may change
the interface at any time and there are many edge cases I have not
tested. I created this project for my own use; 
unless it becomes useful for others, I
cannot say how long I will keep it maintained.

By default, it will search for headings in its nearest ancestor element
that is an `<article>`, `<aside>`, `<section>`, `<blockquote>`, or `<body>`.

<details>

<summary>Example usage (default behaviour)</summary>

```html
<article>
  <header>
    <h1>The Life and Opinions of Tristram Shandy, Gentleman</h1>
    <nav>
      <table-of-contents></table-of-contents>
    </nav>
  </header>
  <h2>Chapter 1.I.</h2>
  <p>
    I wish either my father or my mother, or indeed both of them, as they
    were in duty both equally bound to it, had minded what they were about
    when they begot me; had they duly consider'd how much depended upon what
    they were then doing;-- <!-- etc. -->
  </p>
  <h2>Chapter 1.II.</h2>
  <p>
    --Then, positively, there is nothing in the question that I can
    see, either good or bad.--Then, let me tell you, Sir, it was a very
    unseasonable question at least,--because it scattered and dispersed the
    animal spirits, whose business it was to have escorted and gone hand in
    hand with the Homunculus, and conducted him safe to the place destined
    for his reception.
  </p>
</article>
```

The `<table-of-contents>` element will then look like this:

```html
<table-of-contents>
  <a href="#chapter-1-i">Chapter 1.I</a>
  <a href="#chapter-1-ii">Chapter 1.II</a>
</table-of-contents>
```

</details>

You may specify explicitly where the headings for the table of contents
are to be found by providing the `for` attribute; its value should be
the `id` of an element whose descendants will be searched for headings.

<details>

<summary>Example (with <code>for</code> attribute)</summary>

```html
<article>
  <header>
    <h1>The Life and Opinions of Tristram Shandy, Gentleman</h1>
    <nav>
      <h2>Contents</h2>
      <table-of-contents for=content></table-of-contents>
    </nav>
  </header>
  <div id=content>
    <h2>Chapter 1.I.</h2>
    <p>
      I wish either my father or my mother, or indeed both of them, as they
      were in duty both equally bound to it, had minded what they were about
      when they begot me; had they duly consider'd how much depended upon what
      they were then doing;-- <!-- etc. -->
    </p>
    <h2>Chapter 1.II.</h2>
    <p>
      --Then, positively, there is nothing in the question that I can
      see, either good or bad.--Then, let me tell you, Sir, it was a very
      unseasonable question at least,--because it scattered and dispersed the
      animal spirits, whose business it was to have escorted and gone hand in
      hand with the Homunculus, and conducted him safe to the place destined
      for his reception.
    </p>
  </div>
</article>
```

The `<table-of-contents>` element will then look like this:

```html
<table-of-contents for="content">
  <a href="#chapter-1-i">Chapter 1.I</a>
  <a href="#chapter-1-ii">Chapter 1.II</a>
</table-of-contents>
```

Note that without the `for` attribute, the table of contents would
include a link to its own heading (`<h2>Contents</h2>`).

</details>

Any headings that do not have `id`s to link to will be given an `id`
attribute that is a slugification of their text content.
