import { isListenerProp, isAttributeProp, getEventName } from './utils'
import { DEACT_TEXT } from './types'

export const updateDOMProps = (prevProps = {}, nextProps = {}, node) => {
  if (Object.keys(prevProps).length === Object.keys(nextProps).length) {
    let isSame = true
    for (let key of Object.keys(prevProps)) {
      if (prevProps[key] !== nextProps[key]) {
        isSame = false
        break
      }
    }

    if (isSame) {
      return
    }
  }
  // remove old props and insert new props
  Object.keys(prevProps)
    .filter(isListenerProp)
    .forEach(key => {
      const eventName = getEventName(key)
      node.removeEventListener(eventName, prevProps[key])
    })

  Object.keys(prevProps)
    .filter(isAttributeProp)
    .forEach(key => {
      node[key] = null
    })

  Object.keys(nextProps)
    .filter(isListenerProp)
    .forEach(key => {
      const eventName = getEventName(key)
      node.addEventListener(eventName, nextProps[key])
    })

  Object.keys(nextProps)
    .filter(isAttributeProp)
    .forEach(key => {
      node[key] = nextProps[key]
    })
}

export const createDomElement = (fiber) => {
  const isTextElement = fiber.type === DEACT_TEXT
  const dom = isTextElement
    ? document.createTextNode('')
    : document.createElement(fiber.type)

  updateDOMProps({}, fiber.props, dom)
  return dom
}
