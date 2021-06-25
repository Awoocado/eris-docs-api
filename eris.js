'use strict'

// Docs data is parsed from jsdoc directly
const { classes, constants } = require('./jsdocparser')
// Version info, etc. can be found in package.json
const erisPackage = require('./node_modules/eris/package')
// All the member categories for class objects
const memberCategories = ['properties', 'methods', 'events']

// Properties pulled into all embeds for consistency
const embedDefaults = {
  color: 0x4e98d8,
  footer: {
    text: `Docs generated from eris@${erisPackage.version} | e;docs Class#property`,
  },
}

// Generate a link to a certain member of a class
function linkTo(classname, doclet, kind) {
  if (doclet) {
    const memberType = doclet.kind || kind
    if (memberType) {
      return `https://abal.moe/Eris/docs/${classname}#${memberType}-${doclet.name}`
    }
  }
  return `https://abal.moe/Eris/docs/${classname}`
}

// Generate a list of parameters to put in a field value
function paramList(thing, url) {
  let string = thing.params && thing.params
    .map(param => `**\`${param.name}\`** (${param.type}${param.optional ? ', optional' : ''})\n${param.description}${param.defaultvalue ? `\nDefault: \`${param.defaultvalue}\`` : ''}`)
    .join('\n\n')
  if (thing.hasOptions) {
    string += `\n\nCheck the [full documentation](${url}) for properties on passed objects.`
  }
  return string
}

// Message formatting functions
function formatConstant(constant) {
  return {
    content: 'Docs: https://abal.moe/Eris/docs/reference',
    embed: {
      ...embedDefaults,
      description: constant.value,
      title: constant.display,
    },
  }
}
function formatClass(docsClass) {
  const url = linkTo(docsClass.name)
  return {
    content: `Docs: <${url}>`,
    embed: {
      ...embedDefaults,
      title: docsClass.name,
      url,
      description: docsClass.description,
      fields: [
        {
          name: 'Constructor Params',
          value: paramList(docsClass, url),
        },
        ...memberCategories.map(category => {
          const categoryData = docsClass[category]
          return categoryData && {
            name: `${categoryData.length} ${category}`,
            value: categoryData.slice(0, 5).map(item => item.name).join('\n'),
            inline: true,
          }
        }),
      ].filter(f => f && f.value), // Remove undefined/valueless fields
    },
  }
}
function formatMethodOrEvent(doclet) {
  const classname = doclet.display.replace(/#.*/, '')
  const url = linkTo(classname, doclet)
  const message = {
    content: `Docs: <${url}>`,
    embed: {
      ...embedDefaults,
      title: `\`${doclet.display}\``,
      description: doclet.description,
      url,
      fields: [
        {
          name: 'Return Type',
          value: doclet.returns && `\`${doclet.returns}\``,
        },
        {
          name: 'Parameters',
          value: paramList(doclet, url),
        },
      ].filter(f => f && f.value),
    },
  }
  return message
}
function formatProperty(classname, property) {
  const url = linkTo(classname, property, 'property')
  return {
    content: `Docs: <${url}>`,
    embed: {
      ...embedDefaults,
      title: `${classname}#${property.name}`,
      url,
      description: property.description,
      fields: [
        {
          name: 'Type',
          value: property.type,
        },
      ].filter(f => f && f.value),
    },
  }
}
function formatCategory(docsClass, docsItem) {
  // Properties don't have a .kind, but events and methods do
  if (docsItem.kind) {
    return formatMethodOrEvent(docsItem)
  }
  return formatProperty(docsClass.name, docsItem)
}


// Handle multiple results
function handleResults(results) {
  if (results.length === 1) {
    return formatCategory(results[0].cls, results[0].item)
  } else if (results.length <= 6) {
    return {
      content: 'Docs: https://abal.moe/Eris/docs',
      embed: {
        ...embedDefaults,
        description: results.map(result => {
          if (result.item.kind) {
            return `[\`${result.item.display}\`](${linkTo(result.cls.name, result.item)})`
          }
          return `[\`${result.cls.name}#${result.item.name}\`](${linkTo(result.cls.name, result.item, 'property')})`
        }).join(', '),
        title: 'Multiple Results Found',
      },
    }
  }
  return {
    content: 'Docs: https://abal.moe/Eris/docs',
    embed: {
      ...embedDefaults,
      description: `\`${results.slice(0, 6).map(result => result.item.display).join('`, `')}\`, and ${results.length - 6} more.`,
      title: 'Multiple Results Found',
    },
  }
}

module.exports = args => {
  const [classname, search] = args.join(' ').split(/[#. ]/)
  if (!classname) {
    return {
      content: 'Docs: https://abal.moe/Eris/docs',
      embed: {
        ...embedDefaults,
        description: classes.map(cls => `[${cls.name}](${linkTo(cls.name)})`).join(', '),
        title: 'Classes',
      },
    }
  } else if (classname.toLowerCase().startsWith('constants')) {
    if (!search) {
      return {
        content: 'Docs: https://abal.moe/Eris/docs/reference',
        embed: {
          ...embedDefaults,
          description: `\`${constants.map(constant => constant.name).join('`, `')}\``,
          title: 'Constants',
        },
      }
    }

    const docsItem = constants.find(constant => constant.name.toLowerCase() === search.toLowerCase())
    if (docsItem) {
      return formatConstant(docsItem)
    }
    return {
      embed: {
        ...embedDefaults,
        description: `Couldn't find constant ${classname}.`,
      },
    }
  }
  const docsClass = classes.find(cls => cls.name.toLowerCase() === classname.toLowerCase())
  if (!docsClass) {
    let items = constants.find(constant => constant.name.toLowerCase() === classname.toLowerCase())
    if (items) {
      return formatConstant(items)
    }
    items = []
    for (const cls of classes) {
      for (const category of memberCategories) {
        const item = cls[category] && cls[category].find(i => i.name.toLowerCase() === classname.toLowerCase())
        if (item) items.push({ cls, item }) // push to the list of matches
      }
    }
    if (items.length) {
      return handleResults(items)
    }
    return {
      embed: {
        ...embedDefaults,
        description: `Couldn't find anything matching '${classname}'.`,
      },
    }
  } else if (!search) {
    return formatClass(docsClass)
  }
  const items = []
  for (const category of memberCategories) {
    const item = docsClass[category] && docsClass[category].find(thing => thing.name.toLowerCase() === search.toLowerCase())
    if (item) items.push({ cls: docsClass, item }) // push to the list of matches
  }
  if (!items.length) {
    return {
      embed: {
        ...embedDefaults,
        description: `Couldn't find '${search}' on class ${docsClass.name}`,
      },
    }
  }
  return handleResults(items)
}
