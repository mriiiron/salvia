(function (window, commonmark) {
    'use strict'

    function ajaxGet(url, returnType, callback) {
        let xhr = new XMLHttpRequest();
        xhr.onreadystatechange = function () {
            if (xhr.readyState === XMLHttpRequest.DONE) {
                if (xhr.status === 200) {
                    callback(xhr.response);
                }
                else {
                    console.error('AJAX request failed.');
                }
            }
        }
        xhr.open('GET', url);
        xhr.send();
    }

    function Napa() {

        const config = {
            configFile: './napa.config.json',
            postsPath: './posts/'
        };


        function NAPAFeed(desc) {
            let me = this;
            me.el = desc.el;
            ajaxGet(config.configFile, 'json', function (res) {
                me.render(res.posts);
            });
        }

        NAPAFeed.prototype.render = function (data) {
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

        NAPAFeed.prototype.request = function (hash, callback) {
            let me = this;
            ajaxGet(config.postsPath + hash.substr(1) + '.md.txt', 'text', function (res) {
                let reader = new commonmark.Parser();
                let writer = new commonmark.HtmlRenderer();
                let ast = reader.parse(res);
                let html = writer.render(ast);
                document.querySelector(me.post.el).innerHTML = html;
                callback();
            });
        };


        function NAPAArchive () {

        }


        return {
            Feed: NAPAFeed,
            Archive: NAPAArchive
        }

    }

    if (typeof (window.napa) === 'undefined') {
        window.napa = Napa();
    }

})(window, commonmark);
