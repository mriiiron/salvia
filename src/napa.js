(function (window, commonmark, Prism) {
    'use strict'

    const config = {
        configFile: './napa.config.json',
        postsPath: './posts/',
        themesPath: './themes/',
        postReaderPage: './post.html',
    };

    function ajaxGet(url, returnType, callback) {
        let xhr = new XMLHttpRequest();
        xhr.responseType = returnType;
        xhr.onreadystatechange = function () {
            if (xhr.readyState === XMLHttpRequest.DONE) {
                if (xhr.status === 200) {
                    callback(xhr.status, xhr.response);
                }
                else {
                    callback(xhr.status, null);
                    console.warn('AJAX request to', url, 'failed. Got status', xhr.status);
                }
            }
        }
        xhr.open('GET', url);
        xhr.send();
    }

    function quickCreate(tag, initClassName, initHTML) {
        let element = document.createElement(tag);
        if (initClassName) { element.className = initClassName; }
        if (initHTML) { element.innerHTML = initHTML; }
        return element;
    }

    function extractMustache(input) {
        return input.replace(/^{+|}+$/g, '').trim();
    }


    function NAPA(desc) {
        let me = this;
        me.ready = desc.ready;
        me.ajaxCount = 0;
        me.ajaxMaxCount = 0;
        ajaxGet(config.configFile, 'json', function (status, response) {
            if (status == 200 && response) {
                me.meta = response;

                // Load theme
                let link = document.createElement("link");
                link.rel = "stylesheet";
                link.type = "text/css";
                link.href = config.themesPath + me.meta.blog.theme + '/style.css';
                document.getElementsByTagName("head")[0].appendChild(link);

                // Construct blog components
                if (desc.el.header) {
                    me.header = new NAPAHeader({
                        el: desc.el.header,
                        blogMeta: me.meta
                    });
                }
                if (desc.el.footer) {
                    me.footer = new NAPAFooter({
                        el: desc.el.footer,
                    });
                }
                if (desc.el.feed) {
                    me.ajaxMaxCount = me.meta.posts.length;
                    me.feed = new NAPAFeed({
                        napaCore: me,
                        el: desc.el.feed,
                        blogMeta: me.meta
                    });

                }
                if (desc.el.post) {
                    me.ajaxMaxCount = 1;
                    let isLoaded = false;
                    for (let i = 0; i < me.meta.posts.length; i++) {
                        let postMeta = me.meta.posts[i];
                        let postKey = postMeta.split('||')[2];
                        if (desc.options.postKey == postKey) {
                            let article = quickCreate('article');
                            me.post = new NAPAPost({
                                napaCore: me,
                                node: article,
                                postMeta: postMeta,
                                options: { abstractOnly: false }
                            });
                            let singlePostContainer = document.querySelector(desc.el.post);
                            singlePostContainer.className = 'napa-container';
                            singlePostContainer.appendChild(article);
                            isLoaded = true;
                            break;
                        }
                    }
                    if (!isLoaded) {
                        console.error('NAPA: Failed loading post.');
                    }
                }
                if (desc.el.archive) {
                    me.archive = new NAPAArchive({
                        el: desc.el.archive
                    });
                }

            }
            else {
                console.error('NAPA: Failed loading configuration file.');
            }
        });
    }

    NAPA.prototype.ajaxDone = function () {
        this.ajaxCount++;
        console.log(this.ajaxCount + '/' + this.ajaxMaxCount);
        if (this.ajaxCount == this.ajaxMaxCount && typeof(this.ready) == 'function') {
            Prism.highlightAll();
            this.ready();
        }
    }


    NAPA.util = {
        getUrlParamValue: function (param) {
            return (window.location.search.split(param + '=')[1] || '').split('&')[0];
        }
    };


    function NAPAHeader(desc) {
        this.el = desc.el;
        let titleNode = quickCreate('div', 'napa-title', '<a href="./index.html">' + desc.blogMeta.blog.title + '</a>');
        let extraHTML = '';
        for (let i = 0; i < desc.blogMeta.nav.length; i++) {
            let page = desc.blogMeta.nav[i];
            extraHTML = extraHTML + '<li><a href="' + page.href + '">' + page.text + '</a></li>';
        }
        let navNode = quickCreate('nav', 'napa-nav', '<ul>' + extraHTML + '</ul>');
        let headerInnerNode = quickCreate('div', 'napa-header-inner');
        headerInnerNode.appendChild(titleNode);
        headerInnerNode.appendChild(navNode);
        let headerBaseNode = document.querySelector(this.el);
        headerBaseNode.className = 'napa-header';
        headerBaseNode.appendChild(headerInnerNode);
    }


    function NAPAFooter(desc) {
        this.el = desc.el;
        let copyrightNode = quickCreate('div', 'napa-copyright', 'Powered by napa.js 2017-2018');
        let footerInnerNode = quickCreate('div', 'napa-footer-inner');
        footerInnerNode.appendChild(copyrightNode);
        let footerBaseNode = document.querySelector(this.el);
        footerBaseNode.className = 'napa-footer';
        footerBaseNode.appendChild(footerInnerNode);
    }


    function NAPAFeed(desc) {
        this.napaCore = desc.napaCore;
        this.el = desc.el;
        let feedBaseNode = document.querySelector(this.el);
        feedBaseNode.className = 'napa-container';
        for (let i = 0; i < desc.blogMeta.posts.length; i++) {
            let article = quickCreate('article', 'napa-post');
            let post = new NAPAPost({
                napaCore: this.napaCore,
                node: article,
                postMeta: desc.blogMeta.posts[i],
                options: { abstractOnly: true }
            });
            feedBaseNode.appendChild(post.node);
        }
    }


    function NAPAPost(desc) {
        this.napaCore = desc.napaCore;
        this.node = desc.node;
        let meta = desc.postMeta.split('||');
        this.date = meta[0];
        this.author = meta[1];
        this.key = meta[2];
        this.title = (meta[3] ? meta[3] : this.key);
        this.html = null;
        this.request(desc.options)
    }

    NAPAPost.prototype.request = function (options) {
        let me = this;
        ajaxGet(config.postsPath + this.key + '.md.txt', 'text', function (status, response) {
            if (status == 200) {
                let reader = new commonmark.Parser();
                let writer = new commonmark.HtmlRenderer();
                let ast = reader.parse(response);
                let walker = ast.walker();
                let abstractBreaker = null;
                let event;
                while ((event = walker.next())) {
                    let node = event.node;
                    if (event.entering && node.type == 'text' && node.literal.startsWith('{{') && node.literal.endsWith('}}')) {
                        let napaTags = extractMustache(node.literal);
                        switch (napaTags) {
                            case 'Napa.EndOfAbstract':
                                abstractBreaker = node.parent;
                                break;
                        }
                    }
                }
                if (abstractBreaker) {
                    if (options.abstractOnly) {
                        while (abstractBreaker.next) { abstractBreaker.next.unlink() }
                        abstractBreaker.firstChild.literal = '[[Napa]]ReadMore';
                    }
                    else {
                        abstractBreaker.unlink();
                    }
                }
                me.html = writer.render(ast);
                me.render();
                me.napaCore.ajaxDone();
            }
            else {
                me.node.innerHTML = 'NAPA: Request to post "' + key + '" failed.';
                me.node.className += ' error';
            }
        });
    };

    NAPAPost.prototype.render = function () {
        let article = this.node;
        let postTitle = quickCreate('h1', 'napa-post-title', '<a href="' + config.postReaderPage + '?postKey=' + this.key + '">' + this.title + '</a>');
        let postMeta = quickCreate('p', 'napa-post-meta', '<i><span class="napa-post-date">' + this.date + '</span> by <span class="napa-post-author">' + this.author + '</span></i>');
        let postContent = quickCreate('div', 'napa-post-content', this.html);
        article.className = 'napa-post';
        article.innerHTML = '';
        article.appendChild(postTitle);
        article.appendChild(postMeta);
        article.appendChild(postContent);
        let pTags = article.querySelectorAll('p');
        for (let i = 0; i < pTags.length; i++) {
            switch (pTags[i].innerText) {
                case '[[Napa]]ReadMore':
                    pTags[i].innerHTML = '<a href="' + config.postReaderPage + '?postKey=' + this.key + '">Continue reading ...</a>';
                    break;
                default:
                    break;
            }
        }
    };


    function NAPAArchive(desc) {
        this.el = desc.el;
        let archiveBaseNode = document.querySelector(this.el);
        archiveBaseNode.className = 'napa-container';
        archiveBaseNode.innerText = 'Coming soon!';
    }

    NAPAArchive.prototype.render = function (data) {
        let ul = document.createElement('ul');
        for (let i = 0; i < data.length; i++) {
            let li = document.createElement('li');
            li.innerHTML = '<a href="#' + data[i] + '">' + data[i] + '</a>';
            ul.appendChild(li);
        }
        ul.addEventListener('click', function (event) {
            if (event.target.tagName.toLowerCase() == 'a') {
                let a = event.target;
                // me.request(a.hash, () => console.log('Request completed.'));
            }
        });
        document.querySelector(this.postList.el).appendChild(ul);
    };



    if (typeof (window.napa) === 'undefined') {
        window.Napa = NAPA;
    }

})(window, commonmark, Prism);
