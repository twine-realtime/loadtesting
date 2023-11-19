# Artillery Loadtesting

## Phase I: Concurrent Connections
Twine used [Artillery](https://www.artillery.io/docs) for load testing because of its built-in SocketIO engine, which enabled straightforward connection to the Twine server. However, in Artillery, "each virtual user will pick and run one of the scenarios in the test definition and run it to completion."[1](https://testerops.com/understanding-artillery-tests) That made the Twine flow difficult to simulate in Artillery because the flow requires a successful `/set-cookie` request followed by a second request that establishes the WebSocket connection. That could not occur in sequence for a single virtual user.

This issue was addressed by adding custom processing for the Artillery load test: extracting the Artillery "scenario" logic from the limited YAML options to a more complex JavaScript file. With that in place, each of Artillery's virtual users fetched a cookie, established a WebSocket connection with the Twine server, and maintained that connections, all in sequence.

A t2.xlarge AWS EC2 server handled the load test flow without error, but a t2.small server experienced a small number of errors when fetching `/set-cookie` under the load of 37,000 connections over 15 minutes. The load test, and ultimately the Twine client code, was updated to retry the request up to three times if it failed, with an exponential delay between each retry to mitigate overwhelming the server or network. The new configuration succeeded at handling 30,000 connections over 30 minutes on a t2.small server.

Next, two dedicated Artillery servers were created to substantially increase the load test. This setup was chosen because each server was limited to approximately 60,000 ephemeral ports and 65,000 open file descriptors per process, and each WebSocket connection required one of each. While we could have gone further, we felt that this amount of load testing was adequate for Twine's purpose as a reliable real-time drop-in service for small-to-medium applications.

In the next load test, the Artillery servers created 96,000 virtual users over 20 minutes. Each user successfully requested `/set-cookie`, established a WebSocket connection, and maintained the connection for 20 minutes. The Twine environment began with a single t2.small EC2 server and auto-scaled to four, successfully handling 100% of the 96,000 virtual users and 192,000 requests (one request to `/set-cookie` followed by one request to establish the WebSocket connection, per virtual user).

## Phase II: Pub/Sub
The purpose of this load testing phase was to increase the virtual user simulation accuracy: instead of only maintaining a WebSocket connection, each virtual user requested `/set-cookie`, established a WebSocket connection, *subscribed to a room*, and maintained the connection. The extra step of subscribing to a channel was critical because it enabled load testing of two key abilities: 1) Handling a rapid increase in subscribers to an active room; 2) Handling frequent `/publish` API calls, storing the data, and emitting the payload to a room with a rapidly increasing amount of subscribers.

In the first load test, Artillery server 1 issued 12,000 requests over 10 minutes, 6,000 per virtual user, and in the process also subscribed each user to a single channel. Artillery server 2 issued 6,000 requests to Twine's API over the same time period, publishing 10 messages per second to the same channel. The initial Twine t2.small server reached its limit just before the auto-scaling breach duration was met, and while two more servers spun up, 2% of the publish requests failed.

The auto-scaling threshold was a very conservative 40% CPU usage with a 2-minute breach duration. While the threshold could have been changed to a "Network In" metric, we felt it would trigger auto-scaling too quickly: the t2.small server has a "low to moderate" network performance bottleneck. Instead, we upgraded the server to t3.medium, which has "up to 5 Gbps" network performance. That resolved the issue without auto-scaling: the load test passed without error.

To trigger auto-scaling, the load test was increased to 40,800 subscribed users over 20 minutes (20,400 per Artillery server), with 1 `/publish` request per second being stored and emitted to each user. Postman made the `/publish` requests successfully but the Artillery servers crashed under the load and were upgraded to t3.medium. The new setup facilitated the load test successfully, and the Twine environment auto-scaled to two servers, successfully handling the load of 81,600 requests, 40,800 concurrent subscribed users, and 1,200 payload emissions over 20 minutes.

Throughout these tests, 20-40% of virtual users failed to receive a single message. The other virtual users received the expected amount of messages. Upgrading the Artillery servers from t3.medium to t3.2xlarge immediately reduced the client-side errors to 2-4% during a load test of 6,000 connections over 10 minutes. Further investigation found that neither the type nor number of Twine servers impacted the error rate of any load test. As a result, we think the errors were likely caused by an Artillery server bottleneck, the specific load test configuration, or by a combination thereof. Further investigation is required.

## Phase III: State Recovery
The final phase load tested ramping up to 10,800 subscribed clients over 12 minutes, 1 `/publish` request per second being stored and emitted to each user, with the addition of each user disconnecting then reconnecting after 1 minute, then maintaining the reconnection for 10 minutes. The load test passed without fail, emitting 60 missed messages to each user upon reconnection.