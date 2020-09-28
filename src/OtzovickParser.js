let companies = require('../companies.json');
const fs = require('fs')
const {
    Builder,
    By,
    Key
} = require('selenium-webdriver');
const setDate = require('./setOtzovickDate');
const sender = require('./send');

class OtzovickParser {
    constructor() {
        this.links = [];
        this.reviews = [];
        this.parse = async () => {
            const driver = await new Builder().forBrowser('firefox').build();
            try {
                await driver.get('https://otzovik.com/');
                await driver.sleep(12000);
                await driver.findElement(By.name('action_capcha_ban')).sendKeys('', Key.RETURN);

            } catch (e) {
                console.log('Стадия отправки капчи - прошла')
            } finally {
                await driver.sleep(2000);
            }

            console.log("Начинаем парсить ссылки на отзывы")
            for await (const company of companies) {
                console.log(`Парсим компанию ${company.name}`)
                const company_id = company.otzovick_id;
                const resource_id = 2;
                
                try {
                    await driver.get(company.otzovick_link);
                    

                    await this.reloadPage(driver, '.product-name');
                
                    await driver.sleep(2500);

                    const anchorTags = await driver.findElements(By.css('.review-title'))
                    const limit = Math.min(anchorTags.length, 5);
                    let i = 0
                    for await (const a of anchorTags) {
                        i++;
                        this.links.push([await a.getAttribute('href'), resource_id, company_id]);
                        if(i >= limit) {
                            break;
                        }
                    }
                } catch (e) {
                    console.log('err')
                    continue;
                }
            }
            console.log("Начинаем парсить отзывы")
            const len = this.links.length;
            let i = 0;
            for await (const linkArr of this.links) {
                console.log(`Сбор отзывов готов на ${Math.round(i/len*100)}%`);
                i++;

                const link = linkArr[0];
                const resource_id = linkArr[1];
                const company_id = linkArr[2];
                try {
                    await driver.get(link);
                    
                    await this.reloadPage(driver, '.product-name')

                    await driver.sleep(2000);
                    const review = {};

                    review.company_id = company_id;
                    review.resource_id = resource_id;

                    review.review_link = link;
                    review.reviewer_name = await driver.findElement(By.css('.user-login')).getText();
                    const date = await driver.findElement(By.css('.review-postdate>span.tooltip-right')).getText();
                    
                    review.review_date = setDate(date);
                    const mark = await driver.findElement(By.css('div.product-rating')).getAttribute('title');
                    review.review_mark = Number(mark.slice(14))
                    review.review_text = await driver.findElement(By.css('.description')).getText();
                    review.imgs = [];

                    const imgs = await driver.findElements(By.css('.description>p>img'));
                    
                    for await (const img of imgs) {
                        review.imgs.push(await img.getAttribute('src'))
                    }
                    this.reviews.push(review)
                } catch (e) {
                    console.log('Ошибка получения данных')
                    continue;
                } 
            }
            await driver.quit()
            return this.reviews;
        }
    }
    async reloadPage(driver, selector) {
        try {
            await driver.sleep(1500)
            await driver.findElement(By.css(selector))
        } catch (e) {
            await driver.navigate().refresh();
        }
    }
}

const otzovickParser = new OtzovickParser();
const p = async() => {
    const args = Number(process.argv[2] || 999);
    if (args !== 999) {
        companies = companies.filter((item, index) => index % 26 === args)
    }
    const data = await otzovickParser.parse();
    sender.sendReviews(data)
}

p();
