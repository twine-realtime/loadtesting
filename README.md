# Artillery Loadtesting

In Artillery, "Each virtual user will pick and run one of the scenarios in the test definition and run it to completion." [1](https://testerops.com/understanding-artillery-tests) That makes the Twine scenario difficult to mimic: a user must make an HTTPS request to `/set-cookie` that completes before establishing a WebSocket connection.

Initial load tests established Twine's ability to autoscale up and down based on a CPU % trigger: the load test successfully ramped up to 70,000 simultaneous WebSocket connections.

- ulimit (t2.small vs xlarge)
- ephemeral ports
- 2x artillery servers
- process .js file
