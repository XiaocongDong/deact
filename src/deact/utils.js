export const flatten = arr => {
  return arr.reduce((prev, a) => {
    if (Array.isArray(a)) {
      return prev.concat(flatten(a))
    } else {
      return prev.concat(a)
    }
  }, [])
}

export const removeFalsyChildren = children => {
  return children.filter(child => child)
}

export const isListenerProp = name => name.startsWith('on')
export const isAttributeProp = name => !isListenerProp(name) && name !== 'children'
export const getEventName = name => name.toLowerCase().substring(2)
