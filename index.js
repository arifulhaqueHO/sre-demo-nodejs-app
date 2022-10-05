const express = require('express');
const bodyParser = require('body-parser');

const nunjucks = require('nunjucks');
const promClient = require('prom-client');
const {last} = require("nunjucks/src/filters");

const PORT = 8081;
const app = express();
app.use(bodyParser.urlencoded({extended: true}));

nunjucks.configure('views', {
    autoescape: true,
    express: app
});

// Create a Registry which registers the metrics
const register = new promClient.Registry();

// Add a default label which is added to all metrics
register.setDefaultLabels({
    app: 'demo',
    team: "sre",
});

promClient.collectDefaultMetrics({
    register,
})

const successful = new promClient.Counter({
    name: 'simple_counter1',
    help: 'A demo counter metric',
    status: 'SUCCESS',
});

const exceptions = new promClient.Counter({
    name: 'simple_counter2',
    help: 'A demo counter metric',
    status: 'EXCEPTION',
});

register.registerMetric(successful);
register.registerMetric(exceptions);

const getCounterValue = async name => {
    const theGood = await register.getSingleMetricAsString(name);
    const matches = theGood.match(/(\d+)$/);
    const good = matches.length > 1 ? Number.parseInt(matches[matches.length - 1], 10) : 0;
    return Promise.resolve(good);
}


const getLastSuccessValue = async () => {
    return getCounterValue("simple_counter1");
}

const getLastExceptionValue = async () => {
    return getCounterValue("simple_counter2");
}

app.get('/metrics', async (req, res) => {
    res.setHeader('Content-Type', register.contentType);
    res.send(await register.metrics());
});

app.get('/', async (req, res) => {
    const good = await getLastSuccessValue();
    const bad = await getLastExceptionValue();
    console.log({
        good, bad
    })

    const total = good + bad;
    res.render('index.html', {successful: good, exceptions: bad, total});
});

app.post('/success', (req, res) => {
    const inc = Number.parseInt(req.body.amount, 10);
    console.log("In success");
    successful.inc(inc);
    res.redirect('/');
});

app.post('/exception', (req, res) => {
    const inc = Number.parseInt(req.body.amount, 10);
    console.log("In exception");
    exceptions.inc(inc);
    res.redirect('/');
});

app.listen(PORT, () => {
    console.log(`sre-demo-nodejs-app listening on port: http://localhost:${PORT}`);
});

