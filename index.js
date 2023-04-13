const express = require('express');
const app = express();

app.get('/', (req, res) => {
    res.send("Nice t-yoroshikuonegaishimasu");
});

app.post('/hello', function(req, res){
    res.send("You've been post'd");
})

app.listen(8080);