const {
  Builder,
  By
} = require('selenium-webdriver');
let companies = require('../companies.json');
const setDate = require('./setGoogleDate').setDate;
const sender = require('./send');

const linksArray = [];
const reviewIds = [];
const readyUrls = [];

let reviews = [];

const main = async () => {  
  const args = Number(process.argv[2] || 0);
  companies = companies.filter((item, index) => index % 7 === args)
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
        await driver.sleep(4000);
        await driver.findElement(By.css('.allxGeDnJMl__text')).click();
        await driver.sleep(1500);
        const reviews = await driver.findElements(By.css('.section-review'))
        for await (const review of reviews) {
          reviewIds.push(await review.getAttribute('data-review-id'))
        }
        const links = await driver.findElements(By.css('a.section-review-reviewer-link'))
        for await (const link of links) {
          linksArray.push([await link.getAttribute('href'), company.google_id])
        }
      } catch (e) {
        continue;
      }
    }
    await driver.quit();
  } catch (e) {
    console.log("Большая ошибка", e)
  }

  await findData(Builder);
  await parseData(Builder);
  clearLinks();
}

const clearLinks = () => {
  reviews = reviews.map(item => {
    item.review_link = item.review_link.slice(0, item.review_link.indexOf('?'))
    return item;
  })
}

const findData = async () => {
  console.log("Начинаем парсить ссылки на отзывы")
  const len = linksArray.length;
  let i = 0;
  try {
    const driver = await new Builder().forBrowser('firefox').build();
    for (const linkEl of linksArray) {
      const link = linkEl[0]
      try {
        console.log(`Сбор отзывов готов на ${Math.round(i/len*100)}%`);
        i++;


        await driver.get(link);
        await driver.sleep(2000);
        await driver.findElement(By.css('.section-tab-bar-tab')).click()
        await driver.sleep(1000);
        const personReviews = await driver.findElements(By.css('.section-review'))

        for await (const review of personReviews) {

          const dataId = await review.getAttribute('data-review-id');

          if (reviewIds.indexOf(dataId) + 1) {
            await driver.findElement(By.css(`[data-review-id="${dataId}"]`)).click()
            await driver.sleep(1000);
            const link = await driver.getCurrentUrl();
            readyUrls.push([link, linkEl[1]])
            break;
          }
        }
      } catch (e) {
        continue;
      }
    }
    driver.quit();
  } catch (e) {
    console.log('\n', "Finding problem", e)
  }
}

const parseData = async () => {
  try {
    const driver = await new Builder().forBrowser('firefox').build();
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
        console.log('err', e)
        continue;
      }

    }
    await driver.sleep(1000);
    await driver.quit();
  } catch (e) {
    console.log("Problems with parsing:", e)
  }
}

//
//
main();
//
//