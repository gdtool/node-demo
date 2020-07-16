var os = require('os')
var express = require('express')
var pretty = require('express-prettify')
var bodyParser = require('body-parser');
var util = require('util')
var url = require('url');
var app = express();
var fs = require("fs")
var config = { "version": 0 };

var log = console.log;

console.log = function () {
    var first_parameter = arguments[0];
    var other_parameters = Array.prototype.slice.call(arguments, 1);

    function formatConsoleDate(date) {
        var hour = date.getHours();
        var minutes = date.getMinutes();
        var seconds = date.getSeconds();
        var milliseconds = date.getMilliseconds();

        return '[' +
            ((hour < 10) ? '0' + hour : hour) +
            ':' +
            ((minutes < 10) ? '0' + minutes : minutes) +
            ':' +
            ((seconds < 10) ? '0' + seconds : seconds) +
            '.' +
            ('00' + milliseconds).slice(-3) +
            '] ';
    }

    log.apply(console, [formatConsoleDate(new Date()) + first_parameter].concat(other_parameters));
};

app.use(pretty({ query: 'pretty' }));
//app.use(bodyParser.urlencoded({ extended: true }));
//app.use(bodyParser.json());
app.use(express.urlencoded())
app.use(express.json())

var port = process.env.PORT || 8080;
var router = express.Router();

app.all("/*", function (req, res, next) {
    console.log("%s request for %s", req.method, req.originalUrl)
    return next();
});

router.use(function (req, res, next) {
    req.prefix = req.protocol + '://' + req.get('host') + url.parse(req.originalUrl).pathname;
    console.log(req.prefix);
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Cache-Control, Pragma, Origin, Authorization, Content-Type, X-Requested-With");
    res.header("Access-Control-Allow-Methods", "GET, PUT, POST, DELETE, PATCH");
    next();
});


router.get('/', function (req, res) {
    apis = [
        {
            method: "GET, POST",
            desc: "GET demo",
            url: req.prefix + '/demo/headers'
        },
        {
            method: "GET",
            desc: "GET config",
            url: req.prefix + '/demo/config'
        },
        {
            method: "GET",
            desc: "GET demo",
            url: req.prefix + '/demo/demo'
        },
        {
            method: "PUT",
            desc: "PUT demo",
            url: req.prefix + '/demo/demo'
        },
        {
            method: "PATCH",
            desc: "PATCH demo",
            url: req.prefix + '/demo/demo'
        },
        {
            method: "DELETE",
            desc: "DELETE demo",
            url: req.prefix + '/demo/demo'
        },
        {
            method: "POST",
            desc: "POST demo",
            url: req.prefix + '/demo/demo'
        },
    ]
    res.json({ api: apis });
});

function headers(req, res) {
    res.json({
        result: true,
        hostname: os.hostname(),
        headers: req.headers,
        query: req.query,
        body: req.body,
    });
};

router.route('/demo/headers')
    .get(headers)
    .post(headers)
    .put(headers)
    .patch(headers)
    .delete(headers)

router.route('/demo/config')
    .get(function (req, res) {
        res.json(global.config)
    })

function demo(req, res) {
    res.json({
        result: true,
        hostname: os.hostname(),
        headers: req.headers,
        query: req.query,
        body: req.body,
    });
};


router.route('/demo/demo')
    // curl -H "Content-Type: application/json" -X GET -d '{}' http://localhost:8080/api/demo/demo
    .get(demo)

    // curl -X PUT -d '{}' http://localhost:8080/api/demo/demo
    .put(demo)

    // curl -X DELETE http://localhost:8080/api/demo/demo
    .delete(demo)

    // curl -H "Content-Type: application/json" -X POST -d '{"hello": "world"}' http://localhost:8080/api/demo/demo
    .post(demo)

    // curl -H "Content-Type: application/json" -X PATCH -d '{}' http://localhost:8080/api/demo/demo
    .patch(demo)

app.use('/api', router);

app.use(express.static('static'));
app.use(express.static('conf'));


console.log(process.argv)

function load_config() {
    if (process.argv.length >= 3) {
        var cfg = process.argv[2]
        var content = fs.readFileSync(cfg)
        global.config = JSON.parse(content)
        console.log("Using config: ", global.config)
    }
}
function sighup_handler() {
    console.log("Recieved SIGHUP");
    load_config();
}

process.on("SIGHUP", sighup_handler);

load_config();

pidf = fs.writeFileSync("./nodedemo.pid", util.format("%d", process.pid))

console.log("App PID " + process.pid + " Port :" + port)
app.listen(port);