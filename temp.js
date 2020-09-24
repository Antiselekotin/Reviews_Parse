const fs = require('fs');
const json = require(
    './companies.json'
)

const arr = json.map(item => {
    item.otzovick_link = item.otzovick_id;
    return item
})

fs.writeFileSync('./companies1.json', JSON.stringify(arr))