const {
  Builder,
  By
} = require('selenium-webdriver');
let companies = require('../companies.json');
const fs = require('fs')

const linksArray = [];

const main = async () => {  
  const args = Number(process.argv[2] || 0);
  companies = companies.filter((item, index) => index % 13 === args)
  await parseLinks()
}

const parseLinks = async () => {

  try {
    const driver = await new Builder().forBrowser('firefox').build();
    console.log("Начинаем парсить ссылки, на оставивших отзовы");
    let i = 1;
    for await (const company of companies) {
      try {

        console.log(`${i}. Парсим компанию ${company.name}`)
        i++;

        await driver.get(company.google_link);
        await driver.sleep(6000);
        await driver.findElement(By.css('.allxGeDnJMl__text')).click();
        await driver.sleep(1500);
        
        const reviewsBeta = await driver.executeScript(
          `
            const reviews = document.querySelectorAll('.section-review');
            const reviewsData = []
             reviews.forEach(section => {
              const node = {};
              node.id = section.getAttribute('data-review-id');
              node.link = section.querySelector('a').getAttribute('href');
              reviewsData.push(node)
            })
            return reviewsData;
          `
        )
        reviewsBeta.forEach(item => {
          item.company_id = company.google_id;
          linksArray.push(item)
        })
      } catch (e) {
        continue;
      }
    }
    fs.writeFileSync('./tmp/links.json', JSON.stringify(linksArray))
    await driver.quit();
  } catch (e) {
    console.log("Большая ошибка", e)
  }
}


main();
