import { JSDOM } from 'jsdom'

const html = `
<!DOCTYPE html>
<html>
<head></head>
<body>
<div id="root"></div>
</body>
</html>
`
const dom = new JSDOM(html)
global.window = dom.window
global.document = dom.window.document
global.navigator = dom.window.navigator
