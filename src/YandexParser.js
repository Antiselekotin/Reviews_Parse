const {
    Builder,
    By
} = require('selenium-webdriver');
const companies = require('../companies.json');
const fs = require('fs')
const sender = require('./send');


const parseData = async () => {
    let reviews = [];
    const driver = new Builder().forBrowser('chrome').build();
    for await(const company of companies) {
        console.log("Парсим отзывы компании по ссылке:", company.yandex_link)
        const company_id = company.yandex_id;
        const resource_id = 0;
        try {
            await driver.get(company.yandex_link);
            await driver.sleep(1000);
            const buttons = await driver.findElements(By.css('span.business-review-view__expand'))
            await driver.sleep(1000);
            for await (const button of buttons) {
               try {
                   await button.click()
               } catch (e) {
                   continue;
               }
            }

            const subReviews = (await driver.executeScript(
                `
                const reviewsDOM = document.querySelectorAll(".business-reviews-card-view__review");
                const reviews = [];
                for(let i = 0; i < reviewsDOM.length; i++) {
                    const review = {};
                    const author = reviewsDOM[i].querySelector('.business-review-view__author');
                    review.reviewer_name = author.querySelector('span').textContent;
                    review.review_link = author.querySelector('a').getAttribute('href')
                    review.review_date = reviewsDOM[i].querySelector('[itemprop="datePublished"]').getAttribute('content').slice(0, 10);
                    review.review_mark = 5 - reviewsDOM[i].querySelectorAll('span.business-rating-badge-view__star._empty').length
                    review.review_text = reviewsDOM[i].querySelector('.business-review-view__body-text').textContent;
                    review.imgs = [];
                    const images = reviewsDOM[i].querySelectorAll('.business-review-photos__item-img')
                    images.forEach(item => review.imgs.push(item.getAttribute('style').slice(23, -4) + "XL"))

                    reviews.push(review)
                }
                return reviews
                `))
                const subWithData = subReviews.map(item => {
                    item.resource_id = resource_id;
                    item.company_id = company_id;
                    return item
                })
                reviews = [...reviews, ...subWithData]
        } catch(e) {
            continue;
        }
        
    }
    await driver.quit()
    fs.writeFile('./yandex-date.json', JSON.stringify(reviews), () => console.log('Готово!'))
    return reviews;
}

const p = async() => {
    const data = await parseData();
    sender.sendReviews(data)
}

p();