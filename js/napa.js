(function (window, commonmark) {
    'use strict'

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

    function Napa() {

        const config = {
            configFile: './napa.config.json',
            postsPath: './posts/'
        };


        // TODO: Eliminate hardcoded values.
        function NAPAHeader(desc) {
            this.el = desc.el;
            let titleNode = quickCreate('div', 'napa-title', 'SAMPLE BLOG TITLE');
            let navNode = quickCreate('nav', 'napa-nav');
            let headerInnerNode = quickCreate('div', 'napa-header-inner');
            headerInnerNode.appendChild(titleNode);
            headerInnerNode.appendChild(navNode);
            let headerBaseNode = document.querySelector(this.el);
            headerBaseNode.className = 'napa-header';
            headerBaseNode.appendChild(headerInnerNode);
        }

        function NAPAFeed(desc) {
            let me = this;
            me.el = desc.el;
            let feedBaseNode = document.querySelector(me.el);
            feedBaseNode.className = 'napa-container';
            ajaxGet(config.configFile, 'json', function (status, response) {
                if (status == 200) {
                    for (let i = 0; i < response.postKeys.length; i++) {
                        let postBaseNode = document.createElement('article');
                        postBaseNode.className = 'napa-post';
                        let post = new NAPAPost({ node: postBaseNode });
                        feedBaseNode.appendChild(post.node);
                        post.request(response.postKeys[i], function (post) {
                            console.log("Loaded: ", post.title)
                        });
                    }
                }
                else {
                    document.querySelector(me.el).innerHTML = 'NAPA: Cannot get' + config.configFile;
                    console.error('NAPA: Cannot get', config.configFile);
                }
            });
        }


        function NAPAPost(desc) {
            if (desc.el) {
                this.el = desc.el;
                this.node = document.querySelector(desc.el);
            }
            else {
                this.el = null;
                this.node = desc.node;
            }
            this.title = null;
            this.date = null;
            this.author = null;
            this.html = null;
        }

        NAPAPost.prototype.request = function (key, callback) {
            let me = this;
            ajaxGet(config.postsPath + key + '.md.txt', 'text', function (status, response) {
                if (status == 200) {
                    let reader = new commonmark.Parser();
                    let writer = new commonmark.HtmlRenderer();
                    let ast = reader.parse(response);
                    let isMetaValid = false;
                    if (ast.firstChild.type == 'heading' && ast.firstChild.level == 1 && ast.firstChild.next && ast.firstChild.next.type == 'paragraph') {
                        let metaRaw = ast.firstChild.next.firstChild.literal;
                        if (metaRaw.startsWith('{') && metaRaw.endsWith('}')) {
                            let splitted = metaRaw.substr(1, metaRaw.length - 2).split('|');
                            if (splitted.length == 2) {
                                me.title = ast.firstChild.firstChild.literal;
                                me.date = splitted[0].trim();
                                me.author = splitted[1].trim();
                                isMetaValid = true;
                            }
                        }
                    }
                    if (isMetaValid) {
                        ast.firstChild.unlink();
                        ast.firstChild.unlink();
                        let html = writer.render(ast);
                        me.html = html;
                        me.render();
                    }
                    else {
                        me.node.innerHTML = 'NAPA: Cannot render post "' + key + '", metadata format is not valid.';
                        me.node.className += ' error';
                    }
                }
                else {
                    me.node.innerHTML = 'NAPA: Request to post "' + key + '" failed.';
                    me.node.className += ' error';
                }
                if (typeof(callback) == 'function') { callback(me); }
            });
        };

        NAPAPost.prototype.render = function () {
            let postTitle = document.createElement('h1');
            postTitle.className = 'napa-post-title';
            postTitle.innerHTML = this.title;
            let postMeta = document.createElement('p');
            postMeta.className = 'napa-post-meta';
            postMeta.innerHTML = '<i><span class="napa-post-date">' + this.date + '</span> by <span class="napa-post-author">' + this.author + '</span></i>';
            let postContent = document.createElement('div');
            postContent.className = 'napa-post-content';
            postContent.innerHTML = this.html;
            this.node.className = 'napa-post';
            this.node.innerHTML = '';
            this.node.appendChild(postTitle);
            this.node.appendChild(postMeta);
            this.node.appendChild(postContent);
        }


        function NAPAArchive(desc) {
            let me = this;
            me.el = desc.el;
            ajaxGet(config.configFile, 'json', function (status, response) {
                if (status == 200) {
                    me.render(response.posts);
                }
                else {

                }
            });
        }

        NAPAArchive.prototype.render = function (data) {
            let ul = document.createElement('ul');
            for (let i = 0; i < data.length; i++) {
                let li = document.createElement('li');
                li.innerHTML = '<a href="#' + data[i] + '">' + data[i] + '</a>';
                ul.appendChild(li);
            }
            ul.addEventListener('click', function (event) {
                if (event.target.tagName.toLowerCase() === 'a') {
                    let a = event.target;
                    // me.request(a.hash, () => console.log('Request completed.'));
                }
            });
            document.querySelector(this.postList.el).appendChild(ul);
        }


        return {
            Header: NAPAHeader,
            Feed: NAPAFeed,
            Post: NAPAPost,
            Archive: NAPAArchive
        }

    }

    if (typeof (window.napa) === 'undefined') {
        window.napa = Napa();
    }

})(window, commonmark);
