/*
 * © Copyright 2022 HP Development Company, L.P.
 * SPDX-License-Identifier: MIT
 */

import { ClassType, DecoratorId, reflect, walker } from '@davinci/reflector'

const primitiveTypes = [String, Number, Boolean, Date] as unknown[]

function capitalizeFirstLetter(string: string) {
  return string.charAt(0).toUpperCase() + string.slice(1)
}

const renameClass = (theClass: ClassType, newName: string) => {
  const nameDescriptors = Object.getOwnPropertyDescriptor(theClass, 'name')
  Object.defineProperty(theClass, 'name', {
    ...nameDescriptors,
    value: newName,
  })
}

export function createPartialEntity<T>(
  theClass: ClassType<T>,
  recursively = true,
) {
  return walker<ClassType<Partial<T>>>(theClass, (meta) => {
    if (meta.iterationType === 'class') {
      return { ...meta }
    }

    if (meta.iterationType === 'property') {
      const entityPropDecorator = meta.decorators.find(
        (d) => d[DecoratorId] === 'entity.prop',
      )

      let type = entityPropDecorator?.options?.type ?? meta.type
      const isArray = Array.isArray(type)
      type = isArray ? type[0] : type

      if (
        recursively &&
        !primitiveTypes.includes(type) &&
        typeof type === 'function'
      ) {
        const newClass = reflect.create(
          {},
          { name: `${capitalizeFirstLetter(type.name)}Partial`, extends: type },
        )
        renameClass(newClass, `${capitalizeFirstLetter(type.name)}Partial`)
        type = createPartialEntity(newClass)
      }

      return {
        ...meta,
        decorators: meta.decorators.map((d) => {
          if (d[DecoratorId] === 'entity.prop') {
            return {
              ...d,
              options: {
                ...d.options,
                type: isArray ? [type] : type,
                required: false,
              },
            }
          }

          return d
        }),
      }
    }

    return null
  })
}
