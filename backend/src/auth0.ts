import request from 'request';
import axios from 'axios';

function askForToken(){
    var options = { method: 'POST',
        url: 'https://dev-r0ex85m18bf4us41.us.auth0.com/oauth/token',
        headers: { 'content-type': 'application/json' },
        body: '{"client_id":"sF6pslp9LNfg6C12s9UhEHoelhsrnE80","client_secret":"Y_Lgs_-oQs-s2GSxSWQUuKxIsKKHeb9r1X7hffl381KADaUQjSWvCXHolewG2FC4","audience":"https://dev-r0ex85m18bf4us41.us.auth0.com/api/v2/","grant_type":"client_credentials"}' };
    
    request(options, function (error, response, body) {
        if (error) throw new Error(error);
    
        console.log(body);
    });
}
function sendToken(token){
  const options = { 
    method: "GET",
    url: "http://path_to_your_api/",
    headers: { "authorization": `Bearer ${token}` },
  };
  
  axios(options)
    .then(response => {
      console.log(response.data);
    })
    .catch(error => {
      console.log(error);
    });
}