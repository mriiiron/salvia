(function (window, commonmark) {
    'use strict'

    function Napa() {

        const config = {
            postsPath: './posts/'
        };


        function NAPAPostList(desc) {
            this.el = desc.el,
            this.list = desc.list
        }

        NAPAPostList.prototype.render = function () {
            let me = this;
            let ul = document.getElementById(me.el);
            for (let i = 0; i < me.list.length; i++) {
                let li = document.createElement('li');
                li.innerHTML = '<a href="./post.html#' + me.list[i] + '">' + me.list[i] + '</a>';
                ul.appendChild(li);
            }
        };


        function NAPAPost(desc) {
            this.el = desc.el;
        }

        NAPAPost.prototype.request = function (hash, callback) {
            let me = this;
            let xhr = new XMLHttpRequest();
            xhr.onreadystatechange = function () {
                if (xhr.readyState === XMLHttpRequest.DONE) {
                    if (xhr.status === 200) {
                        let reader = new commonmark.Parser();
                        let writer = new commonmark.HtmlRenderer();
                        let ast = reader.parse(xhr.responseText);
                        let html = writer.render(ast);
                        document.getElementById(me.el).innerHTML = html;
                        callback();
                    }
                    else {
                        console.error('NAPAPost: There was a problem with the request.');
                    }
                }
            }
            xhr.open('GET', config.postsPath + hash + '.md.txt');
            xhr.send();
        };

        return {
            PostList: NAPAPostList,
            Post: NAPAPost
        }

    }

    if (typeof (window.napa) === 'undefined') {
        window.napa = Napa();
    }

})(window, commonmark);
