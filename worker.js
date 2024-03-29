

const { webkit } = require("playwright");
const fs = require("fs");
const { workerData, parentPort } = require("worker_threads");
const { exit } = require("process");


async function scrape(){
    const {tld, path, subject, year} = workerData

    const browser = await webkit.launch();
    const page = await browser.newPage();
    await page.goto(`${tld}${path}`);

    // All category data will be scraped before moving onto the next page
    // universityName: [rank, total, q1, cnci, ic, top, award]
    let dataTable = {};

    let lastPageNumber = await page
      .locator("#content-box > ul > li.ant-pagination-item")
      .last()
      .innerText();

    lastPageNumber = parseInt(lastPageNumber.trim());

    console.log(`Subject: ${subject}\nPages: ${lastPageNumber}`);
    const processPage = async () => {
      const options = await page
        .locator("tr")
        .first()
        .locator(".options")
        .last()
        .locator("li");

      for (let i = 0; i < 5; ++i) {
        // choosing the category
        await page.click(
          "#content-box > div.rk-table-box > table > thead > tr > th:nth-child(5) > div"
        );
        await options.nth(i).click();

        // scrape row data
        const rows = await page.locator("tr").allInnerTexts();
        for (let j = 1; j < rows.length; ++j) {
          const curr = rows[j];
          const result = curr.match(/([^\n\t]+)/g);

          // 0 is rank; 1 is university name; 2 is total; 3 is category score

          if (dataTable[result[1]] === undefined) {
            dataTable[result[1]] = [];
          }

          const currentEntry = dataTable[result[1]];

          // some entries have empty total scores so the length of the result will mess things up
          if (result.length === 3) {
            if (result[2] > 100) {
              result.splice(3, 0, 0);
            } else {
              result.splice(2, 0, 0);
            }
          } else if (result.length === 2) {
            result.splice(2, 0, 0);
            result.splice(3, 0, 0);
          }

          if (i == 0) {
            currentEntry.push(result[0]);
            currentEntry.push(result[2]);
            currentEntry.push(result[3]);
          } else {
            currentEntry.push(result[3]);
          }
        }
      }

      // output dir
      const dir = `out/${year}`;
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      for (const [university, data] of Object.entries(dataTable)) {
        let outFileName = `${dir}/${subject.replace("/", "_")}.tsv`;
        let string = `${data[0]}\t${university}\t${data[1]}\t${data[2]}\t${data[3]}\t${data[4]}\t${data[5]}\t${data[6]}\n`;

        if (fs.existsSync(outFileName)) {
          fs.appendFileSync(outFileName, string);
        } else {
          if (year === 2017 || year === 2018 || year === 2019) {
            fs.writeFileSync(
              outFileName,
              "World Rank\tInstitution\tTotal Score\tPUB\tCNCI\tIC\tTOP\tAWARD\n"
            );
          } else {
            fs.writeFileSync(
              outFileName,
              "World Rank\tInstitution\tTotal Score\tQ1\tCNCI\tIC\tTOP\tAWARD\n"
            );
          }

          fs.appendFileSync(outFileName, string);
        }
      }
      // free up memory
      dataTable = {};
    };

    for (let i = 0; i < lastPageNumber; ++i) {
      await processPage();
      await page.click("#content-box > ul > li.ant-pagination-next");
    }

    await browser.close()
}

scrape().then(()=>{
    parentPort.send("DONE");
    exit(0)
})