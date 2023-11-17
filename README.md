# Artillery Loadtesting

## WebSocket Connections
Twine used [Artillery](https://www.artillery.io/docs) for load testing because of its built-in SocketIO engine, which enabled straightforward connection to the Twine server. However, in Artillery, "each virtual user will pick and run one of the scenarios in the test definition and run it to completion." [1](https://testerops.com/understanding-artillery-tests) That made the Twine flow difficult to mimic in Artillery because the flow requires a successful `/set-cookie` request followed by a second request that establishes the WebSocket connection. That could not occur in sequence for a single virtual user.

This issue was addressed by adding custom processing for the Artillery load test: extracting the Artillery "scenario" logic from the limited YAML options to a more complex JavaScript file. With that in place, each of Artillery's virtual users fetched a cookie, established a WebSocket connection with the Twine server, and maintained that connections, all in sequence.

A t2.xlarge AWS EC2 server handled the new load test flow without error but a t2.small server experienced a small number of errors when fetching `/set-cookie` under the load of 37,000 connections over 15 minutes. The load test, and ultimately the Twine client code, was updated to retry the request up to three times if it failed, with an exponential delay between each retry to mitigate overwhelming the server or network. The new configuration succeeded at handling 30,000 connections over 30 minutes on a t2.small server.

Two dedicated Artillery servers were created in order to substantially increase the load test. This setup was chosen because each server was limited to approximately 60,000 ephemeral ports and 65,000 open file descriptors per process, and each WebSocket connection requires one of each. While we could have gone further, we felt that this amount of load testing was adequate for Twine's purpose as a reliable real-time drop-in service for small-to-medium applications.

In the next load test, the Artillery servers created 48,000 virtual users, per server, over 20 minutes. Each user successfully requested `/set-cookie`, established a WebSocket connection, and maintained the connection for 20 minutes. The Twine environment began with a single t2.small EC2 server and added three more, which handled the 96,000 virtual users and 192,000 requests (one request to `/set-cookie` followed by one request to establish the WebSocket connection, per vuser).

## Pub/Sub
Artillery server 1 issued 12,000 requests over 10 minutes, 6,000 per virtual user, and in the process also subscribed each user to a single channel. Artillery server 2 issued 6,000 requests to Twine's API over the same time period, publishing 10 messages per second to the same channel. The initial Twine `t2.small` server reached its limit just before the two-minute auto-scaling breach duration was met, and while two more servers spun up, 2% of the publish requests failed.

The auto-scaling threshold was a very conservative 40% CPU usage with a 2-minute breach duration. Rather than lower it further, we decided to upgrade 

* bandwidth of Twine server and Artillery servers: upgrade to t3.medium
* 3 successful testing stages: third one triggered auto-scaling

## State Recovery
