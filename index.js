const { By, Builder } = require('selenium-webdriver')
const fs = require('fs')

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

  const getMyPlacesNames = async () => {
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

    const children = await scrollElement.findElements(By.xpath('./*'))

    for (let i = 0; i < children.length; i += 1) {
      try {
        const myPlaceNameElement = await children[i].findElement(By.css('.fontHeadlineSmall'))
        const myPlaceName = await myPlaceNameElement.getText()

        myplacesElements.push({ name: myPlaceName })
      } catch (error) {}
    }
  }

  await getMyPlacesNames()

  console.log(myplacesElements.length)

  const getMyPlaceDetailInfo = async (name, isClicked = false) => {
    if (!isClicked) {
      const placeElements = await driver.findElements(By.css('button .fontHeadlineSmall'))

      for (let i = 0; i < placeElements.length; i += 1) {
        const placeElementText = await placeElements[i].getText()

        if (placeElementText === name) {
          await placeElements[i].click()
          break
        }
      }
    }

    await sleep(4000)

    const headingTagElements = await driver.findElements(By.css('h1'))

    if (headingTagElements.length === 0) {
      await getMyPlaceDetailInfo(name, true)
      return
    }

    const headingTagText = await headingTagElements[0].getText()

    if (headingTagText !== name) {
      await getMyPlaceDetailInfo(name, true)
      return
    }

    const subTitle = await driver.findElement(By.css('h2')).getText()
    const category = await driver.findElement(By.css('.fontBodyMedium span button')).getText()

    const imgInButtons = await driver.findElements(By.css('button div > img'))

    for (let index = 0; index < imgInButtons.length; index++) {
      const button = await imgInButtons[index].findElement(By.xpath('../../../..'))
      const dataItemId = await button.getAttribute('data-item-id')

      if (dataItemId === 'address') {
        myplacesElements.find(({ name }) => name === headingTagText).address = await button.getAttribute('aria-label')
      }
    }

    myplacesElements.find(({ name }) => name === headingTagText).subTitle = subTitle
    myplacesElements.find(({ name }) => name === headingTagText).category = category

    const backButtons = await driver.findElements(By.css('#omnibox-singlebox button'))
    await backButtons[0].click()
  }

  for (let index = 0; index < myplacesElements.length; index += 1) {
    await getMyPlaceDetailInfo(myplacesElements[index].name)
    console.log(myplacesElements[index])
    await sleep(1000)
  }

  driver.quit()

  const csv = [['name', 'address', 'subTitle', 'category']]
  myplacesElements.forEach(({ name, address, subTitle, category }) => {
    csv.push([name, address, subTitle, category].map((str) => `"${str}"`))
  })

  await fs.writeFileSync('my-places.csv', csv.map((arr) => arr.join(',')).join('\n'), 'utf8')
}

init()
