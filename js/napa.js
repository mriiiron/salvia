(function (window, commonmark) {
    'use strict'

    function Napa() {

        const config = {
            postsPath: './posts/'
        };


        function NAPACore(desc) {
            let me = this;
            me.postList = {
                el: desc.postList.el
            };
            me.post = {
                el: desc.post.el
            };
            me.data = desc.data;
            let ul = document.createElement('ul');
            for (let i = 0; i < me.data.length; i++) {
                let li = document.createElement('li');
                li.innerHTML = '<a href="#' + me.data[i] + '">' + me.data[i] + '</a>';
                ul.appendChild(li);
            }
            ul.addEventListener('click', function (event) {
                if (event.target.tagName.toLowerCase() === 'a') {
                    let a = event.target;
                    me.request(a.hash, () => console.log('Request completed.'));
                }
            });
            document.querySelector(this.postList.el).appendChild(ul);
        }

        NAPACore.prototype.request = function (hash, callback) {
            let me = this;
            let xhr = new XMLHttpRequest();
            xhr.onreadystatechange = function () {
                if (xhr.readyState === XMLHttpRequest.DONE) {
                    if (xhr.status === 200) {
                        let reader = new commonmark.Parser();
                        let writer = new commonmark.HtmlRenderer();
                        let ast = reader.parse(xhr.responseText);
                        let html = writer.render(ast);
                        document.querySelector(me.post.el).innerHTML = html;
                        callback();
                    }
                    else {
                        console.error('NAPA: There was a problem with the request.');
                    }
                }
            }
            xhr.open('GET', config.postsPath + hash.substr(1) + '.md.txt');
            xhr.send();
        };

        return {
            Core: NAPACore
        }

    }

    if (typeof (window.napa) === 'undefined') {
        window.napa = Napa();
    }

})(window, commonmark);
