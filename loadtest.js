const io = require('socket.io-client');
const fetch = require('node-fetch');

module.exports = {
  setCookieAndConnectWebSocket: async function(context, events, done) {
    try {
      // Make an HTTP request to set the cookie
      const response = await fetch('https://98y98340923u4.com/set-cookie', {
        method: 'GET'
        // Include other options if needed
      });

      if (!response.ok) {
        throw new Error(`HTTP request failed: ${response.statusText}`);
      }

      // Log cookie setting
      console.log("Cookie set");

      // Establish WebSocket connection
      const socket = io('https://98y98340923u4.com', {
        transports: ['websocket'],
        withCredentials: true,
      });

      // Handle successful connection
      socket.on('connect', () => {
        console.log("WebSocket connection established");
        // You can also emit events or perform actions here as needed
      });

      // Handle other WebSocket events (e.g., messages, errors)

      // Keep the connection open for a specified duration
      setTimeout(() => {
        socket.disconnect();
        done();
      }, 600000); // 10 minutes
    } catch (error) {
      console.error(error);
      done();
    }
  }
};
