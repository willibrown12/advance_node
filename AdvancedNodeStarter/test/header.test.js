const puppeteer = require("puppeteer");

test("we can laounch a browser ", async () => {
  const browser = await puppeteer.launch({
    headless:false
  });
  const page = await browser.newPage();
});
