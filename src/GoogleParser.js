const {
  Builder,
  By
} = require('selenium-webdriver');
let companies = require('../companies.json');
const setDate = require('./setGoogleDate').setDate;
const sender = require('./send');

const linksArray = [];
const readyUrls = [];

let reviews = [];

const main = async () => {  
  const args = Number(process.argv[2] || 0);
  companies = companies.filter((item, index) => index % 13 === args)
  await parseLinks()
   sender.sendReviews(reviews)
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
    await findData(driver);
    await parseData(driver);
    clearLinks();
    await driver.quit();
  } catch (e) {
    console.log("Большая ошибка", e)
  }
}

const clearLinks = () => {
  reviews = reviews.map(item => {
    item.review_link = item.review_link.slice(0, item.review_link.indexOf('?'))
    return item;
  })
}

const findData = async (driver) => {
  console.log("Начинаем парсить ссылки на отзывы")
  const len = linksArray.length;
  let i = 0;
  try {
    for (const linkEl of linksArray) {
      const link = linkEl.link;
      const id = linkEl.id;
      const company_id = linkEl.company_id;
      try {
        console.log(`Сбор отзывов готов на ${Math.round(i/len*100)}%`);
        i++;

        await driver.get(link);
        await driver.sleep(4000);
        
        await driver.findElement(By.css('.section-tab-bar-tab')).click()
        await driver.sleep(4000);
        const res = await driver.executeScript(
          `
            const el = document.querySelector('[data-review-id="${id}"]')
            if(el) {
                el.click();
                return 1;
            } return 0;
          `
        )
        if(res) {
          await driver.sleep(4000);
          const newLink = await driver.getCurrentUrl();
          await driver.sleep(2000);
          readyUrls.push([newLink, company_id])
        }
      } catch (e) {
        console.log(e)
        continue;
      }
    }
  } catch (e) {
    console.log(e)
    console.log('\n', "Finding problem", e)
  }
}

const parseData = async (driver) => {
  try {
    console.log("Начинаем парсить отзывы (Основная часть)")
    const len = readyUrls.length;
    let i = 0;
    for await (const urlItem of readyUrls) {
      const url = urlItem[0]
      const company_id = urlItem[1];
      console.log(`Парсинг отзывов готов на ${Math.round(i/len*100)}%`);
      i++;
      try {
        await driver.get(url);
        await driver.sleep(2000);
        const review = await driver.executeScript(
          `
              const r = {};
              r.review_mark = +document.querySelector('.section-review-stars').getAttribute('aria-label').trim().slice(0, 1)
              r.reviewer_name = document.querySelector('.section-person-header-name').textContent;
              r.review_text =  document.querySelector('.section-review-review-content').textContent;
              r.review_date =  document.querySelector('.section-review-publish-date').textContent;
              r.imgs = [];

              const imgsArr = document.querySelectorAll('.section-photo-bucket-photo>img')
              imgsArr.forEach(item => {
                r.imgs.push(item.getAttribute('src'))
              })
              return r;
            `
        )
        review.company_id = company_id;
        review.resource_id = 1;
        review.review_link = url;
        review.review_date = setDate(review.review_date);

        reviews.push(review)
      } catch (e) {
        console.log(e)
        continue;
      }

    }
    await driver.sleep(1000);
  } catch (e) {
    console.log("Problems with parsing:", e)
  }
}

//
//
main();
//
//