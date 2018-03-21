(function (world) {

    function Baby() {
        this.bDay = new Date();
    }

    Baby.prototype.sayHelloTo = function () {
        console.log('Hello ' + world + '!');
    }

    if (typeof (world.baby) === 'undefined') {
        world.baby = Baby;
    }

})(world);
