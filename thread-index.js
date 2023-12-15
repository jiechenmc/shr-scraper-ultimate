const { webkit } = require("playwright");
const {Worker} = require("worker_threads")

const scrape = async () => {
  // Set up
  const tld = "https://www.shanghairanking.com";
  const browser = await webkit.launch();
  const page = await browser.newPage();
  const year = 2022; // modify the year here!
  await page.goto(`${tld}/rankings/gras/${year}`);

  // Mapping subjects to their path on the website

  let linkTable = {};
  const spans = await page.locator("a:has(span)");
  const count = await spans.count();

  for (let i = 0; i < count - 1; ++i) {
    const text = await spans.nth(i).innerText();
    const link = await spans.nth(i).getAttribute("href");
    linkTable[text] = link;
  }

  console.log(linkTable)

  // scraping every subject

  for (const [subject, path] of Object.entries(linkTable)) {
    // maybe I fork here
    const worker = new Worker("./worker.js", { workerData: {tld, path, subject, year}})

    worker.on("exit", code =>
    console.log(`Worker stopped with exit code ${code}`)
  );
  }

  await browser.close();
};


const main = () =>{
  scrape()
}

main()