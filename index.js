const { By, Builder } = require('selenium-webdriver')

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms))

const init = async () => {
  const driver = await new Builder().forBrowser('chrome').build()
  await driver.get('URL')

  const getTitleElement = async (index = 0) => {
    if (index > 10) {
      console.log('ERROR: No title element found')
      driver.quit()
      return
    }

    const elements = await driver.findElements(By.css('h1'))

    if (elements.length === 0) {
      await sleep(1000)
      return getTitleElement(index + 1)
    }

    return elements[0]
  }

  const titleElement = await getTitleElement()

  console.log(await titleElement.getText())

  const targetElements = await titleElement.findElement(By.xpath('../../../..')).findElements(By.xpath('./*'))

  for (let i = 0; i < targetElements.length; i += 1) {
    const text = await targetElements[i].getText()
    console.log(i, text)
  }

  driver.quit()
}

init()
