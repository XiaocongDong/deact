import { DEACT_COMPONENT, DEACT_TEXT, DEACT_DOM, DEACT_FUNCTION_COMPONENT } from './types'
import { isListenerProp, isAttributeProp, getEventName } from './utils'
import { checkComponentDidMount, checkComponentWillMount } from './lifeCycle'

/**
 * initiate generate deact instance with the input deact element
 * @param {object} element deact element
 * @returns deact instance, an instance represents **an element and its rendered dom**.
 * there are two kinds of instance by now
 * dom instance is like
 * {
 *    element: {
 *      type: 'div',
 *      props: {
 *        id: 'container',
 *        children: [
 *          {
 *            type: 'span',
 *            elementType: 'DEACT_TEXT',
 *            props: {
 *              nodeValue: 'hello'
 *            }
 *          }
 *        ]
 *      }
 *    },
 *    dom: dom,
 *    childInstances: [
 *    ]
 * }
 * dom instance have a childInstances property pointed to all of its children instances
 *
 * deact component instance is like
 * {
 *    element: {
 *      type: Story,
 *      props: {
 *        ...
 *      }
 *    },
 *    dom // dom of its inner dom instance
 *    childInstance: // instance generated from its renderedElement
 *    publicInstance: // refers to the component created with the element constructor
 * }
 */
export const initiate = (element) => {
  const {
    elementType,
    type,
    props
  } = element
  const children = props.children

  if (elementType === DEACT_DOM) {
    // for deact dom element, create an actual dom with props and children
    const dom = document.createElement(type)
    updateDOMProps({}, props || {}, dom)

    const childInstances = children.map(child => initiate(child))
    childInstances.forEach(({ dom: childDOM, publicInstance }) => {
      checkComponentWillMount(publicInstance)
      dom.appendChild(childDOM)
      checkComponentDidMount(publicInstance)
    })

    return { element, dom, childInstances }
  } else if (elementType === DEACT_TEXT) {
    // handle text element
    const dom = document.createTextNode(props.nodeValue)
    return { element, dom, childInstances: [] }
  } else if (elementType === DEACT_COMPONENT) {
    // for deact component, need to call the render function to get the real rendered element
    const instance = {}
    const publicInstance = createPublicInstance(element, instance)
    const childInstance = initiate(publicInstance.render())

    // for deact component element, we need to keep its childInstance
    Object.assign(instance, { dom: childInstance.dom, element, childInstance, publicInstance })
    return instance
  } else if (elementType === DEACT_FUNCTION_COMPONENT) {
    const childInstance = initiate(element.type(element.props))

    return { dom: childInstance.dom, element, childInstance }
  }
}

export const createPublicInstance = (element, internalInstance) => {
  const Constructor = element.type
  const component = new Constructor(element.props)
  component.internalInstance = internalInstance
  return component
}

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

/**
 * This function will generate a dom tree according to the input element
 * and mount it to the root dom node.
 * @param {object} element DEACT element
 * @param {node} root
 */
export const render = (element, root) => {
  const { dom, publicInstance } = initiate(element)
  checkComponentWillMount(publicInstance)
  root.appendChild(dom)
  checkComponentDidMount(publicInstance)
}
