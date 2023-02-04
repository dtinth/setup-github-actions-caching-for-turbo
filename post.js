// eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-var-requires, import/no-commonjs
const {execSync} = require('child_process')

execSync(
  `
curl -X DELETE http://localhost:41230/self || true
cat /tmp/turbogha.log || true
`,
  {stdio: 'inherit'}
)
