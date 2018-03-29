# Napa

A fast and easy blog framework. Forget about building, it would parse Markdown files on-the-fly.

## Features

- No building required. [WYSIWYG](https://en.wikipedia.org/wiki/WYSIWYG), and forget about the time you wasted while generating massive number of posts.
- Parser based on [CommonMark](https://github.com/commonmark/commonmark.js), enhanced with [more useful features](http://caiyi.us/napa/post.html?postKey=api_doc).

## Installation

No need to install.

## Quick Start

Just include necessary files:

```html
<link href="./css/prism.css" rel="stylesheet" />
<script src="./js/napa.min.js"></script>
```

Construct some markup:

```html
<header id="header"></header>
<main id="feed"></main>
<footer id="footer"></footer>
```

And here we go.

```javascript
let blog = new Napa({
    el: {
        header: '#header',
        feed: '#feed',
        footer: '#footer'
    }
});
```

[View Full Guide](http://caiyi.us/napa/post.html?postKey=quick_start)

## License

MIT
