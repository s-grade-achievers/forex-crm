# Forex admin

Responsible for the admin part of the forex handling. Maintains a Microsoft SQL database containing reserves of forex for exchange, the possible pairs of currencies that can be exchanged along with their exchange rates and a transaction ledger of all forex transactions that have occured. 

Uses TLS/SSL based encrypted https communication for ensuring safer commmunication. Enpoints  are provided to list exchangeable pairs of currencies, periodically update exchange rates, buy forex from the reserve and admin side work like buying more of a particular currency. 

Buying currency uses a special signed JWT to add to the security and generate a JWT of its own to complete the transaction and hand over the exchanged currency. 

To run:
- create self signed tls certificate and place it in `src`
- use the commands in `curl.sh` to do so
- endpoints can be tested by generating a jwt using `jwt.js`
- use the curl commands in `curl.sh` to call endpoints
- run `docker-compose up` to start service
- admin page located at `https://localhost:3000/adminLogin`
