const { webkit } = require("playwright");
const fs = require("fs");

(async () => {
  // Set up
  const tld = "https://www.shanghairanking.com";
  const browser = await webkit.launch();
  const page = await browser.newPage();
  const year = 2022; // modify the year here!
  await page.goto(`${tld}/rankings/gras/${year}`);

  // // Mapping subjects to their path on the website

  let linkTable = {};
  const spans = await page.locator("a:has(span)");
  const count = await spans.count();

  for (let i = 0; i < count - 1; ++i) {
    const text = await spans.nth(i).innerText();
    const link = await spans.nth(i).getAttribute("href");
    linkTable[text] = link;
  }

  // scraping every subject

  for (const [subject, path] of Object.entries(linkTable)) {
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
          if (result.length !== 4) {
            result.splice(2, 0, "");
          }

          if (i == 0) {
            currentEntry.push(result[0]);
            currentEntry.push(result[2]);
            currentEntry.push(result[3]);
          } else {
            if (result[3] === undefined) {
              currentEntry.push(0);
            }
            currentEntry.push(result[3]);
          }
        }
      }

      for (const [university, data] of Object.entries(dataTable)) {
        let outFileName = `out/${year}/${subject.replace("/", "_")}.tsv`;
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
    };

    for (let i = 0; i < lastPageNumber; ++i) {
      await processPage();
      await page.click("#content-box > ul > li.ant-pagination-next");
    }
  }

  await browser.close();
})();
