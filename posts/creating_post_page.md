```
title:      Creating Post Page
author:     mriiiron
date:       2018-05-15
category:   Guide
tags:       guide
```

A post reader is a page that displays a single post. Craete a `post.html` and add:

HTML:

```markup
<header id="header"></header>
<main id="post"></main>
<footer id="footer"></footer>
```

JavaScript:

```javascript
let blog = new Salvia({
    el: {
        header: '#header',
        post: '#post',
        footer: '#footer'
    },
    options: {
        postKey: Salvia.util.getUrlParamValue('postKey')
    }
});
```

Note there's a bit difference because here we need 'options' here. for the post reader page, we need to pass the key to Salvia so that we can grab the right post we want. In this example, we'll pass the
post key through URL parameters. For example, visiting `post.html?postKey=hello` will load our sample post with the key `hello`. Salvia provides a function `getUrlParamValue()` to do URL parameter parsing jobs for you. [See API](./post.html?postKey=api_doc) for more information.

> Note:
> You must use `post.html` for the name of post reader page for now. It is NOT CONFIGURABLE during current version.

Now you could open you favorite browser and check your freshly cooked Salvia blog.
