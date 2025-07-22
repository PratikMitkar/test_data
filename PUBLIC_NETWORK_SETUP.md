# Public Network Setup Guide

This guide will help you run both the server and client on the public network so they can be accessed from other devices.

## Prerequisites

1. Make sure both server and client are working locally
2. Know your server's public IP address
3. Configure your firewall to allow connections on ports 3000 (client) and 5000 (server)

## Step 1: Configure the Server

The server is already configured to listen on all network interfaces (`0.0.0.0`). 

### Start the Server

```bash
cd Backend
npm install
npm run dev
```

The server will start on `http://0.0.0.0:5000` and will be accessible from any device on the network.

## Step 2: Configure the Client

The client is configured to run on all network interfaces. You need to update the API base URL to point to your server's IP address.

### Option 1: Use the Update Script (Recommended)

```bash
cd Client/ticketing-system-ui
node update-api-url.js http://YOUR_SERVER_IP:5000
```

Replace `YOUR_SERVER_IP` with your actual server IP address (e.g., `192.168.1.100`).

### Option 2: Manual Update

Edit `Client/ticketing-system-ui/src/config/api.js` and change:

```javascript
export const API_BASE_URL = 'http://localhost:5000';
```

to:

```javascript
export const API_BASE_URL = 'http://YOUR_SERVER_IP:5000';
```

### Start the Client

```bash
cd Client/ticketing-system-ui
npm install
npm run dev
```

The client will start on `http://0.0.0.0:3000` and will be accessible from any device on the network.

## Step 3: Access from Other Devices

### From Other Devices on the Network

- **Client**: `http://YOUR_SERVER_IP:3000`
- **Server API**: `http://YOUR_SERVER_IP:5000`

### Example URLs

If your server IP is `192.168.1.100`:
- Client: `http://192.168.1.100:3000`
- Server: `http://192.168.1.100:5000`

## Step 4: Firewall Configuration

### Windows Firewall

1. Open Windows Defender Firewall
2. Click "Allow an app or feature through Windows Defender Firewall"
3. Click "Change settings" and then "Allow another app"
4. Add Node.js and allow it on both private and public networks
5. Or create inbound rules for ports 3000 and 5000

### Linux Firewall (UFW)

```bash
sudo ufw allow 3000
sudo ufw allow 5000
sudo ufw reload
```

### macOS Firewall

1. Go to System Preferences > Security & Privacy > Firewall
2. Click "Firewall Options"
3. Add Node.js and allow incoming connections

## Step 5: Network Configuration

### Find Your IP Address

**Windows:**
```cmd
ipconfig
```

**Linux/macOS:**
```bash
ifconfig
# or
ip addr
```

Look for your local IP address (usually starts with `192.168.` or `10.0.`).

### Router Configuration (if needed)

If you need to access from outside your local network:
1. Configure port forwarding on your router for ports 3000 and 5000
2. Use your public IP address instead of local IP
3. Consider using a domain name and SSL certificates for production

## Troubleshooting

### Common Issues

1. **Connection Refused**
   - Check if the server is running
   - Verify firewall settings
   - Ensure ports are not blocked by antivirus

2. **CORS Errors**
   - The server is configured to allow all origins in development
   - Check browser console for specific error messages

3. **API Calls Failing**
   - Verify the API base URL is correct
   - Check if the server is accessible from the client device
   - Test with: `curl http://YOUR_SERVER_IP:5000/api/health`

### Testing Connectivity

Test if the server is accessible:

```bash
# From another device
curl http://YOUR_SERVER_IP:5000/api/health
```

Should return:
```json
{
  "status": "OK",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "uptime": 123.456
}
```

## Security Considerations

### For Development
- The current setup is suitable for development and testing
- CORS is configured to allow all origins
- No rate limiting in development mode

### For Production
- Configure proper CORS origins
- Enable rate limiting
- Use HTTPS with SSL certificates
- Implement proper authentication and authorization
- Consider using a reverse proxy (nginx, Apache)
- Set up proper logging and monitoring

## Quick Commands

### Start Both Services

**Terminal 1 (Server):**
```bash
cd Backend
npm run dev
```

**Terminal 2 (Client):**
```bash
cd Client/ticketing-system-ui
npm run dev
```

### Update API URL
```bash
cd Client/ticketing-system-ui
node update-api-url.js http://YOUR_SERVER_IP:5000
```

### Check Server Health
```bash
curl http://YOUR_SERVER_IP:5000/api/health
```

## Notes

- The server will be accessible at `http://YOUR_SERVER_IP:5000`
- The client will be accessible at `http://YOUR_SERVER_IP:3000`
- Both services will be available to all devices on your local network
- For internet access, you'll need to configure port forwarding on your router
- Consider using environment variables for different deployment environments 