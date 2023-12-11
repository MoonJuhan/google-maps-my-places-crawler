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
  const titleText = await titleElement.getText()

  console.log(`Title: ${titleText}`)

  const targetElements = await titleElement.findElement(By.xpath('../../../..')).findElements(By.xpath('./*'))

  let scrollElement

  for (let i = 0; i < targetElements.length; i += 1) {
    if (!scrollElement) {
      scrollElement = targetElements[i]
    }

    if (scrollElement) {
      const scrollElementChildren = await scrollElement.findElements(By.xpath('./*'))
      const children = await targetElements[i].findElements(By.xpath('./*'))

      if (children.length > scrollElementChildren.length) {
        scrollElement = targetElements[i]
      }
    }
  }

  const myplacesElements = []

  const getMyPlacesElements = async () => {
    let prevChildrenLength = 0

    const scrollToLast = async (repeatIndex = 0) => {
      if (repeatIndex > 3) return

      driver.actions().scroll(0, 0, 0, 9999, scrollElement).perform()
      await sleep(1000)

      const children = await scrollElement.findElements(By.xpath('./*'))

      if (prevChildrenLength !== children.length) {
        prevChildrenLength = children.length
        await scrollToLast()
        return
      }

      prevChildrenLength = children.length
      await scrollToLast(repeatIndex + 1)
    }

    await scrollToLast()

    console.log('Scroll To Last')

    const children = await scrollElement.findElements(By.xpath('./*'))

    for (let i = 0; i < children.length; i += 1) {
      try {
        const myPlaceNameElement = await children[i].findElement(By.css('.fontHeadlineSmall'))
        const myPlaceName = await myPlaceNameElement.getText()

        myplacesElements.push({ name: myPlaceName, element: children[i] })
      } catch (error) {}
    }
  }

  await getMyPlacesElements()

  console.log(myplacesElements.length)
  driver.quit()
}

init()
