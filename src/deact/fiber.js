import {
  FIBER_CLASS_COMPONENT,
  FIBER_HOST_COMPONENT,
  FIBER_HOST_ROOT
} from './types'
import {
  FIBER_UPDATE,
  FIBER_PLACEMENT,
  FIBER_DELETION
} from './tags'
import { createDomElement, updateDOMProps } from './dom'
import { arrify } from './utils'

const ENOUGH_TIME = 1

// updateQueue array is used to keep track of the pending updates.
// every call to render() or scheduleUpdate pushes a new update to the updateQueue
let updateQueue = []
let nextUnitOfWork = null
let pendingCommit = null

export function schedule (task) {
  updateQueue.push(task)
  requestIdleCallback(performWork)
}

/**
 * performWork will perform the nextUnitOfWork
 * @param {*} deadline deadline remaining for task execution
 */
function performWork (deadline) {
  workLoop(deadline)
  if (nextUnitOfWork || updateQueue.length > 0) {
    requestIdleCallback(performWork)
  }
}

function workLoop (deadline) {
  if (!nextUnitOfWork) {
    resetNextUnitOfWork()
  }

  while (nextUnitOfWork && deadline.timeRemaining() > ENOUGH_TIME) {
    nextUnitOfWork = performUnitOfWork(nextUnitOfWork)
  }

  if (pendingCommit) {
    commitAllWork(pendingCommit)
  }
}

function resetNextUnitOfWork () {
  const update = updateQueue.shift()
  if (!update) {
    return
  }

  if (update.partialState) {
    update.instance.__fiber.partialState = update.partialState
  }

  // get the root of old fiber tree
  const root = update.from === FIBER_HOST_ROOT
    ? update.dom.__rootContainerFiber
    : getRoot(update.instance.__fiber)

  nextUnitOfWork = {
    tag: FIBER_HOST_ROOT,
    stateNode: update.dom || root.stateNode,
    props: update.newProps || root.props,
    alternate: root
  }
}

function getRoot (fiber) {
  let node = fiber
  while (node.parent) {
    node = node.parent
  }

  return node
}

/**
 * commitAllWork is called outside of the loop. The work done on performUnitOfWork won't mutate the DOM
 * so it's OK to split it. On the other hand, commitAllWork() will mutate the DOM, it should be done all at once to avoid
 * an inconsistent UI.
 *
 * @param {*} pendingCommit commit needed to put on the doms.
 */
function commitAllWork (fiber) {
  fiber.effects.forEach(f => {
    commitWork(f)
  })
  fiber.stateNode.__rootContainerFiber = fiber
  nextUnitOfWork = null
  pendingCommit = null
}

function commitWork (fiber) {
  if (fiber.tag === FIBER_HOST_ROOT) {
    return
  }

  let domParentFiber = fiber.parent
  while (domParentFiber.tag === FIBER_CLASS_COMPONENT) {
    domParentFiber = domParentFiber.parent
  }
  const domParent = domParentFiber.stateNode

  if (fiber.effectTag === FIBER_PLACEMENT && fiber.tag === FIBER_HOST_COMPONENT) {
    domParent.appendChild(fiber.stateNode)
  } else if (fiber.effectTag === FIBER_UPDATE) {
    updateDOMProps(fiber.alternate.props, fiber.props, fiber.stateNode)
  } else if (fiber.effectTag === FIBER_DELETION) {
    commitDeletion(fiber, domParent)
  }
}

/**
 * commitDeletion removes fiber node from the parentDOM
 * since the fiber node can be either a class component or dom
 * if the node is a dom node, remove it directly from the parent dom
 * if the node is a class node, find its nearest dom node and all of its siblings and removed them from the parent dom.
 * @param {*} fiber the fiber needed to be removed from the parent dom
 * @param {*} domParent parent dom.
 */
function commitDeletion (fiber, domParent) {
  let node = fiber
  while (true) {
    if (node.tag === FIBER_CLASS_COMPONENT) {
      node = node.child
      continue
    }
    domParent.removeChild(node.stateNode)
    while (node !== fiber && !node.sibling) {
      node = node.parent
    }
    if (node === fiber) {
      return
    }
    node = node.sibling
  }
}

/**
 * performUnitOfWork will build the work-in-progress tree for the update it's working on
 * and also find out what changes we need to apply to the DOM. This will be done incrementally, on fiber at a time.
 * when performUnitOfWork() finishes all the work for the current update, it returns null and leaves the pending changes
 * to the DOM in pendingCommit. Finally, commitAllWork() will take the effects from the pendingCommit and mutate the DOM.
 *
 * @param {*} wipFiber fiber needed to be executed
 * @returns next fiber needed to be executed
 */
function performUnitOfWork (wipFiber) {
  beginWork(wipFiber)
  // depth-first traverse, from parent to child, from child to its siblings
  if (wipFiber.child) {
    return wipFiber.child
  }

  // if no child of this fiber is found, call completeWork and return the child fiber
  let uow = wipFiber
  while (uow) {
    completeWork(uow)
    if (uow.sibling) {
      return uow.sibling
    }
    // if there isn't any sibling, we go up to the parents calling completeWork() until we find a sibling or until we reach the root
    uow = uow.parent
  }
}

