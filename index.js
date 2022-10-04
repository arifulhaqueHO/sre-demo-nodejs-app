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

app.get('/metrics', async (req, res) => {
  res.setHeader('Content-Type', register.contentType);
  res.send(await register.metrics());
});

app.get('/', (req, res) => {
	console.log(successful);
	console.log(exceptions);
  res.render('index.html', {successful: successful, exceptions: exceptions, total: getTotal()});
});

app.post('/success', (req, res) =>{
	console.log("In success");
	successful.inc();
	res.redirect('/');
});

app.post('/exception', (req ,res) =>{
	console.log("In exception");
	exceptions.inc();
	res.redirect('/');
});

app.listen(PORT, () => {
  console.log(`sre-demo-nodejs-app listening on port: http://localhost:${PORT}`);
});

