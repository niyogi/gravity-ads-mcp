# Development

```bash
git clone https://github.com/niyogi/gravity-ads-mcp.git
cd gravity-ads-mcp
npm install
npm run build
npm run typecheck
```

To test locally with a live API key:

```bash
GRAVITY_API_KEY=your-key node dist/index.js
```

The server speaks JSON-RPC over stdio. You can test the `tools/list` handshake:

```bash
echo '{"jsonrpc":"2.0","id":1,"method":"tools/list"}' | \
  GRAVITY_API_KEY=your-key node dist/index.js
```

## Publishing

```bash
npm login
npm publish
```
