const {
    Builder,
    By
  } = require('selenium-webdriver');


const test = async() => {
    const driver = await new Builder().forBrowser('firefox').build();
    try {
        await driver.get('http://google.com');
        const linkOnImage = await driver.findElement(By.css('#hplogo')).getAttribute('src');
    
        console.log("Если это ссылка на картинку гугла, то все работает нормально", linkOnImage)
    } catch(e) {
        console.log("Вы попали в блок ошибки, ошибка ниже:");
        console.log(e)
    } 
    

    await driver.quit()
}

test();