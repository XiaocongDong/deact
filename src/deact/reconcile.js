import { initiate, updateDOMProps } from './dom'
import { DEACT_COMPONENT } from './types'
import { checkComponentWillUnmount } from './lifeCycle'

/**
 * update preInstance if nextElement has the same type as prevInstance
 * create a new instance if prevInstance doesn't exist
 * delete prevInstance node from the parentNode if nextElement doesn't exit
 * @param {*} prevInstance
 * @param {*} nextElement
 * @param {*} parentNode
 */
export const reconcile = (prevInstance, nextElement, parentNode) => {
  if (prevInstance == null) {
    // this is add node operation
    const instance = initiate(nextElement)
    parentNode.appendChild(instance.dom)
    return instance
  } else if (nextElement == null) {
    // this is delete node operation
    checkComponentWillUnmount(prevInstance.publicInstance)
    parentNode.removeChild(prevInstance.dom)
    return null
  }

  const hasTypeChanged = prevInstance.element.type !== nextElement.type
  if (hasTypeChanged) {
    const instance = initiate(nextElement)
    parentNode.replaceChild(instance.dom, prevInstance.dom)
    return instance
  } else {
    // handle same type update
    if (nextElement.elementType === DEACT_COMPONENT) {
      // update prev public instance props and call the render function to get next rendered element
      prevInstance.publicInstance.props = nextElement.props
      const nextChildElement = prevInstance.publicInstance.render()
      const childInstance = reconcile(prevInstance.childInstance, nextChildElement, parentNode)
      prevInstance.childInstance = childInstance
      prevInstance.dom = childInstance.dom
      prevInstance.element = nextElement
    } else {
      // for dom type instance, update prev dom props and recursively reconcile its children
      updateDOMProps(prevInstance.element.props, nextElement.props, prevInstance.dom)
      prevInstance.element = nextElement
      reconcileChildren(prevInstance, nextElement)
    }
    return prevInstance
  }
}

/**
 * @param {*} prevInstance
 * @param {*} nextElement
 */
export const reconcileChildren = (prevInstance, nextElement) => {
  const prevChildInstances = prevInstance.childInstances
  const nextElementChildren = nextElement.props.children || []
  const maxLength = Math.max(prevChildInstances.length, nextElementChildren.length)

  const nextChildInstances = []

  for (let i = 0; i < maxLength; i++) {
    const nextChildInstance = reconcile(prevChildInstances[i], nextElementChildren[i], prevInstance.dom)
    if (nextChildInstance) {
      nextChildInstances.push(nextChildInstance)
    }
  }

  prevInstance.childInstances = nextChildInstances
}
