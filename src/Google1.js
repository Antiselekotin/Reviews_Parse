const {
  Builder,
  By
} = require('selenium-webdriver');
const fs = require('fs');
const readyUrls = [];

const linksArray = JSON.parse(fs.readFileSync('./tmp/links.json'));

const findData = async () => {
    console.log("Начинаем парсить ссылки на отзывы")
    const len = linksArray.length;
    let i = 0;
    try {
      const driver = await new Builder().forBrowser('firefox').build();
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
      
      await driver.quit();
      fs.writeFileSync('./tmp/readyUrls.json', JSON.stringify(readyUrls))
    } catch (e) {
      console.log(e)
      console.log('\n', "Finding problem", e)
    }
  }

  findData();