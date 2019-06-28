import { DEACT_COMPONENT, DEACT_DOM, DEACT_TEXT, DEACT_FUNCTION_COMPONENT } from './types'
import { flatten, removeFalsyChildren } from './utils'
import Component from './Component'

/**
 * createElement create a deact element describes what needs to be rendered
 * @param {string|function} type type of element, can be either string or function
 * @param {object} props props of this element
 * @param  {...any} children an array of children of this element
 * a deact element should be like:
 * {
 *    type: 'div',
 *    elementType: DEACT_DOM,
 *    props: {
 *      id: 'container',
 *      children: [
 *        {
 *          type: Story,
 *          elementType: DEACT_COMPONENT,
 *          props: {
 *            onOpen: () => {
 *              console.log('this story is opened')
 *            }
 *          }
 *        }
 *      ]
 *    }
 * }
 */
const createElement = (type, props, ...children) => {
  // normalize the children
  // flatten the children and remove falsy children like null, false and undefined, etc
  children = removeFalsyChildren(flatten(children || []))
  // change the pure string child to a DEACT_TEXT element
  children = children.map(child => {
    if (typeof child !== 'object') {
      return {
        elementType: DEACT_TEXT,
        props: {
          nodeValue: child
        }
      }
    } else {
      return child
    }
  })

  if (typeof type === 'string') {
    return {
      type,
      elementType: DEACT_DOM,
      props: {
        ...props,
        children
      }
    }
  } else if (type.prototype instanceof Component) {
    return {
      type,
      elementType: DEACT_COMPONENT,
      props: {
        ...props,
        children
      }
    }
  } else {
    // function component
    return {
      type,
      elementType: DEACT_FUNCTION_COMPONENT,
      props: {
        ...props,
        children
      }
    }
  }
}

export default createElement
