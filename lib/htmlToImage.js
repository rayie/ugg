import puppeteer from "puppeteer";

export default async (html = "") => {
  // We'll handle our image generation here.
  const browser = await puppeteer.launch();
  const page = await browser.newPage();
  await page.goto("https://tabs.ultimate-guitar.com/tab/adele/when-we-were-young-chords-1782038")


  const code = await page.$("code");
  const pre = await code.$eval("pre", n=>console.log(n))

  console.log(pre)

  const imageBuffer = await code.screenshot({ captureBeyondViewport:true, omitBackground: true });
  await page.close();
  await browser.close();

  return imageBuffer;
};
