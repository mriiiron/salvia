(function (window, commonmark, Prism) {
    'use strict'

    const config = {
        blogConfigFile: './salvia.blog.json',
        postsMetaFile: './salvia.posts.json',
        postsPath: './posts/',
        themesPath: './themes/',
        postReaderPage: './post.html',
    };

    function ajaxGet(url, returnType, onSuccess, onFailure) {
        let xhr = new XMLHttpRequest();
        xhr.responseType = returnType;
        xhr.onreadystatechange = function () {
            if (xhr.readyState === XMLHttpRequest.DONE) {
                if (xhr.status === 200) {
                    onSuccess(xhr.status, xhr.response);
                }
                else {
                    onFailure(xhr.status, xhr.response);
                    console.error('AJAX request to', url, 'failed. Got status', xhr.status);
                }
            }
        }
        xhr.open('GET', url);
        xhr.send();
    }

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
            document.getElementsByTagName("head")[0].appendChild(link);

            // Construct blog components
            if (desc.el.header) {
                me.header = new SalviaHeader({
                    el: desc.el.header,
                    blogMeta: blogMeta
                });
            }
            if (desc.el.footer) {
                me.footer = new SalviaFooter({
                    el: desc.el.footer,
                });
            }
            if (desc.el.feed) {
                me.feed = new SalviaFeed({
                    master: me,
                    el: desc.el.feed,
                    blogMeta: blogMeta,
                    postsMeta: postsMeta
                });
            }
            if (desc.el.post) {
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
            if (desc.el.archive) {
                me.archive = new SalviaArchive({
                    el: desc.el.archive
                });
            }
        }, function (reason) {
            console.error('Salvia: Failed loading all configuration file.');
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
        let copyrightNode = quickCreate('div', 'salvia-copyright', 'Powered by <a href="http://caiyi.us/salvia">Salvia</a>, handcrafted by <a href="http://caiyi.us">mriiiron</a>. MIT License. Copyright (c) 2017-2018.');
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
        let postsMeta = desc.postsMeta.posts.sort((a, b) => (new Date(a.date) - new Date(b.date)));
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
            author: desc.meta.author
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
        let postMeta = quickCreate('p', 'salvia-post-meta', '<i><span class="salvia-post-date">' + this.meta.date.toISOString().replace(/T.*$/g, '') + '</span> by <span class="salvia-post-author">' + this.meta.author + '</span></i>');
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


    function SalviaArchive(desc) {
        this.el = desc.el;
        let archiveBaseNode = document.querySelector(this.el);
        archiveBaseNode.className = 'salvia-container';
        archiveBaseNode.innerText = 'Coming soon!';
    }

    SalviaArchive.prototype.render = function (data) {
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



    if (typeof (window.Salvia) === 'undefined') {
        window.Salvia = Salvia;
    }

})(window, commonmark, Prism);
