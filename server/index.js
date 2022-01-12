const express = require('express')
const app = express()
const port = 4444

staticServe = express.static(`${ __dirname }/public`);
app.use("/", staticServe);
app.use("*", staticServe);

app.listen(port, () => {
  console.log(`Example app listening at http://localhost:${port}`)
})
