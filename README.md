# Artillery Loadtesting

In Artillery, "Each virtual user will pick and run one of the scenarios in the test definition and run it to completion." [1](https://testerops.com/understanding-artillery-tests) That makes the Twine scenario difficult to mimic: a user must make an HTTPS request to `/set-cookie` that completes before establishing a WebSocket connection, all in a single scenario, in order for the load test to be an accurate representation of user activity.

Initial load tests established Twine's ability to autoscale up and down based on a CPU % trigger, and to handle a load of 70,000 concurrent WebSocket connections that ramped up over 30 minutes via 2 dedicated Artillery servers. However, 

- ulimit (t2.small vs xlarge)
- ephemeral ports
- 2x artillery servers
- process .js file
