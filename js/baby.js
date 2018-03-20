(function (world) {

    function Baby() {
        
    }

    Baby.prototype.sayHelloTo = function (to) {
        console.log('Hello ' + to + '!');
    }

    if (typeof (world.baby) === 'undefined') {
        world.baby = Baby;
    }

})(world);
