
const {
    Builder,
    By
  } = require('selenium-webdriver');
const setDate = require('./setGoogleDate').setDate;
const sender = require('./send');

const fs = require('fs');
let reviews  = [];

const readyUrls = JSON.parse(fs.readFileSync('./tmp/readyUrls.json'));

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
          console.log(e)
          continue;
        }
  
      }
      await driver.sleep(1000);
      await driver.quit()
      clearLinks();
      sender.sendReviews(reviews);
    } catch (e) {
      console.log("Problems with parsing:", e)
    }
  }

  const clearLinks = () => {
    reviews = reviews.map(item => {
      item.review_link = item.review_link.slice(0, item.review_link.indexOf('?'))
      return item;
    })
  }

  parseData();