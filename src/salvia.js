(function (window, commonmark, Prism, PrismStyles) {
    'use strict'

    const config = {
        blogConfigFile: './salvia.blog.json',
        postsMetaFile: './salvia.posts.json',
        postsPath: './posts/',
        themesPath: './themes/',
        postReaderPage: './post.html',
    };

    function ajax(url, returnType) {
        return new Promise(function(resolve, reject) {
            let request = new XMLHttpRequest();
            request.responseType = returnType;
            request.onreadystatechange = function() {
                if (request.readyState === XMLHttpRequest.DONE) {
                    if (request.status === 200) {
                        resolve(request.response);
                    }
                    else {
                        reject(Error(request.status));
                        console.error('AJAX request to', url, 'failed. Got status', request.status);
                    }
                }
            };
            request.onerror = function() {
                reject(Error("Network Error"));
                console.warn('AJAX request to', url, 'failed due to network error.');
            };
            request.open('GET', url);
            request.send();
        });
    }

    function quickCreate(tag, initClassName, initHTML) {
        let element = document.createElement(tag);
        if (initClassName) { element.className = initClassName; }
        if (initHTML) { element.innerHTML = initHTML; }
        return element;
    }

    function extractTag(input) {
        let mustache = input.match(/{{.*}}/g);
        if (mustache) {
            let pair = mustache[0].replace(/^{{|}}$/g, '').split(':');
            return { key: pair[0].trim(), value: (pair[1] ? pair[1].trim() : null) };
        }
        else {
            return null;
        }
    }

    function removeTag(input) {
        return input.replace(/{{.*}}/g, '').trim();
    }


    function Salvia(desc) {
        let me = this;
        me.ready = desc.ready;

        Promise.all([
            ajax(config.blogConfigFile, 'json'),
            ajax(config.postsMetaFile, 'json')
        ]).then(function (values) {

            let blogMeta = values[0];
            let postsMeta = values[1];

            // Load theme
            let link = document.createElement("link");
            link.rel = "stylesheet";
            link.type = "text/css";
            link.href = config.themesPath + blogMeta.blog.theme + '/style.css';
            document.head.appendChild(link);

            // Load Prism styles for code highlight
            document.head.appendChild(PrismStyles);

            // Construct blog components
            if (desc.el.header) {
                if (document.querySelector(desc.el.header)) {
                    me.header = new SalviaHeader({
                        el: desc.el.header,
                        blogMeta: blogMeta
                    });
                }
                else {
                    console.error('Salvia: Cannot find element "' + desc.el.header + '"');
                }
            }
            if (desc.el.footer) {
                if (document.querySelector(desc.el.footer)) {
                    me.footer = new SalviaFooter({
                        el: desc.el.footer,
                    });
                }
                else {
                    console.error('Salvia: Cannot find element "' + desc.el.footer + '"');
                }
            }
            if (desc.el.feed) {
                if (document.querySelector(desc.el.feed)) {
                    me.feed = new SalviaFeed({
                        master: me,
                        el: desc.el.feed,
                        blogMeta: blogMeta,
                        postsMeta: postsMeta
                    });
                }
                else {
                    console.error('Salvia: Cannot find element "' + desc.el.feed + '"');
                }
            }
            if (desc.el.post) {
                if (document.querySelector(desc.el.post)) {
                    let isLoaded = false;
                    for (let i = 0; i < postsMeta.posts.length; i++) {
                        let postMeta = postsMeta.posts[i];
                        if (desc.options.postKey == postMeta.key) {
                            let articleNode = quickCreate('article');
                            me.post = new SalviaPost({
                                master: me,
                                node: articleNode,
                                meta: postMeta,
                                renderOptions: { abstractOnly: false }
                            });
                            let singlePostContainer = document.querySelector(desc.el.post);
                            singlePostContainer.className = 'salvia-container';
                            singlePostContainer.appendChild(articleNode);
                            me.post.request().then((value) => {
                                me.post.parse(value);
                                me.done();
                            }, function (reason) {
                                console.error(reason);
                            });
                            isLoaded = true;
                            break;
                        }
                    }
                    if (!isLoaded) {
                        console.error('Salvia: Cannot find post with key "' + desc.options.postKey + '".');
                    }
                }
                else {
                    console.error('Salvia: Cannot find element "' + desc.el.post + '"');
                }
            }
            if (desc.el.postList) {
                if (document.querySelector(desc.el.postList)) {
                    me.postList = new SalviaPostList({
                        master: me,
                        el: desc.el.postList,
                        postsMeta: postsMeta
                    });
                }
                else {
                    console.error('Salvia: Cannot find element "' + desc.el.postList + '"');
                }
            }
            // if (desc.el.component) {
            //     if (document.querySelector(desc.el.component)) {
            //         me.component = new SalviaComponent({
            //             master: me,
            //             el: desc.el.component,
            //             blogMeta: blogMeta,
            //             postsMeta: postsMeta
            //         });
            //     }
            //     else {
            //         console.error('Salvia: Cannot find element "' + desc.el.component + '"');
            //     }
            // }
        }, function (reason) {
            console.error('Salvia: Failed loading configuration file(s).');
        });
    }

    Salvia.util = {
        getUrlParamValue: function (param) {
            return (window.location.search.split(param + '=')[1] || '').split('&')[0];
        }
    };

    Salvia.prototype.done = function () {
        Prism.highlightAll();
    }


    function SalviaHeader(desc) {
        this.el = desc.el;
        let titleNode = quickCreate('div', 'salvia-title', '<a href="./index.html">' + desc.blogMeta.blog.title + '</a>');
        let extraHTML = '';
        for (let i = 0; i < desc.blogMeta.nav.length; i++) {
            let page = desc.blogMeta.nav[i];
            extraHTML = extraHTML + '<li><a href="' + page.href + '">' + page.text + '</a></li>';
        }
        let navNode = quickCreate('nav', 'salvia-nav', '<ul>' + extraHTML + '</ul>');
        let headerInnerNode = quickCreate('div', 'salvia-header-inner');
        headerInnerNode.appendChild(titleNode);
        headerInnerNode.appendChild(navNode);
        let headerBaseNode = document.querySelector(this.el);
        headerBaseNode.className = 'salvia-header';
        headerBaseNode.appendChild(headerInnerNode);
    }


    function SalviaFooter(desc) {
        this.el = desc.el;
        let copyrightNode = quickCreate('div', 'salvia-copyright', 'Powered by <a href="http://caiyi.us/salvia">Salvia</a>, a blog engine handcrafted by <a href="http://caiyi.us">mriiiron</a>. MIT License. Copyright (c) 2017-2018');
        let footerInnerNode = quickCreate('div', 'salvia-footer-inner');
        footerInnerNode.appendChild(copyrightNode);
        let footerBaseNode = document.querySelector(this.el);
        footerBaseNode.className = 'salvia-footer';
        footerBaseNode.appendChild(footerInnerNode);
    }


    function SalviaFeed(desc) {
        this.master = desc.master;
        this.el = desc.el;
        this.posts = [];
        let feedBaseNode = document.querySelector(this.el);
        feedBaseNode.className = 'salvia-container';
        let postsMeta = desc.postsMeta.posts.sort((a, b) => (new Date(b.date) - new Date(a.date)));
        let postRequests = [];
        for (let i = 0; i < postsMeta.length; i++) {
            let articleNode = quickCreate('article', 'salvia-post');
            feedBaseNode.appendChild(articleNode);
            let post = new SalviaPost({
                master: this.master,
                node: articleNode,
                meta: postsMeta[i],
                renderOptions: { abstractOnly: true }
            });
            this.posts.push(post);
            postRequests.push(post.request());
        }
        Promise.all(postRequests).then((values) => {
            for (let i = 0; i < values.length; i++) {
                this.posts[i].parse(values[i]);
            }
            this.master.done();
        }, function (reason) {
            console.error(reason);
        });
    }


    function SalviaPost(desc) {
        this.master = desc.master;
        this.node = desc.node;
        this.renderOptions = {
            abstractOnly: desc.renderOptions.abstractOnly
        };
        this.meta = {
            key: desc.meta.key,
            title: desc.meta.title,
            date: new Date(desc.meta.date),
            author: desc.meta.author,
            category: desc.meta.category,
            tags: desc.meta.tags
        };
        this.html = null;
    }

    SalviaPost.prototype.request = function () {
        return ajax(config.postsPath + this.meta.key + '.md.txt', 'text');
    };

    SalviaPost.prototype.parse = function (raw) {
        let reader = new commonmark.Parser();
        let writer = new commonmark.HtmlRenderer();
        let ast = reader.parse(raw);
        if (ast.firstChild.type == 'code_block') {
            ast.firstChild.unlink();
        }
        let walker = ast.walker();
        let abstractBreaker = null;
        let event;
        while ((event = walker.next())) {
            let node = event.node;
            if (event.entering && node.type == 'text') {
                let tag = extractTag(node.literal);
                if (tag) {
                    switch (tag.key) {
                        case 'AbstractBreaker':
                            if (node.parent.type == 'paragraph') {
                                node.literal = '[[LinkMeToPost]]';
                                abstractBreaker = node.parent;
                            }
                            break;
                        case 'NodeID':
                            if (node.parent.type == 'heading') {
                                node.literal = removeTag(node.literal) + '[[MyIdIs:' + tag.value + ']]';
                                //node.literal = removeTag(node.literal) + (options.abstractOnly ? '' : '[[MyIdIs:' + tag.value + ']]');
                            }
                            break;
                        default:
                            break;
                    }
                }
            }
        }
        if (abstractBreaker) {
            if (this.renderOptions.abstractOnly) {
                while (abstractBreaker.next) { abstractBreaker.next.unlink() }
            }
            else {
                abstractBreaker.unlink();
            }
        }
        this.html = writer.render(ast);
        this.render();
    }

    SalviaPost.prototype.render = function () {
        let article = this.node;
        let postTitle = quickCreate('h1', 'salvia-post-title', '<a href="' + config.postReaderPage + '?postKey=' + this.meta.key + '">' + this.meta.title + '</a>');
        let metaDate = '<li>Posted: ' + this.meta.date.toISOString().replace(/T.*$/g, '') + '</li>';
        let metaAuthor = '<li>Author: ' + this.meta.author + '</li>';
        let metaCategory = '<li>Category: ' + this.meta.category + '</li>';
        let metaTags = '<li>Tags: ' + this.meta.tags + '</li>';
        let postMeta = quickCreate('ul', 'salvia-post-meta', metaDate + metaAuthor + metaCategory + metaTags);
        let postContent = quickCreate('div', 'salvia-post-content', this.html);
        article.className = 'salvia-post';
        article.innerHTML = '';
        article.appendChild(postTitle);
        article.appendChild(postMeta);
        article.appendChild(postContent);
        let pTags = article.querySelectorAll('p');
        for (let i = 0; i < pTags.length; i++) {
            if (pTags[i].innerText == '[[LinkMeToPost]]') {
                pTags[i].innerHTML = '<a href="' + config.postReaderPage + '?postKey=' + this.meta.key + '">Continue reading ...</a>';
            }
        }
        let hTags = article.querySelectorAll('h1, h2, h3, h4, h5, h6');
        for (let i = 0; i < hTags.length; i++) {
            let hTag = hTags[i];
            let match = hTag.innerText.match(/\[\[.*\]\]/g);
            if (match) {
                let pair = match[0].replace(/^\[\[|\]\]$/g, '').split(':');
                if (pair[0] == 'MyIdIs') {
                    hTag.id = pair[1];
                }
                hTag.innerText = hTag.innerText.replace(match[0], '');
            }
        }
    };


    function SalviaPostList(desc) {
        this.master = desc.master;
        this.el = desc.el;
        this.posts = [];
        let listBaseNode = document.querySelector(this.el);
        let postsMeta = desc.postsMeta.posts.sort((a, b) => (new Date(b.date) - new Date(a.date)));
        let ul = quickCreate('ul', 'salvia-post-list');
        for (let i = 0; i < postsMeta.length; i++) {
            let meta = postsMeta[i];
            let li = quickCreate('li', null, '<small>' + meta.date.replace(/T.*$/g, '') + '</small>&nbsp;<a href="#">' + meta.title + '</a>');
            ul.appendChild(li);
        }
        listBaseNode.appendChild(ul);
    }


    if (typeof (window.Salvia) === 'undefined') {
        window.Salvia = Salvia;
    }

})(window, commonmark, Prism, PrismStyles);
