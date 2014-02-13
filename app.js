var express = require('express');
var http = require('http');
var https = require('https');
var app = express();

// all environments
app.set('port', process.env.PORT || 3000);
app.use(express.json());
app.use(express.urlencoded());
app.use(express.methodOverride());
app.use(app.router);

app.post('/coveralls', function(req, res){
  var request = https.request({
    hostname: 'excellenteasy.slack.com',
    path: process.env.SLACK_TOKEN,
    method: 'POST'
  },function(response){
    console.log('STATUS: ' + response.statusCode);
    console.log('HEADERS: ' + JSON.stringify(response.headers));
    response.setEncoding('utf8');
    response.on('data', function (chunk) {
      console.log('BODY: ' + chunk);
    });
    res.send(200);
  });

  var covered_percent = parseFloat(req.body.covered_percent);

  if (isNaN(covered_percent)) {
    covered_percent = parseFloat(req.body.badge_url.split('coveralls_')[1].replace('.png',''));
  }

  var color = 'good';

  if (covered_percent < 90) {
    if (covered_percent < 80) {
      color = 'danger';
    } else {
      color = 'warning';
    }
  }

  var data = {
    text: "'" + req.body.commit_message + "' on " + req.body.branch,
    attachments: [{
      fallback: "Coverage Report available at <" + req.body.url + ">",
      color: color,
      fields: [
        {
          title: "Coverage",
          value: "<"+req.body.url+"|"+covered_percent+">",
          short: true
        },
        {
          title: "Change",
          value: req.body.coverage_change,
          short: true
        },
        {
          title: "Repository",
          value: "<https://github.com/"+req.body.repo_name+"|"+req.body.repo_name+">",
          short: true
        },
        {
          title: "Committer",
          value: req.body.committer_name,
          short: true
        }
      ]
    }]
  };
  request.on('error', function(e) {
    console.log('problem with request: ' + e.message);
  });

  request.write(JSON.stringify(data));
  request.end()
});

http.createServer(app).listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});
