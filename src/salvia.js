(function (window, commonmark, Prism, PrismStyles, TagCloud) {
    'use strict'

    const config = {
        commonConfigFile: './salvia.common.json',
        postsMetaFile: './salvia.posts.json',
        postsPath: './posts/',
        themesPath: './themes/',
        postReaderPage: './post.html'
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
        let blogBaseNode = document.querySelector(desc.el);
        blogBaseNode.className = "salvia-blog";
        Promise.all([
            ajax(config.commonConfigFile, 'json'),
            ajax(config.postsMetaFile, 'json')
        ]).then(function (values) {

            // Load metadata
            let commonConfig = values[0];
            let postsMeta = values[1];

            // Load theme
            let link = document.createElement("link");
            link.rel = "stylesheet";
            link.type = "text/css";
            link.href = config.themesPath + commonConfig.theme + '/style.css';
            document.head.appendChild(link);

            // Load Prism styles for code highlight
            document.head.appendChild(PrismStyles);

            // Header
            let blogTitle = "";
            let blogNav = [];
            if (commonConfig.hasOwnProperty("header")) {
                blogTitle = commonConfig.header.title;
                blogNav = commonConfig.header.nav;
            }
            let titleNode = quickCreate('div', 'salvia-title', '<a href="./index.html">' + blogTitle + '</a>');
            let extraHTML = '';
            for (let i = 0; i < blogNav.length; i++) {
                let nav = blogNav[i];
                extraHTML = extraHTML + '<li><a href="' + nav.href + '">' + nav.text + '</a></li>';
            }
            let navNode = quickCreate('nav', 'salvia-nav', '<ul>' + extraHTML + '</ul>');
            let headerInnerNode = quickCreate('div', 'salvia-header-inner');
            headerInnerNode.appendChild(titleNode);
            headerInnerNode.appendChild(navNode);
            let headerBaseNode = quickCreate('header', 'salvia-header');
            headerBaseNode.appendChild(headerInnerNode);
            blogBaseNode.appendChild(headerBaseNode);
            
            let mainNode = quickCreate('main', 'salvia-main');
            
            // Content - Main
            let innerMainNode = quickCreate('div', 'salvia-main-content');
            let mainConfig = desc.main;
            if (mainConfig.type == "feed") {
                let pagination = mainConfig.hasOwnProperty("pagination") ? mainConfig.pagination : false;
                if (pagination) {
                    me.main = new SalviaFeed({
                        master: me,
                        node: innerMainNode,
                        postsMeta: postsMeta,
                        limit: pagination.limit,
                        page: pagination.page
                    });
                }                
            }
            else if (mainConfig.type == "singlePost") {
                let isLoaded = false;
                for (let i = 0; i < postsMeta.posts.length; i++) {
                    let postMeta = postsMeta.posts[i];
                    if (mainConfig.postKey == postMeta.key) {
                        let articleNode = quickCreate('article', 'salvia-post');
                        me.main = new SalviaPost({
                            master: me,
                            node: articleNode,
                            meta: postMeta,
                            renderOptions: { abstractOnly: false }
                        });
                        innerMainNode.appendChild(articleNode);
                        me.main.request().then((value) => {
                            me.main.parse(value);
                            me.done();
                        }, function (reason) {
                            console.error(reason);
                        });
                        isLoaded = true;
                        break;
                    }
                }
                if (!isLoaded) {
                    // TODO: 404 here
                    console.error('Salvia: Cannot find post with key "' + desc.options.postKey + '".');
                }
            }
            else if (mainConfig.type == "custom") {
                innerMainNode.appendChild(mainConfig.content);
            }
            if (mainConfig.comment) {
                let commentNode = quickCreate('div', 'salvia-comment');
                me.comment = new Valine({
                    el: commentNode,
                    path: "post:" + mainConfig.postKey,
                    appId: commonConfig.valine.appId,
                    appKey: commonConfig.valine.appKey
                });
                innerMainNode.appendChild(commentNode);
            }
            mainNode.appendChild(innerMainNode);

            // Content - Sidebar
            let sidebarNode = quickCreate('aside', 'salvia-sidebar');
            let widgetConfigs = desc.widgets;
            me.widgets = [];
            if (Array.isArray(widgetConfigs)) {
                for (let i = 0; i < widgetConfigs.length; i++) {
                    let widgetContentNode = quickCreate('div', 'salvia-widget-content');
                    let widgetConfig = widgetConfigs[i];
                    if (widgetConfig.type == "recentPosts") {
                        let limit = widgetConfig.hasOwnProperty("limit") ? widgetConfig.limit : 0;
                        let widget = new SalviaPostListWidget({
                            node: widgetContentNode,
                            postsMeta: postsMeta,
                            limit: limit
                        });
                        me.widgets.push(widget);
                    }
                    else if (widgetConfig.type == "tagCloud") {
                        let widget = new SalviaTagCloudWidget({
                            node: widgetContentNode,
                            postsMeta: postsMeta
                        });
                        me.widgets.push(widget);
                    }
                    else if (widgetConfig.type == "categoryList") {
                        let widget = new SalviaCategoryListWidget({
                            node: widgetContentNode,
                            postsMeta: postsMeta
                        });
                        me.widgets.push(widget);
                    }
                    else if (widgetConfig.type == "custom") {
                        widgetContentNode.appendChild(widgetConfig.content);
                    }
                    else {
                        continue;
                    }
                    let widgetNode = quickCreate('div', 'salvia-widget');
                    let widgetTitleNode = quickCreate('div', 'salvia-widget-title', widgetConfig.title);
                    widgetNode.appendChild(widgetTitleNode);
                    widgetNode.appendChild(widgetContentNode);
                    sidebarNode.appendChild(widgetNode);
                }
            }
            if (me.widgets.length > 0) {
                mainNode.appendChild(sidebarNode);
            }
            blogBaseNode.appendChild(mainNode);

            // Footer
            let blogFooterText = "";
            if (commonConfig.hasOwnProperty("footer")) {
                blogFooterText = commonConfig.footer.text;
            }
            let copyrightNode = quickCreate('div', 'salvia-copyright', blogFooterText);
            let footerInnerNode = quickCreate('div', 'salvia-footer-inner');
            footerInnerNode.appendChild(copyrightNode);
            let footerBaseNode = quickCreate('footer', 'salvia-footer');
            footerBaseNode.appendChild(footerInnerNode);
            blogBaseNode.appendChild(footerBaseNode);

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


    function SalviaFeed(desc) {
        this.master = desc.master;
        this.node = desc.node;
        this.posts = [];
        let postsMeta = desc.postsMeta.posts.sort((a, b) => (new Date(b.date) - new Date(a.date)));
        let postCount = postsMeta.length;
        let postRequests = [];
        let limit = desc.limit;
        let page = desc.page;

        // Iterate posts
        for (let i = limit * (page - 1); i < limit * page; i++) {
            if (i >= postCount) {
                break;
            }
            let articleNode = quickCreate("article", "salvia-post");
            this.node.appendChild(articleNode);
            let post = new SalviaPost({
                master: this.master,
                node: articleNode,
                meta: postsMeta[i],
                renderOptions: { abstractOnly: true }
            });
            this.posts.push(post);
            postRequests.push(post.request());
        }

        // Insert paginator
        let ul = quickCreate('ul', 'salvia-paginator');
        let pageCount = Math.ceil(postCount / limit);
        for (let i = 1; i <= pageCount; i++) {
            let self = window.location.href.split("?")[0];
            let li = quickCreate('li', null, i == page ? '<b>' + i + '</b>' : '<a href="' + self + '?page=' + i + '">' + i + '</a>');
            ul.appendChild(li);
        }
        this.node.appendChild(ul);
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
        return ajax(config.postsPath + this.meta.key + '.md', 'text');
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
        let metaCategory = (this.meta.category ? '<li>Category: ' + this.meta.category + '</li>' : '');
        let metaTags = (this.meta.tags.length > 0 ? '<li>Tags: ' + this.meta.tags + '</li>' : '');
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

    
    function SalviaPostListWidget(desc) {
        this.node = desc.node;
        let postsMeta = desc.postsMeta.posts.sort((a, b) => (new Date(b.date) - new Date(a.date)));
        let limit = desc.limit > 0 && desc.limit < postsMeta.length ? desc.limit : postsMeta.length;
        let ul = quickCreate('ul', 'salvia-post-list');
        for (let i = 0; i < limit; i++) {
            let meta = postsMeta[i];
            let li = quickCreate('li', null, '<a href="' + config.postReaderPage + '?postKey=' + meta.key + '">' + meta.title + '</a><br /><small>' + meta.date.replace(/T.*$/g, '') + '</small>');
            ul.appendChild(li);
        }
        this.node.appendChild(ul);
    }


    function SalviaTagCloudWidget(desc) {
        this.node = desc.node;
        this.tagCloud = TagCloud(this.node, desc.postsMeta.tags);
    }


    function SalviaCategoryListWidget(desc) {
        this.node = desc.node; 
        let categoryList = desc.postsMeta.categories;
        let ul = quickCreate('ul', 'salvia-category-list');
        for (let i = 0; i < categoryList.length; i++) {
            let li = quickCreate('li', null, '<a href="#">' + categoryList[i] + '</a>');
            ul.appendChild(li);
        }
        this.node.appendChild(ul);
    }


    if (typeof (window.Salvia) === 'undefined') {
        window.Salvia = Salvia;
    }

})(window, commonmark, Prism, PrismStyles, TagCloud);
