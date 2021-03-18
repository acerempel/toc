This package provides a custom element `<table-of-contents>` that
populates itself with a list of links to the headings in another element.

Its interface is not yet stable. I created it for my own use, and,
unless it becomes useful for others, I
cannot say how long I will keep it maintained.

Use it like this:

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

The `for` attribute, if present, is the `id` of the element whose
headings should appear in the table of contents. If it is not present,
the parent element of `<table-of-contents>` is searched for headings.

Any headings that do not have `id`s to link to will be given an `id`
attribute that is a slugification of their text content.
