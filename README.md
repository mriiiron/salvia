# SalviaJS

A fast and easy blog framework featuring minimum building. Only metadata of posts need to be built. Posts in Markdown would be parsed on-the-fly.

![Sage](./assets/sage.jpg)

## Features

- [WYSIWYG](https://en.wikipedia.org/wiki/WYSIWYG), and forget about the time you wasted while generating massive number of posts.
- Parser based on [CommonMark](https://github.com/commonmark/commonmark.js), enhanced with [more useful features](http://caiyi.us/salvia/post.html?postKey=api_doc).

## Installation

No need to install.

## Quick Start

Using CDN is the easiest way:

```html
<script src="https://rawgit.com/mriiiron/salvia/master/dist/salvia.min.js"></script>
```

Construct some markup:

```html
<header id="header"></header>
<main id="feed"></main>
<footer id="footer"></footer>
```

And here we go.

```javascript
let blog = new Salvia({
    el: {
        header: '#header',
        feed: '#feed',
        footer: '#footer'
    }
});
```

[View Full Guide](http://caiyi.us/salvia/docs.html)

## To-do

[ ] Pagination
[ ] `npm install salvia-cli`
[ ] `salvia init`

## License

MIT
