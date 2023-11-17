# Artillery Loadtesting

### WebSocket Connections
In Artillery, "Each virtual user will pick and run one of the scenarios in the test definition and run it to completion." [1](https://testerops.com/understanding-artillery-tests) That makes the Twine scenario difficult to mimic: a user must make an HTTPS request to `/set-cookie` that completes before establishing a WebSocket connection, all in a single scenario, in order for the load test to be an accurate representation of user activity.

Initial load tests established Twine's ability to auto-scale up and down based on a CPU % trigger, and to handle a load of 70,000 concurrent WebSocket connections that ramped up over 30 minutes. However, that was unsatisfactory because, as noted above, the flow was not completely accurate. This was addressed by adding custom processing for the Artillery load test: extracting the Artillery "scenario" logic from the limited YAML options to a JavaScript file. With that in place, each of Artillery's virtual users fetched a cookie, established a WebSocket connection with the Twine server, and maintained that connections, all in sequence.

A t2.xlarge AWS EC2 server handled the new load test flow without error but a t2.small server experienced a small number of errors when fetching `/set-cookie` under the load of 37,000 connections over 15 minutes. The load test--and ultimately the Twine client code--was updated to retry the request up to three times if it failed, with an exponential delay between each retry to mitigate overwhelming the server or network. The new configuration succeed when testing 30,000 connections over 30 minutes on a t2.small server. Next, we increased the load test with this new configuration and triggered auto-scaling.

Two dedicated Artillery servers load tested the Twine AWS Beanstalk environment. This setup was chosen because each server was limited to approximately 60,000 ephemeral ports and 65,000 open file descriptors per process, and each WebSocket connection requires one of each. While we could have gone further, we felt that this amount of load testing was adequate for Twine's purpose as a reliable real-time drop-in service for small-to-medium applications.

We used this Artillery server setup to create 48,000 virtual users, per server, over 20 minutes. Each user successfully requested `/set-cookie`, established a WebSocket connection, and maintained the connection for 20 minutes. The Twine environment began with a single t2.small EC2 server and added three more, which handled the 96,000 virtual users and 192,000 requests (one request to `/set-cookie` followed by one request to establish the WebSocket connection, per vuser).

### Pub/Sub
Artillery server 1 issued 12,000 requests over 10 minutes, 6,000 per virtual user, and in the process also subscribed each user to a single channel. Artillery server 2 issued 6,000 requests to Twine's API over the same time period, publishing 10 messages per second to the same channel. The initial Twine `t2.small` server reached its limit just before the two-minute auto-scaling breach duration was met, and approximately 2% of the publish requests failed.

### State Recovery
