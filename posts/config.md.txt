```
title:      Configuration
author:     mriiiron
date:       2018-05-18
category:   Guide
tags:       guide
```

### Blog Configuration

Create `salvia.blog.json` file in the root folder (if you're using `salvia-cli`, this file should have already been created):

```javascript
{
    "blog": {
        "title": "Your Blog by Salvia",
        "theme": "sage-violet"
    },
    "nav": [
        { "text": "Home", "href": "./index.html" }
    ]
}
```

#### `blog.title`

> This your blog title displaying in the header.

#### `blog.theme`

> The name of theme folder under your `themes` folder. Here `sage-violet` is Salvia's default theme.

#### `nav`

> This array of objects defines the items of the navigation bar.

### Metadata of Posts

Create `salvia.posts.json` file in the root folder (if you're using `salvia-cli`, this file could be created by running `salvia build`):

```javascript
{
    "posts":[
        {
            "key": "hello",
            "title": "Hello world!",
            "author": "Salvia",
            "date": "2018-05-08T00:00:00.000Z",
            "category": null,
            "tags": []
        }
    ],
    "tags": [],
    "categories": []
}
```

#### `foo`

> foo foo foo
