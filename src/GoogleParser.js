const {
    Builder,
    By
  } = require('selenium-webdriver');
  const companies = require('../companies.json');
  const fs = require('fs')
  const setDate = require('./setGoogleDate')
  const sender = require('./send');

  const linksArray = [];
  const reviewIds = [];
  const readyUrls = [];

  let reviews = [];

  const main = async() => {
   const data = await parseLinks()
   sender.sendReviews(data)
  }

  const parseLinks = async () => {
    try {
      const driver = await new Builder().forBrowser('chrome').build();

    for await (const company of companies) {
      try {
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
      console.log("Huge problem", e)
    }

    await findData(Builder);
    await parseData(Builder);
    clearLinks();
    fs.writeFile('./google_date.json', JSON.stringify(reviews), () => console.log('Готово!'))
    return reviews
  }

  const clearLinks = () => {
    reviews = reviews.map(item => {
      item.review_link = item.review_link.slice(0, item.review_link.indexOf('?'))
      return item;
    })
  }

  const findData = async () => {
    try {
      const driver = await new Builder().forBrowser('chrome').build();
      for (const linkEl of linksArray) {
        const link = linkEl[0]
        try {
          await driver.get(link)
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
      console.log('\n',"Finding problem", e)
    }      
  }

  const parseData = async () => {
    try {
      const driver = await new Builder().forBrowser('chrome').build();

      for await (const urlItem of readyUrls) {
        const url = urlItem[0]
        const company_id = urlItem[1];
        const review = {};
        try {
          await driver.get(url);
          await driver.sleep(2000);
          review.company_id = company_id;
          review.resource_id = 1;

          review.review_link = url;
          review.review_mark = (parseInt(await driver.findElement(By.css('.section-review-stars')).getAttribute('aria-label')));
          review.reviewer_name = await driver.findElement(By.css('.section-person-header-name')).getText();
          review.review_text = await driver.findElement(By.css('.section-review-review-content')).getText();
          review.review_date = setDate(await driver.findElement(By.css('.section-review-publish-date')).getText());
          review.imgs = [];
          const imgsArr = await driver.findElements(By.css('.section-photo-bucket-photo>img'));
          for await (const img of imgsArr) {
            const path = await img.getAttribute('src')
            review.imgs.push(path)
          }
          reviews.push(review)
        } catch (e) {
          console.log('err')
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