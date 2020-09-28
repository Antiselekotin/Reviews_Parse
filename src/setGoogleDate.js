const fs = require('fs')

const setDate = (date) => {
    let dataStart = new Date();
    if (date.indexOf('неделю назад') + 1) {
      dataStart.setDate(dataStart.getDay() - 7);
    } else if (date.indexOf('месяц назад') + 1) {
      dataStart.setMonth(dataStart.getMonth() - 1);
    } else if (date.indexOf('мес') + 1) {
      dataStart.setMonth(dataStart.getMonth() - parseInt(date));
    } else if (date.indexOf('дн') + 1) {
      dataStart.setDate(dataStart.getDay() - parseInt(date));
    } else if (date.indexOf('нед') + 1) {
      dataStart.setDate(dataStart.getDay() - parseInt(date) * 7);
    } else if(date.indexOf('года') + 1) {
      dataStart.setFullYear(dataStart.getFullYear() - parseInt(date))
    } else if(date.indexOf('год') + 1) {
      dataStart.setFullYear(dataStart.getFullYear() - 1)
    } else {
      fs.writeFile('./log.txt', date, () => {
        console.log("logged")
      })
    }
    const month = dataStart.getUTCMonth() + 1 < 10 ? '0' + (dataStart.getUTCMonth() + 1) : dataStart.getUTCMonth() + 1 ; //months from 1-12
    const day = dataStart.getUTCDate() < 10 ? '0' + dataStart.getUTCDate() : dataStart.getUTCDate();
    const year = dataStart.getUTCFullYear();
    return `${year}-${month}-${day}`;
  }

  module.exports = {setDate: setDate};