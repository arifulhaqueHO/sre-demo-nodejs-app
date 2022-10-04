const express = require('express');
const nunjucks= require('nunjucks');
const promClient = require('prom-client');

const PORT = 8081;
const app = express();

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

promClient.collectDefaultMetrics({ register });

const successful = new promClient.Counter({
  name: 'simple_counter1',
	help: 'A demo counter metric',
	status: 'SUCCESS',
});

successful.inc()

const exceptions = new promClient.Counter({
  name: 'simple_counter2',
	help: 'A demo counter metric',
	status: 'EXCEPTION',
});

exceptions.inc()

function getTotal() {
	return successful.Counter + exceptions.Counter;
}

app.get('/metrics', (req, res) => {
  res.setHeader('Content-Type', register.contentType);
  res.send(register.metrics());
});

app.get('/', (req, res) => {
  res.render('index.html', {successful: successful.Counter, exceptions: exceptions.Counter, total: getTotal()});
});


app.listen(PORT, () => {
  console.log(`sre-demo-nodejs-app listening on port: http://localhost:${PORT}`);
});

