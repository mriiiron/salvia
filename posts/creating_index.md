```
title:      Creating Index Page
author:     mriiiron
date:       2018-05-16
category:   Guide
tags:       guide
```

Salvia provides a bunch of building blocks. A home page for a blog is usually a "feed" page. People would see a list of your abstracted posts.

Make sure you have `salvia.min.js` in your `js` folder under your site:

```markup
<script src="./js/salvia.min.js"></script>
```

Create a `index.html` and put following things:

```markup
<header id="header"></header>
<main id="feed"></main>
<footer id="footer"></footer>
```

Now we initialize a `Salvia` object, using markups we defined above:

```javascript
let blog = new Salvia({
    el: {
        header: '#header',
        feed: '#feed',
        footer: '#footer'
    }
});
```

And here we go!

In the object we passed to Salvia constructor, the `el` property defines the [components](./post.html?postKey=api_doc) you choose to build this page. In this example, we simply feed Salvia with `feed` component to the `<main>` tag, then add a `header` to `<header>` tag and a `footer` to `<footer>` tag.
