# SalviaJS

A fast and easy blog framework featuring minimum building. Only metadata of posts need to be built. Posts in Markdown would be parsed on-the-fly.

![Sage](./assets/sage.jpg)

## Features

- [WYSIWYG](https://en.wikipedia.org/wiki/WYSIWYG), and forget about the time you wasted while generating massive number of posts.
- Parser based on [CommonMark](https://github.com/commonmark/commonmark.js), enhanced with [more useful features](http://caiyi.us/salvia/post.html?postKey=api_doc).
- Provided `salvia-cli` for easy blogging.

## Quick Start

### Via npm

``` bash
// Install CLI
$ npm install -g salvia-cli

// Start your blog in "myblog" folder
$ salvia init myblog
```

> Note: I have not implemented local serving yet. Please use other methods to do local testing (e.g. IIS).

### Manually

[Follow Full Guide](http://caiyi.us/salvia/docs.html) to set up proper folder structure.

In your page, link script:

``` html
<script src="https://rawgit.com/mriiiron/salvia/master/dist/salvia.min.js"></script>
```

Construct some markup:

``` html
<header id="header"></header>
<main id="feed"></main>
<footer id="footer"></footer>
```

And here we go.

``` javascript
let blog = new Salvia({
    el: {
        header: '#header',
        feed: '#feed',
        footer: '#footer'
    }
});
```

> Note: API Documentation on the way ...

## To-do

- [ ] Feed: Pagination
- [x] Post Page: Display of Category, Tags
- [x] SalviaPostList
- [ ] SalviaCategoryList
- [ ] SalviaTagCloud

## License

MIT
