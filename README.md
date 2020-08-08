# SalviaJS

A fast and easy blog framework featuring minimum building. Only metadata of posts need to be built. Posts in Markdown would be parsed on-the-fly.

![Sage](./assets/sage.jpg)

## Features

- [WYSIWYG](https://en.wikipedia.org/wiki/WYSIWYG), and forget about the time you wasted while generating massive number of posts.
- Parser based on [CommonMark](https://github.com/commonmark/commonmark.js), with more features extended.
- Provided `salvia-cli` for easy blogging. [Get](https://github.com/mriiiron/salvia-cli)

## Quick Start

### Via npm (recommended)

Install CLI:

``` bash
$ npm install -g salvia-cli
```

Start your blog in "myblog" folder:

``` bash
$ salvia init myblog
```

You're all set.

### Manually

Follow [Full Guide](https://mriiiron.github.io/salvia) to set up proper folder structure and create your main page, post page, archive, page, etc.

In your page, link script:

``` html
<script src="./js/salvia.min.js"></script>
```

Construct the container div:

``` html
<div id="blog"></div>
```

And construct the blog into the container:

``` javascript
let blog = new Salvia({
    el: "#blog",
    main: {
        type: "feed",
        pagination: {
            limit: 5,
            page: Salvia.util.getUrlParamValue("page") || 1
        }
    },
    widgets: [
        {
            title: "TABLE OF CONTENTS",
            type: "recentPosts"
        },
        {
            title: "TAG CLOUD",
            type: "tagCloud"
        }
    ]
});
```

## To-do

- [x] SalviaFeed (with pagination)
- [x] SalviaPost
- [x] SalviaArchives
- [x] SalviaPostListWidget
- [ ] SalviaCategoryListWidget
- [x] SalviaTagCloudWidget

## License

MIT