/**
 * beginWork creates the new children of a fiber and then return the first child so it becomes the nextUnitOfWork
 * @param {*} wipFiber workInProcess fiber
 */
function beginWork (wipFiber) {
  if (wipFiber.tag === FIBER_CLASS_COMPONENT) {
    updateClassComponent(wipFiber)
  } else {
    updateHostComponent(wipFiber)
  }
}

/**
 * append current child effects to parent effect list
 * @param {*} wipFiber work-in-progress fiber
 */
function completeWork (wipFiber) {
  if (wipFiber.tag === FIBER_CLASS_COMPONENT) {
    wipFiber.stateNode.__fiber = wipFiber
  }

  if (wipFiber.parent) {
    const childEffects = wipFiber.effects || []
    const thisEffect = wipFiber.effectTag !== null ? [wipFiber] : []
    const parentEffects = wipFiber.parent.effects || []
    wipFiber.parent.effects = parentEffects.concat(childEffects, thisEffect)
  } else {
    pendingCommit = wipFiber
  }
}

function updateClassComponent (wipFiber) {
  let instance = wipFiber.stateNode
  if (instance === null || instance === undefined) {
    instance = wipFiber.stateNode = createInstance(wipFiber)
  } else if (wipFiber.props === instance.props && !wipFiber.partialState) {
    // no need to render, clone children from last time
    cloneChildFibers(wipFiber)
    return
  }

  instance.props = wipFiber.props
  instance.state = Object.assign({}, instance.state, wipFiber.partialState)
  wipFiber.partialState = null

  const newChildElements = wipFiber.stateNode.render()
  reconcileChildrenArray(wipFiber, newChildElements)
}

function cloneChildFibers (parentFiber) {
  const oldFiber = parentFiber.alternate
  if (!oldFiber.child) {
    return
  }

  let oldChild = oldFiber.child
  let prevChild = null
  while (oldChild) {
    const newChild = {
      type: oldChild.type,
      tag: oldChild.tag,
      stateNode: oldChild.stateNode,
      props: oldChild.props,
      partialState: oldChild.partialState,
      alternate: oldChild,
      parent: parentFiber
    }
    if (prevChild) {
      prevChild.sibling = newChild
    } else {
      parentFiber.child = newChild
    }
    prevChild = newChild
    oldChild = oldChild.sibling
  }
}

/**
 * This is the heart of the library, where the work-in-progress tree grows
 * and where we decide what changes we will do to the DOM on the commit phase
 * @param {*} wipFiber the work-in-progress fiber
 * @param {*} newChildElements new childElements passed from the parent fiber
 */
function reconcileChildrenArray (wipFiber, newChildElements) {
  const elements = arrify(newChildElements)

  let index = 0
  // old fiber of the wipFiber child
  let oldFiber = wipFiber.alternate ? wipFiber.alternate.child : null
  let newFiber = null
  while (index < elements.length || oldFiber != null) {
    const prevFiber = newFiber
    const element = index < elements.length && elements[index]
    const sameType = oldFiber && element && element.type === oldFiber.type

    if (sameType) {
      newFiber = {
        type: oldFiber.type,
        tag: oldFiber.tag,
        stateNode: oldFiber.stateNode,
        props: element.props,
        parent: wipFiber,
        alternate: oldFiber,
        partialState: oldFiber.partialState,
        effectTag: FIBER_UPDATE
      }
    }

    if (element && !sameType) {
      newFiber = {
        type: element.type,
        tag: typeof element.type === 'string' ? FIBER_HOST_COMPONENT : FIBER_CLASS_COMPONENT,
        props: element.props,
        parent: wipFiber,
        effectTag: FIBER_PLACEMENT
      }
    }

    if (oldFiber && !sameType) {
      oldFiber.effectTag = FIBER_DELETION
      wipFiber.effects = wipFiber.effects || []
      wipFiber.effects.push(oldFiber)
    }

    if (oldFiber) {
      oldFiber = oldFiber.sibling
    }

    if (index === 0) {
      wipFiber.child = newFiber
    } else if (prevFiber && element) {
      prevFiber.sibling = newFiber
    }

    index++
  }
}

function updateHostComponent (wipFiber) {
  if (!wipFiber.stateNode) {
    wipFiber.stateNode = createDomElement(wipFiber)
  }
  const newChildElements = wipFiber.props.children
  reconcileChildrenArray(wipFiber, newChildElements)
}

export function createInstance (fiber) {
  const Constructor = fiber.type
  const instance = new Constructor(fiber.props)
  instance.__fiber = fiber
  return instance
}

// schedule state update for instance
export function scheduleUpdate (instance, partialState) {
  updateQueue.push({
    from: FIBER_CLASS_COMPONENT,
    instance: instance,
    partialState: partialState
  })
  requestIdleCallback(performWork)
}

export function render (elements, containerDOM) {
  updateQueue.push({
    from: FIBER_HOST_ROOT,
    dom: containerDOM,
    newProps: { children: elements }
  })
  requestIdleCallback(performWork)
}
