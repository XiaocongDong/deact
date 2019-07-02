import { DEACT_TEXT } from './types'
import { flatten, removeFalsyChildren } from './utils'

/**
 * createElement create a deact element describes what needs to be rendered
 * @param {string|function} type type of element, can be either string or function
 * @param {object} props props of this element
 * @param  {...any} children an array of children of this element
 * a deact element should be like:
 * {
 *    type: 'div',
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
        type: DEACT_TEXT,
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
      props: {
        ...props,
        children
      }
    }
  } else {
    // function component
    return {
      type,
      props: {
        ...props,
        children
      }
    }
  }
}

export default createElement
